// src/pages/admin/Messages.tsx
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { messagingService } from '@/services/messagingService'
import { getPublicDirectoryProfiles } from '@/lib/publicDirectory'
import { ChatBubble } from '@/components/chat/ChatBubble'
import { ChatInput } from '@/components/chat/ChatInput'
import type { Conversation, ConversationSummary, FlaggedMessage, Message } from '@/types/admin'

function formatRelative(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const diffMs = Date.now() - d.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function AdminMessages() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [activeConv, setActiveConv] = useState<ConversationSummary | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [memberProfilesMap, setMemberProfilesMap] = useState<
    Record<string, { full_name: string | null; avatar_url: string | null }>
  >({})
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [flagged, setFlagged] = useState<FlaggedMessage[]>([])
  const [moderatingId, setModeratingId] = useState<string | null>(null)
  const messageListRef = useRef<HTMLDivElement>(null)

  // Load all conversations for this leader on mount
  useEffect(() => {
    if (!user) return
    void (async () => {
      const convs = await messagingService.getLeaderConversations(user.id)
      setConversations(convs)
      setLoading(false)
    })()
  }, [user])

  // Reported messages awaiting moderation, across every room
  useEffect(() => {
    if (!user) return
    let isMounted = true
    void (async () => {
      const reports = await messagingService.getFlaggedMessages()
      if (isMounted) setFlagged(reports)
    })()
    return () => {
      isMounted = false
    }
  }, [user])

  // Both effects below key off the conversation id only — reading it through a
  // variable keeps the dependency statically checkable without widening them to
  // the whole object, which would re-subscribe on every list refresh.
  const activeConvId = activeConv?.id

  // Load thread when active conversation changes
  useEffect(() => {
    if (!activeConvId) return
    let cancelled = false
    void (async () => {
      setLoadingMessages(true)
      const msgs = await messagingService.getMessages(activeConvId)
      if (cancelled) return
      setMessages(msgs)
      setLoadingMessages(false)
      void messagingService.markAsRead(activeConvId, 'leader')
      // Clear unread badge in the list
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConvId ? { ...c, unread_count: 0 } : c))
      )
    })()
    return () => {
      cancelled = true
    }
  }, [activeConvId])

  // Realtime on active conversation
  useEffect(() => {
    if (!activeConvId) return
    const unsub = messagingService.subscribeToMessages(activeConvId, (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      if (msg.sender_type === 'member') {
        void messagingService.markAsRead(activeConvId, 'leader')
      }
    })
    return unsub
  }, [activeConvId])

  // Resolve member profiles for senders in thread
  useEffect(() => {
    if (!messages || messages.length === 0) return
    const missingSenderIds = messages
      .map((m) => m.sender_id)
      .filter((id) => id && id !== user?.id && !memberProfilesMap[id])

    const uniqueMissing = Array.from(new Set(missingSenderIds))
    if (uniqueMissing.length === 0) return

    let isMounted = true
    void (async () => {
      const profiles = await getPublicDirectoryProfiles(uniqueMissing)
      if (!isMounted) return
      setMemberProfilesMap((prev) => {
        const next = { ...prev }
        for (const p of profiles) {
          next[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url }
        }
        return next
      })
    })()
    return () => {
      isMounted = false
    }
  }, [messages, user?.id, memberProfilesMap])

  // Auto-scroll the thread only. scrollIntoView on a sentinel also scrolls every
  // scrollable ancestor, which drags the whole admin page down on each send.
  useEffect(() => {
    const list = messageListRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [messages])

  const handleSend = async (content: string) => {
    if (!activeConv || !user) return
    setSending(true)
    const msg = await messagingService.sendMessage(activeConv.id, content, 'leader', user.id)
    if (msg) {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
    } else {
      const { toast } = await import('sonner')
      toast.error('Message not sent — try again')
    }
    setSending(false)
  }

  const handleClose = async () => {
    if (!activeConv) return
    await messagingService.closeConversation(activeConv.id)
    const closed: Conversation['status'] = 'closed'
    setActiveConv((prev) => (prev ? { ...prev, status: closed } : prev))
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConv.id ? { ...c, status: closed } : c))
    )
  }

  const handleRemoveFlagged = async (messageId: string) => {
    if (!user) return
    setModeratingId(messageId)
    const ok = await messagingService.deleteMessage(messageId, user.id)
    const { toast } = await import('sonner')
    if (ok) {
      setFlagged((prev) => prev.filter((m) => m.id !== messageId))
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
      toast.success('Message removed')
    } else {
      toast.error('Could not remove message')
    }
    setModeratingId(null)
  }

  const handleDismissFlagged = async (messageId: string) => {
    setModeratingId(messageId)
    const ok = await messagingService.dismissFlag(messageId)
    const { toast } = await import('sonner')
    if (ok) {
      setFlagged((prev) => prev.filter((m) => m.id !== messageId))
      toast.success('Report dismissed')
    } else {
      toast.error('Could not dismiss report')
    }
    setModeratingId(null)
  }

  const memberInitial = (name: string | undefined | null) =>
    name ? name.trim().charAt(0).toUpperCase() : '?'

  return (
    <div className="main" style={{ padding: '24px 20px' }}>
      {/* Page header */}
      <div className="ph" style={{ marginBottom: 20 }}>
        <div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              margin: 0,
            }}
          >
            Messages
          </h1>
          <p style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))', margin: '2px 0 0' }}>
            Member conversations in your scope
          </p>
        </div>
      </div>

      {/* Moderation queue — only surfaces when members have reported something */}
      {flagged.length > 0 && (
        <div className="panel" style={{ marginBottom: 20, overflow: 'hidden' }}>
          <div
            className="ph"
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid hsl(var(--border))',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 18, color: 'hsl(var(--destructive))' }}
              >
                flag
              </span>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  Reported messages
                </p>
                <p style={{ margin: 0, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                  {flagged.length} awaiting review
                </p>
              </div>
            </div>
          </div>

          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {flagged.map((m) => (
              <div
                key={m.id}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid hsl(var(--border))',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: 4,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {m.sender_name}
                    </span>
                    <span className="pill pill-mute" style={{ fontSize: 10 }}>
                      {m.is_group ? `📢 ${m.scope_label}` : m.scope_label}
                    </span>
                    <span style={{ fontSize: 10, color: 'hsl(var(--on-surface-muted))' }}>
                      {formatRelative(m.created_at)}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: 'hsl(var(--on-surface))',
                      lineHeight: 1.5,
                      wordBreak: 'break-word',
                    }}
                  >
                    {m.content}
                  </p>
                  {m.flagged_reason && (
                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: 11,
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      Reason: {m.flagged_reason}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={moderatingId === m.id}
                    onClick={() => void handleDismissFlagged(m.id)}
                  >
                    Keep
                  </button>
                  <button
                    className="btn btn-dest btn-sm"
                    disabled={moderatingId === m.id}
                    onClick={() => void handleRemoveFlagged(m.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two-panel layout */}
      <div
        className="sidebar-main"
        style={{ height: 'calc(100vh - 180px)', minHeight: 400, alignItems: 'stretch' }}
      >
        {/* Left: conversation list */}
        <aside
          className="panel"
          style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}
        >
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid hsl(var(--border))',
              fontSize: 11,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {loading
              ? 'Loading…'
              : `${conversations.length} conversation${conversations.length !== 1 ? 's' : ''}`}
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {conversations.map((conv) => {
              const isActive = activeConv?.id === conv.id
              const isGroup = conv.scope_type?.startsWith('group_')
              const displayName =
                conv.member?.full_name ??
                (isGroup ? `📢 ${conv.scope_value} Forum` : conv.scope_value)

              return (
                <button
                  key={conv.id}
                  onClick={() => {
                    setActiveConv(conv)
                    setMessages([])
                    setLoadingMessages(true)
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    background: isActive ? 'hsl(var(--container-low))' : 'transparent',
                    cursor: 'pointer',
                    border: 'none',
                    borderBottom: '1px solid hsl(var(--border))',
                    borderRadius: 0,
                  }}
                >
                  {conv.member?.avatar_url ? (
                    <img
                      src={conv.member.avatar_url}
                      alt={displayName}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />
                  ) : isGroup ? (
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: 'hsl(var(--primary))',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        forum
                      </span>
                    </div>
                  ) : (
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: 'hsl(var(--primary))',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        flexShrink: 0,
                      }}
                    >
                      {memberInitial(displayName)}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color: 'hsl(var(--on-surface))',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {displayName}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: 'hsl(var(--on-surface-muted))',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        {formatRelative(conv.last_message_at)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <span className="pill pill-mute" style={{ fontSize: 9, padding: '1px 6px' }}>
                        {conv.scope_value}
                      </span>
                      {conv.status === 'closed' && (
                        <span className="pill pill-err" style={{ fontSize: 9, padding: '1px 6px' }}>
                          Closed
                        </span>
                      )}
                    </div>
                    {conv.last_message_content && (
                      <p
                        style={{
                          margin: '4px 0 0',
                          fontSize: 11.5,
                          color: 'hsl(var(--on-surface-muted))',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontFamily: "'Public Sans', sans-serif",
                        }}
                      >
                        {conv.last_message_content}
                      </p>
                    )}
                  </div>
                  {conv.unread_count > 0 && (
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: 'hsl(var(--destructive))',
                        color: '#fff',
                        fontSize: 9,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'var(--font-weight-medium, 500)',
                        flexShrink: 0,
                      }}
                    >
                      {conv.unread_count > 9 ? '9+' : conv.unread_count}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </aside>

        {/* Right: thread */}
        <main
          className="panel"
          style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}
        >
          {!activeConv ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 10,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 40 }}>
                chat
              </span>
              <p style={{ fontSize: 13, margin: 0 }}>Select a conversation to view messages</p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid hsl(var(--border))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    {activeConv.member?.full_name ??
                      (activeConv.scope_type?.startsWith('group_')
                        ? `📢 ${activeConv.scope_value} Community Forum`
                        : activeConv.scope_value)}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      color: 'hsl(var(--on-surface-muted))',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    {activeConv.member?.registration_number
                      ? `${activeConv.member.registration_number} · `
                      : ''}
                    {activeConv.scope_value}
                  </p>
                </div>
                {activeConv.status === 'open' && (
                  <button
                    className="btn btn-outline-dest btn-sm"
                    onClick={() => {
                      void handleClose()
                    }}
                  >
                    Close conversation
                  </button>
                )}
              </div>

              {/* Messages */}
              <div
                ref={messageListRef}
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  overscrollBehavior: 'contain',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {loadingMessages ? (
                  <p
                    style={{
                      textAlign: 'center',
                      color: 'hsl(var(--on-surface-muted))',
                      fontSize: 13,
                      marginTop: 32,
                    }}
                  >
                    Loading…
                  </p>
                ) : messages.length === 0 ? (
                  <p
                    style={{
                      textAlign: 'center',
                      color: 'hsl(var(--on-surface-muted))',
                      fontSize: 13,
                      marginTop: 32,
                    }}
                  >
                    No messages yet.
                  </p>
                ) : null}
                {messages.map((msg) => {
                  const isSelf = msg.sender_type === 'leader' && msg.sender_id === user?.id
                  let senderName: string | undefined = undefined
                  if (!isSelf) {
                    if (msg.sender_type === 'member') {
                      senderName =
                        activeConv.member?.full_name ??
                        memberProfilesMap[msg.sender_id]?.full_name ??
                        'Member'
                    } else {
                      senderName = memberProfilesMap[msg.sender_id]?.full_name ?? 'Leader/Admin'
                    }
                  }

                  return (
                    <ChatBubble
                      key={msg.id}
                      content={msg.content}
                      isSelf={isSelf}
                      timestamp={msg.created_at}
                      senderName={senderName}
                      // Members record voice notes to their leader, so this side is
                      // where they actually get listened to.
                      audioPath={msg.audio_url ?? null}
                      audioDurationSeconds={msg.audio_duration_seconds ?? null}
                      isRecalled={Boolean(msg.recalled_at)}
                      isEdited={Boolean(msg.edited_at)}
                      isFlagged={Boolean(msg.is_flagged)}
                    />
                  )
                })}
              </div>

              {/* Input or closed banner */}
              {activeConv.status === 'closed' ? (
                <div
                  style={{
                    padding: '12px 20px',
                    borderTop: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--container-low))',
                    textAlign: 'center',
                    fontSize: 12,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  Conversation closed
                </div>
              ) : (
                <ChatInput
                  onSend={(content) => {
                    void handleSend(content)
                  }}
                  disabled={sending}
                  placeholder={`Reply to ${
                    activeConv.member?.full_name ?? activeConv.scope_value
                  }…`}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

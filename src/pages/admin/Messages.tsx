// src/pages/admin/Messages.tsx
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { messagingService } from '@/services/messagingService'
import { ChatBubble } from '@/components/chat/ChatBubble'
import { ChatInput } from '@/components/chat/ChatInput'
import type { Conversation, ConversationSummary, Message } from '@/types/admin'

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
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load all conversations for this leader on mount
  useEffect(() => {
    if (!user) return
    void (async () => {
      const convs = await messagingService.getLeaderConversations(user.id)
      setConversations(convs)
      setLoading(false)
    })()
  }, [user])

  // Load thread when active conversation changes
  useEffect(() => {
    if (!activeConv) return
    let cancelled = false
    void (async () => {
      setLoadingMessages(true)
      const msgs = await messagingService.getMessages(activeConv.id)
      if (cancelled) return
      setMessages(msgs)
      setLoadingMessages(false)
      void messagingService.markAsRead(activeConv.id, 'leader')
      // Clear unread badge in the list
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConv.id ? { ...c, unread_count: 0 } : c))
      )
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConv?.id])

  // Realtime on active conversation
  useEffect(() => {
    if (!activeConv) return
    const unsub = messagingService.subscribeToMessages(activeConv.id, (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      if (msg.sender_type === 'member') {
        void messagingService.markAsRead(activeConv.id, 'leader')
      }
    })
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConv?.id])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
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
                      alt={conv.member.full_name}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />
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
                      {memberInitial(conv.member?.full_name)}
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
                        {conv.member?.full_name ?? 'Member'}
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
                    {activeConv.member?.full_name ?? 'Member'}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      color: 'hsl(var(--on-surface-muted))',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    {activeConv.member?.registration_number ?? ''} · {activeConv.scope_value}
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
                style={{
                  flex: 1,
                  overflowY: 'auto',
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
                {messages.map((msg) => (
                  <ChatBubble
                    key={msg.id}
                    content={msg.content}
                    isSelf={msg.sender_type === 'leader'}
                    timestamp={msg.created_at}
                    senderName={
                      msg.sender_type === 'member'
                        ? (activeConv.member?.full_name ?? 'Member')
                        : undefined
                    }
                  />
                ))}
                <div ref={bottomRef} />
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
                  placeholder={`Reply to ${activeConv.member?.full_name ?? 'member'}…`}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

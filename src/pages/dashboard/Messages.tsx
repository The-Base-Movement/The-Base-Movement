// src/pages/dashboard/Messages.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { messagingService } from '@/services/messagingService'
import { getPublicDirectoryProfiles } from '@/lib/publicDirectory'
import { ChatBubble } from '@/components/chat/ChatBubble'
import { ChatInput } from '@/components/chat/ChatInput'
import type {
  Conversation,
  ConversationLeaderInfo,
  Message,
  MessageReaction,
  ReactionEmoji,
  ReactionSummary,
} from '@/types/admin'

function roleLabel(role: string): string {
  return role
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function scopeLabel(conv: Conversation): string {
  if (conv.scope_type === 'chapter') return `Diaspora: ${conv.scope_value}`
  if (conv.scope_type === 'constituency') return `Constituency: ${conv.scope_value}`
  if (conv.scope_type === 'group_movement') return '🌍 General Discussion'
  if (conv.scope_type === 'group_chapter') return `📢 ${conv.scope_value} Forum`
  if (conv.scope_type === 'group_constituency') return `📢 ${conv.scope_value} Forum`
  if (conv.scope_type === 'department') return `🏢 ${conv.scope_value}`
  return conv.scope_value
}

interface Department {
  id: string
  name: string
  icon: string
  lead_id: string | null
  lead_name: string | null
  lead_avatar: string | null
}

export default function DashboardMessages() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [leaderInfoMap, setLeaderInfoMap] = useState<Record<string, ConversationLeaderInfo>>({})
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({})
  const [memberProfilesMap, setMemberProfilesMap] = useState<
    Record<string, { full_name: string | null; avatar_url: string | null }>
  >({})
  const [sending, setSending] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [noMoreOlder, setNoMoreOlder] = useState<Record<string, boolean>>({})
  // Group rooms track read state per member, not on the message row.
  const [lastReadMap, setLastReadMap] = useState<Record<string, string | null>>({})
  const [reactions, setReactions] = useState<MessageReaction[]>([])
  // "Delete for me" is per-member state, so hidden ids are filtered at render.
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [editing, setEditing] = useState<Message | null>(null)
  // Ticks so the 15-minute Edit option disappears on its own once it lapses,
  // instead of being offered until the next re-render happens to occur.
  const [now, setNow] = useState(() => Date.now())
  const [expandDepartments, setExpandDepartments] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Detect mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const activeConv = conversations.find((c) => c.id === activeId) ?? null
  const leaderInfo = activeId ? (leaderInfoMap[activeId] ?? null) : null
  const allMessages = useMemo(
    () => (activeId ? (messagesMap[activeId] ?? []) : []),
    [activeId, messagesMap]
  )
  // Messages this member chose to hide never render, but stay visible to everyone else.
  const messages = useMemo(
    () => allMessages.filter((m) => !hiddenIds.has(m.id)),
    [allMessages, hiddenIds]
  )
  const messageById = useMemo(() => new Map(allMessages.map((m) => [m.id, m])), [allMessages])

  /** Reactions on one message, collapsed to one chip per emoji. */
  const reactionsFor = useMemo(() => {
    const byMessage = new Map<string, ReactionSummary[]>()
    for (const r of reactions) {
      const list = byMessage.get(r.message_id) ?? []
      const found = list.find((s) => s.emoji === r.emoji)
      if (found) {
        found.count += 1
        found.reactedByMe = found.reactedByMe || r.user_id === user?.id
      } else {
        list.push({ emoji: r.emoji, count: 1, reactedByMe: r.user_id === user?.id })
      }
      byMessage.set(r.message_id, list)
    }
    return byMessage
  }, [reactions, user?.id])

  // Load all conversations (personal + group) + departments on mount
  useEffect(() => {
    if (!user) return
    let isMounted = true
    void (async () => {
      const [convs, groupConvs, forum, depts] = await Promise.all([
        messagingService.getOrCreateConversations(user.id),
        messagingService.getMemberGroupConversations(user.id),
        messagingService.getMovementForum(user.id),
        messagingService.getDepartments(),
      ])
      if (!isMounted) return
      const allConvs = [...convs, ...groupConvs, ...(forum ? [forum] : [])]
      setConversations(allConvs)
      setDepartments(depts)
      if (allConvs.length > 0) {
        setActiveId(allConvs[0].id)
        // Load messages + leader info for all conversations in parallel
        await Promise.all(
          allConvs.map(async (conv) => {
            const [msgs, leader] = await Promise.all([
              messagingService.getMessages(conv.id),
              messagingService.getLeaderInfo(conv.leader_id, conv.scope_type, conv.department_id),
            ])
            if (!isMounted) return
            setMessagesMap((prev) => ({ ...prev, [conv.id]: msgs }))
            if (leader) setLeaderInfoMap((prev) => ({ ...prev, [conv.id]: leader }))
            if (conv.group_type) {
              // Capture the previous read point before advancing it, so the badge
              // reflects what arrived while the member was away.
              const lastRead = await messagingService.getGroupLastReadAt(conv.id, user.id)
              if (!isMounted) return
              setLastReadMap((prev) => ({ ...prev, [conv.id]: lastRead }))
              void messagingService.markGroupAsRead(conv.id, user.id)
            } else {
              void messagingService.markAsRead(conv.id, 'member')
            }
          })
        )
      }
      if (isMounted) setLoading(false)
    })()
    return () => {
      isMounted = false
    }
  }, [user])

  // Realtime subscription for active conversation
  useEffect(() => {
    if (!activeId) return
    const unsub = messagingService.subscribeToMessages(
      activeId,
      (msg) => {
        setMessagesMap((prev) => {
          const cur = prev[activeId] ?? []
          if (cur.some((m) => m.id === msg.id)) return prev
          return { ...prev, [activeId]: [...cur, msg] }
        })
        if (msg.sender_type === 'leader') {
          void messagingService.markAsRead(activeId, 'member')
        }
      },
      (msg) => {
        // Drop removed posts live; otherwise reflect edits/flags in place.
        setMessagesMap((prev) => {
          const cur = prev[activeId] ?? []
          return {
            ...prev,
            [activeId]: msg.is_deleted
              ? cur.filter((m) => m.id !== msg.id)
              : cur.map((m) => (m.id === msg.id ? msg : m)),
          }
        })
      }
    )
    return unsub
  }, [activeId])

  // Resolve sender names for member messages in active thread
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

  // Auto-scroll on new messages. Keyed on the last message so prepending older
  // history doesn't yank the reader back down to the bottom.
  const lastMessageId = messages.at(-1)?.id
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lastMessageId])

  const handleSend = async (content: string) => {
    if (!activeConv || !user) return
    setSending(true)

    // Editing an existing message rather than posting a new one
    if (editing) {
      const err = await messagingService.editMessage(editing.id, content)
      const { toast } = await import('sonner')
      if (err) {
        toast.error(err)
      } else {
        setMessagesMap((prev) => ({
          ...prev,
          [activeConv.id]: (prev[activeConv.id] ?? []).map((m) =>
            m.id === editing.id ? { ...m, content, edited_at: new Date().toISOString() } : m
          ),
        }))
        setEditing(null)
      }
      setSending(false)
      return
    }

    // Check anti-flood protection
    const floodCheck = await messagingService.checkCanSendMessage(activeConv.id, user.id)
    if (floodCheck) {
      const { toast } = await import('sonner')
      toast.error(floodCheck)
      setSending(false)
      return
    }

    const msg = await messagingService.sendMessage(
      activeConv.id,
      content,
      'member',
      user.id,
      replyTo?.id ?? null
    )
    if (msg) {
      setReplyTo(null)
      setMessagesMap((prev) => {
        const cur = prev[activeConv.id] ?? []
        return cur.some((m) => m.id === msg.id) ? prev : { ...prev, [activeConv.id]: [...cur, msg] }
      })
    } else {
      const { toast } = await import('sonner')
      toast.error(messagingService.lastSendError ?? 'Message not sent — try again')
    }
    setSending(false)
  }

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(timer)
  }, [])

  // Reactions for the visible thread, refreshed when it changes or a reaction lands.
  const messageIdsKey = messages.map((m) => m.id).join(',')
  useEffect(() => {
    const ids = messageIdsKey ? messageIdsKey.split(',') : []
    if (!activeId || ids.length === 0) return
    let isMounted = true
    const load = () => {
      void (async () => {
        const rows = await messagingService.getReactions(ids)
        if (isMounted) setReactions(rows)
      })()
    }
    load()
    const unsub = messagingService.subscribeToReactions(activeId, load)
    return () => {
      isMounted = false
      unsub()
    }
  }, [activeId, messageIdsKey])

  // Which messages this member has hidden from their own view
  useEffect(() => {
    if (!user) return
    let isMounted = true
    void (async () => {
      const ids = await messagingService.getHiddenMessageIds(user.id)
      if (isMounted) setHiddenIds(new Set(ids))
    })()
    return () => {
      isMounted = false
    }
  }, [user])

  const handleReact = async (messageId: string, emoji: ReactionEmoji) => {
    if (!user) return
    const isOn = Boolean(
      reactions.find(
        (r) => r.message_id === messageId && r.user_id === user.id && r.emoji === emoji
      )
    )
    // Optimistic — realtime reconciles it either way.
    setReactions((prev) =>
      isOn
        ? prev.filter(
            (r) => !(r.message_id === messageId && r.user_id === user.id && r.emoji === emoji)
          )
        : [
            ...prev,
            {
              id: `optimistic-${messageId}-${emoji}`,
              message_id: messageId,
              user_id: user.id,
              emoji,
              created_at: new Date().toISOString(),
            },
          ]
    )
    const ok = await messagingService.toggleReaction(messageId, user.id, emoji, isOn)
    if (!ok) {
      const rows = await messagingService.getReactions(messages.map((m) => m.id))
      setReactions(rows)
    }
  }

  const handleRecall = async (messageId: string) => {
    const { toast } = await import('sonner')
    toast('Delete this message for everyone?', {
      action: {
        label: 'Delete',
        onClick: () => {
          void (async () => {
            const err = await messagingService.recallMessage(messageId)
            if (err) {
              toast.error(err)
              return
            }
            if (activeId) {
              setMessagesMap((prev) => ({
                ...prev,
                [activeId]: (prev[activeId] ?? []).map((m) =>
                  m.id === messageId
                    ? { ...m, recalled_at: new Date().toISOString(), content: '' }
                    : m
                ),
              }))
            }
          })()
        },
      },
    })
  }

  const handleDeleteForMe = async (messageId: string) => {
    if (!user) return
    const ok = await messagingService.hideMessageForMe(messageId, user.id)
    const { toast } = await import('sonner')
    if (!ok) {
      toast.error('Could not remove message')
      return
    }
    setHiddenIds((prev) => new Set(prev).add(messageId))
  }

  const handleReport = async (messageId: string) => {
    const { toast } = await import('sonner')
    toast('Report this message to moderators?', {
      action: {
        label: 'Report',
        onClick: () => {
          void (async () => {
            const ok = await messagingService.flagMessage(messageId, 'Reported by member')
            if (!ok) {
              toast.error('Could not report — try again')
              return
            }
            if (activeId) {
              setMessagesMap((prev) => ({
                ...prev,
                [activeId]: (prev[activeId] ?? []).map((m) =>
                  m.id === messageId ? { ...m, is_flagged: true } : m
                ),
              }))
            }
            toast.success('Reported. Moderators will review it.')
          })()
        },
      },
    })
  }

  // Rooms are paged newest-first, so reaching back through history is explicit.
  const handleLoadOlder = async () => {
    if (!activeId || messages.length === 0 || loadingOlder) return
    setLoadingOlder(true)
    const older = await messagingService.getMessages(activeId, messages[0].created_at)
    if (older.length === 0) {
      setNoMoreOlder((prev) => ({ ...prev, [activeId]: true }))
    } else {
      setMessagesMap((prev) => ({ ...prev, [activeId]: [...older, ...(prev[activeId] ?? [])] }))
    }
    setLoadingOlder(false)
  }

  const handleMessageDepartment = async (dept: Department) => {
    if (!user) return
    const conv = await messagingService.getOrCreateDepartmentConversation(user.id, dept.id)
    if (conv) {
      setConversations((prev) => {
        if (prev.some((c) => c.id === conv.id)) return prev
        return [...prev, conv]
      })
      setActiveId(conv.id)
      setSidebarOpen(false)
      // Load messages for this new conversation
      const msgs = await messagingService.getMessages(conv.id)
      setMessagesMap((prev) => ({ ...prev, [conv.id]: msgs }))
      const leader = await messagingService.getDepartmentInfo(dept.id)
      if (leader) setLeaderInfoMap((prev) => ({ ...prev, [conv.id]: leader }))
      void messagingService.markAsRead(conv.id, 'member')
    } else {
      const { toast } = await import('sonner')
      toast.error('Failed to open department chat')
    }
  }

  if (loading) {
    return (
      <div className="main" style={{ padding: '24px 20px' }}>
        <div className="panel" style={{ padding: 24 }}>
          <div
            style={{
              height: 40,
              background: 'hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              width: '40%',
              marginBottom: 12,
            }}
          />
          <div
            style={{
              height: 20,
              background: 'hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              width: '70%',
            }}
          />
        </div>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="main" style={{ padding: '24px 20px' }}>
        <div
          className="panel"
          style={{
            padding: 48,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            textAlign: 'center',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 48, color: 'hsl(var(--on-surface-muted))' }}
          >
            mark_chat_unread
          </span>
          <p
            style={{
              fontSize: 15,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              margin: 0,
            }}
          >
            No leader assigned yet
          </p>
          <p
            style={{
              fontSize: 13,
              color: 'hsl(var(--on-surface-muted))',
              maxWidth: 340,
              margin: 0,
            }}
          >
            Your leader hasn&apos;t been assigned yet. Contact HQ at{' '}
            <a href="mailto:info@thebasemovement.org.gh" style={{ color: 'hsl(var(--primary))' }}>
              info@thebasemovement.org.gh
            </a>
          </p>
        </div>
      </div>
    )
  }

  const isClosed = activeConv?.status === 'closed'
  const isGroupChat = activeConv?.scope_type?.startsWith('group_')
  const isMovementChat = activeConv?.scope_type === 'group_movement'
  const isDeptChat = activeConv?.scope_type === 'department'
  const leaderInitial = leaderInfo?.full_name?.charAt(0)?.toUpperCase() || '?'

  const filteredSearch = (list: Conversation[]) =>
    list.filter((c) => scopeLabel(c).toLowerCase().includes(searchQuery.toLowerCase()))

  const directConvs = filteredSearch(
    conversations.filter(
      (c) => !c.scope_type?.startsWith('group_') && c.scope_type !== 'department'
    )
  )
  const groupConvs = filteredSearch(conversations.filter((c) => c.scope_type?.startsWith('group_')))
  const deptConvs = filteredSearch(conversations.filter((c) => c.scope_type === 'department'))

  return (
    <div
      className="main"
      style={{
        padding: '16px 12px',
        display: 'flex',
        gap: 16,
        height: 'calc(100vh - 120px)',
        overflow: 'hidden',
        position: 'relative',
        scrollBehavior: 'auto',
      }}
    >
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.3)',
            zIndex: 40,
            display: 'none',
          }}
          className="mobile-only"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Aside: Conversations list */}
      {!isMobile || !activeId ? (
        <aside
          style={{
            width: isMobile ? '100%' : 280,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            background: 'hsl(var(--card))',
            border: isMobile ? 'none' : '1px solid hsl(var(--border))',
            overflow: 'hidden',
            borderRadius: isMobile ? 0 : 'var(--radius-lg)',
            position: 'relative',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid hsl(var(--border))',
              backgroundColor: 'hsl(var(--container-low))',
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
              }}
            >
              Conversations
            </h3>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Search input */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid hsl(var(--border))',
            }}
          >
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: 12,
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                background: 'hsl(var(--container-low))',
                color: 'hsl(var(--on-surface))',
                boxSizing: 'border-box',
                outline: 'none',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'hsl(var(--primary))')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'hsl(var(--border))')}
            />
          </div>

          {/* Conversations list */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              scrollBehavior: 'auto',
            }}
          >
            {/* Direct Leader Conversations */}
            {directConvs.length > 0 && (
              <div>
                <div
                  style={{
                    padding: '10px 16px 4px',
                    fontSize: 10,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    textTransform: 'uppercase',
                    color: 'hsl(var(--on-surface-muted))',
                    letterSpacing: '0.05em',
                  }}
                >
                  💬 Direct Messages
                </div>
                {directConvs.map((conv) => {
                  const isActive = conv.id === activeId
                  const convMessages = messagesMap[conv.id] ?? []
                  const unreadCount = convMessages.filter(
                    (m) => !m.read_at && m.sender_type === 'leader'
                  ).length

                  return (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setActiveId(conv.id)
                        setSidebarOpen(false)
                      }}
                      style={{
                        padding: '12px 16px',
                        background: isActive ? 'hsl(var(--container-low))' : 'transparent',
                        border: 'none',
                        borderLeft: isActive
                          ? '3px solid hsl(var(--primary))'
                          : '3px solid transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        color: 'hsl(var(--on-surface))',
                        fontSize: 13,
                        transition: 'background 0.2s',
                        width: '100%',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive)
                          e.currentTarget.style.background = 'hsl(var(--container-low) / 0.5)'
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: 18,
                          flexShrink: 0,
                          color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {conv.scope_type === 'chapter' ? 'groups' : 'location_city'}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: isActive ? 'var(--font-weight-medium, 500)' : 'normal',
                            color: 'hsl(var(--on-surface))',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {scopeLabel(conv)}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: 'hsl(var(--on-surface-muted))',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {convMessages.length} {convMessages.length === 1 ? 'message' : 'messages'}
                        </div>
                      </div>
                      {unreadCount > 0 && (
                        <span
                          style={{
                            background: 'hsl(var(--accent))',
                            color: '#000',
                            fontSize: 10,
                            fontWeight: 'var(--font-weight-medium, 500)',
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-pill)',
                            flexShrink: 0,
                            minWidth: 20,
                            textAlign: 'center',
                          }}
                        >
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Group forums section */}
            {groupConvs.length > 0 && (
              <div
                style={{
                  borderTop: '1px solid hsl(var(--border))',
                  padding: '4px 0',
                }}
              >
                <div
                  style={{
                    padding: '10px 16px 4px',
                    fontSize: 10,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    textTransform: 'uppercase',
                    color: 'hsl(var(--on-surface-muted))',
                    letterSpacing: '0.05em',
                  }}
                >
                  📢 Community Forums
                </div>
                {groupConvs.map((conv) => {
                  const isActive = conv.id === activeId
                  const convMessages = messagesMap[conv.id] ?? []
                  const lastRead = lastReadMap[conv.id]
                  const unreadCount = convMessages.filter(
                    (m) => m.sender_id !== user?.id && (!lastRead || m.created_at > lastRead)
                  ).length

                  return (
                    <button
                      key={conv.id}
                      onClick={(e) => {
                        e.preventDefault()
                        e.currentTarget.blur()
                        setActiveId(conv.id)
                        setSidebarOpen(false)
                      }}
                      style={{
                        padding: '12px 16px',
                        background: isActive ? 'hsl(var(--container-low))' : 'transparent',
                        border: 'none',
                        borderLeft: isActive
                          ? '3px solid hsl(var(--primary))'
                          : '3px solid transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        color: 'hsl(var(--on-surface))',
                        fontSize: 13,
                        transition: 'background 0.2s',
                        width: '100%',
                        outline: 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive)
                          e.currentTarget.style.background = 'hsl(var(--container-low) / 0.5)'
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: 18,
                          flexShrink: 0,
                          color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        forum
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: isActive ? 'var(--font-weight-medium, 500)' : 'normal',
                            color: 'hsl(var(--on-surface))',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {scopeLabel(conv)}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: 'hsl(var(--on-surface-muted))',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {convMessages.length} {convMessages.length === 1 ? 'message' : 'messages'}
                        </div>
                      </div>
                      {unreadCount > 0 && (
                        <span
                          style={{
                            background: 'hsl(var(--primary))',
                            color: '#fff',
                            fontSize: 10,
                            fontWeight: 'var(--font-weight-medium, 500)',
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-pill)',
                            flexShrink: 0,
                            minWidth: 20,
                            textAlign: 'center',
                          }}
                        >
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Department conversations section */}
            {deptConvs.length > 0 && (
              <div
                style={{
                  borderTop: '1px solid hsl(var(--border))',
                  padding: '4px 0',
                }}
              >
                <div
                  style={{
                    padding: '10px 16px 4px',
                    fontSize: 10,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    textTransform: 'uppercase',
                    color: 'hsl(var(--on-surface-muted))',
                    letterSpacing: '0.05em',
                  }}
                >
                  🏢 Department Channels
                </div>
                {deptConvs.map((conv) => {
                  const isActive = conv.id === activeId
                  const convMessages = messagesMap[conv.id] ?? []
                  const unreadCount = convMessages.filter(
                    (m) => !m.read_at && m.sender_type === 'leader'
                  ).length

                  return (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setActiveId(conv.id)
                        setSidebarOpen(false)
                      }}
                      style={{
                        padding: '12px 16px',
                        background: isActive ? 'hsl(var(--container-low))' : 'transparent',
                        border: 'none',
                        borderLeft: isActive
                          ? '3px solid hsl(var(--primary))'
                          : '3px solid transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        color: 'hsl(var(--on-surface))',
                        fontSize: 13,
                        transition: 'background 0.2s',
                        width: '100%',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive)
                          e.currentTarget.style.background = 'hsl(var(--container-low) / 0.5)'
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: 18,
                          flexShrink: 0,
                          color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        help
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: isActive ? 'var(--font-weight-medium, 500)' : 'normal',
                            color: 'hsl(var(--on-surface))',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {conv.scope_value}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: 'hsl(var(--on-surface-muted))',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {convMessages.length} {convMessages.length === 1 ? 'message' : 'messages'}
                        </div>
                      </div>
                      {unreadCount > 0 && (
                        <span
                          style={{
                            background: 'hsl(var(--primary))',
                            color: '#fff',
                            fontSize: 10,
                            fontWeight: 'var(--font-weight-medium, 500)',
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-pill)',
                            flexShrink: 0,
                            minWidth: 20,
                            textAlign: 'center',
                          }}
                        >
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Departments selection drawer */}
          {departments.length > 0 && (
            <div
              style={{
                borderTop: '1px solid hsl(var(--border))',
                padding: '12px 0',
              }}
            >
              <button
                onClick={() => setExpandDepartments(!expandDepartments)}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface))',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'hsl(var(--container-low) / 0.5)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 16,
                    transform: expandDepartments ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }}
                >
                  expand_more
                </span>
                + Message a Department
              </button>

              {expandDepartments && (
                <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                  {departments.map((dept) => (
                    <button
                      key={dept.id}
                      onClick={() => handleMessageDepartment(dept)}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        paddingLeft: '32px',
                        background: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 12,
                        color: 'hsl(var(--on-surface))',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'hsl(var(--container-low))'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: 16,
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {dept.icon || 'help'}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 12,
                            color: 'hsl(var(--on-surface))',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {dept.name}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </aside>
      ) : null}

      {/* Main chat area */}
      {!isMobile || activeId ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            width: isMobile ? '100%' : 'auto',
          }}
        >
          {/* Mobile header with back button */}
          {isMobile && activeId && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16,
              }}
            >
              <button
                onClick={() => setActiveId(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'hsl(var(--primary))',
                }}
                aria-label="Back to conversations"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
                  arrow_back
                </span>
              </button>
            </div>
          )}

          {/* Desktop header */}
          {!isMobile && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16,
              }}
              className="mobile-only"
            >
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Toggle conversations"
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 24,
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  {sidebarOpen ? 'close' : 'menu'}
                </span>
              </button>
              <h2
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface))',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {activeConv?.scope_value || 'Messages'}
              </h2>
            </div>
          )}

          {/* Expiry notice */}
          <div
            style={{
              padding: '10px 12px',
              background: 'hsl(var(--container-low))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-md)',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 10,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 14, color: 'hsl(var(--accent))', flexShrink: 0 }}
            >
              schedule
            </span>
            <span style={{ lineHeight: 1.3 }}>Messages expire after 30 days</span>
          </div>

          <div
            className="panel"
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
            }}
          >
            {/* Conversation header */}
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid hsl(var(--border))',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexShrink: 0,
              }}
            >
              {isGroupChat ? (
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
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                    forum
                  </span>
                </div>
              ) : isDeptChat ? (
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'hsl(var(--accent))',
                    color: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                    help
                  </span>
                </div>
              ) : leaderInfo?.avatar_url ? (
                <img
                  src={leaderInfo.avatar_url}
                  alt={leaderInfo.full_name}
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
                    background:
                      activeConv?.scope_type === 'chapter'
                        ? 'hsl(var(--accent))'
                        : 'hsl(var(--primary))',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  {leaderInitial}
                </div>
              )}

              <div style={{ minWidth: 0, flex: 1 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {isMovementChat
                    ? '🌍 General Discussion'
                    : isGroupChat
                      ? `📢 ${activeConv?.scope_value} Community Forum`
                      : isDeptChat
                        ? `🏢 ${activeConv?.scope_value}`
                        : (leaderInfo?.full_name ?? 'Your Leader')}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 10,
                    color: 'hsl(var(--on-surface-muted))',
                    fontFamily: "'Public Sans', sans-serif",
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {isMovementChat
                    ? 'Open to every member of The Base Movement'
                    : isGroupChat
                      ? `Open Discussion · ${
                          activeConv?.scope_type === 'group_chapter' ? 'Diaspora' : 'Constituency'
                        } Forum`
                      : isDeptChat
                        ? 'Official Helpdesk & Secretariat Support'
                        : `${leaderInfo ? roleLabel(leaderInfo.role) : ''}${
                            activeConv?.scope_value ? ` — ${activeConv.scope_value}` : ''
                          }`}
                </p>
              </div>
              {isClosed && (
                <span className="pill pill-err" style={{ marginLeft: 'auto' }}>
                  Closed
                </span>
              )}
            </div>

            {/* Messages scrollable area */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {messages.length === 0 && (
                <p
                  style={{
                    textAlign: 'center',
                    color: 'hsl(var(--on-surface-muted))',
                    fontSize: 13,
                    marginTop: 32,
                  }}
                >
                  No messages yet. Send a message to get started!
                </p>
              )}
              {messages.length > 0 && activeId && !noMoreOlder[activeId] && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => void handleLoadOlder()}
                  disabled={loadingOlder}
                  style={{ alignSelf: 'center', fontSize: 11, flexShrink: 0 }}
                >
                  {loadingOlder ? 'Loading…' : 'Load older messages'}
                </button>
              )}
              {messages.map((msg) => {
                const isSelf = msg.sender_id === user?.id
                let senderName: string | undefined = undefined
                if (!isSelf) {
                  if (msg.sender_type === 'leader') {
                    senderName =
                      leaderInfo?.full_name ?? (isDeptChat ? activeConv?.scope_value : 'Leader')
                  } else {
                    senderName = memberProfilesMap[msg.sender_id]?.full_name ?? 'Member'
                  }
                }

                const quoted = msg.reply_to_id ? messageById.get(msg.reply_to_id) : undefined
                const quotedName = quoted
                  ? quoted.sender_id === user?.id
                    ? 'You'
                    : quoted.sender_type === 'leader'
                      ? (leaderInfo?.full_name ?? 'Leader')
                      : (memberProfilesMap[quoted.sender_id]?.full_name ?? 'Member')
                  : null
                const isRecalled = Boolean(msg.recalled_at)
                // The 15-minute edit window is enforced in the DB; mirror it here so
                // the action is only offered while it would actually succeed.
                const withinEditWindow = now - new Date(msg.created_at).getTime() < 15 * 60 * 1000

                return (
                  <ChatBubble
                    key={msg.id}
                    content={msg.content}
                    isSelf={isSelf}
                    timestamp={msg.created_at}
                    senderName={senderName}
                    isFlagged={Boolean(msg.is_flagged)}
                    isEdited={Boolean(msg.edited_at)}
                    isRecalled={isRecalled}
                    replyPreview={
                      quoted && quotedName
                        ? {
                            senderName: quotedName,
                            content: quoted.recalled_at ? 'Deleted message' : quoted.content,
                          }
                        : null
                    }
                    reactions={reactionsFor.get(msg.id)}
                    canEdit={isSelf && withinEditWindow}
                    onReply={isRecalled ? undefined : () => setReplyTo(msg)}
                    onReact={isRecalled ? undefined : (emoji) => void handleReact(msg.id, emoji)}
                    onEdit={isSelf && !isRecalled ? () => setEditing(msg) : undefined}
                    onRecall={isSelf && !isRecalled ? () => void handleRecall(msg.id) : undefined}
                    onDeleteForMe={() => void handleDeleteForMe(msg.id)}
                    // Reporting only makes sense for other people's posts in an open room.
                    onReport={
                      isGroupChat && !isSelf && !isRecalled
                        ? () => void handleReport(msg.id)
                        : undefined
                    }
                  />
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input bar or closed banner */}
            {isClosed ? (
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
                This conversation has been closed.
              </div>
            ) : (
              <>
                {(replyTo || editing) && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 16px',
                      borderTop: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--container-low))',
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 16, color: 'hsl(var(--primary))', flexShrink: 0 }}
                    >
                      {editing ? 'edit' : 'reply'}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        borderLeft: '3px solid hsl(var(--primary))',
                        paddingLeft: 8,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color: 'hsl(var(--primary))',
                        }}
                      >
                        {editing ? 'Editing your message' : 'Replying to'}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'hsl(var(--on-surface-muted))',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {(editing ?? replyTo)?.content}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setReplyTo(null)
                        setEditing(null)
                      }}
                      aria-label="Cancel"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'hsl(var(--on-surface-muted))',
                        flexShrink: 0,
                        display: 'flex',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        close
                      </span>
                    </button>
                  </div>
                )}
                <ChatInput
                  // Remount when switching into or out of editing so the field
                  // picks up the message text without a prop-to-state effect.
                  key={editing ? `edit-${editing.id}` : 'compose'}
                  onSend={(content) => {
                    void handleSend(content)
                  }}
                  initialValue={editing?.content ?? ''}
                  onCancel={
                    editing || replyTo
                      ? () => {
                          setEditing(null)
                          setReplyTo(null)
                        }
                      : undefined
                  }
                  disabled={sending}
                  placeholder={
                    editing
                      ? 'Edit your message…'
                      : replyTo
                        ? 'Write a reply…'
                        : isMovementChat
                          ? 'Message the movement…'
                          : isGroupChat
                            ? `Message ${activeConv?.scope_value} Forum…`
                            : isDeptChat
                              ? `Message ${activeConv?.scope_value}…`
                              : 'Message your leader…'
                  }
                />
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

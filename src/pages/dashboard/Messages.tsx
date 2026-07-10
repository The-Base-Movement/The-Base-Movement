// src/pages/dashboard/Messages.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { messagingService } from '@/services/messagingService'
import { ChatBubble } from '@/components/chat/ChatBubble'
import { ChatInput } from '@/components/chat/ChatInput'
import type { Conversation, ConversationLeaderInfo, Message } from '@/types/admin'

function roleLabel(role: string): string {
  return role
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function scopeLabel(conv: Conversation): string {
  if (conv.scope_type === 'chapter') return `Chapter: ${conv.scope_value}`
  if (conv.scope_type === 'constituency') return `Constituency: ${conv.scope_value}`
  if (conv.scope_type === 'group_chapter') return `📢 ${conv.scope_value} Forum`
  if (conv.scope_type === 'group_constituency') return `📢 ${conv.scope_value} Forum`
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
  const [sending, setSending] = useState(false)
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
  const messages = useMemo(
    () => (activeId ? (messagesMap[activeId] ?? []) : []),
    [activeId, messagesMap]
  )

  // Load all conversations (personal + group) + departments on mount
  useEffect(() => {
    if (!user) return
    let isMounted = true
    void (async () => {
      const [convs, groupConvs, depts] = await Promise.all([
        messagingService.getOrCreateConversations(user.id),
        messagingService.getMemberGroupConversations(user.id),
        messagingService.getDepartments(),
      ])
      if (!isMounted) return
      const allConvs = [...convs, ...groupConvs]
      setConversations(allConvs)
      setDepartments(depts)
      if (allConvs.length > 0) {
        setActiveId(allConvs[0].id)
        // Load messages + leader info for all conversations in parallel
        await Promise.all(
          allConvs.map(async (conv) => {
            const [msgs, leader] = await Promise.all([
              messagingService.getMessages(conv.id),
              messagingService.getLeaderInfo(conv.leader_id, conv.scope_type),
            ])
            if (!isMounted) return
            setMessagesMap((prev) => ({ ...prev, [conv.id]: msgs }))
            if (leader) setLeaderInfoMap((prev) => ({ ...prev, [conv.id]: leader }))
            void messagingService.markAsRead(conv.id, 'member')
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
    const unsub = messagingService.subscribeToMessages(activeId, (msg) => {
      setMessagesMap((prev) => {
        const cur = prev[activeId] ?? []
        if (cur.some((m) => m.id === msg.id)) return prev
        return { ...prev, [activeId]: [...cur, msg] }
      })
      if (msg.sender_type === 'leader') {
        void messagingService.markAsRead(activeId, 'member')
      }
    })
    return unsub
  }, [activeId])

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (content: string) => {
    if (!activeConv || !user) return
    setSending(true)

    // Check anti-flood protection
    const floodCheck = await messagingService.checkCanSendMessage(activeConv.id, user.id)
    if (floodCheck) {
      const { toast } = await import('sonner')
      toast.error(floodCheck)
      setSending(false)
      return
    }

    const msg = await messagingService.sendMessage(activeConv.id, content, 'member', user.id)
    if (msg) {
      setMessagesMap((prev) => {
        const cur = prev[activeConv.id] ?? []
        return cur.some((m) => m.id === msg.id) ? prev : { ...prev, [activeConv.id]: [...cur, msg] }
      })
    } else {
      const { toast } = await import('sonner')
      toast.error('Message not sent — try again')
    }
    setSending(false)
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
  const leaderInitial = leaderInfo?.full_name?.charAt(0)?.toUpperCase() || '?'

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

      {/* Aside: Conversations list - full screen on mobile, sidebar on desktop */}
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
              placeholder="Search conversations..."
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

          {/* Conversations list - with internal scrollbar */}
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
            {/* Personal conversations (with leaders/departments) */}
            {conversations
              .filter((c) => !c.scope_type?.startsWith('group_'))
              .filter((c) => c.scope_value.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((conv) => {
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

            {/* Group forums section */}
            {conversations.filter(
              (c) =>
                c.scope_type?.startsWith('group_') &&
                c.scope_value.toLowerCase().includes(searchQuery.toLowerCase())
            ).length > 0 && (
              <div
                style={{
                  borderTop: '1px solid hsl(var(--border))',
                  padding: '12px 0',
                }}
              >
                <div
                  style={{
                    padding: '10px 16px',
                    fontSize: 11,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    textTransform: 'uppercase',
                    color: 'hsl(var(--on-surface-muted))',
                    letterSpacing: '0.05em',
                  }}
                >
                  📢 Community Forums
                </div>
                {conversations
                  .filter((c) => c.scope_type?.startsWith('group_'))
                  .map((conv) => {
                    const isActive = conv.id === activeId
                    const convMessages = messagesMap[conv.id] ?? []
                    const unreadCount = convMessages.filter((m) => !m.read_at).length

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
                            color: isActive
                              ? 'hsl(var(--primary))'
                              : 'hsl(var(--on-surface-muted))',
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
                            {convMessages.length}{' '}
                            {convMessages.length === 1 ? 'message' : 'messages'}
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

          {/* Departments section */}
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
                Departments
              </button>

              {expandDepartments && (
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
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
      {/* Chat panel - shown on desktop always, on mobile only when conversation selected */}
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

          {/* Desktop header - hidden on mobile when chat is shown */}
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
              {leaderInfo?.avatar_url ? (
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
                  {leaderInfo?.full_name ?? 'Your Leader'}
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
                  {leaderInfo ? roleLabel(leaderInfo.role) : ''}
                  {activeConv?.scope_value ? ` — ${activeConv.scope_value}` : ''}
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
                  No messages yet. Send one to your leader!
                </p>
              )}
              {messages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  content={msg.content}
                  isSelf={msg.sender_type === 'member'}
                  timestamp={msg.created_at}
                  senderName={
                    msg.sender_type === 'leader' ? (leaderInfo?.full_name ?? 'Leader') : undefined
                  }
                />
              ))}
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
                This conversation has been closed by your leader.
              </div>
            ) : (
              <ChatInput
                onSend={(content) => {
                  void handleSend(content)
                }}
                disabled={sending}
                placeholder="Message your leader…"
              />
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

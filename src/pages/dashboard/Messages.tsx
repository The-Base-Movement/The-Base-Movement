// src/pages/dashboard/Messages.tsx
import { useEffect, useRef, useState } from 'react'
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

export default function DashboardMessages() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [leaderInfo, setLeaderInfo] = useState<ConversationLeaderInfo | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load or create conversation on mount
  useEffect(() => {
    if (!user) return
    void (async () => {
      const conv = await messagingService.getOrCreateConversation(user.id)
      setConversation(conv)
      if (conv) {
        const [msgs, leader] = await Promise.all([
          messagingService.getMessages(conv.id),
          messagingService.getLeaderInfo(conv.leader_id),
        ])
        setMessages(msgs)
        setLeaderInfo(leader)
        void messagingService.markAsRead(conv.id, 'member')
      }
      setLoading(false)
    })()
  }, [user])

  // Realtime subscription
  useEffect(() => {
    if (!conversation) return
    const unsub = messagingService.subscribeToMessages(conversation.id, (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      if (msg.sender_type === 'leader') {
        void messagingService.markAsRead(conversation.id, 'member')
      }
    })
    return unsub
  }, [conversation])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (content: string) => {
    if (!conversation || !user) return
    setSending(true)
    const msg = await messagingService.sendMessage(conversation.id, content, 'member', user.id)
    if (msg) {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
    } else {
      const { toast } = await import('sonner')
      toast.error('Message not sent — try again')
    }
    setSending(false)
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

  if (!conversation) {
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
            Your regional leader hasn&apos;t been assigned yet. Contact HQ at{' '}
            <a href="mailto:info@thebasemovement.com" style={{ color: 'hsl(var(--primary))' }}>
              info@thebasemovement.com
            </a>
          </p>
        </div>
      </div>
    )
  }

  const isClosed = conversation.status === 'closed'
  const leaderInitial = leaderInfo?.full_name.charAt(0).toUpperCase() ?? '?'

  return (
    <div className="main" style={{ padding: '24px 20px' }}>
      <div
        className="panel"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 140px)',
          minHeight: 400,
          overflow: 'hidden',
        }}
      >
        {/* Conversation header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid hsl(var(--border))',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {leaderInfo?.avatar_url ? (
            <img
              src={leaderInfo.avatar_url}
              alt={leaderInfo.full_name}
              style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'hsl(var(--primary))',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 16,
              }}
            >
              {leaderInitial}
            </div>
          )}
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
              }}
            >
              {leaderInfo?.full_name ?? 'Your Leader'}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              {leaderInfo ? roleLabel(leaderInfo.role) : ''}
              {conversation.scope_value ? ` — ${conversation.scope_value}` : ''}
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
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
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
  )
}

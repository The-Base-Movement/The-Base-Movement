// src/components/chat/ChatInput.tsx
import { useRef, useState } from 'react'

interface ChatInputProps {
  onSend: (content: string) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Type a message…',
}: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    // Auto-grow up to 3 rows (72px)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 72) + 'px'
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 10,
        padding: '12px 16px',
        borderTop: '1px solid hsl(var(--border))',
        background: 'hsl(var(--card))',
      }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        style={{
          flex: 1,
          resize: 'none',
          border: '1px solid hsl(var(--border))',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 12px',
          fontSize: 13.5,
          fontFamily: "'Public Sans', sans-serif",
          fontWeight: 'var(--font-weight-medium, 500)',
          color: 'hsl(var(--on-surface))',
          background: 'hsl(var(--container-low))',
          boxSizing: 'border-box',
          outline: 'none',
          lineHeight: 1.5,
          overflow: 'hidden',
          opacity: disabled ? 0.5 : 1,
        }}
      />
      <button
        className="btn btn-primary btn-sm"
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        style={{ flexShrink: 0, height: 36, display: 'flex', alignItems: 'center', gap: 4 }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
          send
        </span>
      </button>
    </div>
  )
}

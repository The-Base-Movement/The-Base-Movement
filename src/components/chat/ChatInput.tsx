/**
 * ChatInput Component
 * -------------------------------------------------------------
 * Provides a dynamic, auto-growing textarea input field for chat.
 * Triggers callback events when messages are submitted (via Enter key or send button).
 *
 * Also hosts voice-note recording where it is allowed. Recording stops itself at
 * VOICE_NOTE_MAX_SECONDS so the cap does not depend on the member releasing the
 * button, and the requested bitrate is the single biggest lever on storage:
 * 60s of Opus at 24 kbps is ~180 KB against ~960 KB at the browser default.
 */

import { useEffect, useRef, useState } from 'react'
import { VOICE_NOTE_MAX_SECONDS } from '@/types/admin'

interface ChatInputProps {
  onSend: (content: string) => void
  disabled?: boolean
  placeholder?: string
  /**
   * Prefilled text, used when editing an existing message. The caller remounts this
   * component with a `key` when it changes, so there is no prop-to-state effect here.
   */
  initialValue?: string
  /** Shows a cancel control — set while editing or replying. */
  onCancel?: () => void
  /** When set, a mic button appears and recordings are handed back here. */
  onSendVoice?: (blob: Blob, durationSeconds: number, extension: string) => void
}

/** Opus where available; iOS Safari only offers mp4/AAC. */
function pickRecordingType(): { mime: string; ext: string } | null {
  if (typeof MediaRecorder === 'undefined') return null
  const candidates = [
    { mime: 'audio/webm;codecs=opus', ext: 'webm' },
    { mime: 'audio/ogg;codecs=opus', ext: 'ogg' },
    { mime: 'audio/webm', ext: 'webm' },
    { mime: 'audio/mp4', ext: 'mp4' },
  ]
  return candidates.find((c) => MediaRecorder.isTypeSupported(c.mime)) ?? null
}

/**
 * ChatInput
 * -------------------------------------------------------------
 * Text field component with key listeners and submit control.
 */
export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Type a message…',
  initialValue = '',
  onCancel,
  onSendVoice,
}: ChatInputProps) {
  const [value, setValue] = useState(initialValue)
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [micError, setMicError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAtRef = useRef(0)
  const cancelledRef = useRef(false)

  const stopTracks = () => {
    recorderRef.current?.stream.getTracks().forEach((t) => t.stop())
    if (tickRef.current) clearInterval(tickRef.current)
    tickRef.current = null
  }

  // Releasing the microphone on unmount matters: leaving it open keeps the
  // browser's recording indicator lit after the member navigates away.
  useEffect(() => {
    return () => {
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
      stopTracks()
    }
  }, [])

  /**
   * handleSend
   * -------------------------------------------------------------
   * Dispatches the text value if valid and resets the textarea's state.
   */
  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const startRecording = async () => {
    if (!onSendVoice || recording || disabled) return
    const type = pickRecordingType()
    if (!type) {
      setMicError('Voice notes are not supported in this browser')
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setMicError('Recording needs a secure (https) connection')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, {
        mimeType: type.mime,
        audioBitsPerSecond: 24_000,
      })
      chunksRef.current = []
      cancelledRef.current = false

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        stopTracks()
        setRecording(false)
        const elapsed = (Date.now() - startedAtRef.current) / 1000
        setSeconds(0)
        if (cancelledRef.current || chunksRef.current.length === 0) return
        // Sub-second taps are almost always a mis-tap, not a message.
        if (elapsed < 1) return
        const blob = new Blob(chunksRef.current, { type: type.mime })
        onSendVoice(blob, Math.min(elapsed, VOICE_NOTE_MAX_SECONDS), type.ext)
      }

      recorderRef.current = recorder
      startedAtRef.current = Date.now()
      recorder.start()
      setRecording(true)
      setMicError(null)

      tickRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000)
        setSeconds(elapsed)
        // The cap is enforced here rather than trusting the member to stop.
        if (elapsed >= VOICE_NOTE_MAX_SECONDS && recorderRef.current?.state === 'recording') {
          recorderRef.current.stop()
        }
      }, 250)
    } catch (err) {
      // A Permissions-Policy block and a user denial both surface as
      // NotAllowedError, so the copy has to cover both rather than blaming
      // the member for a refusal they never made.
      const name = (err as DOMException)?.name
      setMicError(
        name === 'NotFoundError' || name === 'DevicesNotFoundError'
          ? 'No microphone found'
          : 'Microphone unavailable — allow access in your browser and reload'
      )
    }
  }

  const finishRecording = (cancel: boolean) => {
    cancelledRef.current = cancel
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    else {
      stopTracks()
      setRecording(false)
      setSeconds(0)
    }
  }

  // Key event interceptor to send message on Enter (without Shift)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Value change tracker enforcing height adjustment auto-grow constraints
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    // Auto-grow up to 3 rows (72px)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 72) + 'px'
  }

  const remaining = VOICE_NOTE_MAX_SECONDS - seconds

  return (
    <div>
      {micError && (
        <div
          style={{
            padding: '6px 16px',
            fontSize: 11,
            color: 'hsl(var(--destructive))',
            fontFamily: "'Public Sans', sans-serif",
            borderTop: '1px solid hsl(var(--border))',
          }}
        >
          {micError}
        </div>
      )}
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
        {recording ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              height: 36,
              padding: '0 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'hsl(var(--container-low))',
              border: '1px solid hsl(var(--destructive))',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16, color: 'hsl(var(--destructive))' }}
            >
              mic
            </span>
            <span
              style={{
                fontSize: 12.5,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              Recording… 0:{String(seconds).padStart(2, '0')}
            </span>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 11,
                color: remaining <= 10 ? 'hsl(var(--destructive))' : 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              {remaining}s left
            </span>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            id="message-input"
            name="message-textarea"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={Boolean(initialValue)}
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
        )}

        {recording ? (
          <>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => finishRecording(true)}
              aria-label="Discard recording"
              style={{ flexShrink: 0, height: 36, display: 'flex', alignItems: 'center' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                delete
              </span>
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => finishRecording(false)}
              aria-label="Send voice note"
              style={{ flexShrink: 0, height: 36, display: 'flex', alignItems: 'center' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                send
              </span>
            </button>
          </>
        ) : (
          <>
            {onCancel && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setValue('')
                  onCancel()
                }}
                aria-label="Cancel"
                style={{ flexShrink: 0, height: 36, display: 'flex', alignItems: 'center' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  close
                </span>
              </button>
            )}
            {onSendVoice && !value.trim() && (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => void startRecording()}
                disabled={disabled}
                aria-label="Record a voice note"
                style={{ flexShrink: 0, height: 36, display: 'flex', alignItems: 'center' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  mic
                </span>
              </button>
            )}
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSend}
              disabled={disabled || !value.trim()}
              aria-label="Send message"
              style={{ flexShrink: 0, height: 36, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                send
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * VoiceNotePlayer
 * -------------------------------------------------------------
 * Playback for a voice note inside a chat bubble.
 *
 * The bucket is private, so the signed URL is fetched lazily on first play
 * rather than for every note in the thread — a room of fifty notes would
 * otherwise mint fifty signed URLs nobody listens to.
 *
 * A note whose audio has been purged (30 days) or recalled keeps its duration
 * but loses its path, so it renders as an expired placeholder instead of
 * disappearing and leaving a hole in the conversation.
 */

import { useEffect, useRef, useState } from 'react'
import { messagingService } from '@/services/messagingService'

interface VoiceNotePlayerProps {
  /** Storage path, or null when the audio is gone. */
  audioPath: string | null
  durationSeconds: number
  isSelf: boolean
}

function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  return `0:${String(s).padStart(2, '0')}`
}

export function VoiceNotePlayer({ audioPath, durationSeconds, isSelf }: VoiceNotePlayerProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [])

  const tint = isSelf ? 'hsl(var(--card))' : 'hsl(var(--primary))'
  const track = isSelf ? 'rgba(255,255,255,.35)' : 'hsl(var(--border))'

  if (!audioPath) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          fontStyle: 'italic',
          opacity: 0.75,
          fontFamily: "'Public Sans', sans-serif",
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
          mic_off
        </span>
        Voice note expired
      </span>
    )
  }

  const toggle = async () => {
    if (playing) {
      audioRef.current?.pause()
      setPlaying(false)
      return
    }

    let src = url
    if (!src) {
      setLoading(true)
      src = await messagingService.getVoiceNoteUrl(audioPath)
      setLoading(false)
      if (!src) return
      setUrl(src)
    }

    if (!audioRef.current) {
      const el = new Audio(src)
      el.addEventListener('timeupdate', () => setElapsed(el.currentTime))
      el.addEventListener('ended', () => {
        setPlaying(false)
        setElapsed(0)
      })
      audioRef.current = el
    }
    await audioRef.current.play()
    setPlaying(true)
  }

  const progress = durationSeconds > 0 ? Math.min(elapsed / durationSeconds, 1) : 0

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 168 }}>
      <button
        onClick={() => void toggle()}
        disabled={loading}
        aria-label={playing ? 'Pause voice note' : 'Play voice note'}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: loading ? 'default' : 'pointer',
          color: tint,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 26 }}>
          {loading ? 'hourglass_empty' : playing ? 'pause_circle' : 'play_circle'}
        </span>
      </button>

      <span
        style={{
          flex: 1,
          height: 3,
          minWidth: 72,
          borderRadius: 'var(--radius-pill)',
          background: track,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            position: 'absolute',
            inset: 0,
            width: `${progress * 100}%`,
            background: tint,
            borderRadius: 'var(--radius-pill)',
          }}
        />
      </span>

      <span
        style={{
          fontSize: 11,
          fontVariantNumeric: 'tabular-nums',
          fontFamily: "'Public Sans', sans-serif",
          opacity: 0.85,
        }}
      >
        {formatDuration(playing || elapsed > 0 ? durationSeconds - elapsed : durationSeconds)}
      </span>
    </span>
  )
}

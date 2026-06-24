import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { discordService } from '@/services/discordService'

const GATE_KEY = 'admin_gate_passed'
const GATE_TTL = 1000 * 60 * 60 * 4 // 4 hours

function isGateValid(): boolean {
  const raw = sessionStorage.getItem(GATE_KEY)
  if (!raw) return false
  const ts = Number(raw)
  return Date.now() - ts < GATE_TTL
}

interface AdminGateProps {
  children: React.ReactNode
}

export function AdminGate({ children }: AdminGateProps) {
  const [passed, setPassed] = useState(isGateValid)
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [locked, setLocked] = useState(false)
  const [checking, setChecking] = useState(false)

  if (passed) return <>{children}</>

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (locked || checking) return
    setChecking(true)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-admin-gate', {
        body: { passphrase: value.trim() },
      })

      if (fnError || !data?.ok) {
        const next = attempts + 1
        setAttempts(next)
        setError(true)
        discordService.adminAccessAttempt(false)
        setValue('')
        if (next >= 5) setLocked(true)
        return
      }

      sessionStorage.setItem(GATE_KEY, String(Date.now()))
      discordService.adminAccessAttempt(true)
      setPassed(true)
    } catch {
      setError(true)
      setValue('')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0d0b',
        fontFamily: "'Public Sans', sans-serif",
        padding: 20,
      }}
    >
      <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'rgba(0,107,63,.12)',
            border: '1px solid rgba(0,107,63,.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 26, color: 'hsl(var(--primary))' }}
          >
            lock
          </span>
        </div>

        <h1
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: '#fff',
            margin: '0 0 6px',
          }}
        >
          Restricted Area
        </h1>
        <p
          style={{
            fontSize: 12,
            color: 'rgba(255,255,255,.4)',
            margin: '0 0 28px',
          }}
        >
          This area requires authorization to proceed.
        </p>

        {locked ? (
          <div
            style={{
              padding: '16px 20px',
              background: 'rgba(206,17,38,.1)',
              border: '1px solid rgba(206,17,38,.3)',
              borderRadius: 6,
              color: 'hsl(var(--destructive))',
              fontSize: 13,
            }}
          >
            Too many failed attempts. Access locked.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                setError(false)
              }}
              placeholder="Enter passphrase"
              autoFocus
              autoComplete="off"
              disabled={checking}
              style={{
                width: '100%',
                height: 48,
                background: 'rgba(255,255,255,.06)',
                border: `1px solid ${error ? 'hsl(var(--destructive))' : 'rgba(255,255,255,.12)'}`,
                borderRadius: 6,
                padding: '0 16px',
                fontSize: 14,
                color: '#fff',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color .15s',
              }}
            />
            {error && (
              <p style={{ fontSize: 11, color: 'hsl(var(--destructive))', margin: '8px 0 0' }}>
                Incorrect passphrase. {5 - attempts} attempt{5 - attempts !== 1 ? 's' : ''}{' '}
                remaining.
              </p>
            )}
            <button
              type="submit"
              disabled={checking}
              style={{
                width: '100%',
                height: 44,
                marginTop: 14,
                background: 'hsl(var(--primary))',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: checking ? 'wait' : 'pointer',
                letterSpacing: '0.03em',
                opacity: checking ? 0.7 : 1,
              }}
            >
              {checking ? 'Verifying…' : 'Proceed'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

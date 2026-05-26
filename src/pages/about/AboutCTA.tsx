import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/buttons/ui/neon-button'

export function AboutCTA() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true)
      },
      { threshold: 0.2 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className="flex flex-col md:flex-row items-center justify-between gap-6"
      style={{
        background: 'hsl(var(--on-surface))',
        borderRadius: 16,
        padding: 'clamp(24px, 4vw, 40px) clamp(24px, 5vw, 48px)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s',
      }}
    >
      <div>
        <h3
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 'clamp(1.25rem, 3vw, 1.6rem)',
            color: '#fff',
            margin: '0 0 6px',
          }}
        >
          Ready to join the movement?
        </h3>
        <p
          style={{
            fontSize: 14,
            fontWeight: 'var(--font-weight-normal, 400)',
            color: 'rgba(255,255,255,0.65)',
            margin: 0,
          }}
        >
          Add your name. Strengthen the cause. Ghana First.
        </p>
      </div>

      <Link to="/register" style={{ flexShrink: 0 }}>
        <Button variant="accent" size="lg">
          Join the Base
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            arrow_forward
          </span>
        </Button>
      </Link>
    </div>
  )
}

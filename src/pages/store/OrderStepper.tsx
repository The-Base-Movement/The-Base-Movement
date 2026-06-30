import { useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger)

const steps = [
  {
    num: '01',
    title: 'Cart review',
    text: 'Confirm items and quantities. Apply member discount.',
    color: 'hsl(var(--brand-red))',
  },
  {
    num: '02',
    title: 'Shipping address',
    text: 'Region · constituency · landmark · phone for delivery rider.',
    color: 'hsl(var(--brand-gold))',
  },
  {
    num: '03',
    title: 'Payment',
    text: 'Hubtel checkout supports mobile money, bank card, wallets, and GhQR.',
    color: 'var(--charcoal)',
  },
  {
    num: '04',
    title: 'Order summary',
    text: 'Receipt emailed. Track from your member dashboard.',
    color: 'hsl(var(--brand-green))',
  },
]

export function OrderStepper() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      gsap.from('[data-step-card]', {
        opacity: 0,
        y: 24,
        duration: 0.5,
        ease: 'power2.out',
        stagger: 0.12,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' },
      })
    },
    { scope: sectionRef }
  )

  return (
    <section ref={sectionRef} className="mt-16 mb-16 pt-10 border-t-2 border-on-surface">
      <h2 className="font-meta font-medium text-[18px] md:text-[20px] mb-5 m-0">
        Checkout · Order flow
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-[14px]">
        {steps.map((step) => (
          <div
            key={step.num}
            data-step-card
            className="p-4 md:p-[18px] border border-border rounded-[6px]"
            style={{ borderLeft: `3px solid ${step.color}` }}
          >
            <div
              className="font-meta font-medium text-[24px] md:text-[32px] tracking-tight leading-none"
              style={{ color: step.color }}
            >
              {step.num}
            </div>
            <b className="font-meta font-semibold text-[12px] md:text-[13px] block mt-2">
              {step.title}
            </b>
            <p className="text-[10.5px] md:text-[11.5px] text-on-surface-muted font-medium mt-1 leading-relaxed m-0">
              {step.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

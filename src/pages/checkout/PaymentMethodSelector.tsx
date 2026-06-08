const hubtelMethods = [
  {
    label: 'Mobile Money',
    detail: 'MTN MoMo, Telecel Cash, AT Money',
    icon: 'smartphone',
  },
  {
    label: 'Bank Card',
    detail: 'Visa and Mastercard',
    icon: 'credit_card',
  },
  {
    label: 'Wallets',
    detail: 'Pay with supported digital wallets',
    icon: 'account_balance_wallet',
  },
  {
    label: 'GhQR',
    detail: 'Scan and pay with GhQR',
    icon: 'qr_code_2',
  },
]

export function PaymentMethodSelector() {
  return (
    <div
      className="panel"
      style={{
        padding: 24,
        background: 'hsl(var(--background))',
        border: '1px solid hsl(var(--border))',
        borderRadius: 'var(--radius-sm)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div
          style={{
            width: 40,
            height: 40,
            background: 'hsl(var(--primary) / 10%)',
            borderRadius: 'var(--radius-pill)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 20, color: 'hsl(var(--primary))' }}
          >
            credit_card
          </span>
        </div>
        <div>
          <h2
            className="font-h3 text-xl"
            style={{
              margin: 0,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-semibold, 600)',
              color: 'hsl(var(--on-surface))',
            }}
          >
            2. Secure payment
          </h2>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              letterSpacing: '-0.005em',
            }}
          >
            Hubtel opens a protected checkout where you choose the payment channel.
          </p>
        </div>
      </div>

      <div
        className="hubtel-payment-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 16,
        }}
      >
        {hubtelMethods.map((method) => (
          <div
            key={method.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: 20,
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              background: 'hsl(var(--container-low))',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-pill)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                background: 'hsl(var(--primary) / 10%)',
                color: 'hsl(var(--primary))',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 23 }}>
                {method.icon}
              </span>
            </div>
            <div>
              <p
                style={{
                  margin: '0 0 4px',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-bold, 700)',
                  fontSize: 14,
                  color: 'hsl(var(--on-surface))',
                }}
              >
                {method.label}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                  letterSpacing: '-0.005em',
                }}
              >
                {method.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media (max-width: 640px) {
              .hubtel-payment-grid {
                grid-template-columns: 1fr !important;
              }
            }
          `,
        }}
      />
    </div>
  )
}

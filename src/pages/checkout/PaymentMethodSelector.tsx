interface PaymentMethodSelectorProps {
  paymentMethod: 'momo' | 'card'
  onSelect: (method: 'momo' | 'card') => void
}

export function PaymentMethodSelector({ paymentMethod, onSelect }: PaymentMethodSelectorProps) {
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
        <h2
          className="font-h3 text-xl"
          style={{
            margin: 0,
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-semibold, 600)',
            color: 'hsl(var(--on-surface))',
          }}
        >
          2. Payment Method
        </h2>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
        }}
      >
        <button
          type="button"
          onClick={() => onSelect('momo')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: 24,
            border: `1px solid ${
              paymentMethod === 'momo' ? 'hsl(var(--primary))' : 'hsl(var(--border))'
            }`,
            borderRadius: 'var(--radius-sm)',
            background:
              paymentMethod === 'momo' ? 'hsl(var(--primary) / 5%)' : 'hsl(var(--container-low))',
            boxShadow: paymentMethod === 'momo' ? '0 0 0 1px hsl(var(--primary))' : 'none',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-pill)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: paymentMethod === 'momo' ? 'hsl(var(--primary))' : 'hsl(var(--border))',
              color: paymentMethod === 'momo' ? '#fff' : 'hsl(var(--on-surface-muted))',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
              smartphone
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
              Mobile money
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                letterSpacing: '-0.005em',
              }}
            >
              MTN, Telecel, AT money
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelect('card')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: 24,
            border: `1px solid ${
              paymentMethod === 'card' ? 'hsl(var(--primary))' : 'hsl(var(--border))'
            }`,
            borderRadius: 'var(--radius-sm)',
            background:
              paymentMethod === 'card' ? 'hsl(var(--primary) / 5%)' : 'hsl(var(--container-low))',
            boxShadow: paymentMethod === 'card' ? '0 0 0 1px hsl(var(--primary))' : 'none',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-pill)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: paymentMethod === 'card' ? 'hsl(var(--primary))' : 'hsl(var(--border))',
              color: paymentMethod === 'card' ? '#fff' : 'hsl(var(--on-surface-muted))',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
              credit_card
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
              Credit / debit card
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                letterSpacing: '-0.005em',
              }}
            >
              Visa, Mastercard, AMEX
            </p>
          </div>
        </button>
      </div>

      {paymentMethod === 'momo' && (
        <div
          style={{
            marginTop: 24,
            padding: 24,
            background: 'hsl(var(--container-low))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <label
            style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 'var(--font-weight-bold, 700)',
              color: 'hsl(var(--on-surface))',
              letterSpacing: '-0.005em',
              marginBottom: 12,
            }}
          >
            Select network
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {['MTN', 'Telecel', 'AT Money'].map((network) => (
              <label
                key={network}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                }}
              >
                <input
                  id="input-4964d2"
                  type="radio"
                  name="network"
                  style={{
                    width: 16,
                    height: 16,
                    accentColor: 'hsl(var(--primary))',
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 'var(--font-weight-bold, 700)',
                    color: 'hsl(var(--on-surface-muted))',
                    letterSpacing: '-0.005em',
                  }}
                >
                  {network}
                </span>
              </label>
            ))}
          </div>
          <div style={{ marginTop: 20 }}>
            <label
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 'var(--font-weight-bold, 700)',
                color: 'hsl(var(--on-surface))',
                letterSpacing: '-0.005em',
                marginBottom: 8,
              }}
            >
              MoMo number
            </label>
            <input
              aria-label="Enter your mobile number"
              name="name-94ad78"
              id="input-94ad78"
              type="tel"
              style={{
                width: '100%',
                height: 48,
                background: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                outline: 'none',
                boxSizing: 'border-box',
                padding: '0 16px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 14,
                fontFamily: "'Public Sans', sans-serif",
                transition: 'border-color 0.15s ease',
              }}
              placeholder="Enter your mobile number"
            />
          </div>
        </div>
      )}
    </div>
  )
}

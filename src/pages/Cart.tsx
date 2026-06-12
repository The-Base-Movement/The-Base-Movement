import { Link, useLocation } from 'react-router-dom'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { useStore } from '@/hooks/useStore'
import SEO from '@/components/SEO'
import { EmptyState } from '@/components/states'

export default function Cart() {
  const location = useLocation()
  const isDashboard = location.pathname.includes('/dashboard')
  const { cart, removeFromCart, updateCartQuantity } = useStore()

  const subtotal = cart.reduce((sum, item) => {
    const price =
      typeof item.price === 'string' ? parseFloat(item.price.replace(/[^0-9.]/g, '')) : item.price
    return sum + price * item.quantity
  }, 0)
  const shipping = cart.length > 0 ? 18 : 0
  const discount = cart.length > 0 ? 25 : 0
  const total = Math.max(0, subtotal + shipping - discount)

  const checkoutPath = isDashboard ? '/dashboard/store/checkout' : '/store/checkout'

  return (
    <div style={{ background: 'hsl(var(--background))', minHeight: '100vh' }}>
      <SEO
        title="Your Shopping Bag"
        description="Review your items and proceed to secure checkout."
        canonical="/store/cart"
        noindex
      />
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px 64px' }}>
        <Breadcrumbs />

        <header style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 28,
              color: 'hsl(var(--on-surface))',
              margin: '0 0 6px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              letterSpacing: '-0.02em',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 28, color: 'hsl(var(--primary))' }}
            >
              shopping_bag
            </span>
            Your Shopping Bag
          </h1>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-normal, 400)',
              fontSize: 13,
              color: 'hsl(var(--on-surface-muted))',
              margin: 0,
            }}
          >
            Review your items and proceed to secure checkout.
          </p>
        </header>

        {cart.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
            {/* Cart Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {cart.map((item) => {
                const unitPrice =
                  typeof item.price === 'string'
                    ? parseFloat(item.price.replace(/[^0-9.]/g, ''))
                    : item.price
                const lineTotal = unitPrice * item.quantity

                return (
                  <div
                    key={`${item.id}-${item.selectedSize}-${item.selectedColor}`}
                    style={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px 20px',
                      display: 'flex',
                      gap: 16,
                      alignItems: 'flex-start',
                    }}
                  >
                    {/* Thumbnail */}
                    <div
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 'var(--radius-sm)',
                        background: 'hsl(var(--container-low))',
                        overflow: 'hidden',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          decoding="async"
                          loading="lazy"
                        />
                      ) : (
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: 32, color: 'hsl(var(--on-surface-muted))' }}
                        >
                          shopping_bag
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 12,
                          marginBottom: 6,
                        }}
                      >
                        <Link
                          to={
                            isDashboard
                              ? `/dashboard/store/product/${item.slug}`
                              : `/store/product/${item.slug}`
                          }
                          style={{
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: 14,
                            color: 'hsl(var(--on-surface))',
                            textDecoration: 'none',
                            lineHeight: 1.3,
                          }}
                        >
                          {item.name}
                        </Link>
                        <span
                          style={{
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: 15,
                            color: 'hsl(var(--primary))',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          ₵{lineTotal.toFixed(0)}
                        </span>
                      </div>

                      {(item.selectedSize || item.selectedColor) && (
                        <div
                          style={{
                            display: 'flex',
                            gap: 12,
                            marginBottom: 10,
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 'var(--font-weight-normal, 400)',
                            fontSize: 11,
                            color: 'hsl(var(--on-surface-muted))',
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                          {item.selectedColor && <span>Colour: {item.selectedColor}</span>}
                        </div>
                      )}

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          marginTop: 'auto',
                        }}
                      >
                        {/* Quantity stepper */}
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 'var(--radius-sm)',
                            overflow: 'hidden',
                            height: 32,
                          }}
                        >
                          <button
                            onClick={() =>
                              updateCartQuantity(
                                item.id,
                                Math.max(1, item.quantity - 1),
                                item.selectedSize,
                                item.selectedColor
                              )
                            }
                            style={{
                              width: 32,
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'hsl(var(--on-surface-muted))',
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
                              remove
                            </span>
                          </button>
                          <span
                            style={{
                              width: 32,
                              textAlign: 'center',
                              fontFamily: "'Public Sans', sans-serif",
                              fontWeight: 'var(--font-weight-medium, 500)',
                              fontSize: 13,
                              fontVariantNumeric: 'tabular-nums',
                              color: 'hsl(var(--on-surface))',
                              borderLeft: '1px solid hsl(var(--border))',
                              borderRight: '1px solid hsl(var(--border))',
                            }}
                          >
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateCartQuantity(
                                item.id,
                                item.quantity + 1,
                                item.selectedSize,
                                item.selectedColor
                              )
                            }
                            style={{
                              width: 32,
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'hsl(var(--on-surface-muted))',
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
                              add
                            </span>
                          </button>
                        </div>

                        <button
                          onClick={() =>
                            removeFromCart(item.id, item.selectedSize, item.selectedColor)
                          }
                          className="btn btn-outline-dest btn-sm"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                            delete
                          </span>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}

              <Link
                to={isDashboard ? '/dashboard/store' : '/store'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 12,
                  color: 'hsl(var(--on-surface-muted))',
                  textDecoration: 'none',
                  marginTop: 4,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  arrow_back
                </span>
                Continue shopping
              </Link>
            </div>

            {/* Order Summary */}
            <div>
              <div
                style={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px 24px',
                  position: 'sticky',
                  top: 24,
                }}
              >
                <h2
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 15,
                    color: 'hsl(var(--on-surface))',
                    margin: '0 0 16px',
                    paddingBottom: 14,
                    borderBottom: '1px solid hsl(var(--border))',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Order Summary
                </h2>

                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}
                >
                  {[
                    { label: 'Subtotal', value: `₵${subtotal.toFixed(0)}`, muted: false },
                    { label: 'Shipping', value: `₵${shipping}`, muted: false },
                    { label: 'Member discount', value: `−₵${discount}`, green: true },
                    { label: 'Taxes', value: 'At checkout', muted: true },
                  ].map(({ label, value, muted, green }) => (
                    <div
                      key={label}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-normal, 400)',
                        fontSize: 13,
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      <span>{label}</span>
                      <span
                        style={{
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color: green
                            ? 'hsl(var(--primary))'
                            : muted
                              ? 'hsl(var(--on-surface-muted))'
                              : 'hsl(var(--on-surface))',
                          fontVariantNumeric: 'tabular-nums',
                          fontSize: muted ? 11 : 13,
                        }}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 14,
                    borderTop: '1px solid hsl(var(--border))',
                    marginBottom: 18,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 16,
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    Total
                  </span>
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 22,
                      color: 'hsl(var(--primary))',
                      letterSpacing: '-0.02em',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    ₵{total.toFixed(0)}
                  </span>
                </div>

                <Link
                  to={checkoutPath}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', height: 52 }}
                >
                  Proceed to Checkout
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    arrow_forward
                  </span>
                </Link>

                <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { icon: 'verified_user', text: '100% Secure transaction' },
                    { icon: 'local_shipping', text: 'Free shipping over ₵500' },
                  ].map(({ icon, text }) => (
                    <div
                      key={icon}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-normal, 400)',
                        fontSize: 11,
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        {icon}
                      </span>
                      {text}
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: 16,
                    display: 'flex',
                    gap: 6,
                    justifyContent: 'center',
                    opacity: 0.4,
                  }}
                >
                  {['Mobile Money', 'Bank Card', 'Wallets', 'GhQR'].map((m) => (
                    <span
                      key={m}
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 9,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius-xs)',
                        padding: '2px 6px',
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-lg)',
              padding: '64px 24px',
              textAlign: 'center',
              maxWidth: 480,
              margin: '0 auto',
            }}
          >
            <EmptyState
              icon="shopping_bag"
              title="Your bag is empty"
              body="Looks like you haven't added anything yet."
            />
            <div style={{ marginTop: 24 }}>
              <Link to="/store" className="btn btn-primary">
                Explore the Store
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Hubtel Checkout Service Helpers
 * -------------------------------------------------------------
 * Provides interface models and utility functions to interface with the Hubtel payment gateway.
 * Invokes the Supabase Edge Function 'hubtel-initiate-payment' and parses checkout targets.
 */

import { supabase } from '@/lib/supabase'

export interface HubtelCheckoutMetadata {
  donationId?: string
  groupId?: string
  orderId?: string
  monthlyDuesPaymentId?: string
  memberId?: string
  context?: { type: 'chapter' | 'constituency'; name: string; id: string }
  [key: string]: unknown
}

export interface HubtelCheckoutRequest {
  amount: number
  currency?: string
  name: string
  phone: string
  email?: string
  reference: string
  metadata?: HubtelCheckoutMetadata
  returnUrl?: string
  cancellationUrl?: string
}

/**
 * Traverses dynamic API response payloads to safely extract the checkout URL string.
 */
function getCheckoutUrl(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const record = payload as Record<string, unknown>
  const data = record.data
  if (data && typeof data === 'object') {
    const nested = data as Record<string, unknown>
    const url = nested.checkoutUrl ?? nested.CheckoutUrl ?? nested.paymentUrl ?? nested.PaymentUrl
    if (typeof url === 'string') return url
  }
  const url = record.checkoutUrl ?? record.CheckoutUrl ?? record.paymentUrl ?? record.PaymentUrl
  return typeof url === 'string' ? url : null
}

/**
 * Invokes the Edge Function to initialize a secure payment transaction with Hubtel.
 * Returns the checkout target URL on success.
 */
export async function initiateHubtelCheckout(request: HubtelCheckoutRequest): Promise<string> {
  const { data, error } = await supabase.functions.invoke('hubtel-initiate-payment', {
    body: {
      type: request.metadata?.donationId
        ? 'donation'
        : request.metadata?.groupId
          ? 'group_donation'
          : request.metadata?.orderId
            ? 'order'
            : request.metadata?.monthlyDuesPaymentId
              ? 'monthly_dues'
              : 'payment',
      reference: request.reference,
      amount: request.amount,
      currency: request.currency,
      name: request.name,
      phone: request.phone,
      email: request.email,
      metadata: request.metadata,
      returnUrl: request.returnUrl ?? `${window.location.origin}/payment-complete`,
      cancellationUrl: request.cancellationUrl ?? `${window.location.origin}/payment-complete`,
    },
  })

  if (error) throw error

  const checkoutUrl = getCheckoutUrl(data)
  if (!checkoutUrl) throw new Error('Hubtel did not return a checkout URL.')
  return checkoutUrl
}

/**
 * Triggers a centered viewport window pop-up pointing to the checkout URL.
 */
export function openHubtelCheckout(checkoutUrl: string): Window | null {
  return window.open(
    checkoutUrl,
    'hubtelCheckout',
    'width=520,height=760,menubar=no,toolbar=no,location=yes,status=no,resizable=yes,scrollbars=yes'
  )
}

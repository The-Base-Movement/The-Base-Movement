/**
 * Paystack Checkout Service Helpers
 * -------------------------------------------------------------
 * Invokes the 'paystack-initiate-payment' edge function. Paystack is the
 * primary payment gateway; initiateCheckout() falls back to Hubtel
 * automatically if Paystack initiation fails (network error, misconfigured
 * keys, etc.) so a single provider outage never blocks checkout.
 */

import { supabase } from '@/lib/supabase'
import {
  initiateHubtelCheckout,
  type HubtelCheckoutRequest,
} from '@/components/payment/hubtelCheckout'

export type CheckoutProvider = 'Paystack' | 'Hubtel'

export interface CheckoutResult {
  checkoutUrl: string
  provider: CheckoutProvider
}

function getCheckoutUrl(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const record = payload as Record<string, unknown>
  const url = record.checkoutUrl
  return typeof url === 'string' ? url : null
}

async function initiatePaystackCheckout(request: HubtelCheckoutRequest): Promise<string> {
  const { data, error } = await supabase.functions.invoke('paystack-initiate-payment', {
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

  if (error) throw new Error(error.message || 'Paystack payment initiation failed.')
  const checkoutUrl = getCheckoutUrl(data)
  if (!checkoutUrl) throw new Error('Paystack did not return a checkout URL.')
  return checkoutUrl
}

/**
 * Tries Paystack first, falls back to Hubtel if Paystack initiation throws.
 */
export async function initiateCheckout(request: HubtelCheckoutRequest): Promise<CheckoutResult> {
  try {
    const checkoutUrl = await initiatePaystackCheckout(request)
    return { checkoutUrl, provider: 'Paystack' }
  } catch (paystackError) {
    console.warn('[Checkout] Paystack initiation failed, falling back to Hubtel:', paystackError)
    const checkoutUrl = await initiateHubtelCheckout(request)
    return { checkoutUrl, provider: 'Hubtel' }
  }
}

export function openCheckout(checkoutUrl: string): Window | null {
  return window.open(
    checkoutUrl,
    'checkout',
    'width=520,height=760,menubar=no,toolbar=no,location=yes,status=no,resizable=yes,scrollbars=yes'
  )
}

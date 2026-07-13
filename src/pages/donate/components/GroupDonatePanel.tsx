import { useState } from 'react'
import { toast } from 'sonner'
import { donationService, type GroupDonationResult } from '@/services/donationService'
import { initiateHubtelCheckout } from '@/components/payment/hubtelCheckout'
import { HubtelPaymentModal } from '@/components/payment/HubtelPaymentModal'
import { normalizeDonationPhone } from '@/lib/donationPhone'
import { convertToGhs, getCurrencyForCountry } from '@/lib/currency'
import type { Country } from '@/services/adminService'
import { DonateSuccessPanel } from './DonateSuccessPanel'

interface GroupDonatePanelProps {
  campaignId: string | null
  countries: Country[]
  defaultName: string
  defaultPhone: string
  defaultCountry: string
}

/**
 * Donate as a group: a coordinator pastes one line per member
 * ("REG-NUMBER AMOUNT"), previews the resolved names, and pays the total in
 * one Hubtel charge. Each member gets their own donation record, receipt and
 * royalty points, exactly as if they had donated individually.
 */
export function GroupDonatePanel({
  campaignId,
  countries,
  defaultName,
  defaultPhone,
  defaultCountry,
}: GroupDonatePanelProps) {
  const [pasteText, setPasteText] = useState('')
  const [preview, setPreview] = useState<GroupDonationResult | null>(null)
  const [groupName, setGroupName] = useState('')
  const [payerName, setPayerName] = useState(defaultName)
  const [payerPhone, setPayerPhone] = useState(defaultPhone)
  const [payerCountry, setPayerCountry] = useState(defaultCountry || 'Ghana')
  const [busy, setBusy] = useState(false)
  const [groupId, setGroupId] = useState<string | null>(null)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Amounts are entered in the payer country's currency and converted to GHS
  // once, here — the rows, the Hubtel charge and the sum check all use the
  // same GHS numbers, so there is no double-conversion drift.
  const currency = getCurrencyForCountry(payerCountry)

  const parseEntries = (text: string) =>
    text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(/[,\t ]+/).filter(Boolean)
        return {
          registrationNumber: parts.slice(0, -1).join(' '),
          entered: Number(parts[parts.length - 1]),
        }
      })

  const toGhsPortions = (entries: ReturnType<typeof parseEntries>) =>
    entries.map((e) => ({
      registrationNumber: e.registrationNumber,
      amountGhs: Number(convertToGhs(e.entered, currency).toFixed(2)),
    }))

  const enteredByReg = (entries: ReturnType<typeof parseEntries>) =>
    new Map(entries.map((e) => [e.registrationNumber.toUpperCase(), e.entered]))

  const describeError = (result: GroupDonationResult) => {
    const regs = (result.registration_numbers ?? []).join(', ')
    switch (result.error) {
      case 'min_two_members':
        return 'A group donation needs at least 2 members.'
      case 'max_two_hundred_members':
        return 'A group donation is limited to 200 members.'
      case 'invalid_amounts':
        return `These rows have missing or invalid amounts: ${regs}`
      case 'duplicate_members':
        return `These members appear more than once: ${regs}`
      case 'unknown_members':
        return `These registration numbers were not found: ${regs}`
      case 'payer_phone_required':
        return 'Enter the payer phone number.'
      default:
        return 'The member list could not be validated. Check the format and try again.'
    }
  }

  const normalizedPayerPhone = () => {
    const country = countries.find((c) => c.name === payerCountry)
    return normalizeDonationPhone({
      phone: payerPhone,
      country: payerCountry,
      dialingCode: country?.dialing_code,
    })
  }

  const handlePreview = async () => {
    const entries = parseEntries(pasteText)
    if (entries.length < 2) {
      toast.error('Paste at least 2 lines, one per member: REG-NUMBER AMOUNT')
      return
    }
    const phone = normalizedPayerPhone()
    if (!phone.ok) {
      toast.error(phone.error)
      return
    }
    setBusy(true)
    try {
      const result = await donationService.createGroupDonation(toGhsPortions(entries), phone.e164, {
        campaignId,
        country: payerCountry,
        dryRun: true,
        groupName,
      })
      if (!result.ok) {
        setPreview(null)
        toast.error(describeError(result))
        return
      }
      setPreview(result)
    } catch {
      toast.error('Could not validate the member list. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const handlePay = async () => {
    if (!preview?.ok) return
    if (!payerName.trim()) {
      toast.error('Enter the payer full name.')
      return
    }
    const phone = normalizedPayerPhone()
    if (!phone.ok) {
      toast.error(phone.error)
      return
    }
    setBusy(true)
    try {
      const entries = parseEntries(pasteText)
      const result = await donationService.createGroupDonation(toGhsPortions(entries), phone.e164, {
        campaignId,
        country: payerCountry,
        groupName,
        payerName,
      })
      if (!result.ok || !result.group_id || !result.total_ghs) {
        toast.error(describeError(result))
        return
      }
      setGroupId(result.group_id)
      const url = await initiateHubtelCheckout({
        reference: result.group_id,
        // The charge is always the stored GHS total; the entered currency is
        // metadata only, so the sum check on the server is exact.
        amount: result.total_ghs,
        currency: 'GHS',
        name: payerName.trim(),
        phone: phone.e164,
        metadata: {
          groupId: result.group_id,
          groupName: groupName.trim() || undefined,
          memberCount: result.members?.length,
          ghsAmount: result.total_ghs,
          currency: 'GHS',
          sourceCurrency: currency.code,
        },
      })
      setCheckoutUrl(url)
      setIsModalOpen(true)
    } catch {
      toast.error('Could not start secure checkout. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (submitted) {
    return <DonateSuccessPanel variant="public" onNewContribution={() => setSubmitted(false)} />
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px',
    border: '1px solid hsl(var(--border))',
    borderRadius: 'var(--radius-xs)',
    fontSize: 14,
    fontFamily: "'Public Sans', sans-serif",
    color: 'hsl(var(--on-surface))',
    background: 'hsl(var(--card))',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 10,
    fontWeight: 'var(--font-weight-medium, 500)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'hsl(var(--on-surface-muted))',
    margin: '0 0 6px',
  }

  return (
    <div className="panel" style={{ padding: 24, marginTop: 24 }}>
      <div className="ph" style={{ marginBottom: 16 }}>
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            Donate as a group
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
            One member pays for the whole group. Every listed member is credited and rewarded for
            their own portion. Amounts follow the payer country&apos;s currency ({currency.code}).
          </p>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Group name (optional)</label>
        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          maxLength={120}
          placeholder="e.g. Kumasi Youth Wing"
          style={inputStyle}
        />
      </div>

      <label style={labelStyle}>
        Member list — one line per member: registration number, then amount in {currency.code}
      </label>
      <textarea
        value={pasteText}
        onChange={(e) => {
          setPasteText(e.target.value)
          setPreview(null)
        }}
        rows={8}
        placeholder={'TBM-GH-000001  500\nTBM-GH-000002  1200\nTBM-DI-000003  50'}
        style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginTop: 16,
        }}
      >
        <div>
          <label style={labelStyle}>Payer full name</label>
          <input
            type="text"
            value={payerName}
            onChange={(e) => setPayerName(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Payer phone</label>
          <input
            type="tel"
            value={payerPhone}
            onChange={(e) => setPayerPhone(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Payer country</label>
          <select
            value={payerCountry}
            onChange={(e) => {
              setPayerCountry(e.target.value)
              setPreview(null) // country sets the currency; converted amounts go stale
            }}
            style={inputStyle}
          >
            {countries.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {preview?.ok && (
        <div style={{ marginTop: 16 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {[
                    'Member',
                    'Registration no.',
                    ...(currency.code !== 'GHS' ? [`Amount (${currency.code})`] : []),
                    'Amount (GHS)',
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: h.startsWith('Amount') ? 'right' : 'left',
                        padding: '8px 10px',
                        borderBottom: '1px solid hsl(var(--border))',
                        fontSize: 10,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(preview.members ?? []).map((m) => (
                  <tr key={m.registration_number}>
                    <td
                      style={{
                        padding: '8px 10px',
                        borderBottom: '1px solid hsl(var(--border))',
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {m.full_name}
                    </td>
                    <td
                      style={{
                        padding: '8px 10px',
                        borderBottom: '1px solid hsl(var(--border))',
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {m.registration_number}
                    </td>
                    {currency.code !== 'GHS' && (
                      <td
                        style={{
                          padding: '8px 10px',
                          borderBottom: '1px solid hsl(var(--border))',
                          textAlign: 'right',
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {(
                          enteredByReg(parseEntries(pasteText)).get(m.registration_number) ?? 0
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    )}
                    <td
                      style={{
                        padding: '8px 10px',
                        borderBottom: '1px solid hsl(var(--border))',
                        textAlign: 'right',
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {Number(m.amount_ghs).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p
            style={{
              margin: '12px 0 0',
              textAlign: 'right',
              fontSize: 14,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
            }}
          >
            {currency.code !== 'GHS' && (
              <>
                {currency.symbol}{' '}
                {parseEntries(pasteText)
                  .reduce((sum, e) => sum + e.entered, 0)
                  .toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                ≈{' '}
              </>
            )}
            Total: ₵{' '}
            {Number(preview.total_ghs ?? 0).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            · {(preview.members ?? []).length} members
            {groupName.trim() ? ` · ${groupName.trim()}` : ''}
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-outline" onClick={handlePreview} disabled={busy}>
          {busy && !preview ? 'Checking…' : 'Preview members'}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handlePay}
          disabled={busy || !preview?.ok}
        >
          {busy && preview ? 'Starting checkout…' : 'Pay group total'}
        </button>
      </div>

      <HubtelPaymentModal
        isOpen={isModalOpen}
        checkoutUrl={checkoutUrl}
        referenceId={groupId}
        type="group_donation"
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false)
          setCheckoutUrl(null)
          setGroupId(null)
          setPasteText('')
          setPreview(null)
          setSubmitted(true)
          toast.success('Group donation confirmed. Every member has been credited.')
        }}
      />
    </div>
  )
}

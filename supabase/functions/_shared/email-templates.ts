// HTML email templates — The Base Movement
// Matches the email design kit at docs/design-system-handoff/.../ui_kits/emails/index.html
// Each function returns a complete HTML string safe to pass to an email provider (Resend, etc.)
// Max width 600px, inline styles only, Work Sans + Public Sans via Google Fonts

const SHELL_OPEN = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;700;800&family=Work+Sans:wght@400;500;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:32px 0;background:#f4f4f4;font-family:'Work Sans',Arial,sans-serif;font-size:14px;color:#1a1a1a">
<div style="max-width:600px;margin:0 auto">`

const SHELL_CLOSE = `</div></body></html>`

function emailHeader(tag: string) {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"
    style="background:#181d19;border-collapse:collapse">
    <tr>
      <td style="padding:20px 28px;vertical-align:middle">
        <table cellpadding="0" cellspacing="0" border="0" role="presentation">
          <tr>
            <td style="padding-right:10px;vertical-align:middle">
              <div style="width:28px;height:28px;background:#CE1126;border-radius:4px;font-family:'Public Sans',Arial;font-weight:800;font-size:13px;color:#fff;text-align:center;line-height:28px">B</div>
            </td>
            <td style="vertical-align:middle">
              <span style="font-family:'Public Sans',Arial;font-weight:800;font-size:14px;color:#fff">The Base Movement</span>
            </td>
          </tr>
        </table>
      </td>
      <td style="padding:20px 28px;vertical-align:middle;text-align:right;white-space:nowrap">
        <span style="font-family:'Public Sans',Arial;font-weight:800;font-size:9px;color:rgba(255,255,255,.5);letter-spacing:.08em;text-transform:uppercase">${tag}</span>
      </td>
    </tr>
  </table>`
}

const TOP_BAR = `<div style="height:5px;background:linear-gradient(to right,#CE1126,#DAA520,#006B3F)"></div>`

function emailFooter(lines: string) {
  return `
  <div style="background:#f9f9f9;padding:16px 28px;font-size:11px;color:#aaa;font-family:'Public Sans',Arial;font-weight:700;letter-spacing:.04em;line-height:1.7">
    ${lines}
    <div style="width:80px;height:3px;background:linear-gradient(to right,#CE1126,#DAA520,#006B3F);border-radius:99px;margin-top:10px"></div>
  </div>`
}

function ctaButton(label: string, url: string, color = '#006B3F') {
  return `<a href="${url}" style="display:block;background:${color};color:#fff;text-align:center;padding:14px 28px;border-radius:4px;font-family:'Public Sans',Arial;font-weight:800;font-size:14px;text-decoration:none;margin:20px 0">${label}</a>`
}

function statRow(stats: Array<{ value: string; label: string; color?: string }>) {
  const cells = stats
    .map(
      (s) => `
    <div style="background:#f6fbf4;border-radius:4px;padding:12px;text-align:center">
      <div style="font-family:'Public Sans',Arial;font-weight:800;font-size:22px;color:${s.color ?? '#181d19'};font-variant-numeric:tabular-nums">${s.value}</div>
      <div style="font-size:10px;color:#888;font-family:'Public Sans',Arial;font-weight:700;letter-spacing:.05em;text-transform:uppercase;margin-top:3px">${s.label}</div>
    </div>`
    )
    .join('')
  return `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin:18px 0">${cells}</div>`
}

// ---------------------------------------------------------------------------
// 01 · Welcome — new verified member
// ---------------------------------------------------------------------------

export interface WelcomeEmailData {
  name: string // e.g. "Kwesi"
  regNo: string // e.g. "GH-001847"
  chapter: string // e.g. "Lapaz 04"
  dashboardUrl: string
  cardDownloadUrl: string
  totalMembers?: string // e.g. "355,212"
}

export function welcomeEmail(d: WelcomeEmailData): string {
  const total = d.totalMembers ?? '355,212'
  return `${SHELL_OPEN}
  <div style="font-size:10px;color:#888;font-family:'Public Sans',Arial;font-weight:700;letter-spacing:.04em;background:#f4f4f4;padding:10px 24px">
    Welcome to The Base, ${d.name}. Your Ghana Card has been verified — here's what's next.
  </div>
  <div style="background:#fff;border-radius:4px;overflow:hidden">
    ${TOP_BAR}
    ${emailHeader('Member portal')}
    <div style="background:linear-gradient(135deg,#181d19,#0f1310);height:140px;display:flex;align-items:center;justify-content:center">
      <span style="font-family:'Public Sans',Arial;font-weight:800;font-size:48px;color:rgba(255,255,255,.12);letter-spacing:-.04em">Ghana First</span>
    </div>
    <div style="padding:28px 28px 24px">
      <div style="font-size:15px;font-weight:700;margin-bottom:18px;color:#181d19">Akwaaba, ${d.name} 🇬🇭</div>
      <h1 style="font-family:'Public Sans',Arial;font-weight:800;font-size:26px;letter-spacing:-.02em;line-height:1.15;color:#181d19;margin:0 0 14px">You are now a verified member of The Base.</h1>
      <p style="line-height:1.65;color:#444;margin-bottom:14px">Your Ghana Card has been confirmed. Your membership is active and your registration number is ready. Welcome to a movement of <strong>${total}</strong> patriots building Ghana's future.</p>
      ${statRow([
        { value: d.regNo, label: 'Reg. no.' },
        { value: 'Verified', label: 'Status', color: '#006B3F' },
        { value: d.chapter, label: 'Chapter' },
      ])}
      ${ctaButton('Go to your dashboard →', d.dashboardUrl)}
      <hr style="border:0;border-top:1px solid #eee;margin:18px 0">
      <h2 style="font-family:'Public Sans',Arial;font-weight:800;font-size:16px;letter-spacing:-.01em;color:#181d19;margin:22px 0 8px">Three things to do now.</h2>
      <p style="line-height:1.65;color:#444;margin-bottom:14px"><strong>1. Download your membership card.</strong> It includes your QR code, registration number, and chapter assignment. Show it at any branch event.</p>
      <p style="line-height:1.65;color:#444;margin-bottom:14px"><strong>2. Vote in the current poll.</strong> A regional poll is open. Your chapter chair needs your input.</p>
      <p style="line-height:1.65;color:#444;margin-bottom:14px"><strong>3. Follow your branch.</strong> Your nearest branch, ${d.chapter}, meets every first Saturday. Join the group to stay informed.</p>
      ${ctaButton('Download my membership card', d.cardDownloadUrl, '#DAA520')}
    </div>
    ${emailFooter(`Ghana First, jobs for the youth! · <a href="#" style="color:#888">Unsubscribe</a> · <a href="#" style="color:#888">Update preferences</a><br>The Base Movement · Accra, Ghana · nevermind-beta.vercel.app`)}
  </div>
${SHELL_CLOSE}`
}

// ---------------------------------------------------------------------------
// 02 · Donation receipt
// ---------------------------------------------------------------------------

export interface DonationReceiptEmailData {
  name: string // e.g. "Kwesi Owusu"
  amount: string // e.g. "₵50.00"
  method: string // e.g. "MTN MoMo · +233 24 ••• 8890"
  reference: string // e.g. "TBM-2026-00847"
  date: string // e.g. "26 May 2026 · 14:08 GMT"
  frequency?: string // e.g. "One-time"
  monthlyUrl: string
  receiptPdfUrl?: string
  impactNote?: string // sentence about what the donation funds
}

export function donationReceiptEmail(d: DonationReceiptEmailData): string {
  const freq = d.frequency ?? 'One-time'
  const impact =
    d.impactNote ??
    `Your ${d.amount} contribution goes directly to youth employment programs and branch operations.`

  function receiptRow(key: string, value: string, ok = false) {
    return `<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #f0f0f0;font-size:13px">
      <span style="color:#888;font-weight:700">${key}</span>
      <span style="font-family:'Public Sans',Arial;font-weight:800;${ok ? 'color:#006B3F' : ''}">${value}</span>
    </div>`
  }

  return `${SHELL_OPEN}
  <div style="font-size:10px;color:#888;font-family:'Public Sans',Arial;font-weight:700;letter-spacing:.04em;background:#f4f4f4;padding:10px 24px">
    Your ${d.amount} contribution is confirmed. Receipt ref: ${d.reference}. Thank you, patriot.
  </div>
  <div style="background:#fff;border-radius:4px;overflow:hidden">
    ${TOP_BAR}
    ${emailHeader('Donation receipt')}
    <div style="padding:28px 28px 24px">
      <div style="font-size:15px;font-weight:700;margin-bottom:18px;color:#181d19">Thank you, ${d.name}.</div>
      <h1 style="font-family:'Public Sans',Arial;font-weight:800;font-size:26px;letter-spacing:-.02em;line-height:1.15;color:#181d19;margin:0 0 14px">Your ${d.amount} contribution is confirmed.</h1>
      <p style="line-height:1.65;color:#444;margin-bottom:14px">Every cedi you give goes directly to youth employment programs and branch operations. Here is your official receipt.</p>
      ${receiptRow('Donor', d.name)}
      ${receiptRow('Amount', d.amount)}
      ${receiptRow('Method', d.method)}
      ${receiptRow('Date', d.date)}
      ${receiptRow('Frequency', freq)}
      ${receiptRow('Reference', d.reference)}
      ${receiptRow('Status', '✓ Confirmed', true)}
      <div style="display:flex;justify-content:space-between;padding:12px 16px;background:#f6fbf4;border-radius:4px;margin:14px 0">
        <span style="font-family:'Public Sans',Arial;font-weight:800">Total paid</span>
        <span style="font-family:'Public Sans',Arial;font-weight:800;font-size:18px;color:#006B3F">${d.amount}</span>
      </div>
      <p style="line-height:1.65;color:#888;font-size:12px;margin-bottom:14px">${impact}</p>
      ${ctaButton('Set up a monthly contribution →', d.monthlyUrl)}
      ${d.receiptPdfUrl ? `<a href="${d.receiptPdfUrl}" style="display:block;background:#fff;color:#006B3F;border:1px solid #dfe4dd;text-align:center;padding:12px;border-radius:4px;font-family:'Public Sans',Arial;font-weight:800;font-size:13px;text-decoration:none;margin-bottom:14px">Download PDF receipt</a>` : ''}
    </div>
    ${emailFooter(`Questions? Reply to this email or visit <a href="https://nevermind-beta.vercel.app/contact" style="color:#888">nevermind-beta.vercel.app/contact</a><br>The Base Movement · Accra, Ghana · <a href="#" style="color:#888">Unsubscribe</a>`)}
  </div>
${SHELL_CLOSE}`
}

// ---------------------------------------------------------------------------
// 03 · Movement broadcast
// ---------------------------------------------------------------------------

export interface BroadcastEmailData {
  subject: string // e.g. "Lapaz registered 1,247 new patriots in one weekend."
  preheader: string // short preview text
  greeting?: string // e.g. "Patriots —"
  body: string // HTML allowed (e.g. "<p>...</p><p>...</p>")
  region?: string // pill label e.g. "Greater Accra"
  heroText?: string // large ghost text in hero e.g. "1,247"
  heroColor?: string // hero bg e.g. "linear-gradient(135deg,#006B3F,#004d2d)"
  stats?: Array<{ value: string; label: string; color?: string }>
  ctaLabel: string
  ctaUrl: string
  secondaryCtaLabel?: string
  secondaryCtaUrl?: string
  secondaryCtaColor?: string
}

export function broadcastEmail(d: BroadcastEmailData): string {
  const greeting = d.greeting ?? 'Patriots —'
  const heroBg = d.heroColor ?? 'linear-gradient(135deg,#181d19,#0f1310)'
  const heroText = d.heroText ?? 'The Base'

  const regionPill = d.region
    ? `<span style="display:inline-block;padding:3px 9px;border-radius:99px;font-family:'Public Sans',Arial;font-weight:800;font-size:10px;background:rgba(218,165,32,.1);color:#7d5d12;border:1px solid rgba(218,165,32,.25)">${d.region}</span>`
    : ''
  const fieldPill = `<span style="display:inline-block;padding:3px 9px;border-radius:99px;font-family:'Public Sans',Arial;font-weight:800;font-size:10px;background:rgba(0,107,63,.1);color:#006B3F;border:1px solid rgba(0,107,63,.2)">Field report</span>`

  return `${SHELL_OPEN}
  <div style="font-size:10px;color:#888;font-family:'Public Sans',Arial;font-weight:700;letter-spacing:.04em;background:#f4f4f4;padding:10px 24px">
    ${d.preheader}
  </div>
  <div style="background:#fff;border-radius:4px;overflow:hidden">
    ${TOP_BAR}
    ${emailHeader('Movement update')}
    <div style="background:${heroBg};height:140px;display:flex;align-items:center;justify-content:center">
      <span style="font-family:'Public Sans',Arial;font-weight:800;font-size:48px;color:rgba(255,255,255,.25);letter-spacing:-.04em">${heroText}</span>
    </div>
    <div style="padding:28px 28px 24px">
      <div style="font-size:15px;font-weight:700;margin-bottom:18px;color:#181d19">${greeting}</div>
      <h1 style="font-family:'Public Sans',Arial;font-weight:800;font-size:26px;letter-spacing:-.02em;line-height:1.15;color:#181d19;margin:0 0 14px">${d.subject}</h1>
      <div style="display:flex;gap:6px;margin-bottom:14px">${regionPill}${fieldPill}</div>
      ${d.body}
      ${d.stats ? statRow(d.stats) : ''}
      ${ctaButton(d.ctaLabel, d.ctaUrl)}
      ${d.secondaryCtaLabel && d.secondaryCtaUrl ? `<hr style="border:0;border-top:1px solid #eee;margin:18px 0">${ctaButton(d.secondaryCtaLabel, d.secondaryCtaUrl, d.secondaryCtaColor ?? '#CE1126')}` : ''}
    </div>
    ${emailFooter(`You're receiving this because you are a verified member of The Base. · <a href="#" style="color:#888">Unsubscribe</a><br>The Base Movement · Accra, Ghana · nevermind-beta.vercel.app`)}
  </div>
${SHELL_CLOSE}`
}

// ---------------------------------------------------------------------------
// 04 · Poll closing notification
// ---------------------------------------------------------------------------

export interface PollOption {
  label: string
  percent: number
  leading?: boolean
}

export interface PollClosingEmailData {
  name: string
  pollTitle: string // e.g. "Which sector should we prioritise for Greater Accra?"
  preheader: string
  region: string // e.g. "Greater Accra"
  voteCount: number // e.g. 3412
  voteTarget: number // e.g. 5000
  hoursRemaining: number
  options: PollOption[]
  voteUrl: string
  resultNote?: string
}

export function pollClosingEmail(d: PollClosingEmailData): string {
  const progressPct = Math.round((d.voteCount / d.voteTarget) * 100)
  const voteCountFmt = d.voteCount.toLocaleString()
  const hrs = `${d.hoursRemaining} hour${d.hoursRemaining !== 1 ? 's' : ''}`

  const pollOptions = d.options
    .map((opt) => {
      const isLeading = opt.leading ?? false
      return `<div style="padding:10px 14px;border:1px solid ${isLeading ? '#006B3F' : '#e8ece7'};background:${isLeading ? '#f6fbf4' : '#fff'};border-radius:4px;margin-bottom:8px">
      <div style="display:flex;align-items:center;justify-content:space-between;font-family:'Public Sans',Arial;font-weight:800;font-size:13px">
        <span>${opt.label}</span>
        <span style="color:${isLeading ? '#006B3F' : '#444'};font-variant-numeric:tabular-nums">${opt.percent}%</span>
      </div>
      <div style="height:4px;background:${isLeading ? '#006B3F' : '#dfe4dd'};border-radius:99px;margin-top:6px;width:${opt.percent}%"></div>
    </div>`
    })
    .join('')

  const resultNote =
    d.resultNote ??
    'Results are published publicly 48 hours after closing. The regional coordinator is required to respond within 7 days explaining how results will influence planning.'

  return `${SHELL_OPEN}
  <div style="font-size:10px;color:#888;font-family:'Public Sans',Arial;font-weight:700;letter-spacing:.04em;background:#f4f4f4;padding:10px 24px">
    ${d.preheader}
  </div>
  <div style="background:#fff;border-radius:4px;overflow:hidden">
    ${TOP_BAR}
    ${emailHeader('Poll · closing soon')}
    <div style="padding:28px 28px 24px">
      <div style="font-size:15px;font-weight:700;margin-bottom:18px;color:#181d19">${d.name} —</div>
      <h1 style="font-family:'Public Sans',Arial;font-weight:800;font-size:26px;letter-spacing:-.02em;line-height:1.15;color:#181d19;margin:0 0 14px">This poll closes in ${hrs}. Your vote counts.</h1>
      <p style="line-height:1.65;color:#444;margin-bottom:14px">You haven't voted in the ${d.region} regional poll. <strong>${voteCountFmt}</strong> of your fellow members have. The results go directly to the regional coordinator before the next planning session.</p>
      <h2 style="font-family:'Public Sans',Arial;font-weight:800;font-size:16px;letter-spacing:-.01em;color:#181d19;margin:22px 0 8px">${d.pollTitle}</h2>
      ${pollOptions}
      <div style="background:#eee;border-radius:99px;height:8px;overflow:hidden;margin:10px 0">
        <div style="display:block;height:100%;background:linear-gradient(to right,#CE1126,#DAA520,#006B3F);border-radius:99px;width:${progressPct}%"></div>
      </div>
      <p style="font-size:11px;color:#888;font-family:'Public Sans',Arial;font-weight:700;margin-bottom:16px">${voteCountFmt} of ${d.voteTarget.toLocaleString()} target votes received · ${hrs} remaining</p>
      ${ctaButton('Cast my vote now →', d.voteUrl, '#DAA520')}
      <hr style="border:0;border-top:1px solid #eee;margin:18px 0">
      <p style="line-height:1.65;color:#888;font-size:12px">${resultNote}</p>
    </div>
    ${emailFooter(`You're receiving this because you are a verified member in the ${d.region} region. · <a href="#" style="color:#888">Unsubscribe</a><br>The Base Movement · <a href="#" style="color:#888">Manage poll notifications</a>`)}
  </div>
${SHELL_CLOSE}`
}

// ---------------------------------------------------------------------------
// 05 · CSV import — account credentials
// ---------------------------------------------------------------------------

export interface CsvImportWelcomeEmailData {
  name: string
  regNo: string
  phone: string
  tempPassword: string
  loginUrl: string
}

export function csvImportWelcomeEmail(d: CsvImportWelcomeEmailData): string {
  return `${SHELL_OPEN}
  <div style="background:#fff;border-radius:4px;overflow:hidden">
    ${TOP_BAR}
    ${emailHeader('Account setup')}
    <div style="padding:28px 28px 24px">
      <div style="font-size:15px;font-weight:700;margin-bottom:18px;color:#181d19">Welcome, ${d.name} 🇬🇭</div>
      <h1 style="font-family:'Public Sans',Arial;font-weight:800;font-size:24px;letter-spacing:-.02em;line-height:1.2;color:#181d19;margin:0 0 14px">Your Base Movement account is ready.</h1>
      <p style="line-height:1.65;color:#444;margin-bottom:20px">An administrator has set up your account. Use the credentials below to log in for the first time — you will be asked to set a new password immediately.</p>
      <div style="background:#f6fbf4;border:1px solid #d4edda;border-radius:4px;padding:18px 20px;margin-bottom:20px">
        <div style="font-family:'Public Sans',Arial;font-weight:800;font-size:10px;color:#006B3F;letter-spacing:.08em;text-transform:uppercase;margin-bottom:12px">Your login credentials</div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #e8f5e9">
          <span style="font-size:12px;color:#888;font-family:'Public Sans',Arial;font-weight:700;text-transform:uppercase;letter-spacing:.05em">Phone</span>
          <span style="font-family:'Public Sans',Arial;font-weight:800;font-size:14px;color:#181d19">${d.phone}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #e8f5e9">
          <span style="font-size:12px;color:#888;font-family:'Public Sans',Arial;font-weight:700;text-transform:uppercase;letter-spacing:.05em">Reg. No.</span>
          <span style="font-family:'Public Sans',Arial;font-weight:800;font-size:14px;color:#181d19">${d.regNo}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0">
          <span style="font-size:12px;color:#888;font-family:'Public Sans',Arial;font-weight:700;text-transform:uppercase;letter-spacing:.05em">Temp password</span>
          <span style="font-family:monospace;font-weight:800;font-size:15px;color:#CE1126;letter-spacing:.06em">${d.tempPassword}</span>
        </div>
      </div>
      <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:4px;padding:12px 16px;margin-bottom:20px;font-size:12px;color:#7a5800;font-family:'Public Sans',Arial;font-weight:700">
        ⚠ You must change this password after your first login. Do not share it with anyone.
      </div>
      ${ctaButton('Log in to The Base →', d.loginUrl)}
    </div>
    ${emailFooter(`You're receiving this because an administrator created your account. · nevermind-beta.vercel.app`)}
  </div>
${SHELL_CLOSE}`
}

// ---------------------------------------------------------------------------
// Donation receipt — downloadable HTML (printable, no email shell)
// ---------------------------------------------------------------------------

export interface DonationReceiptHtmlData {
  name: string // "Kwame Mensah"
  amount: string // "₵50.00"
  method: string // "Hubtel" | "Mobile Money" | "Bank Transfer" etc.
  reference: string // internal donation reference
  hubtelReference?: string // Hubtel transaction ID if available
  date: string // "09 Jun 2026 · 14:08 GMT"
}

export function donationReceiptHtml(d: DonationReceiptHtmlData): string {
  const rows = [
    { label: 'Donor', value: d.name },
    { label: 'Amount', value: d.amount },
    { label: 'Payment Method', value: d.method },
    { label: 'Date', value: d.date },
    { label: 'Reference', value: d.reference },
    ...(d.hubtelReference ? [{ label: 'Transaction ID', value: d.hubtelReference }] : []),
    { label: 'Status', value: '✓ Verified', green: true },
  ]

  const rowHtml = rows
    .map(
      (r) =>
        `<div class="row">
          <span class="label">${r.label}</span>
          <span class="value${(r as { green?: boolean }).green ? ' green' : ''}">${r.value}</span>
        </div>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Donation Receipt – ${d.reference}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Public Sans',Arial,sans-serif;background:#f6fbf4;color:#181d19;padding:40px 20px}
  .receipt{max-width:520px;margin:0 auto;background:#fff;border:1px solid #dfe4dd;border-radius:8px;overflow:hidden}
  .hdr{background:#006B3F;padding:28px 32px;color:#fff}
  .hdr h1{font-size:22px;font-weight:700;letter-spacing:-.02em}
  .hdr p{font-size:12px;opacity:.8;margin-top:4px}
  .body{padding:28px 32px}
  .row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:13px}
  .row:last-child{border-bottom:none}
  .label{color:#6f7a71;font-weight:500}
  .value{font-weight:600;text-align:right}
  .value.green{color:#006B3F}
  .total{background:#f6fbf4;border-radius:4px;padding:14px 16px;margin-top:16px;display:flex;justify-content:space-between;align-items:center}
  .total .tl{font-weight:700;font-size:14px}
  .total .tv{font-size:20px;font-weight:800;color:#006B3F}
  .ftr{padding:16px 32px;border-top:1px solid #dfe4dd;font-size:11px;color:#6f7a71;text-align:center;line-height:1.6}
  @media print{body{background:#fff;padding:0}.receipt{border:none;border-radius:0;max-width:100%}}
</style>
</head>
<body>
<div class="receipt">
  <div class="hdr">
    <h1>Donation Receipt</h1>
    <p>The Base Movement · Official Payment Confirmation</p>
  </div>
  <div class="body">
    ${rowHtml}
    <div class="total">
      <span class="tl">Total Paid</span>
      <span class="tv">${d.amount}</span>
    </div>
  </div>
  <div class="ftr">
    The Base Movement · Accra, Ghana · thebasemovement.com<br/>
    This receipt is valid proof of your contribution.
  </div>
</div>
</body>
</html>`
}

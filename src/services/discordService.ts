const WEBHOOK = import.meta.env.VITE_DISCORD_WEBHOOK_URL as string | undefined

interface Field {
  name: string
  value: string
  inline?: boolean
}

interface Embed {
  title: string
  description?: string
  color: number
  fields?: Field[]
  footer?: { text: string }
  timestamp: string
}

function post(embed: Embed): void {
  if (!WEBHOOK) return
  fetch(WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [embed] }),
  }).catch(() => {})
}

export const discordService = {
  memberRegistered(name: string, platform: string, regionOrCountry: string, regNo: string): void {
    post({
      title: '🇬🇭 New Patriot Registered',
      color: 0x006b3f,
      fields: [
        { name: 'Name', value: name || '—', inline: true },
        {
          name: 'Network',
          value: platform === 'GHANA' ? 'Ghana Network' : 'Diaspora Network',
          inline: true,
        },
        {
          name: platform === 'GHANA' ? 'Region' : 'Country',
          value: regionOrCountry || '—',
          inline: true,
        },
        { name: 'Reg No', value: regNo, inline: true },
      ],
      timestamp: new Date().toISOString(),
    })
  },

  donationSubmitted(
    name: string,
    amount: string,
    method: string,
    country: string,
    campaign?: string
  ): void {
    const fields: Field[] = [
      { name: 'From', value: name || 'Anonymous', inline: true },
      { name: 'Amount', value: `₵ ${Number(amount).toLocaleString()}`, inline: true },
      { name: 'Method', value: method || 'MTN MoMo', inline: true },
      { name: 'Country', value: country || '—', inline: true },
    ]
    if (campaign) fields.push({ name: 'Campaign', value: campaign, inline: true })
    post({
      title: '💰 Donation Received',
      color: 0xfcd116,
      fields,
      footer: { text: 'Awaiting verification' },
      timestamp: new Date().toISOString(),
    })
  },

  memberVerified(regNo: string, name: string, approved: boolean, chapter?: string): void {
    const fields: Field[] = [
      { name: 'Member', value: name || regNo, inline: true },
      { name: 'Reg No', value: regNo, inline: true },
    ]
    if (approved && chapter) fields.push({ name: 'Chapter', value: chapter, inline: true })
    post({
      title: approved ? '✅ Member Approved' : '❌ Member Rejected',
      color: approved ? 0x006b3f : 0xce1126,
      fields,
      timestamp: new Date().toISOString(),
    })
  },

  blogPostPublished(title: string, category: string, author: string, slug: string): void {
    post({
      title: '📢 New Post Published',
      description: `**${title}**`,
      color: 0x5865f2,
      fields: [
        { name: 'Category', value: category || '—', inline: true },
        { name: 'Author', value: author || 'Admin', inline: true },
      ],
      footer: { text: `/blog/${slug}` },
      timestamp: new Date().toISOString(),
    })
  },
}

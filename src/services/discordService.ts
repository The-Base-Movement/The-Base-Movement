import { supabase } from '@/lib/supabase'

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

type DiscordChannel = 'payments' | 'alerts'

function post(embed: Embed, channel?: DiscordChannel): void {
  // Fire-and-forget: route through the server-side proxy Edge Function.
  // `channel` selects a dedicated webhook (payments/alerts); omitted = default
  // notifications channel.
  supabase.functions
    .invoke('discord-notify', {
      body: { embeds: [embed], channel },
    })
    .catch((err) => {
      console.warn('[DISCORD SERVICE] Failed to send notification through proxy:', err)
    })
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
    post(
      {
        title: '💰 Donation Received',
        color: 0xfcd116,
        fields,
        footer: { text: 'Awaiting verification' },
        timestamp: new Date().toISOString(),
      },
      'payments'
    )
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

  storeOrderPlaced(
    orderId: string,
    name: string,
    totalAmount: number,
    itemCount: number,
    method: string,
    regionOrState: string
  ): void {
    post(
      {
        title: '🛒 New Store Order Placed',
        color: 0x006b3f,
        fields: [
          { name: 'Order ID', value: `#${orderId.substring(0, 8).toUpperCase()}`, inline: true },
          { name: 'Customer', value: name || 'Anonymous', inline: true },
          { name: 'Total Amount', value: `₵ ${totalAmount.toFixed(2)}`, inline: true },
          { name: 'Items', value: `${itemCount} item${itemCount === 1 ? '' : 's'}`, inline: true },
          { name: 'Payment Method', value: method || 'N/A', inline: true },
          { name: 'Region/State', value: regionOrState || '—', inline: true },
        ],
        timestamp: new Date().toISOString(),
      },
      'payments'
    )
  },

  chapterJoined(name: string, regNo: string, chapterName: string, regionOrCountry: string): void {
    post({
      title: '📍 Member Joined Chapter',
      color: 0x006b3f,
      fields: [
        { name: 'Patriot', value: name || '—', inline: true },
        { name: 'Reg No', value: regNo || '—', inline: true },
        { name: 'Chapter', value: chapterName || '—', inline: true },
        { name: 'Region/Country', value: regionOrCountry || '—', inline: true },
      ],
      timestamp: new Date().toISOString(),
    })
  },

  donationVerified(
    name: string,
    amount: string,
    method: string,
    country: string,
    reference: string
  ): void {
    post(
      {
        title: '💰 Donation Confirmed ✅',
        color: 0xfcd116,
        fields: [
          { name: 'From', value: name || 'Anonymous', inline: true },
          { name: 'Amount', value: `₵ ${Number(amount).toLocaleString()}`, inline: true },
          { name: 'Method', value: method || 'MTN MoMo', inline: true },
          { name: 'Country', value: country || '—', inline: true },
          { name: 'Reference', value: reference || '—', inline: true },
        ],
        footer: { text: 'Receipt Sent & Dispatched' },
        timestamp: new Date().toISOString(),
      },
      'payments'
    )
  },

  // Generic system alert → #alerts channel. Use in catch blocks / failure paths
  // for things an operator should see immediately (not the weekly digest).
  alert(title: string, description: string, fields?: Field[]): void {
    post(
      {
        title: `🔴 ${title}`,
        description,
        color: 0xce1126,
        fields,
        footer: { text: 'Automated alert' },
        timestamp: new Date().toISOString(),
      },
      'alerts'
    )
  },
}

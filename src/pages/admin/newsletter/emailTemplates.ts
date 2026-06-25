// ---------------------------------------------------------------------------
// Email template presets — fill TinyMCE body with starter HTML
// These are the inner body only; the outer shell/header/footer is applied
// automatically by the send-newsletter edge function.
// ---------------------------------------------------------------------------

export const EMAIL_TEMPLATES: {
  id: string
  label: string
  icon: string
  description: string
  defaultSubject: string
  html: string
}[] = [
  {
    id: 'announcement',
    label: 'Announcement',
    icon: 'campaign',
    description: 'General movement announcement with headline and body',
    defaultSubject: 'Important Update from The Base Movement',
    html: `<h2 style="margin:0 0 12px;font-family:'Public Sans',Arial;font-size:22px;font-weight:800;color:#181d19;line-height:1.3">Headline Goes Here</h2>
<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#444">Open with a brief summary of the announcement — one or two sentences that explain why this matters to members.</p>
<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#444">Add your main body text here. Keep it clear, direct, and action-oriented. Members appreciate brevity.</p>
<a href="https://thebasemovement.info" style="display:inline-block;background:#006B3F;color:#fff;padding:14px 28px;border-radius:4px;font-family:'Public Sans',Arial;font-weight:800;font-size:14px;text-decoration:none;margin:8px 0 20px">Read More →</a>`,
  },
  {
    id: 'event',
    label: 'Event / Rally',
    icon: 'event',
    description: 'Event or rally invitation with date, location, and RSVP',
    defaultSubject: 'You Are Invited — The Base Movement Rally',
    html: `<h2 style="margin:0 0 6px;font-family:'Public Sans',Arial;font-size:22px;font-weight:800;color:#181d19">Event Title</h2>
<p style="margin:0 0 20px;font-size:14px;color:#6f7a71">Join us for this important gathering of patriots</p>
<table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#f4f4f4;border-radius:8px;margin-bottom:20px">
  <tr>
    <td style="padding:20px">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6f7a71">Date &amp; Time</p>
      <p style="margin:0 0 16px;font-size:15px;font-weight:700;color:#181d19">Saturday, July 12, 2026 at 10:00 AM</p>
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6f7a71">Location</p>
      <p style="margin:0;font-size:15px;font-weight:700;color:#181d19">Venue Name, City, Ghana</p>
    </td>
  </tr>
</table>
<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#444">Describe the event, what to expect, and why attendance matters. Keep the tone energetic and motivating.</p>
<a href="https://thebasemovement.info" style="display:inline-block;background:#CE1126;color:#fff;padding:14px 28px;border-radius:4px;font-family:'Public Sans',Arial;font-weight:800;font-size:14px;text-decoration:none;margin:8px 0 20px">RSVP Now →</a>`,
  },
  {
    id: 'member-update',
    label: 'Member Update',
    icon: 'group',
    description: 'Membership news, benefits, or important notices',
    defaultSubject: 'Membership Update — The Base Movement',
    html: `<h2 style="margin:0 0 12px;font-family:'Public Sans',Arial;font-size:22px;font-weight:800;color:#181d19">Member Notice</h2>
<p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#444">Dear Patriot, we have an important update regarding your membership.</p>
<ul style="margin:0 0 20px;padding-left:20px;font-size:15px;line-height:2;color:#444">
  <li>Key point one goes here</li>
  <li>Key point two goes here</li>
  <li>Key point three goes here</li>
</ul>
<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#444">Any further details or instructions for members can go here.</p>
<a href="https://thebasemovement.info/dashboard" style="display:inline-block;background:#006B3F;color:#fff;padding:14px 28px;border-radius:4px;font-family:'Public Sans',Arial;font-weight:800;font-size:14px;text-decoration:none;margin:8px 0 20px">Go to Dashboard →</a>`,
  },
  {
    id: 'policy',
    label: 'Policy / Statement',
    icon: 'policy',
    description: 'Official policy position or public statement',
    defaultSubject: 'Our Position on [Topic] — The Base Movement',
    html: `<h2 style="margin:0 0 6px;font-family:'Public Sans',Arial;font-size:22px;font-weight:800;color:#181d19">Official Statement</h2>
<p style="margin:0 0 20px;font-size:13px;color:#6f7a71;font-style:italic">Issued by The Base Movement National Secretariat</p>
<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#444">Opening paragraph — state the issue clearly and our position on it.</p>
<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#444">Second paragraph with supporting reasoning or context. Reference facts, values, or the movement's mandate.</p>
<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#444">Closing call to action or next steps for members and the public.</p>
<div style="border-left:4px solid #DAA520;padding:12px 16px;background:#fffdf0;margin:20px 0">
  <p style="margin:0;font-size:14px;font-style:italic;color:#5a4a00">"Quote or key soundbite from leadership goes here."</p>
  <p style="margin:8px 0 0;font-size:12px;font-weight:700;color:#6f7a71">— Name, Title</p>
</div>`,
  },
]

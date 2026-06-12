import DOMPurify from 'dompurify'

export function toSafeHtml(md: string): string {
  const escaped = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const raw = escaped
    .replace(/^### (.+)$/gm, '<h3 style="margin:14px 0 5px;font-size:13px;font-weight:600">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="margin:18px 0 7px;font-size:15px;font-weight:600">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="margin:0 0 12px;font-size:18px;font-weight:600">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(
      /```([\s\S]*?)```/g,
      '<pre style="background:#f5f5f5;border:1px solid #e0e0e0;border-radius:4px;padding:12px;overflow-x:auto;font-size:12px;margin:10px 0"><code>$1</code></pre>'
    )
    .replace(
      /`(.+?)`/g,
      '<code style="background:#f5f5f5;border:1px solid #e0e0e0;border-radius:3px;padding:1px 5px;font-size:12px">$1</code>'
    )
    .replace(
      /^- \[ \] (.+)$/gm,
      '<div style="display:flex;gap:8px;align-items:center;margin:3px 0"><span style="width:13px;height:13px;border:1.5px solid #ccc;border-radius:2px;display:inline-block;flex-shrink:0"></span><span>$1</span></div>'
    )
    .replace(
      /^- \[x\] (.+)$/gm,
      '<div style="display:flex;gap:8px;align-items:center;margin:3px 0;opacity:0.6;text-decoration:line-through"><span style="width:13px;height:13px;background:#16a34a;border-radius:2px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff;font-size:9px">✓</span><span>$1</span></div>'
    )
    .replace(/^- (.+)$/gm, '<li style="margin:3px 0">$1</li>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #e0e0e0;margin:14px 0"/>')
    .replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#15803d;text-decoration:underline">$1</a>'
    )
    .replace(/\n\n/g, '</p><p style="margin:8px 0">')
    .replace(/\n/g, '<br/>')

  return DOMPurify.sanitize(`<p style="margin:0">${raw}</p>`, {
    ALLOWED_TAGS: [
      'p',
      'h1',
      'h2',
      'h3',
      'h4',
      'strong',
      'em',
      'code',
      'pre',
      'li',
      'ul',
      'ol',
      'a',
      'br',
      'hr',
      'div',
      'span',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'style'],
    ALLOW_DATA_ATTR: false,
  })
}

function Btn({ variant = 'primary', size = 'md', children, href, onClick, className = '' }) {
  const base = 'tbm-btn';
  const cls = `${base} ${base}--${variant} ${base}--${size} ${className}`;
  if (href) return <a className={cls} href={href} onClick={onClick}>{children}</a>;
  return <button className={cls} onClick={onClick}>{children}</button>;
}
window.Btn = Btn;

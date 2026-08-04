function BrandLine({ className = '', width = 128 }) {
  return (
    <div className={`brand-line ${className}`} style={{ width }}>
      <span style={{ background: '#CE1126', flex: 1 }} />
      <span style={{ background: '#DAA520', flex: 1 }} />
      <span style={{ background: '#006B3F', flex: 1 }} />
    </div>
  );
}
window.BrandLine = BrandLine;

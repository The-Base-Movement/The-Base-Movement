function Footer() {
  const [email, setEmail] = React.useState('');
  const [sub, setSub] = React.useState(false);
  const cols = [
    { h: 'Foundation', l: ['The plan', 'Impact', 'Chapters', 'Polls'] },
    { h: 'Connect', l: ['Contact', 'Press', 'Privacy', 'Terms of service'] },
    { h: 'Action', l: ['Join', 'Donate', 'Supplies'] },
  ];
  const socials = ['facebook', 'instagram', 'tiktok', 'youtube'];
  return (
    <footer className="tbm-footer">
      <div className="tbm-footer__grid">
        <div className="tbm-footer__brand">
          <div className="tbm-footer__logo">
            <img src="../../assets/logo.png" alt="" />
            <div>
              <h2>The Base</h2>
              <span>Ghana First, Jobs for the Youth!</span>
            </div>
          </div>
          <p>A grassroots movement committed to youth jobs, accountable leadership, and national development for a more productive Ghana.</p>
          <div className="tbm-footer__social">
            {socials.map(s => <a key={s} href="#"><img src={`../../assets/icons/${s}.svg`} alt={s} /></a>)}
          </div>
        </div>
        <div className="tbm-footer__cols">
          {cols.map(c => (
            <div key={c.h}>
              <h4>{c.h}</h4>
              {c.l.map(x => <a key={x} href="#">{x}</a>)}
            </div>
          ))}
        </div>
        <div className="tbm-footer__news">
          <div className="tbm-news">
            <h4>Stay Informed.</h4>
            <p>Subscribe to receive regular updates on our progress, community initiatives, and news from across the movement.</p>
            {sub ? <div className="tbm-news__ok">Successfully Enlisted</div> : (
              <form onSubmit={(e) => { e.preventDefault(); if (email) setSub(true); }}>
                <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <Btn variant="primary" className="tbm-news__btn">Subscribe →</Btn>
              </form>
            )}
          </div>
        </div>
      </div>
      <div className="tbm-footer__bar">
        <p>© 2026 The Base Movement. Ghana First.</p>
        <div className="tbm-footer__gradient" />
      </div>
    </footer>
  );
}
window.Footer = Footer;

function Navbar({ isLoggedIn, onLogin, onLogout, onRegister }) {
  const [mobile, setMobile] = React.useState(false);
  const [drop, setDrop] = React.useState(false);
  const links = ['Home', 'Updates', 'Polls', 'The Plan', 'Chapters', 'Supplies', 'Donate', 'Contact'];
  const [active, setActive] = React.useState('Home');
  return (
    <header className="tbm-nav">
      <nav>
        <div className="tbm-nav__brand">
          <img src="../../assets/logo.png" alt="The Base" />
          <h1>The Base</h1>
        </div>
        <div className="tbm-nav__links">
          {links.map(l => (
            <a key={l} className={active === l ? 'is-active' : ''} onClick={(e) => { e.preventDefault(); setActive(l); }} href="#">{l}</a>
          ))}
          {isLoggedIn && <a className="tbm-nav__dash" href="#">Dashboard</a>}
        </div>
        <div className="tbm-nav__actions">
          {isLoggedIn ? (
            <div className="tbm-nav__avatar-wrap">
              <button className="tbm-nav__avatar" onClick={() => setDrop(!drop)}>
                <img src="https://i.pravatar.cc/80?u=base" alt="Profile" />
              </button>
              {drop && (
                <div className="tbm-nav__dropdown">
                  <div className="tbm-nav__dropdown-h">
                    <p>Member portal</p>
                    <span>Active patriot</span>
                  </div>
                  <a href="#">Dashboard</a>
                  <a href="#">Settings</a>
                  <button className="tbm-nav__logout" onClick={() => { setDrop(false); onLogout(); }}>Logout</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Btn variant="ghost" size="sm" onClick={onLogin}>Login</Btn>
              <Btn variant="gold" size="sm" onClick={onRegister}>Register</Btn>
            </>
          )}
        </div>
        <button className="tbm-nav__hamburger" onClick={() => setMobile(!mobile)}>{mobile ? '×' : '☰'}</button>
      </nav>
    </header>
  );
}
window.Navbar = Navbar;

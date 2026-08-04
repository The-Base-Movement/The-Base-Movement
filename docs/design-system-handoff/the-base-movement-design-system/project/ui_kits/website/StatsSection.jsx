function Counter({ target, duration = 1800 }) {
  const [val, setVal] = React.useState(0);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) start(); }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    let started = false;
    function start() {
      if (started) return; started = true;
      const inc = target / (duration / 16);
      let cur = 0;
      const t = setInterval(() => { cur += inc; if (cur >= target) { setVal(target); clearInterval(t); } else setVal(Math.floor(cur)); }, 16);
    }
    return () => obs.disconnect();
  }, [target]);
  const color = val <= 100000 ? '#CE1126' : val <= 200001 ? '#DAA520' : '#006B3F';
  return <div ref={ref} className="tbm-counter" style={{ color }}>{val.toLocaleString()}</div>;
}
function StatsSection() {
  const stats = [
    { n: 355212, c: '#006B3F', label: 'Members registered nationwide', cap: "Verified citizens joined across the movement's network." },
    { n: 1247, c: '#DAA520', label: 'Community branches active in nearly every district', cap: 'Local branches established and operating nationwide.' },
    { n: 16, c: '#CE1126', label: 'Movement presence across all 16 regions', cap: 'Full representation across every administrative region.' },
    { n: 28400, c: '#181d19', label: 'Diaspora supporters registered online', cap: 'Global Ghanaians supporting from abroad.' },
  ];
  return (
    <section className="tbm-stats">
      <div className="tbm-stats__inner">
        {stats.map(s => (
          <div key={s.label} className="tbm-stat">
            <BrandLine className="tbm-stat__bl" width={80} />
            <Counter target={s.n} />
            <div className="tbm-stat__lbl" style={{ color: s.c }}>{s.label}</div>
            <p>{s.cap}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
window.StatsSection = StatsSection;

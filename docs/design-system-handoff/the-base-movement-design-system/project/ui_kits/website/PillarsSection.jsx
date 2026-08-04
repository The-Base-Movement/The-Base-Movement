function PillarsSection() {
  const pillars = [
    { color: '#CE1126', label: 'Core Pillar 01', title: 'Economic Responsibility', body: 'We advocate for the transparent management of national resources to ensure they are invested in projects that create sustainable, long-term jobs for our youth.' },
    { color: '#DAA520', label: 'Core Pillar 02', title: 'Youth Participation', body: "We believe young people must be at the heart of our progress, equipped with the skills and opportunities to lead Ghana's development." },
    { color: '#006B3F', label: 'Core Pillar 03', title: 'Integrity & Accountability', body: 'A movement built on trust. We believe every leader must be answerable to the citizens they represent and the promises they make.' },
  ];
  return (
    <section className="tbm-pillars">
      <div className="tbm-pillars__inner">
        <h2>Our Foundation</h2>
        <BrandLine />
        <div className="tbm-pillars__grid">
          {pillars.map(p => (
            <div key={p.label} className="tbm-pillar" style={{ borderLeftColor: p.color }}>
              <span className="tbm-pillar__eye" style={{ color: p.color }}>{p.label}</span>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
window.PillarsSection = PillarsSection;

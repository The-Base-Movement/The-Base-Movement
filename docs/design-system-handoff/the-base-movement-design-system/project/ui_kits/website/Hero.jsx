function Hero({ onJoin, onLearn }) {
  const ref = React.useRef(null);
  const [pos, setPos] = React.useState({ x: -1000, y: -1000 });
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
  };
  return (
    <section className="tbm-hero" ref={ref} onMouseMove={onMove}>
      <div className="tbm-hero__bg" style={{ backgroundImage: "url('../../assets/hero-background-image.png')" }} />
      <div
        className="tbm-hero__spot"
        style={{
          backgroundImage: "url('../../assets/hero-background-image.png')",
          WebkitMaskImage: `radial-gradient(circle 350px at ${pos.x}px ${pos.y}px, black 0%, transparent 100%)`,
          maskImage: `radial-gradient(circle 350px at ${pos.x}px ${pos.y}px, black 0%, transparent 100%)`,
        }}
      />
      <div className="tbm-hero__veil" />
      <div className="tbm-hero__inner">
        <div className="tbm-hero__copy">
          <h1>Ghana First,<br />Jobs for the youth!</h1>
          <BrandLine />
          <p>We are a grassroots movement committed to youth jobs, accountable leadership, and national development. Join citizens in Ghana and across the diaspora working for a more productive future.</p>
          <div className="tbm-hero__cta">
            <Btn variant="gold" size="lg" onClick={onJoin}>Join the Movement →</Btn>
            <Btn variant="primary" size="lg" onClick={onLearn}>Learn More About Us</Btn>
          </div>
        </div>
        <div className="tbm-hero__logo">
          <img src="../../assets/logo.png" alt="The Base" />
        </div>
      </div>
    </section>
  );
}
window.Hero = Hero;

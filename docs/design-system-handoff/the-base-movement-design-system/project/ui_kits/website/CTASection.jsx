function CTASection({ onRegister, onAgenda }) {
  return (
    <section className="tbm-cta">
      <div className="tbm-cta__card">
        <span className="tbm-cta__eye">Ready to build Ghana?</span>
        <h2>Join the Movement Shaping Ghana's Future.</h2>
        <p>Be part of a growing movement focused on jobs, accountability, and a stronger future for the next generation.</p>
        <div className="tbm-cta__btns">
          <Btn variant="gold" size="lg" onClick={onRegister}>Register Now →</Btn>
          <Btn variant="primary" size="lg" onClick={onAgenda}>Get Involved →</Btn>
        </div>
        <div className="tbm-cta__pills">
          {['Base Ghana', 'Base Diaspora', 'Free Registration'].map(l => <span key={l}>{l}</span>)}
        </div>
      </div>
    </section>
  );
}
window.CTASection = CTASection;

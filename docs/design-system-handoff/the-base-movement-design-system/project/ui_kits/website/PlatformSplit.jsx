function PlatformSplit({ onGhana, onDiaspora }) {
  return (
    <section className="tbm-split">
      <div className="tbm-split__inner">
        <div className="tbm-split__col tbm-split__col--green">
          <h3><span className="tbm-pin">📍</span>For Citizens in Ghana.</h3>
          <p>Get involved in your district. Join your local branch, take part in community activity, and support practical action for jobs and development.</p>
          <Btn variant="primary" onClick={onGhana}>Join Base Ghana →</Btn>
        </div>
        <div className="tbm-split__col tbm-split__col--gold">
          <h3><span className="tbm-pin">🌍</span>For Ghanaians Abroad.</h3>
          <p>Stay connected to home and support national development from abroad through your skills, networks, and commitment to Ghana's future.</p>
          <Btn variant="gold" onClick={onDiaspora}>Join Base Diaspora →</Btn>
        </div>
      </div>
    </section>
  );
}
window.PlatformSplit = PlatformSplit;

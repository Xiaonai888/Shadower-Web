import Icon from "./Icon";

function ComingSoon({ icon, title }) {
  return (
    <main className="coming-page">
      <div className="coming-card">
        <div className="coming-icon">
          <Icon name={icon} size={30} />
        </div>
        <span className="eyebrow">SHADOWER STUDIO</span>
        <h1>{title}</h1>
        <p>This workspace is being prepared and will be available soon.</p>
        <span className="soon-badge">Coming soon</span>
      </div>
    </main>
  );
}

export default ComingSoon;

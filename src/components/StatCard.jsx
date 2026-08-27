export default function StatCard({ label, value, hint, tone = 'low' }) {
  return (
    <article className={`stat-card tone-${String(tone).toLowerCase()}`}>
      <p className="eyebrow">{label}</p>
      <p className="stat-value">{value}</p>
      {hint ? <p className="stat-hint">{hint}</p> : null}
    </article>
  );
}

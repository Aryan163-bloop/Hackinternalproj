export default function SeverityBadge({ severity }) {
  const level = String(severity || 'Low');
  const tone = level.toLowerCase();
  return <span className={`badge badge-${tone}`}>{level}</span>;
}

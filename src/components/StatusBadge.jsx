export default function StatusBadge({ status }) {
  const value = String(status || 'Unknown');
  const tone = value.toLowerCase();
  const className =
    tone === 'online' || tone === 'safe' || tone === 'closed'
      ? 'badge badge-safe'
      : tone === 'offline' || tone === 'error'
        ? 'badge badge-critical'
        : tone === 'active' || tone === 'open'
          ? 'badge badge-high'
          : 'badge badge-low';
  return <span className={className}>{value}</span>;
}

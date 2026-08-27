const SEVERITY_RANK = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

export function timeAgo(value) {
  if (!value) return '—';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '—';
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatTimestamp(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function severityRank(severity) {
  return SEVERITY_RANK[severity] || 0;
}

export function riskColor(level) {
  const key = String(level || '').toLowerCase();
  if (key === 'critical') return 'critical';
  if (key === 'high') return 'high';
  if (key === 'medium') return 'medium';
  if (key === 'low') return 'low';
  if (key === 'safe' || key === 'online') return 'safe';
  return 'low';
}

export function asArray(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value.items)) return value.items;
  if (Array.isArray(value.results)) return value.results;
  if (Array.isArray(value.data)) return value.data;
  if (Array.isArray(value.logs)) return value.logs;
  if (Array.isArray(value.events)) return value.events;
  if (Array.isArray(value.scan_results)) return value.scan_results;
  if (Array.isArray(value.honeypot_logs)) return value.honeypot_logs;
  if (Array.isArray(value.threat_events)) return value.threat_events;
  return [];
}

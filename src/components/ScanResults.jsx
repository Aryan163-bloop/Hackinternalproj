import { useMemo, useState } from 'react';
import SeverityBadge from './SeverityBadge';
import StatusBadge from './StatusBadge';
import { formatTimestamp, severityRank } from '../utils/format';

export default function ScanResults({ results, loading, error, scanning }) {
  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState('All');
  const [sortKey, setSortKey] = useState('severity');

  const rows = useMemo(() => {
    const filtered = (results || []).filter((row) => {
      const haystack = `${row.endpoint} ${row.vulnerability_type} ${row.evidence}`.toLowerCase();
      const matchesQuery = haystack.includes(query.toLowerCase());
      const matchesSeverity = severity === 'All' || row.severity === severity;
      return matchesQuery && matchesSeverity;
    });
    return filtered.sort((a, b) => {
      if (sortKey === 'severity') return severityRank(b.severity) - severityRank(a.severity);
      if (sortKey === 'endpoint') return String(a.endpoint).localeCompare(String(b.endpoint));
      if (sortKey === 'scanned_at') return new Date(b.scanned_at || 0) - new Date(a.scanned_at || 0);
      return 0;
    });
  }, [query, results, severity, sortKey]);

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Scanner output</p>
          <h2>SECURITY FINDINGS</h2>
        </div>
      </div>
      <div className="toolbar">
        <input
          className="mono-input"
          placeholder="Search endpoint, type, evidence"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select value={severity} onChange={(event) => setSeverity(event.target.value)}>
          <option>All</option>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
          <option>Critical</option>
        </select>
        <select value={sortKey} onChange={(event) => setSortKey(event.target.value)}>
          <option value="severity">Sort: Severity</option>
          <option value="endpoint">Sort: Endpoint</option>
          <option value="scanned_at">Sort: Scanned at</option>
        </select>
      </div>
      {loading || scanning ? <p className="state-msg">Loading findings…</p> : null}
      {error ? <p className="state-msg is-error">{error}</p> : null}
      {!loading && !scanning && !error && rows.length === 0 ? (
        <p className="state-msg">No findings yet. Start an authorized scan to populate this table.</p>
      ) : null}
      {!loading && !scanning && rows.length > 0 ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Endpoint</th>
                <th>Vulnerability</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Evidence</th>
                <th>Scanned At</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="mono">{row.endpoint}</td>
                  <td>{row.vulnerability_type}</td>
                  <td>
                    <SeverityBadge severity={row.severity} />
                  </td>
                  <td>
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="evidence">{row.evidence}</td>
                  <td className="mono muted">{formatTimestamp(row.scanned_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

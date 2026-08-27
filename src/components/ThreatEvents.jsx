import { formatTimestamp } from '../utils/format';
import StatusBadge from './StatusBadge';

const EVENT_TONES = {
  RECON: 'low',
  BRUTE_FORCE: 'high',
  ACTIVE_EXPLOITATION: 'critical',
};

export default function ThreatEvents({ events, loading, error }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Classifier output</p>
          <h2>THREAT EVENTS</h2>
        </div>
      </div>
      {loading && !events.length ? <p className="state-msg">Classifying activity…</p> : null}
      {error ? <p className="state-msg is-error">{error}</p> : null}
      {!loading && !error && !events.length ? (
        <p className="state-msg">No classified threat events in this window.</p>
      ) : null}
      <div className="table-wrap">
        {events.length ? (
          <table>
            <thead>
              <tr>
                <th>Source IP</th>
                <th>Event Type</th>
                <th>Severity Score</th>
                <th>Classification Reason</th>
                <th>Status</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {events.map((row) => (
                <tr key={row.id}>
                  <td className="mono">{row.source_ip}</td>
                  <td>
                    <span className={`badge badge-${EVENT_TONES[row.event_type] || 'low'}`}>
                      {row.event_type}
                    </span>
                  </td>
                  <td className="mono">{row.severity_score}</td>
                  <td>{row.classification_reason}</td>
                  <td>
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="mono muted">{formatTimestamp(row.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </section>
  );
}

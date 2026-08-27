import { useEffect, useRef, useState } from 'react';
import { timeAgo } from '../utils/format';

export default function AttackFeed({ logs, loading, error }) {
  const seenRef = useRef(new Set());
  const booted = useRef(false);
  const [fresh, setFresh] = useState(() => new Set());
  const [, setClock] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setClock((value) => value + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const ids = (logs || []).map((row) => String(row.id));
    if (!booted.current) {
      seenRef.current = new Set(ids);
      booted.current = true;
      return undefined;
    }
    const newcomers = ids.filter((id) => !seenRef.current.has(id));
    if (!newcomers.length) return undefined;
    seenRef.current = new Set(ids);
    setFresh(new Set(newcomers));
    const timer = setTimeout(() => setFresh(new Set()), 2400);
    return () => clearTimeout(timer);
  }, [logs]);

  return (
    <section className="panel feed-panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Honeypot telemetry</p>
          <h2>LIVE ATTACK FEED</h2>
        </div>
      </div>
      {loading && !logs.length ? <p className="state-msg">Listening for events…</p> : null}
      {error ? <p className="state-msg is-error">{error}</p> : null}
      {!loading && !error && !logs.length ? (
        <p className="state-msg">No attacker traffic yet. Trigger the live attack demo to stream events.</p>
      ) : null}
      <ul className="feed-list">
        {logs.map((row) => {
          const id = String(row.id);
          const isNew = fresh.has(id);
          return (
            <li key={id} className={`feed-item ${isNew ? 'is-new' : ''}`}>
              <div className="feed-top">
                <span className="mono ip">{row.source_ip}</span>
                <span className="mono method">{row.method}</span>
                <span className="mono endpoint">{row.endpoint_hit}</span>
                {isNew ? <span className="new-tag">NEW</span> : null}
                <span className="muted when">{timeAgo(row.hit_at)}</span>
              </div>
              {row.payload_snippet ? (
                <pre className="payload">{row.payload_snippet}</pre>
              ) : (
                <p className="muted payload-empty">No payload body</p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

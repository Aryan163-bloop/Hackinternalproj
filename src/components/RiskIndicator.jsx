import { Shield } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function RiskIndicator({ risk }) {
  const level = risk?.level || 'Low';
  const score = Number(risk?.score ?? 0);
  const tone = level.toLowerCase();
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    setPulse(true);
    const id = setTimeout(() => setPulse(false), 900);
    return () => clearTimeout(id);
  }, [level, score]);

  const classification =
    tone === 'critical'
      ? 'ACTIVE EXPLOITATION'
      : tone === 'high'
        ? 'BRUTE FORCE IN PROGRESS'
        : tone === 'medium'
          ? 'ELEVATED EXPOSURE'
          : 'QUIET MONITORING';

  return (
    <section className={`hero-risk tone-${tone} ${pulse ? 'is-pulse' : ''}`}>
      <div className="hero-copy">
        <p className="eyebrow">
          <Shield size={14} />
          LIVE THREAT LEVEL
        </p>
        <p className={`hero-level tone-${tone}`}>{level.toUpperCase()}</p>
        <p className="hero-score">
          <span>{score}</span>
          <small>/ 100</small>
        </p>
        <p className="hero-class">{classification}</p>
      </div>
      <div className="hero-meter" aria-hidden="true">
        <div className="meter-track">
          <div className={`meter-fill tone-${tone}`} style={{ width: `${Math.min(score, 100)}%` }} />
        </div>
        <div className="meter-scale">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
          <span>Critical</span>
        </div>
      </div>
    </section>
  );
}

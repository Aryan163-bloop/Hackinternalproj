import { Activity, ShieldAlert } from 'lucide-react';

export default function Header({ backendOnline, demoMode }) {
  return (
    <header className="header">
      <div className="brand-block">
        <div className="brand-mark" aria-hidden="true">
          <ShieldAlert size={22} />
        </div>
        <div>
          <h1 className="brand">SENTINELPATH</h1>
          <p className="subtitle">AI-ASSISTED WEB SECURITY &amp; THREAT INTELLIGENCE</p>
        </div>
      </div>
      <div className="header-status">
        <span className={`sys-pill ${backendOnline ? 'is-online' : 'is-offline'}`}>
          <span className="sys-dot" />
          {backendOnline ? 'SYSTEM ONLINE' : 'BACKEND OFFLINE'}
        </span>
        {demoMode ? (
          <span className="sys-pill is-demo">
            <Activity size={14} />
            DEMO MODE
          </span>
        ) : null}
      </div>
    </header>
  );
}

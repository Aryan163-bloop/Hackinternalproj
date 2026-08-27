import { useState } from 'react';
import { Radar, Zap } from 'lucide-react';

const DEFAULT_TARGET = 'http://127.0.0.1:5000';
const SCAN_STEPS = [
  'INITIALIZING SCANNER',
  'DISCOVERING ENDPOINTS',
  'RUNNING ZAP SCAN',
  'ANALYZING VULNERABILITIES',
  'FINALIZING RESULTS',
  'SCAN COMPLETE',
];

export default function TargetScanner({
  onScan,
  onTriggerDemo,
  scanning,
  scanStep,
  demoRunning,
}) {
  const [url, setUrl] = useState(DEFAULT_TARGET);
  const [notice, setNotice] = useState('');

  function handleScan(event) {
    event.preventDefault();
    const target = url.trim();
    if (!/^https?:\/\//i.test(target)) {
      setNotice('Enter an authorized http(s) URL.');
      return;
    }
    setNotice('');
    onScan(target);
  }

  return (
    <section className="panel scanner-panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Authorized assessment</p>
          <h2>TARGET SECURITY SCANNER</h2>
        </div>
        <Radar size={18} />
      </div>
      <form className="scanner-form" onSubmit={handleScan}>
        <label className="sr-only" htmlFor="target-url">
          Target URL
        </label>
        <input
          id="target-url"
          className="mono-input"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="http://127.0.0.1:5000"
          autoComplete="off"
          spellCheck="false"
        />
        <button className="btn btn-primary" type="submit" disabled={scanning}>
          {scanning ? 'SCANNING…' : 'START SECURITY SCAN'}
        </button>
        <button
          className="btn btn-danger"
          type="button"
          onClick={onTriggerDemo}
          disabled={demoRunning && scanning}
        >
          <Zap size={16} />
          TRIGGER LIVE ATTACK DEMO
        </button>
      </form>
      <p className="fine-print">Only scan systems you own or are authorized to test.</p>
      {notice ? <p className="form-error">{notice}</p> : null}
      {scanning || scanStep ? (
        <ol className="scan-steps">
          {SCAN_STEPS.map((step) => {
            const currentIndex = SCAN_STEPS.indexOf(scanStep);
            const thisIndex = SCAN_STEPS.indexOf(step);
            const done = currentIndex > thisIndex;
            const active = scanStep === step;
            return (
              <li key={step} className={`${done ? 'is-done' : ''} ${active ? 'is-active' : ''}`}>
                {step}
              </li>
            );
          })}
        </ol>
      ) : null}
    </section>
  );
}

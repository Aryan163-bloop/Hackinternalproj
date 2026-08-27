import {
  ATTACKER,
  BASELINE_RISK,
  CRITICAL_RISK,
  HIGH_RISK,
  baselineAiReport,
  baselineGraph,
  criticalAiReport,
  criticalGraph,
  highGraph,
  stampScanResults,
} from '../data/mockData';

const UA =
  'Mozilla/5.0 (compatible; SentinelPath-Demo/1.0; authorized security test)';

let scanResults = [];
let startedAt = 0;
let running = false;
let timers = [];

function clearTimers() {
  timers.forEach((id) => clearTimeout(id));
  timers = [];
}

function at(offsetMs) {
  return new Date(startedAt + offsetMs).toISOString();
}

function log({ id, endpoint, method, payload, offsetMs }) {
  return {
    id,
    source_ip: ATTACKER,
    endpoint_hit: endpoint,
    method,
    user_agent: UA,
    payload_snippet: payload,
    session_id: 'sess-demo-20301135',
    hit_at: at(offsetMs),
  };
}

function event({ id, type, score, reason, status, offsetMs, honeypotId }) {
  return {
    id,
    source_ip: ATTACKER,
    event_type: type,
    related_scan_id: scanResults[0]?.id ?? null,
    related_honeypot_id: honeypotId,
    severity_score: score,
    classification_reason: reason,
    created_at: at(offsetMs),
    status,
  };
}

function snapshotForElapsed(elapsed) {
  const logs = [];
  const events = [];
  let risk = { ...BASELINE_RISK };
  let graph = baselineGraph;
  let report = baselineAiReport;
  let phase = 'idle';

  if (!running && scanResults.length === 0) {
    return {
      scanResults,
      logs,
      events,
      risk,
      graph,
      report,
      phase,
    };
  }

  if (elapsed >= 0 && running) {
    phase = 'recon';
    logs.push(
      log({
        id: 101,
        endpoint: '/.env',
        method: 'GET',
        payload: '',
        offsetMs: 0,
      }),
    );
    events.push(
      event({
        id: 201,
        type: 'RECON',
        score: 42,
        reason: 'Public configuration probe against /.env from 203.0.113.5',
        status: 'Open',
        offsetMs: 400,
        honeypotId: 101,
      }),
    );
  }

  if (elapsed >= 2800 && running) {
    phase = 'brute';
    risk = { ...HIGH_RISK };
    graph = highGraph;
    logs.push(
      log({
        id: 102,
        endpoint: '/admin/login',
        method: 'POST',
        payload: 'username=admin&password=admin',
        offsetMs: 2800,
      }),
    );
    events.push(
      event({
        id: 202,
        type: 'BRUTE_FORCE',
        score: 67,
        reason: 'Repeated administrative login attempts with common credentials',
        status: 'Open',
        offsetMs: 3000,
        honeypotId: 102,
      }),
    );
  }

  if (elapsed >= 5200 && running) {
    logs.push(
      log({
        id: 103,
        endpoint: '/phpmyadmin',
        method: 'GET',
        payload: '',
        offsetMs: 5200,
      }),
    );
  }

  if (elapsed >= 7600 && running) {
    phase = 'exploit';
    risk = { ...CRITICAL_RISK };
    graph = criticalGraph;
    report = criticalAiReport;
    logs.push(
      log({
        id: 104,
        endpoint: '/admin/login',
        method: 'POST',
        payload: "username=admin' --&password=anything",
        offsetMs: 7600,
      }),
    );
    events.push(
      event({
        id: 203,
        type: 'ACTIVE_EXPLOITATION',
        score: 89,
        reason: 'SQL injection on /admin/login consistent with database compromise',
        status: 'Active',
        offsetMs: 7800,
        honeypotId: 104,
      }),
    );
  }

  if (!running) {
    risk = scanResults.length ? { ...BASELINE_RISK } : { ...BASELINE_RISK };
    report = baselineAiReport;
    graph = baselineGraph;
  }

  logs.sort((a, b) => new Date(b.hit_at) - new Date(a.hit_at));
  events.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return { scanResults, logs, events, risk, graph, report, phase };
}

export function getDemoSnapshot() {
  const elapsed = running ? Date.now() - startedAt : 0;
  return snapshotForElapsed(elapsed);
}

export function startDemoScan(targetUrl = TARGET) {
  scanResults = stampScanResults(targetUrl);
  return scanResults;
}

export function startDemoAttack() {
  clearTimers();
  running = true;
  startedAt = Date.now();
  return getDemoSnapshot();
}

export function resetDemoEngine() {
  clearTimers();
  running = false;
  startedAt = 0;
}

export function isDemoAttackRunning() {
  return running;
}

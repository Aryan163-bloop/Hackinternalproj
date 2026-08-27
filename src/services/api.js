import axios from 'axios';
import { asArray } from '../utils/format';
import { BASELINE_RISK, baselineAiReport, baselineGraph } from '../data/mockData';
import {
  getDemoSnapshot,
  startDemoAttack,
  startDemoScan,
} from './demoEngine';

const DB_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
const HONEYPOT_BASE = import.meta.env.VITE_HONEYPOT_URL || 'http://127.0.0.1:8082';
const P3_BASE = import.meta.env.VITE_P3_URL || 'http://127.0.0.1:5001';

  const client = axios.create({
  timeout: 1800,
  headers: { Accept: 'application/json' },
});

const state = {
  online: false,
  demoMode: true,
  usingMock: true,
  lastError: null,
};

export function getConnectionState() {
  return { ...state };
}

function markLive() {
  state.online = true;
  state.demoMode = false;
  state.usingMock = false;
  state.lastError = null;
}

function markDemo(error) {
  state.online = false;
  state.demoMode = true;
  state.usingMock = true;
  state.lastError = error?.message || 'Backend unreachable';
}

async function firstOk(requests, { parallel = true } = {}) {
  if (!parallel) {
    for (const request of requests) {
      try {
        const response = await request();
        if (response && response.status >= 200 && response.status < 300) {
          return response.data;
        }
      } catch {
        /* try next candidate */
      }
    }
    return null;
  }

  const results = await Promise.allSettled(requests.map((request) => request()));
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value && result.value.status >= 200 && result.value.status < 300) {
      return result.value.data;
    }
  }
  return null;
}

function normalizeRisk(raw) {
  if (raw == null) return { ...BASELINE_RISK };
  if (typeof raw === 'number') {
    return { score: raw, level: levelFromScore(raw) };
  }
  const source = raw.risk && typeof raw.risk === 'object' ? raw.risk : raw;
  const score = Number(
    source.score ?? source.risk_score ?? source.severity_score ?? source.value ?? BASELINE_RISK.score,
  );
  const level = normalizeLevel(source.level || source.risk_level || source.severity || levelFromScore(score));
  return {
    score: Number.isFinite(score) ? score : BASELINE_RISK.score,
    level,
  };
}

function normalizeLevel(value) {
  const text = String(value || '').toLowerCase();
  if (text.includes('crit')) return 'Critical';
  if (text.includes('high')) return 'High';
  if (text.includes('med')) return 'Medium';
  if (text.includes('low')) return 'Low';
  return 'Medium';
}

function levelFromScore(score) {
  if (score >= 80) return 'Critical';
  if (score >= 60) return 'High';
  if (score >= 30) return 'Medium';
  return 'Low';
}

function normalizeScanRow(row, index) {
  return {
    id: row.id ?? index + 1,
    target_url: row.target_url || row.target || row.url || 'http://127.0.0.1:5000',
    endpoint: row.endpoint || row.path || row.route || '/',
    vulnerability_type: row.vulnerability_type || row.vuln_type || row.type || 'Misconfig',
    is_vulnerable: Boolean(row.is_vulnerable ?? row.vulnerable ?? true),
    evidence: String(row.evidence || row.detail || row.description || ''),
    severity: normalizeLevel(row.severity || row.risk || 'Medium'),
    scanned_at: row.scanned_at || row.created_at || row.timestamp || new Date().toISOString(),
    status: row.status || (row.is_vulnerable === false ? 'Closed' : 'Open'),
  };
}

function normalizeLog(row, index) {
  return {
    id: row.id ?? `log-${index}`,
    source_ip: row.source_ip || row.ip || row.src || '0.0.0.0',
    endpoint_hit: row.endpoint_hit || row.endpoint || row.path || '/',
    method: String(row.method || row.http_method || 'GET').toUpperCase(),
    user_agent: row.user_agent || row.ua || '',
    payload_snippet: String(row.payload_snippet || row.payload || row.body || ''),
    session_id: row.session_id || row.session || '',
    hit_at: row.hit_at || row.created_at || row.timestamp || new Date().toISOString(),
  };
}

function normalizeEvent(row, index) {
  return {
    id: row.id ?? `evt-${index}`,
    source_ip: row.source_ip || row.ip || '0.0.0.0',
    event_type: String(row.event_type || row.type || 'RECON').toUpperCase(),
    related_scan_id: row.related_scan_id ?? null,
    related_honeypot_id: row.related_honeypot_id ?? null,
    severity_score: Number(row.severity_score ?? row.score ?? 0),
    classification_reason: String(row.classification_reason || row.reason || row.detail || ''),
    created_at: row.created_at || row.timestamp || new Date().toISOString(),
    status: row.status || 'Open',
  };
}

function normalizeGraph(raw) {
  if (!raw || typeof raw !== 'object') {
    return { nodes: [...baselineGraph.nodes], edges: [...baselineGraph.edges] };
  }
  const nodes = asArray(raw.nodes).map((node, index) => {
    const id = String(node.id ?? node.name ?? node.label ?? `node-${index}`);
    return {
      id,
      label: node.label || node.name || node.id || id,
      risk: normalizeLevel(node.risk || node.severity || node.level || 'Low'),
      attacked: Boolean(node.attacked || node.is_attacked || node.compromised),
    };
  });
  const rawEdges = asArray(raw.edges).length ? asArray(raw.edges) : asArray(raw.links);
  const edges = rawEdges.map((edge, index) => ({
    id: String(edge.id ?? `e-${edge.source}-${edge.target}-${index}`),
    source: String(edge.source ?? edge.from ?? edge.src),
    target: String(edge.target ?? edge.to ?? edge.dst),
  }));
  if (!nodes.length) {
    return { nodes: [...baselineGraph.nodes], edges: [...baselineGraph.edges] };
  }
  return { nodes, edges };
}

function normalizeReport(raw) {
  if (raw == null) return { report: baselineAiReport };
  if (typeof raw === 'string') return { report: raw };
  const report =
    raw.report ||
    raw.summary ||
    raw.text ||
    raw.content ||
    raw.ai_report ||
    raw.message ||
    '';
  return { report: String(report || baselineAiReport) };
}

export async function probeBackend() {
  const data = await firstOk([
    () => client.get(`${P3_BASE}/health`),
    () => client.get(`${P3_BASE}/api/health`),
    () => client.get(`${P3_BASE}/risk`),
    () => client.get(`${DB_BASE}/health`),
    () => client.get(`${DB_BASE}/api/health`),
    () => client.get(`${HONEYPOT_BASE}/health`),
    () => client.get(`${HONEYPOT_BASE}/api/health`),
    () => client.get(`${HONEYPOT_BASE}/logs`),
  ]);

  if (data != null) {
    markLive();
    return getConnectionState();
  }
  markDemo(new Error('No backend health/data endpoint responded'));
  return getConnectionState();
}

export async function getScanResults() {
  if (!state.online) return getDemoSnapshot().scanResults;
  const data = await firstOk([
    () => client.get(`${DB_BASE}/scan_results`),
    () => client.get(`${DB_BASE}/api/scan_results`),
    () => client.get(`${DB_BASE}/api/scans`),
    () => client.get(`${DB_BASE}/results`),
    () => client.get(`${P3_BASE}/scan_results`),
  ]);
  if (data == null) {
    state.usingMock = true;
    state.demoMode = true;
    return getDemoSnapshot().scanResults;
  }
  return asArray(data).map(normalizeScanRow);
}

export async function getHoneypotLogs() {
  if (!state.online) {
    return getDemoSnapshot().logs;
  }
  const data = await firstOk([
    () => client.get(`${HONEYPOT_BASE}/logs`),
    () => client.get(`${HONEYPOT_BASE}/honeypot_logs`),
    () => client.get(`${HONEYPOT_BASE}/api/logs`),
    () => client.get(`${HONEYPOT_BASE}/api/honeypot_logs`),
    () => client.get(`${DB_BASE}/honeypot_logs`),
    () => client.get(`${DB_BASE}/api/honeypot_logs`),
  ]);
  if (data == null) {
    state.usingMock = true;
    state.demoMode = true;
    return getDemoSnapshot().logs;
  }
  return asArray(data)
    .map(normalizeLog)
    .sort((a, b) => new Date(b.hit_at) - new Date(a.hit_at));
}

export async function getThreatEvents() {
  if (!state.online) return getDemoSnapshot().events;
  const data = await firstOk([
    () => client.get(`${P3_BASE}/threat_events`),
    () => client.get(`${P3_BASE}/api/threat_events`),
    () => client.get(`${P3_BASE}/events`),
    () => client.get(`${DB_BASE}/threat_events`),
    () => client.get(`${DB_BASE}/api/threat_events`),
  ]);
  if (data == null) {
    state.usingMock = true;
    state.demoMode = true;
    return getDemoSnapshot().events;
  }
  return asArray(data)
    .map(normalizeEvent)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function getRisk() {
  if (!state.online) return getDemoSnapshot().risk;
  const data = await firstOk([
    () => client.get(`${P3_BASE}/risk`),
    () => client.get(`${P3_BASE}/api/risk`),
    () => client.get(`${P3_BASE}/risk_score`),
    () => client.get(`${DB_BASE}/risk`),
  ]);
  if (data == null) {
    state.usingMock = true;
    state.demoMode = true;
    return getDemoSnapshot().risk;
  }
  return normalizeRisk(data);
}

export async function getAttackGraph() {
  if (!state.online) return getDemoSnapshot().graph;
  const data = await firstOk([
    () => client.get(`${P3_BASE}/attack_graph`),
    () => client.get(`${P3_BASE}/api/attack_graph`),
    () => client.get(`${P3_BASE}/graph`),
    () => client.get(`${DB_BASE}/attack_graph`),
  ]);
  if (data == null) {
    state.usingMock = true;
    state.demoMode = true;
    return getDemoSnapshot().graph;
  }
  return normalizeGraph(data);
}

export async function getAiReport() {
  if (!state.online) return { report: getDemoSnapshot().report };
  const data = await firstOk([
    () => client.get(`${P3_BASE}/ai_report`),
    () => client.get(`${P3_BASE}/api/ai_report`),
    () => client.get(`${P3_BASE}/report`),
    () => client.get(`${P3_BASE}/api/report`),
  ]);
  if (data == null) {
    state.usingMock = true;
    state.demoMode = true;
    return { report: getDemoSnapshot().report };
  }
  return normalizeReport(data);
}

export async function startScan(targetUrl) {
  const data = await firstOk(
    [() => client.post(`${DB_BASE}/scan`, { target_url: targetUrl, url: targetUrl })],
    { parallel: false },
  );
  if (data == null) {
    markDemo(new Error('Scan endpoint unavailable'));
    return startDemoScan(targetUrl);
  }
  state.online = true;
  const rows = asArray(data);
  if (rows.length) return rows.map(normalizeScanRow);
  return startDemoScan(targetUrl);
}

export async function triggerDemo() {
  const data = await firstOk(
    [() => client.post(`${HONEYPOT_BASE}/trigger-demo`, {})],
    { parallel: false },
  );
  if (data == null) {
    markDemo(new Error('Trigger endpoint unavailable'));
    return startDemoAttack();
  }
  state.online = true;
  state.demoMode = false;
  return data;
}

export { DB_BASE, HONEYPOT_BASE, P3_BASE };

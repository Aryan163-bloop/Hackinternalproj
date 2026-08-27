import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getAiReport,
  getAttackGraph,
  getConnectionState,
  getHoneypotLogs,
  getRisk,
  getScanResults,
  getThreatEvents,
  probeBackend,
  startScan as startScanRequest,
  triggerDemo as triggerDemoRequest,
} from '../services/api';
import { BASELINE_RISK, baselineAiReport, baselineGraph } from '../data/mockData';
import { usePolling } from './usePolling';

const SCAN_STEPS = [
  'INITIALIZING SCANNER',
  'DISCOVERING ENDPOINTS',
  'RUNNING ZAP SCAN',
  'ANALYZING VULNERABILITIES',
  'FINALIZING RESULTS',
  'SCAN COMPLETE',
];

export function useDashboardData() {
  const [backendOnline, setBackendOnline] = useState(false);
  const [demoMode, setDemoMode] = useState(true);
  const [switchedToDemo, setSwitchedToDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scanResults, setScanResults] = useState([]);
  const [honeypotLogs, setHoneypotLogs] = useState([]);
  const [threatEvents, setThreatEvents] = useState([]);
  const [risk, setRisk] = useState(BASELINE_RISK);
  const [graph, setGraph] = useState(baselineGraph);
  const [aiReport, setAiReport] = useState({ report: baselineAiReport });
  const [scanStep, setScanStep] = useState('');
  const [scanning, setScanning] = useState(false);
  const [demoRunning, setDemoRunning] = useState(false);
  const [panelErrors, setPanelErrors] = useState({});

  const syncConnection = useCallback(() => {
    const connection = getConnectionState();
    setBackendOnline(connection.online);
    setDemoMode(connection.demoMode || connection.usingMock);
    if (!connection.online) setSwitchedToDemo(true);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [results, logs, events, nextRisk, nextGraph, nextReport] = await Promise.all([
        getScanResults().catch(() => []),
        getHoneypotLogs().catch(() => []),
        getThreatEvents().catch(() => []),
        getRisk().catch(() => BASELINE_RISK),
        getAttackGraph().catch(() => baselineGraph),
        getAiReport().catch(() => ({ report: baselineAiReport })),
      ]);
      replaceIfChanged(setScanResults, Array.isArray(results) ? results : []);
      replaceIfChanged(setHoneypotLogs, Array.isArray(logs) ? logs : []);
      replaceIfChanged(setThreatEvents, Array.isArray(events) ? events : []);
      replaceIfChanged(setRisk, nextRisk || BASELINE_RISK);
      replaceIfChanged(setGraph, nextGraph || baselineGraph);
      replaceIfChanged(setAiReport, nextReport || { report: baselineAiReport });
      setError('');
      setPanelErrors({});
      syncConnection();
    } catch (err) {
      setError(err.message || 'Unable to refresh dashboard');
      setSwitchedToDemo(true);
      setDemoMode(true);
      setBackendOnline(false);
    } finally {
      setLoading(false);
    }
  }, [syncConnection]);

  const initialize = useCallback(async () => {
    const connection = await probeBackend();
    setBackendOnline(connection.online);
    setDemoMode(connection.demoMode);
    if (!connection.online) setSwitchedToDemo(true);
    await refresh();
  }, [refresh]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  usePolling(refresh, 2500, true);

  const startScan = useCallback(async (targetUrl) => {
    setScanning(true);
    setScanStep(SCAN_STEPS[0]);
    setPanelErrors((current) => ({ ...current, findings: '' }));

    for (let i = 0; i < SCAN_STEPS.length; i += 1) {
      setScanStep(SCAN_STEPS[i]);
      await wait(i === SCAN_STEPS.length - 1 ? 350 : 700);
    }

    try {
      const results = await startScanRequest(targetUrl);
      setScanResults(results);
      syncConnection();
      await refresh();
    } catch (err) {
      setPanelErrors((current) => ({
        ...current,
        findings: err.message || 'Scan failed',
      }));
    } finally {
      setScanning(false);
    }
  }, [refresh, syncConnection]);

  const triggerDemo = useCallback(async () => {
    setDemoRunning(true);
    try {
      await triggerDemoRequest();
      syncConnection();
      await refresh();
    } catch (err) {
      setError(err.message || 'Unable to trigger demo');
      setDemoMode(true);
      setSwitchedToDemo(true);
    }
  }, [refresh, syncConnection]);

  const stats = useMemo(() => {
    const vulns = scanResults.filter((row) => row.is_vulnerable).length;
    const activeThreats = threatEvents.filter((row) => {
      const status = String(row.status || '').toLowerCase();
      return status === 'open' || status === 'active';
    }).length;
    return {
      liveRisk: `${risk.score} / 100`,
      liveRiskLevel: risk.level,
      vulnerabilities: vulns,
      activeThreats,
      systemStatus: backendOnline ? 'Online' : 'Offline',
    };
  }, [backendOnline, risk, scanResults, threatEvents]);

  return {
    backendOnline,
    demoMode,
    switchedToDemo,
    loading,
    error,
    scanResults,
    honeypotLogs,
    threatEvents,
    risk,
    graph,
    aiReport,
    stats,
    scanStep,
    scanning,
    demoRunning,
    panelErrors,
    scanSteps: SCAN_STEPS,
    initialize,
    startScan,
    triggerDemo,
    refresh,
  };
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function replaceIfChanged(setter, next) {
  setter((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
}

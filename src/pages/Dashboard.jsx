import Header from '../components/Header';
import TargetScanner from '../components/TargetScanner';
import RiskIndicator from '../components/RiskIndicator';
import StatCard from '../components/StatCard';
import ScanResults from '../components/ScanResults';
import AttackFeed from '../components/AttackFeed';
import ThreatEvents from '../components/ThreatEvents';
import AttackGraph from '../components/AttackGraph';
import AIReport from '../components/AIReport';
import { useDashboardData } from '../hooks/useDashboardData';

export default function Dashboard() {
  const data = useDashboardData();

  return (
    <div className="app-shell min-h-screen">
      <Header backendOnline={data.backendOnline} demoMode={data.demoMode} />
      {data.switchedToDemo && !data.backendOnline ? (
        <div className="mode-banner">BACKEND OFFLINE — SWITCHED TO DEMO MODE</div>
      ) : null}
      {data.error ? <div className="mode-banner is-error">{data.error}</div> : null}

      <TargetScanner
        onScan={data.startScan}
        onTriggerDemo={data.triggerDemo}
        scanning={data.scanning}
        scanStep={data.scanStep}
        demoRunning={data.demoRunning}
      />

      <RiskIndicator risk={data.risk} />

      <section className="stats-grid">
        <StatCard
          label="LIVE RISK"
          value={data.stats.liveRisk}
          hint={data.stats.liveRiskLevel}
          tone={data.risk.level}
        />
        <StatCard
          label="VULNERABILITIES"
          value={data.stats.vulnerabilities}
          hint="Confirmed findings"
          tone={data.stats.vulnerabilities > 3 ? 'high' : 'medium'}
        />
        <StatCard
          label="ACTIVE THREATS"
          value={data.stats.activeThreats}
          hint="Open classifications"
          tone={data.stats.activeThreats > 1 ? 'critical' : 'medium'}
        />
        <StatCard
          label="SYSTEM STATUS"
          value={data.stats.systemStatus}
          hint={data.backendOnline ? 'Collectors reachable' : 'Using local demo telemetry'}
          tone={data.backendOnline ? 'safe' : 'low'}
        />
      </section>

      <section className="split-grid">
        <AttackFeed logs={data.honeypotLogs} loading={data.loading} error={data.panelErrors.feed} />
        <AttackGraph graph={data.graph} loading={data.loading} error={data.panelErrors.graph} />
      </section>

      <ScanResults
        results={data.scanResults}
        loading={data.loading}
        error={data.panelErrors.findings}
        scanning={data.scanning}
      />

      <ThreatEvents events={data.threatEvents} loading={data.loading} error={data.panelErrors.events} />

      <AIReport
        report={data.aiReport}
        demoMode={data.demoMode}
        loading={data.loading}
        error={data.panelErrors.report}
      />
    </div>
  );
}

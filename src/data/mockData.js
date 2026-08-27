const TARGET = 'http://127.0.0.1:5000';
const ATTACKER = '203.0.113.5';

export const mockScanResults = [
  {
    id: 1,
    target_url: TARGET,
    endpoint: '/admin/login',
    vulnerability_type: 'SQLi',
    is_vulnerable: true,
    evidence:
      "Parameter 'username' reflected unescaped quote. Payload admin' -- returned 200 with session cookie.",
    severity: 'Critical',
    scanned_at: null,
    status: 'Open',
  },
  {
    id: 2,
    target_url: TARGET,
    endpoint: '/search',
    vulnerability_type: 'XSS',
    is_vulnerable: true,
    evidence:
      "Query param q is reflected in HTML without encoding. Payload <script>alert(1)</script> persisted in response body.",
    severity: 'High',
    scanned_at: null,
    status: 'Open',
  },
  {
    id: 3,
    target_url: TARGET,
    endpoint: '/account/settings',
    vulnerability_type: 'CSRF',
    is_vulnerable: true,
    evidence:
      'State-changing POST accepted without CSRF token or SameSite=Strict cookie flags.',
    severity: 'High',
    scanned_at: null,
    status: 'Open',
  },
  {
    id: 4,
    target_url: TARGET,
    endpoint: '/session/profile',
    vulnerability_type: 'Session Hijacking',
    is_vulnerable: true,
    evidence:
      'Session identifier transmitted over URL rewrite and missing HttpOnly on Set-Cookie.',
    severity: 'Medium',
    scanned_at: null,
    status: 'Open',
  },
  {
    id: 5,
    target_url: TARGET,
    endpoint: '/.env',
    vulnerability_type: 'Misconfig',
    is_vulnerable: true,
    evidence:
      'Environment file publicly reachable. Response included APP_SECRET and database credentials.',
    severity: 'Critical',
    scanned_at: null,
    status: 'Open',
  },
  {
    id: 6,
    target_url: TARGET,
    endpoint: '/health',
    vulnerability_type: 'Misconfig',
    is_vulnerable: false,
    evidence: 'Health endpoint returns status only. No sensitive configuration exposed.',
    severity: 'Low',
    scanned_at: null,
    status: 'Closed',
  },
];

export const BASELINE_RISK = { score: 42, level: 'Medium' };
export const HIGH_RISK = { score: 67, level: 'High' };
export const CRITICAL_RISK = { score: 89, level: 'Critical' };

export const baselineGraph = {
  nodes: [
    { id: 'login', label: 'Login', risk: 'Medium' },
    { id: 'api', label: 'API', risk: 'Low' },
    { id: 'database', label: 'Database', risk: 'Low' },
    { id: 'user_records', label: 'UserRecords', risk: 'Low' },
    { id: 'config', label: 'Config', risk: 'Medium' },
    { id: 'admin', label: 'AdminPanel', risk: 'Low' },
  ],
  edges: [
    { id: 'e-login-api', source: 'login', target: 'api' },
    { id: 'e-api-db', source: 'api', target: 'database' },
    { id: 'e-db-users', source: 'database', target: 'user_records' },
    { id: 'e-config-db', source: 'config', target: 'database' },
    { id: 'e-admin-db', source: 'admin', target: 'database' },
  ],
};

export const highGraph = {
  nodes: [
    { id: 'login', label: 'Login', risk: 'High', attacked: true },
    { id: 'api', label: 'API', risk: 'High', attacked: true },
    { id: 'database', label: 'Database', risk: 'Medium' },
    { id: 'user_records', label: 'UserRecords', risk: 'Low' },
    { id: 'config', label: 'Config', risk: 'Medium' },
    { id: 'admin', label: 'AdminPanel', risk: 'High', attacked: true },
  ],
  edges: baselineGraph.edges,
};

export const criticalGraph = {
  nodes: [
    { id: 'login', label: 'Login', risk: 'Critical', attacked: true },
    { id: 'api', label: 'API', risk: 'Critical', attacked: true },
    { id: 'database', label: 'Database', risk: 'Critical', attacked: true },
    { id: 'user_records', label: 'UserRecords', risk: 'High', attacked: true },
    { id: 'config', label: 'Config', risk: 'High', attacked: true },
    { id: 'admin', label: 'AdminPanel', risk: 'High', attacked: true },
  ],
  edges: baselineGraph.edges,
};

export const baselineAiReport = `Baseline assessment of ${TARGET} indicates a medium residual risk posture. Authenticated surfaces and public configuration endpoints should be reviewed, but no active exploitation has been observed in the current monitoring window.

Priority actions:
• Restrict public access to environment and admin interfaces
• Confirm input validation on login and search parameters
• Enable HttpOnly, Secure, and SameSite cookie flags`;

export const criticalAiReport = `Active exploitation has been observed against ${TARGET} from ${ATTACKER}. The sequence progressed from reconnaissance on /.env, to credential stuffing on /admin/login, to SQL injection consistent with database access.

Impact:
• Likely exposure of application secrets via misconfiguration
• Brute-force pressure on the administrative login
• Confirmed SQLi pattern targeting UserRecords through the API/database path

Immediate recommendations:
1. Take /admin/login behind MFA and lockout controls
2. Rotate credentials found in publicly reachable configuration
3. Deploy a WAF rule for classic SQLi tokens on login parameters
4. Isolate the database subnet and review UserRecords access logs`;

export function stampScanResults(targetUrl = TARGET) {
  const scannedAt = new Date().toISOString();
  return mockScanResults.map((row) => ({
    ...row,
    target_url: targetUrl,
    scanned_at: scannedAt,
  }));
}

export { TARGET, ATTACKER };

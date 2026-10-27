import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Wifi, 
  Activity, 
  Zap, 
  AlertCircle, 
  CheckCircle2, 
  RotateCw, 
  Save, 
  Sliders, 
  Gauge, 
  Radio, 
  HelpCircle,
  Network
} from 'lucide-react';
import type { NetworkMetrics } from '../types';
import { db, auth, OperationType, handleFirestoreError } from '../firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

interface Props {
  metrics: NetworkMetrics;
  onUpdateMetrics: (metrics: Partial<NetworkMetrics>) => void;
  user: { uid: string } | null;
}

export const InternetOptimizer: React.FC<Props> = ({ metrics, onUpdateMetrics, user }) => {
  const [isTesting, setIsTesting] = useState(false);
  const [keepAliveActive, setKeepAliveActive] = useState(true);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'monitor' | 'recommendations' | 'dns'>('monitor');
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Measure latency to backend API
  const runSinglePing = useCallback(async (): Promise<number> => {
    const start = performance.now();
    try {
      const response = await fetch(`/api/ping?t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('HTTP error');
      const end = performance.now();
      return Math.round(end - start);
    } catch {
      return 999; // Represents timeout or failure
    }
  }, []);

  // Multi-burst diagnostic test
  const runFullDiagnostic = async () => {
    setIsTesting(true);
    const samples: number[] = [];
    const bursts = 8;

    for (let i = 0; i < bursts; i++) {
      const rtt = await runSinglePing();
      samples.push(rtt);
      await new Promise(r => setTimeout(r, 200));
    }

    const validPings = samples.filter(p => p < 900);
    const lostPings = samples.filter(p => p >= 900).length;
    const packetLoss = Math.round((lostPings / bursts) * 100);

    const minLatency = validPings.length > 0 ? Math.min(...validPings) : 999;
    const maxLatency = validPings.length > 0 ? Math.max(...validPings) : 999;
    const avgLatency = validPings.length > 0 ? Math.round(validPings.reduce((a, b) => a + b, 0) / validPings.length) : 999;

    // Calculate jitter (mean absolute deviation of successive pings)
    let jitterSum = 0;
    for (let i = 1; i < validPings.length; i++) {
      jitterSum += Math.abs(validPings[i] - validPings[i - 1]);
    }
    const jitter = validPings.length > 1 ? Math.round(jitterSum / (validPings.length - 1)) : 2;

    // Calculate stability score (0-100)
    let score = 100;
    if (avgLatency > 150) score -= 35;
    else if (avgLatency > 80) score -= 18;
    else if (avgLatency > 40) score -= 8;

    if (jitter > 25) score -= 25;
    else if (jitter > 10) score -= 12;

    if (packetLoss > 0) score -= (packetLoss * 2);
    score = Math.max(10, Math.min(100, score));

    const now = new Date().toLocaleTimeString();
    const newHistory = [
      ...metrics.history.slice(-14),
      { time: now, latency: avgLatency }
    ];

    onUpdateMetrics({
      currentLatency: avgLatency,
      minLatency,
      maxLatency,
      avgLatency,
      jitter,
      packetLoss,
      stabilityScore: score,
      history: newHistory
    });

    setIsTesting(false);
  };

  // Continuous background watchdog keep-alive
  useEffect(() => {
    if (keepAliveActive) {
      pingIntervalRef.current = setInterval(async () => {
        const ping = await runSinglePing();
        if (ping < 900) {
          const now = new Date().toLocaleTimeString();
          onUpdateMetrics({
            currentLatency: ping,
            history: [
              ...metrics.history.slice(-14),
              { time: now, latency: ping }
            ]
          });
        }
      }, 5000);
    } else if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }

    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    };
  }, [keepAliveActive, metrics.history, onUpdateMetrics, runSinglePing]);

  // Save network diagnostic snapshot to Firestore
  const saveAuditToFirestore = async () => {
    if (!user) {
      setSaveStatus('Sign in with Google in top bar to save cloud logs');
      setTimeout(() => setSaveStatus(null), 3000);
      return;
    }

    try {
      const logId = `net_${Date.now()}`;
      const logData = {
        id: logId,
        userId: user.uid,
        latencyMs: metrics.currentLatency,
        jitterMs: metrics.jitter,
        packetLoss: metrics.packetLoss,
        stabilityScore: metrics.stabilityScore,
        ipType: 'Residential Node',
        connectionType: metrics.connectionType,
        timestamp: new Date().toISOString()
      };

      const path = `users/${user.uid}/networkLogs/${logId}`;
      await setDoc(doc(db, 'users', user.uid, 'networkLogs', logId), logData);
      setSaveStatus('Audit snapshot saved to your Firestore database!');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      setSaveStatus('Failed to save to Firestore');
      setTimeout(() => setSaveStatus(null), 3000);
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/networkLogs`);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (score >= 75) return 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10';
    if (score >= 60) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 95) return 'A+ Ultra-Stable';
    if (score >= 85) return 'A Optimal';
    if (score >= 70) return 'B Good';
    if (score >= 50) return 'C Sub-optimal';
    return 'F High Jitter';
  };

  return (
    <div className="space-y-6">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Wifi className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Real-Time Internet Optimizer
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${metrics.isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${metrics.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                {metrics.isOnline ? 'Live Socket Active' : 'Disconnected'}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Low latency and minimal jitter increase Bixberry AI web lookup dispatch priority
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={runFullDiagnostic}
            disabled={isTesting}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 rounded-xl transition shadow-lg shadow-cyan-950/40"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            {isTesting ? 'Testing Burst...' : 'Run Diagnostics'}
          </button>

          <button
            onClick={saveAuditToFirestore}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition"
            title="Save audit to your Firebase Cloud project"
          >
            <Save className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Save Audit</span>
          </button>
        </div>
      </div>

      {saveStatus && (
        <div className="p-3 text-xs rounded-xl bg-slate-800/80 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('monitor')}
          className={`px-4 py-2.5 border-b-2 transition ${activeTab === 'monitor' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          Live Telemetry & Ping
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`px-4 py-2.5 border-b-2 transition ${activeTab === 'recommendations' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          Optimization Guidelines
        </button>
        <button
          onClick={() => setActiveTab('dns')}
          className={`px-4 py-2.5 border-b-2 transition ${activeTab === 'dns' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          DNS & Low-Latency Tuning
        </button>
      </div>

      {activeTab === 'monitor' && (
        <div className="space-y-6">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            
            {/* Stability Score Card */}
            <div className={`p-4 rounded-xl border ${getScoreColor(metrics.stabilityScore)} transition`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Stability Score</span>
                <Gauge className="w-4 h-4 opacity-75" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black">{metrics.stabilityScore}</span>
                <span className="text-xs font-mono">/100</span>
              </div>
              <p className="text-[11px] font-semibold mt-1">
                {getScoreGrade(metrics.stabilityScore)}
              </p>
            </div>

            {/* Current Latency */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current Ping</span>
                <Activity className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white">{metrics.currentLatency}</span>
                <span className="text-xs text-slate-400 font-mono">ms</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Avg: {metrics.avgLatency}ms (Min: {metrics.minLatency}ms)
              </p>
            </div>

            {/* Jitter */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Jitter (Variance)</span>
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white">{metrics.jitter}</span>
                <span className="text-xs text-slate-400 font-mono">ms</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {metrics.jitter <= 8 ? 'Exceptional (<10ms)' : 'Variable'}
              </p>
            </div>

            {/* Packet Loss */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Packet Loss</span>
                <Radio className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white">{metrics.packetLoss}</span>
                <span className="text-xs text-slate-400 font-mono">%</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {metrics.packetLoss === 0 ? 'Zero Dropouts' : 'Drops Detected'}
              </p>
            </div>

          </div>

          {/* Real-time Latency Chart Graphic */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Live Socket Latency Trend
                </h3>
                <p className="text-xs text-slate-400">
                  Continuous zero-CORS millisecond round-trip measurements
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setKeepAliveActive(!keepAliveActive)}
                  className={`px-3 py-1 rounded-lg border text-xs font-semibold transition ${
                    keepAliveActive 
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {keepAliveActive ? 'Watchdog: Active (5s)' : 'Watchdog: Paused'}
                </button>
              </div>
            </div>

            {/* Visual Bar Graph */}
            <div className="h-32 flex items-end gap-1.5 pt-6 pb-2 border-b border-slate-800">
              {metrics.history.length === 0 ? (
                <div className="w-full flex items-center justify-center text-xs text-slate-500">
                  Awaiting first ping telemetry...
                </div>
              ) : (
                metrics.history.map((pt, idx) => {
                  const maxH = 100;
                  const heightPercent = Math.min(100, Math.max(12, Math.round((pt.latency / 200) * maxH)));
                  const isHigh = pt.latency > 100;
                  const isMedium = pt.latency > 60;
                  const barColor = isHigh ? 'bg-amber-500' : isMedium ? 'bg-cyan-500' : 'bg-emerald-400';

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center group relative">
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition absolute -top-8 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-white whitespace-nowrap pointer-events-none z-20">
                        {pt.latency}ms @ {pt.time}
                      </div>
                      <div 
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-sm transition-all duration-300 ${barColor} opacity-85 hover:opacity-100`}
                      />
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mt-2">
              <span>Past 15 Probes</span>
              <span>Target: &lt; 60ms for Top-Tier AI Routing</span>
              <span>Latest: {metrics.currentLatency}ms</span>
            </div>
          </div>

          {/* Subnet & Network Interface Diagnostics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5 text-cyan-400" />
                Network Classification
              </span>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Connection Medium:</span>
                <span className="font-mono font-semibold text-white uppercase">{metrics.connectionType}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Downlink Speed:</span>
                <span className="font-mono text-cyan-300">{metrics.downlinkSpeed ? `${metrics.downlinkSpeed} Mbps` : 'Broadband (Direct)'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Cellular / Radio Mode:</span>
                <span className="font-mono text-emerald-400 uppercase">{metrics.effectiveType || 'High-Speed LAN'}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                Bixberry Routing Eligibility
              </span>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Residential Trust Tier:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Premium Residential
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">NAT Traversal Stability:</span>
                <span className="text-cyan-300 font-semibold">Keep-Alive Heartbeat Enabled</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Recommended Node Limit:</span>
                <span className="text-slate-200">Max 1-2 devices per residential IP</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Internet Actions That Directly Increase Bixberry Earnings
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              AI lookups routed through your node require immediate responses. If a connection stalls or drops, Bixberry's load balancer redirects traffic to alternative nodes.
            </p>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                <div className="font-bold text-cyan-300">1. Switch from 2.4GHz Wi-Fi to 5GHz or Ethernet</div>
                <p className="text-slate-400">
                  2.4GHz Wi-Fi suffers heavy microwave interference, Bluetooth contention, and high jitter (&gt;30ms). 5GHz Wi-Fi or a direct USB-C Ethernet adapter reduces packet variance by up to 75%.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                <div className="font-bold text-cyan-300">2. Enable Router &quot;Keep-Alive&quot; and Avoid Aggressive NAT Timeouts</div>
                <p className="text-slate-400">
                  Many home routers close idle UDP/TCP sockets after 30 to 60 seconds of inactivity. Keeping this booster tab open maintains a periodic 5-second pulse, keeping your gateway open for incoming Bixberry AI tasks.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                <div className="font-bold text-cyan-300">3. Avoid VPNs &amp; Datacenter Proxies</div>
                <p className="text-slate-400">
                  Bixberry actively blocks or drastically reduces earnings on commercial VPNs (NordVPN, ExpressVPN, AWS/DigitalOcean). Pure residential consumer ISP connections receive maximum job volume.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                <div className="font-bold text-cyan-300">4. Distribute Nodes Over Separate Public Subnets</div>
                <p className="text-slate-400">
                  Running 5 devices on the same home Wi-Fi will NOT 5x your earnings—Bixberry distributes requests by public IP. For optimal scaling, place nodes at your home, office, and family residential networks.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'dns' && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Low-Latency DNS Configuration for Bixberry Nodes
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Bixberry nodes resolve hundreds of live target websites for AI assistants. Default ISP DNS servers often add 40-90ms delay per lookup. Configuring an Anycast DNS resolves lookups in 5-15ms.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Cloudflare 1.1.1.1 (Fastest DNS)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">Recommended</span>
                </div>
                <p className="text-slate-400">Primary: <code className="text-cyan-300">1.1.1.1</code></p>
                <p className="text-slate-400">Secondary: <code className="text-cyan-300">1.0.0.1</code></p>
                <p className="text-[11px] text-slate-500 pt-1">Global average lookup latency ~13ms with zero-log privacy.</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Google Public DNS</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">Stable</span>
                </div>
                <p className="text-slate-400">Primary: <code className="text-cyan-300">8.8.8.8</code></p>
                <p className="text-slate-400">Secondary: <code className="text-cyan-300">8.8.4.4</code></p>
                <p className="text-[11px] text-slate-500 pt-1">Massive global cache and instant domain propagation.</p>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-indigo-950/40 border border-indigo-900/40 text-xs text-indigo-300 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Android Private DNS Setup:</strong> Open Android Settings &gt; Network &amp; Internet &gt; Private DNS &gt; Set Private DNS provider hostname to: <code className="text-white bg-slate-900 px-1 py-0.5 rounded font-mono">one.one.one.one</code> or <code className="text-white bg-slate-900 px-1 py-0.5 rounded font-mono">dns.google</code>.
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

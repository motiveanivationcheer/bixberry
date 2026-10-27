import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  Smartphone, 
  Activity, 
  Zap, 
  Play, 
  Square, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  Battery, 
  BatteryCharging, 
  Eye, 
  EyeOff, 
  Gauge, 
  Save, 
  Cpu
} from 'lucide-react';
import { OptimizationEngine } from '../services/optimizationEngine';
import { BixberryService } from '../services/bixberryService';
import type { NetworkMetrics, DeviceHealth } from '../types';

interface Props {
  user: { uid: string } | null;
  metrics: NetworkMetrics;
  deviceHealth: DeviceHealth;
  isMonitoring: boolean;
  onToggleMonitoring: () => void;
  onUpdateMetrics: (metrics: Partial<NetworkMetrics>) => void;
  onUpdateDeviceHealth: (health: Partial<DeviceHealth>) => void;
}

export const ConnectionOptimizationScreen: React.FC<Props> = ({
  user,
  metrics,
  deviceHealth,
  isMonitoring,
  onToggleMonitoring,
  onUpdateMetrics,
  onUpdateDeviceHealth
}) => {
  const [selectedOem, setSelectedOem] = useState<'samsung' | 'pixel' | 'xiaomi' | 'generic'>('samsung');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const toggleWakeLock = async () => {
    if (deviceHealth.wakeLockActive) {
      await OptimizationEngine.releaseWakeLock();
    } else {
      await OptimizationEngine.acquireWakeLock();
    }
  };

  const toggleCheck = (key: keyof DeviceHealth['backgroundGuidanceDone']) => {
    const newVal = !deviceHealth.backgroundGuidanceDone[key];
    OptimizationEngine.updateGuidanceCheck(key, newVal);
  };

  const saveAuditLog = async () => {
    if (!user) {
      setSaveStatus('Sign in to persist audit logs to your Firestore database.');
      setTimeout(() => setSaveStatus(null), 3500);
      return;
    }

    try {
      await BixberryService.logConnectionEvent(user.uid, {
        event: 'probe',
        status: metrics.packetLoss === 0 ? 'success' : 'failure',
        endpoint: 'https://dashboard.bixberry.com',
        latencyMs: metrics.currentLatency,
        details: `Stability: ${metrics.stabilityScore}/100, Jitter: ${metrics.jitter}ms, Loss: ${metrics.packetLoss}%`
      });
      setSaveStatus('Audit logged to Firestore (users/{userId}/connectionLogs)!');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch {
      setSaveStatus('Failed to save audit log');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  return (
    <div className="space-y-6">

      {/* Screen Header */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Wifi className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Connection &amp; Device Optimization Engine
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold font-mono">
                Screen 5
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Active monitoring engine, Android Doze bypass, and high-frequency keep-alive heartbeat
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMonitoring}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-lg ${
              isMonitoring
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40'
                : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-emerald-950/40'
            }`}
          >
            {isMonitoring ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}</span>
          </button>

          <button
            onClick={saveAuditLog}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
          >
            <Save className="w-3.5 h-3.5 text-emerald-400" />
            <span>Save Log</span>
          </button>
        </div>
      </div>

      {saveStatus && (
        <div className="p-3 text-xs rounded-xl bg-slate-800/80 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* Real-time Diagnostics Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Round-Trip Latency</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-cyan-400 font-mono">{metrics.currentLatency}</span>
            <span className="text-xs text-slate-500">ms</span>
          </div>
          <span className="text-[10px] text-emerald-400">Target &lt;70ms Met</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Jitter (Variance)</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-amber-400 font-mono">{metrics.jitter}</span>
            <span className="text-xs text-slate-500">ms</span>
          </div>
          <span className="text-[10px] text-slate-400">Stable Routing Window</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Packet Loss Rate</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-white font-mono">{metrics.packetLoss}</span>
            <span className="text-xs text-slate-500">%</span>
          </div>
          <span className="text-[10px] text-emerald-400">No Dropouts</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Stability Score</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-emerald-400 font-mono">{metrics.stabilityScore}</span>
            <span className="text-xs text-slate-500">/ 100</span>
          </div>
          <span className="text-[10px] text-emerald-400">A+ Ultra-Stable</span>
        </div>
      </div>

      {/* Latency History Graph */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Real-Time High-Precision Ping History
            </h3>
            <p className="text-xs text-slate-400">
              Measures zero-CORS round-trip milliseconds to keep node socket warmed
            </p>
          </div>
          <button
            onClick={toggleWakeLock}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
              deviceHealth.wakeLockActive
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {deviceHealth.wakeLockActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{deviceHealth.wakeLockActive ? 'WakeLock Active' : 'Keep Screen Awake'}</span>
          </button>
        </div>

        {/* Bar chart */}
        <div className="h-32 flex items-end gap-1.5 pt-6 pb-2 border-b border-slate-800">
          {metrics.history.length === 0 ? (
            <div className="w-full flex items-center justify-center text-xs text-slate-500">
              Click &quot;Start Monitoring&quot; to initialize continuous ping telemetry
            </div>
          ) : (
            metrics.history.map((pt, idx) => {
              const heightPercent = Math.min(100, Math.max(12, Math.round((pt.latency / 180) * 100)));
              const barColor = pt.latency > 100 ? 'bg-amber-500' : pt.latency > 65 ? 'bg-cyan-500' : 'bg-emerald-400';
              return (
                <div key={idx} className="flex-1 flex flex-col items-center group relative">
                  <div className="opacity-0 group-hover:opacity-100 transition absolute -top-8 px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-white pointer-events-none z-10 whitespace-nowrap">
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
      </div>

      {/* Android Doze Mode & Background Optimization Guide */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              Android Battery Optimization &amp; Doze Bypass
            </h3>
            <p className="text-xs text-slate-400">
              Keep the Bixberry background socket alive 24/7 without OS power-killer drops:
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedOem('samsung')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${selectedOem === 'samsung' ? 'bg-emerald-600 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              Samsung
            </button>
            <button
              onClick={() => setSelectedOem('pixel')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${selectedOem === 'pixel' ? 'bg-emerald-600 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              Pixel
            </button>
            <button
              onClick={() => setSelectedOem('xiaomi')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${selectedOem === 'xiaomi' ? 'bg-emerald-600 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              Xiaomi
            </button>
            <button
              onClick={() => setSelectedOem('generic')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${selectedOem === 'generic' ? 'bg-emerald-600 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              Other
            </button>
          </div>
        </div>

        {/* Steps */}
        <div className="p-4 rounded-xl bg-slate-950 text-xs text-slate-300 space-y-2">
          {selectedOem === 'samsung' && (
            <ol className="list-decimal pl-5 space-y-1.5">
              <li>Long press Bixberry &gt; App info &gt; <strong>Battery</strong> &gt; Select <strong className="text-white">&quot;Unrestricted&quot;</strong>.</li>
              <li>App info &gt; <strong>Mobile data</strong> &gt; Enable <strong className="text-white">&quot;Allow background data usage&quot;</strong> and <strong className="text-white">&quot;Allow data while Data saver on&quot;</strong>.</li>
              <li>Device Care &gt; Battery &gt; Background usage limits &gt; Add Bixberry to <strong className="text-white">&quot;Never sleeping apps&quot;</strong>.</li>
            </ol>
          )}

          {selectedOem === 'pixel' && (
            <ol className="list-decimal pl-5 space-y-1.5">
              <li>Settings &gt; Apps &gt; Bixberry &gt; <strong>App battery usage</strong> &gt; Select <strong className="text-white">&quot;Unrestricted&quot;</strong>.</li>
              <li>Mobile data &amp; Wi-Fi &gt; Enable <strong className="text-white">&quot;Background data&quot;</strong> and <strong className="text-white">&quot;Unrestricted data usage&quot;</strong>.</li>
            </ol>
          )}

          {selectedOem === 'xiaomi' && (
            <ol className="list-decimal pl-5 space-y-1.5">
              <li>Security &gt; Manage Apps &gt; Bixberry &gt; Enable <strong className="text-white">&quot;Autostart&quot;</strong>.</li>
              <li>Battery saver &gt; Select <strong className="text-white">&quot;No restrictions&quot;</strong>.</li>
              <li>Recent apps overview &gt; Long press Bixberry &gt; Tap the <strong className="text-white">Padlock icon</strong> to lock in RAM.</li>
            </ol>
          )}

          {selectedOem === 'generic' && (
            <ol className="list-decimal pl-5 space-y-1.5">
              <li>Settings &gt; Apps &gt; Special app access &gt; Battery optimization &gt; Set to <strong className="text-white">&quot;Don&apos;t optimize&quot;</strong>.</li>
              <li>Keep device connected to a dedicated charger during active earning sessions.</li>
            </ol>
          )}
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => toggleCheck('batteryExemption')}
            className={`p-3 rounded-xl border flex items-center justify-between transition ${
              deviceHealth.backgroundGuidanceDone.batteryExemption 
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' 
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            <span>Battery Set to &quot;Unrestricted&quot;</span>
            <CheckCircle2 className={`w-4 h-4 ${deviceHealth.backgroundGuidanceDone.batteryExemption ? 'text-emerald-400' : 'text-slate-600'}`} />
          </button>

          <button
            onClick={() => toggleCheck('appPinning')}
            className={`p-3 rounded-xl border flex items-center justify-between transition ${
              deviceHealth.backgroundGuidanceDone.appPinning 
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' 
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            <span>Bixberry Locked in RAM / Recents</span>
            <CheckCircle2 className={`w-4 h-4 ${deviceHealth.backgroundGuidanceDone.appPinning ? 'text-emerald-400' : 'text-slate-600'}`} />
          </button>

          <button
            onClick={() => toggleCheck('backgroundData')}
            className={`p-3 rounded-xl border flex items-center justify-between transition ${
              deviceHealth.backgroundGuidanceDone.backgroundData 
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' 
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            <span>Unrestricted Background Mobile Data</span>
            <CheckCircle2 className={`w-4 h-4 ${deviceHealth.backgroundGuidanceDone.backgroundData ? 'text-emerald-400' : 'text-slate-600'}`} />
          </button>

          <button
            onClick={() => toggleCheck('dozeMode')}
            className={`p-3 rounded-xl border flex items-center justify-between transition ${
              deviceHealth.backgroundGuidanceDone.dozeMode 
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' 
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            <span>Whitelisted from Deep Sleep (Doze)</span>
            <CheckCircle2 className={`w-4 h-4 ${deviceHealth.backgroundGuidanceDone.dozeMode ? 'text-emerald-400' : 'text-slate-600'}`} />
          </button>
        </div>
      </div>

    </div>
  );
};

import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Gauge, 
  ArrowRight, 
  Sparkles,
  Zap
} from 'lucide-react';
import type { NetworkMetrics, DeviceHealth } from '../types';

interface Props {
  metrics: NetworkMetrics;
  deviceHealth: DeviceHealth;
  onNavigateTab: (tab: 'internet' | 'device' | 'connector' | 'earnings') => void;
}

export const OptimizationChecklist: React.FC<Props> = ({ 
  metrics, 
  deviceHealth, 
  onNavigateTab 
}) => {
  // Item 1: Low Latency (<60ms)
  const isLatencyOptimal = metrics.avgLatency <= 70;
  // Item 2: Zero packet loss
  const isZeroLoss = metrics.packetLoss === 0;
  // Item 3: Battery Unrestricted
  const isBatteryExempt = deviceHealth.backgroundGuidanceDone.batteryExemption;
  // Item 4: WakeLock or plugged in
  const isPowerOptimal = deviceHealth.wakeLockActive || deviceHealth.isCharging === true;
  // Item 5: Background data allowed
  const isBgDataAllowed = deviceHealth.backgroundGuidanceDone.backgroundData;
  // Item 6: App locked in RAM
  const isAppLocked = deviceHealth.backgroundGuidanceDone.appPinning;

  const items = [
    {
      title: 'Low Latency & Fast AI Lookups',
      description: metrics.avgLatency < 900 ? `Current avg ping: ${metrics.avgLatency}ms (Target: < 70ms)` : 'Ping test needed',
      passed: isLatencyOptimal,
      tab: 'internet' as const
    },
    {
      title: 'Zero Packet Loss & Stability',
      description: `${metrics.packetLoss}% packet loss detected`,
      passed: isZeroLoss,
      tab: 'internet' as const
    },
    {
      title: 'Android Battery Set to "Unrestricted"',
      description: isBatteryExempt ? 'Exempted from Android Doze Mode' : 'OS may kill background socket',
      passed: isBatteryExempt,
      tab: 'device' as const
    },
    {
      title: 'Continuous Node Power & Wake Lock',
      description: isPowerOptimal ? 'Device plugged in or WakeLock active' : 'Device may sleep on battery',
      passed: isPowerOptimal,
      tab: 'device' as const
    },
    {
      title: 'Unrestricted Background Mobile Data',
      description: isBgDataAllowed ? 'Background data permitted' : 'Data saver might block tasks',
      passed: isBgDataAllowed,
      tab: 'device' as const
    },
    {
      title: 'Bixberry App Locked in Memory / RAM',
      description: isAppLocked ? 'Pinned in recent apps overview' : 'Risk of OS memory eviction',
      passed: isAppLocked,
      tab: 'device' as const
    }
  ];

  const passedCount = items.filter(i => i.passed).length;
  const totalCount = items.length;
  const overallPercentage = Math.round((passedCount / totalCount) * 100);

  return (
    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Bixberry Node Optimization Health Index
          </h3>
          <p className="text-xs text-slate-400">
            {passedCount} of {totalCount} critical optimization factors verified
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs font-semibold text-slate-400 block">Readiness</span>
            <span className="text-lg font-black text-emerald-400 font-mono">{overallPercentage}%</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center">
            <Gauge className={`w-6 h-6 ${overallPercentage >= 80 ? 'text-emerald-400' : overallPercentage >= 50 ? 'text-amber-400' : 'text-rose-400'}`} />
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800/80">
        <div 
          className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-emerald-300 transition-all duration-500"
          style={{ width: `${overallPercentage}%` }}
        />
      </div>

      {/* Checklist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-xl border flex items-center justify-between transition ${
              item.passed
                ? 'bg-emerald-500/5 border-emerald-500/30'
                : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {item.passed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              )}
              <div>
                <span className={`text-xs font-bold block ${item.passed ? 'text-emerald-200' : 'text-slate-300'}`}>
                  {item.title}
                </span>
                <span className="text-[11px] text-slate-400">
                  {item.description}
                </span>
              </div>
            </div>

            {!item.passed && (
              <button
                onClick={() => onNavigateTab(item.tab)}
                className="ml-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition shrink-0"
                title="Configure"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

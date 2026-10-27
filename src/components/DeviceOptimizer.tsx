import React, { useState, useEffect } from 'react';
import { 
  Battery, 
  BatteryCharging, 
  Flame, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertTriangle, 
  Smartphone, 
  Cpu, 
  ShieldAlert, 
  Settings2,
  ChevronRight
} from 'lucide-react';
import type { DeviceHealth } from '../types';

interface Props {
  deviceHealth: DeviceHealth;
  onUpdateDeviceHealth: (health: Partial<DeviceHealth>) => void;
}

export const DeviceOptimizer: React.FC<Props> = ({ deviceHealth, onUpdateDeviceHealth }) => {
  const [selectedOem, setSelectedOem] = useState<'pixel' | 'samsung' | 'xiaomi' | 'generic'>('samsung');
  const [wakeLockError, setWakeLockError] = useState<string | null>(null);
  const [wakeLockObj, setWakeLockObj] = useState<any>(null);

  // Toggle Screen Wake Lock API
  const toggleWakeLock = async () => {
    if ('wakeLock' in navigator) {
      if (deviceHealth.wakeLockActive && wakeLockObj) {
        try {
          await wakeLockObj.release();
          setWakeLockObj(null);
          onUpdateDeviceHealth({ wakeLockActive: false });
          setWakeLockError(null);
        } catch (e: any) {
          setWakeLockError(e?.message || 'Failed to release WakeLock');
        }
      } else {
        try {
          const lock = await (navigator as any).wakeLock.request('screen');
          setWakeLockObj(lock);
          onUpdateDeviceHealth({ wakeLockActive: true });
          setWakeLockError(null);

          lock.addEventListener('release', () => {
            setWakeLockObj(null);
            onUpdateDeviceHealth({ wakeLockActive: false });
          });
        } catch (e: any) {
          setWakeLockError(e?.message || 'WakeLock request denied or tab backgrounded');
        }
      }
    } else {
      setWakeLockError('Screen Wake Lock API not supported on this browser engine. Keep device plugged into power with screen timeout set to Never.');
    }
  };

  // Inspect Battery API if available
  useEffect(() => {
    let batteryInstance: any = null;

    const initBattery = async () => {
      try {
        if ('getBattery' in navigator) {
          batteryInstance = await (navigator as any).getBattery();
          const update = () => {
            onUpdateDeviceHealth({
              batteryLevel: Math.round(batteryInstance.level * 100),
              isCharging: batteryInstance.charging
            });
          };
          update();
          batteryInstance.addEventListener('levelchange', update);
          batteryInstance.addEventListener('chargingchange', update);
        }
      } catch {
        // Battery API is restricted on some desktop browsers for privacy
      }
    };

    initBattery();

    return () => {
      if (batteryInstance) {
        batteryInstance.removeEventListener('levelchange', () => {});
        batteryInstance.removeEventListener('chargingchange', () => {});
      }
    };
  }, [onUpdateDeviceHealth]);

  // Measure Event Loop latency to detect CPU thermal throttling
  useEffect(() => {
    const interval = setInterval(() => {
      const start = performance.now();
      setTimeout(() => {
        const delta = Math.round(performance.now() - start - 50);
        const delay = Math.max(0, delta);
        let thermalStatus: 'normal' | 'warm' | 'throttled' = 'normal';
        if (delay > 60) thermalStatus = 'throttled';
        else if (delay > 25) thermalStatus = 'warm';

        onUpdateDeviceHealth({
          eventLoopDelayMs: delay,
          thermalStatus
        });
      }, 50);
    }, 4000);

    return () => clearInterval(interval);
  }, [onUpdateDeviceHealth]);

  const toggleGuidanceCheck = (key: keyof DeviceHealth['backgroundGuidanceDone']) => {
    onUpdateDeviceHealth({
      backgroundGuidanceDone: {
        ...deviceHealth.backgroundGuidanceDone,
        [key]: !deviceHealth.backgroundGuidanceDone[key]
      }
    });
  };

  const getThermalBadge = (status: DeviceHealth['thermalStatus']) => {
    if (status === 'normal') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" /> Cool &amp; Responsive
        </span>
      );
    }
    if (status === 'warm') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400">
          <Flame className="w-3.5 h-3.5" /> Elevated Temp
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 animate-pulse">
        <AlertTriangle className="w-3.5 h-3.5" /> Thermal Throttling Detected
      </span>
    );
  };

  return (
    <div className="space-y-6">

      {/* Header card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Automatic Device &amp; Battery Optimizer
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                Android &amp; Background Guard
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Stop Android Doze Mode and battery optimization from freezing the Bixberry background node
            </p>
          </div>
        </div>

        {/* Wake lock action button */}
        <button
          onClick={toggleWakeLock}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition shadow-lg ${
            deviceHealth.wakeLockActive
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/40'
              : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-emerald-950/40'
          }`}
        >
          {deviceHealth.wakeLockActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {deviceHealth.wakeLockActive ? 'Disable Screen WakeLock' : 'Keep Screen / Node Awake'}
        </button>
      </div>

      {wakeLockError && (
        <div className="p-3 text-xs rounded-xl bg-amber-950/40 border border-amber-800/50 text-amber-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">WakeLock Notice: </span>
            {wakeLockError}
          </div>
        </div>
      )}

      {/* Device Vital Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Battery State */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Power Supply</span>
            {deviceHealth.isCharging ? (
              <BatteryCharging className="w-4 h-4 text-emerald-400" />
            ) : (
              <Battery className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              {deviceHealth.batteryLevel !== null ? `${deviceHealth.batteryLevel}%` : 'AC / Desktop'}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {deviceHealth.isCharging ? '(Charging)' : '(On Battery)'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {deviceHealth.isCharging
              ? 'Optimal: Plugged in prevents OS power-saving dropouts'
              : 'Warning: Node may be suspended when battery drops < 20%'}
          </p>
        </div>

        {/* Thermal & CPU Throttling */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Thermal State</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mb-1">
            {getThermalBadge(deviceHealth.thermalStatus)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Event loop latency: <span className="font-mono text-cyan-300">{deviceHealth.eventLoopDelayMs}ms</span> (Excess heat throttles network throughput)
          </p>
        </div>

        {/* Wake Lock Status */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Awake Lock</span>
            <Eye className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${deviceHealth.wakeLockActive ? 'text-amber-400' : 'text-slate-400'}`}>
              {deviceHealth.wakeLockActive ? 'Active (Screen Stay)' : 'Standard Sleep'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {deviceHealth.wakeLockActive
              ? 'Screen will not sleep while viewing booster'
              : 'Device sleep may disconnect Bixberry background socket'}
          </p>
        </div>

      </div>

      {/* Android Doze Mode & Background Optimization Guide */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-emerald-400" />
              Android Battery Optimization Bypass Guide
            </h3>
            <p className="text-xs text-slate-400">
              Android OS kills background apps unless explicitly exempted. Select your phone brand:
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setSelectedOem('samsung')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                selectedOem === 'samsung' ? 'bg-emerald-600 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Samsung
            </button>
            <button
              onClick={() => setSelectedOem('pixel')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                selectedOem === 'pixel' ? 'bg-emerald-600 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pixel / Stock
            </button>
            <button
              onClick={() => setSelectedOem('xiaomi')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                selectedOem === 'xiaomi' ? 'bg-emerald-600 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Xiaomi
            </button>
            <button
              onClick={() => setSelectedOem('generic')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                selectedOem === 'generic' ? 'bg-emerald-600 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Other
            </button>
          </div>
        </div>

        {/* Step-by-step OEM instructions */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-3">
          {selectedOem === 'samsung' && (
            <div className="space-y-2.5">
              <div className="font-bold text-emerald-300">Samsung One UI Configuration:</div>
              <ol className="list-decimal pl-5 space-y-1.5 text-slate-300">
                <li>Long press the <strong>Bixberry</strong> app icon &gt; Tap the &quot;i&quot; (App Info) icon.</li>
                <li>Tap <strong>Battery</strong> &gt; Switch from &quot;Optimized&quot; to <strong className="text-white">&quot;Unrestricted&quot;</strong>.</li>
                <li>Go to <strong>Mobile data</strong> &gt; Turn ON <strong className="text-white">&quot;Allow background data usage&quot;</strong> and <strong className="text-white">&quot;Allow data usage while Data saver is on&quot;</strong>.</li>
                <li>Open Settings &gt; Device Care &gt; Battery &gt; Background usage limits &gt; Add Bixberry to <strong className="text-white">&quot;Never sleeping apps&quot;</strong>.</li>
              </ol>
            </div>
          )}

          {selectedOem === 'pixel' && (
            <div className="space-y-2.5">
              <div className="font-bold text-emerald-300">Google Pixel &amp; Pure Android Configuration:</div>
              <ol className="list-decimal pl-5 space-y-1.5 text-slate-300">
                <li>Settings &gt; Apps &gt; See all apps &gt; Select <strong>Bixberry</strong>.</li>
                <li>Tap <strong>App battery usage</strong> &gt; Select <strong className="text-white">&quot;Unrestricted&quot;</strong>.</li>
                <li>Tap <strong>Mobile data &amp; Wi-Fi</strong> &gt; Enable <strong className="text-white">&quot;Background data&quot;</strong> and <strong className="text-white">&quot;Unrestricted data usage&quot;</strong>.</li>
                <li>Settings &gt; Battery &gt; Battery Saver &gt; Ensure Battery Saver is not set to auto-enable.</li>
              </ol>
            </div>
          )}

          {selectedOem === 'xiaomi' && (
            <div className="space-y-2.5">
              <div className="font-bold text-emerald-300">Xiaomi HyperOS / MIUI Configuration:</div>
              <ol className="list-decimal pl-5 space-y-1.5 text-slate-300">
                <li>Security app &gt; Manage Apps &gt; <strong>Bixberry</strong>.</li>
                <li>Enable <strong className="text-white">&quot;Autostart&quot;</strong> permission.</li>
                <li>Tap <strong>Battery saver</strong> &gt; Select <strong className="text-white">&quot;No restrictions&quot;</strong>.</li>
                <li>Open recent apps drawer &gt; Long press Bixberry &gt; Tap the <strong className="text-white">Padlock icon</strong> to pin the app in RAM memory.</li>
              </ol>
            </div>
          )}

          {selectedOem === 'generic' && (
            <div className="space-y-2.5">
              <div className="font-bold text-emerald-300">Universal Android Steps:</div>
              <ol className="list-decimal pl-5 space-y-1.5 text-slate-300">
                <li>Open Android Settings &gt; Apps &gt; Special App Access &gt; Battery Optimization.</li>
                <li>Switch filter to &quot;All apps&quot; &gt; Find Bixberry &gt; Choose <strong className="text-white">&quot;Don&apos;t optimize&quot;</strong>.</li>
                <li>Ensure device is connected to a dedicated USB-C charger when running long earning sessions.</li>
              </ol>
            </div>
          )}
        </div>

        {/* Verification Checklist */}
        <div className="space-y-2 pt-1">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Confirm Applied Optimizations:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => toggleGuidanceCheck('batteryExemption')}
              className={`flex items-center justify-between p-3 rounded-xl border text-left transition ${
                deviceHealth.backgroundGuidanceDone.batteryExemption
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span>Set Battery to &quot;Unrestricted&quot;</span>
              <CheckCircle2 className={`w-4 h-4 ${deviceHealth.backgroundGuidanceDone.batteryExemption ? 'text-emerald-400' : 'text-slate-600'}`} />
            </button>

            <button
              onClick={() => toggleGuidanceCheck('backgroundData')}
              className={`flex items-center justify-between p-3 rounded-xl border text-left transition ${
                deviceHealth.backgroundGuidanceDone.backgroundData
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span>Enabled Unrestricted Background Data</span>
              <CheckCircle2 className={`w-4 h-4 ${deviceHealth.backgroundGuidanceDone.backgroundData ? 'text-emerald-400' : 'text-slate-600'}`} />
            </button>

            <button
              onClick={() => toggleGuidanceCheck('appPinning')}
              className={`flex items-center justify-between p-3 rounded-xl border text-left transition ${
                deviceHealth.backgroundGuidanceDone.appPinning
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span>Locked App in Recent Tasks / RAM</span>
              <CheckCircle2 className={`w-4 h-4 ${deviceHealth.backgroundGuidanceDone.appPinning ? 'text-emerald-400' : 'text-slate-600'}`} />
            </button>

            <button
              onClick={() => toggleGuidanceCheck('dozeMode')}
              className={`flex items-center justify-between p-3 rounded-xl border text-left transition ${
                deviceHealth.backgroundGuidanceDone.dozeMode
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span>Whitelisted from Deep Sleep (Doze)</span>
              <CheckCircle2 className={`w-4 h-4 ${deviceHealth.backgroundGuidanceDone.dozeMode ? 'text-emerald-400' : 'text-slate-600'}`} />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

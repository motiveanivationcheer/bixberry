import React, { useState } from 'react';
import { 
  Wifi, 
  Smartphone, 
  Link2, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Crown, 
  RefreshCw, 
  Play, 
  Square, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  CreditCard,
  DollarSign,
  Activity,
  Layers,
  Settings,
  HelpCircle,
  ExternalLink,
  RotateCcw,
  Clock,
  AlertTriangle,
  Server,
  Lock,
  Mail,
  Cpu,
  Radio
} from 'lucide-react';
import type { NetworkMetrics, DeviceHealth, UserProfile, BalanceSnapshot, ScreenId, BixberryConnectionStatus } from '../types';

interface Props {
  metrics: NetworkMetrics;
  deviceHealth: DeviceHealth;
  userProfile: UserProfile | null;
  balanceSnapshot: BalanceSnapshot | null;
  isMonitoring: boolean;
  onToggleMonitoring: () => void;
  onNavigate: (screen: ScreenId) => void;
  onRefreshBalance: () => void;
  isRefreshingBalance: boolean;
  bixberryStatus: BixberryConnectionStatus;
  lastSyncTimestamp: string | null;
  onOpenDashboard: () => void;
  onReconnect: () => void;
  isReconnecting: boolean;
  connectionError: string | null;
}

export const DashboardScreen: React.FC<Props> = ({
  metrics,
  deviceHealth,
  userProfile,
  balanceSnapshot,
  isMonitoring,
  onToggleMonitoring,
  onNavigate,
  onRefreshBalance,
  isRefreshingBalance,
  bixberryStatus,
  lastSyncTimestamp,
  onOpenDashboard,
  onReconnect,
  isReconnecting,
  connectionError
}) => {
  // Optimization factors
  const isLatencyGood = metrics.avgLatency <= 70;
  const isPacketLossZero = metrics.packetLoss === 0;
  const isBatteryExempt = deviceHealth.backgroundGuidanceDone.batteryExemption;
  const isPowerOptimal = deviceHealth.wakeLockActive || deviceHealth.isCharging === true;
  const isBgDataAllowed = deviceHealth.backgroundGuidanceDone.backgroundData;
  const isAppLocked = deviceHealth.backgroundGuidanceDone.appPinning;

  const passedCount = [
    isLatencyGood,
    isPacketLossZero,
    isBatteryExempt,
    isPowerOptimal,
    isBgDataAllowed,
    isAppLocked
  ].filter(Boolean).length;

  const compositeScore = Math.round((passedCount / 6) * 100);
  const isPremium = userProfile?.subscriptionTier && userProfile.subscriptionTier !== 'free' && userProfile.subscriptionStatus === 'active';

  // Format last sync time nicely
  const formattedSyncTime = lastSyncTimestamp 
    ? new Date(lastSyncTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Not yet synchronized';

  return (
    <div className="space-y-6">
      
      {/* SECTION 1: Gateway Connection & Official Actions Toolbar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Connection Status Badge & Metadata */}
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition ${
              bixberryStatus === 'Connected'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                : bixberryStatus === 'Session Expired'
                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/40 shadow-lg shadow-rose-500/10'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              <Server className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  Official Gateway Status:
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border flex items-center gap-1.5 ${
                  bixberryStatus === 'Connected'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : bixberryStatus === 'Session Expired'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    bixberryStatus === 'Connected' ? 'bg-emerald-400' : bixberryStatus === 'Session Expired' ? 'bg-rose-400' : 'bg-slate-500'
                  }`} />
                  {bixberryStatus}
                </span>

                {userProfile?.bixberryEmail && (
                  <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                    ({userProfile.bixberryEmail})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="text-slate-500 font-semibold">Gateway:</span>
                  <code className="text-cyan-400 font-mono">https://dashboard.bixberry.com</code>
                </span>
                <span className="text-slate-600">&bull;</span>
                <span className="flex items-center gap-1 font-mono text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Last Sync: {formattedSyncTime}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Core Mandatory Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Button 1: Open Bixberry Dashboard */}
            <button
              onClick={onOpenDashboard}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition shadow-sm active:scale-95"
              title="Open official Bixberry dashboard in new browser tab"
            >
              <span>Open Bixberry Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            </button>

            {/* Button 2: Connect Bixberry Account */}
            <button
              onClick={() => onNavigate('connector')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm active:scale-95 ${
                bixberryStatus === 'Connected'
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-emerald-950/40'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Connect Bixberry Account</span>
            </button>

            {/* Button 3: Refresh Button */}
            <button
              onClick={onRefreshBalance}
              disabled={isRefreshingBalance}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition disabled:opacity-50"
              title="Refresh gateway connection and sync balance"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingBalance ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Button 4: Reconnect Button */}
            <button
              onClick={onReconnect}
              disabled={isReconnecting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition disabled:opacity-50"
              title="Attempt automatic reconnection with exponential backoff"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isReconnecting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isReconnecting ? 'Reconnecting...' : 'Reconnect'}</span>
            </button>
          </div>

        </div>

        {/* Dynamic Connection Status Notification Banners */}
        {bixberryStatus === 'Session Expired' && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <span className="font-bold">Bixberry Session Expired: </span>
                Your security session has expired. To maintain continuous node authorization and processing earnings, please sign in to the official dashboard and refresh your credentials.
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onOpenDashboard}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-sm flex items-center gap-1"
              >
                <span>Sign In at Bixberry</span>
                <ExternalLink className="w-3 h-3" />
              </button>
              <button
                onClick={() => onNavigate('connector')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              >
                Update Token
              </button>
            </div>
          </div>
        )}

        {bixberryStatus === 'Disconnected' && (
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="font-semibold text-white">Bixberry Account Disconnected: </span>
                Sign in to <code className="text-indigo-400 font-mono">https://dashboard.bixberry.com</code> and connect your authorized session token to enable node verification.
              </div>
            </div>
            <button
              onClick={() => onNavigate('connector')}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition shrink-0"
            >
              Connect Bixberry Account
            </button>
          </div>
        )}

        {/* Connection Error Diagnostic Banner (if any) */}
        {connectionError && (
          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex-1">
              <span className="font-bold">Notice: </span>
              {connectionError}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: Active Monitoring Engine & Low-Latency Live Telemetry */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition ${
              isMonitoring 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-lg shadow-emerald-500/20' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              <Zap className={`w-6 h-6 ${isMonitoring ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-white">
                  Bixberry Booster Optimization Engine
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono border ${
                  isMonitoring 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {isMonitoring ? 'ACTIVE MONITORING' : 'STANDBY'}
                </span>
                {isPremium && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-400" />
                    PRO TIER
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                NAT Keep-Alive: 5-second pulses &bull; Round-trip &lt;70ms Target &bull; Zero Packet Loss Guard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onToggleMonitoring}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-lg active:scale-95 ${
                isMonitoring
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-emerald-950/40'
              }`}
            >
              {isMonitoring ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}</span>
            </button>

            <button
              onClick={() => onNavigate('optimization')}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
            >
              Optimizer Settings &rarr;
            </button>
          </div>
        </div>

        {/* Live Vitals Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 block">Gateway Latency</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-cyan-400 font-mono">{metrics.currentLatency}</span>
              <span className="text-xs text-slate-500">ms</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">
              {metrics.currentLatency <= 70 ? '&lt; 70ms Target Met' : 'Above Target'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 block">Connection Stability</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-emerald-400 font-mono">{metrics.stabilityScore}</span>
              <span className="text-xs text-slate-500">/ 100</span>
            </div>
            <span className="text-[10px] text-slate-400">Jitter: {metrics.jitter}ms</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 block">Packet Loss</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-white font-mono">{metrics.packetLoss}%</span>
            </div>
            <span className="text-[10px] text-emerald-400">Socket Drops: 0</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 block">Device Power State</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-amber-400 font-mono">
                {deviceHealth.batteryLevel ? `${deviceHealth.batteryLevel}%` : 'AC Power'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              {deviceHealth.wakeLockActive ? 'WakeLock Active' : 'Doze Guarded'}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 3: Honest Balance & Verified Node Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Verified Balance Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Verified Bixberry Balance</h3>
              </div>
              <button
                onClick={onRefreshBalance}
                disabled={isRefreshingBalance}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshingBalance ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Honest verification logic: never display simulated balances as real */}
            {balanceSnapshot && balanceSnapshot.syncStatus === 'verified' && balanceSnapshot.confirmedBalance !== null ? (
              <div className="space-y-2 mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white font-mono">
                    ${balanceSnapshot.confirmedBalance.toFixed(2)}
                  </span>
                  <span className="text-xs font-semibold text-emerald-400">USD Confirmed</span>
                </div>
                {balanceSnapshot.pendingBalance !== undefined && (
                  <p className="text-xs text-slate-400">
                    Pending Processing: <span className="font-mono text-cyan-300">${balanceSnapshot.pendingBalance.toFixed(2)}</span>
                  </p>
                )}
                <p className="text-[11px] text-slate-500 font-mono">
                  Verified Sync: {new Date(balanceSnapshot.syncTimestamp).toLocaleTimeString()}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs space-y-2.5 mt-2">
                <div className="flex items-center gap-2 text-amber-300 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Official 3P REST Balance API Restricted by Cloudsquad UAB</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Bixberry does not provide a public REST balance endpoint without an approved enterprise partner agreement. Live balances are securely managed on the official web dashboard.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={onOpenDashboard}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition flex items-center gap-1"
                  >
                    <span>View Balance on Bixberry</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onNavigate('connector')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                  >
                    Request Partner API
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">Full transaction &amp; withdrawal records:</span>
            <button
              onClick={() => onNavigate('balance')}
              className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 transition"
            >
              <span>Balance Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Node Health & Readiness Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Node Optimization Readiness</h3>
              </div>
              <span className="text-xs font-bold font-mono text-emerald-400">{compositeScore}% Ready</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800 mb-3">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-emerald-300 transition-all duration-500"
                style={{ width: `${compositeScore}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className={`w-3.5 h-3.5 ${isLatencyGood ? 'text-emerald-400' : 'text-slate-600'}`} />
                <span>Low Latency (&lt;70ms)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className={`w-3.5 h-3.5 ${isBatteryExempt ? 'text-emerald-400' : 'text-slate-600'}`} />
                <span>Battery Unrestricted</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className={`w-3.5 h-3.5 ${isAppLocked ? 'text-emerald-400' : 'text-slate-600'}`} />
                <span>Locked in RAM</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className={`w-3.5 h-3.5 ${isBgDataAllowed ? 'text-emerald-400' : 'text-slate-600'}`} />
                <span>Unrestricted Data</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">Android battery &amp; keep-alive tuning:</span>
            <button
              onClick={() => onNavigate('optimization')}
              className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 transition"
            >
              <span>Optimizer Tools</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* SECTION 4: 9-Module Quick Navigation Matrix */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          Quick Navigation &amp; Functional Modules
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          
          <button
            onClick={() => onNavigate('connector')}
            className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 text-left transition space-y-1.5"
          >
            <Link2 className="w-5 h-5 text-indigo-400" />
            <div className="font-bold text-white">Bixberry Gateway</div>
            <p className="text-[11px] text-slate-400">Verify token &amp; gateway handshake</p>
          </button>

          <button
            onClick={() => onNavigate('balance')}
            className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 text-left transition space-y-1.5"
          >
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <div className="font-bold text-white">Verified Balance</div>
            <p className="text-[11px] text-slate-400">Real sync, pending vs confirmed</p>
          </button>

          <button
            onClick={() => onNavigate('earnings')}
            className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 text-left transition space-y-1.5"
          >
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <div className="font-bold text-white">Earning History</div>
            <p className="text-[11px] text-slate-400">Session logs &amp; before/after stats</p>
          </button>

          <button
            onClick={() => onNavigate('optimization')}
            className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 text-left transition space-y-1.5"
          >
            <Wifi className="w-5 h-5 text-cyan-400" />
            <div className="font-bold text-white">Connection Engine</div>
            <p className="text-[11px] text-slate-400">Live pings, DNS &amp; battery guide</p>
          </button>

          <button
            onClick={() => onNavigate('subscriptions')}
            className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 text-left transition space-y-1.5"
          >
            <Crown className="w-5 h-5 text-amber-400" />
            <div className="font-bold text-white">Premium Plans</div>
            <p className="text-[11px] text-slate-400">$100/mo &amp; $1,000/yr Pro plans</p>
          </button>

          <button
            onClick={() => onNavigate('payments')}
            className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/40 text-left transition space-y-1.5"
          >
            <CreditCard className="w-5 h-5 text-blue-400" />
            <div className="font-bold text-white">Payment History</div>
            <p className="text-[11px] text-slate-400">Invoices &amp; refund status</p>
          </button>

          <button
            onClick={() => onNavigate('settings')}
            className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-600 text-left transition space-y-1.5"
          >
            <Settings className="w-5 h-5 text-slate-400" />
            <div className="font-bold text-white">Account Settings</div>
            <p className="text-[11px] text-slate-400">Firebase sync &amp; ping intervals</p>
          </button>

          <button
            onClick={() => onNavigate('support')}
            className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 text-left transition space-y-1.5"
          >
            <HelpCircle className="w-5 h-5 text-emerald-400" />
            <div className="font-bold text-white">Help &amp; Support</div>
            <p className="text-[11px] text-slate-400">FAQ, official routes &amp; docs</p>
          </button>

        </div>
      </div>

    </div>
  );
};

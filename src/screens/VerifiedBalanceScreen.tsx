import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  ArrowDownRight, 
  ShieldCheck, 
  Calendar,
  Lock,
  ExternalLink,
  Info
} from 'lucide-react';
import { BixberryService, type BixberryBalanceResult } from '../services/bixberryService';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import type { BalanceSnapshot, EarningRecord } from '../types';

interface Props {
  user: { uid: string } | null;
  currentSnapshot: BalanceSnapshot | null;
  onBalanceUpdated: () => void;
}

export const VerifiedBalanceScreen: React.FC<Props> = ({
  user,
  currentSnapshot,
  onBalanceUpdated
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncResult, setSyncResult] = useState<BixberryBalanceResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [pastSnapshots, setPastSnapshots] = useState<BalanceSnapshot[]>([]);
  const [earningRecords, setEarningRecords] = useState<EarningRecord[]>([]);

  // Load past snapshots and earnings from Firestore
  const loadHistory = async () => {
    if (!user) return;
    try {
      // Balance snapshots
      const snapQ = query(
        collection(db, 'users', user.uid, 'balanceSnapshots'),
        orderBy('syncTimestamp', 'desc'),
        limit(10)
      );
      const snapDocs = await getDocs(snapQ);
      const snaps: BalanceSnapshot[] = [];
      snapDocs.forEach(d => snaps.push(d.data() as BalanceSnapshot));
      setPastSnapshots(snaps);

      // Earning records for daily/weekly/monthly calculations
      const earnQ = query(
        collection(db, 'users', user.uid, 'earningRecords'),
        orderBy('date', 'desc'),
        limit(30)
      );
      const earnDocs = await getDocs(earnQ);
      const records: EarningRecord[] = [];
      earnDocs.forEach(d => records.push(d.data() as EarningRecord));
      setEarningRecords(records);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user]);

  const handleRefreshBalance = async () => {
    setIsRefreshing(true);
    setSyncError(null);
    try {
      const data = await BixberryService.syncBalance(user?.uid);
      setSyncResult(data);
      onBalanceUpdated();
      await loadHistory();
    } catch (err: any) {
      setSyncError(err.message || 'Balance synchronization failed');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate actual daily, weekly, and monthly totals from real transaction/session records
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 86400000).toISOString().split('T')[0];
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];

  // Deduplicate records by ID or date
  const uniqueRecords = Array.from(new Map(earningRecords.map(r => [r.id || r.date, r])).values());

  const dailyEarned = uniqueRecords
    .filter(r => r.date >= oneDayAgo)
    .reduce((sum, r) => sum + r.amountEarnedUsd, 0);

  const weeklyEarned = uniqueRecords
    .filter(r => r.date >= sevenDaysAgo)
    .reduce((sum, r) => sum + r.amountEarnedUsd, 0);

  const monthlyEarned = uniqueRecords
    .filter(r => r.date >= thirtyDaysAgo)
    .reduce((sum, r) => sum + r.amountEarnedUsd, 0);

  const confirmedBalance = currentSnapshot?.confirmedBalance ?? null;
  const pendingBalance = currentSnapshot?.pendingBalance ?? 0;

  return (
    <div className="space-y-6">

      {/* Screen Header */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Verified Balance &amp; Earnings Synchronization
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold font-mono">
                Screen 3
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Honest balance auditing, verified transaction history, and confirmed vs pending separation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => BixberryService.openOfficialDashboard()}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition"
            title="Open official Bixberry dashboard in browser"
          >
            <span>Open Bixberry Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
          </button>

          <button
            onClick={handleRefreshBalance}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-950/40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Synchronizing...' : 'Refresh Balance'}</span>
          </button>
        </div>
      </div>

      {/* Main Balance Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Confirmed Balance Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/40 space-y-2 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Confirmed Balance
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
              REDEEMABLE
            </span>
          </div>

          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-3xl font-black text-white font-mono">
              {confirmedBalance !== null ? `$${confirmedBalance.toFixed(2)}` : 'Restricted'}
            </span>
            <span className="text-xs font-bold text-emerald-400 font-mono">
              {currentSnapshot?.currency || 'USD'}
            </span>
          </div>

          <p className="text-[11px] text-slate-400">
            {confirmedBalance !== null 
              ? 'Audited and verified through Bixberry session adapter.' 
              : 'Direct API access pending. Never displaying fabricated figures.'}
          </p>
        </div>

        {/* Pending Balance Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Pending Processing
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
              IN VERIFICATION
            </span>
          </div>

          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-3xl font-black text-cyan-300 font-mono">
              ${pendingBalance.toFixed(2)}
            </span>
            <span className="text-xs font-bold text-slate-400 font-mono">USD</span>
          </div>

          <p className="text-[11px] text-slate-400">
            AI lookups currently awaiting settlement batch confirmation.
          </p>
        </div>

        {/* Last Synchronized Timestamp */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Last Sync Timestamp
            </span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>

          <div className="text-base font-bold text-white pt-2 font-mono">
            {currentSnapshot ? new Date(currentSnapshot.syncTimestamp).toLocaleString() : 'Not Yet Synced'}
          </div>

          <p className="text-[11px] text-slate-400">
            Source: <code className="text-emerald-400">{currentSnapshot?.source || 'bixberry_session_adapter'}</code>
          </p>
        </div>

      </div>

      {/* Synchronized Notice / Transparency Box */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex items-start gap-3">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-slate-300">
          <span className="font-bold text-white">Authentic Balance Policy: </span>
          <span>
            Bixberry operates on minimum withdrawals of $10 (first payout) and $20 (subsequent). Payouts are fulfilled via the GIFQ Gift Card API and supported crypto wallets. This booster does not fabricate financial balances or simulate fake earnings.
          </span>
        </div>
      </div>

      {/* Calculated Rolling Totals from Verified Records */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Calculated Earnings from Verified Transaction Records</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {uniqueRecords.length} recorded session(s)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block mb-1">Past 24 Hours:</span>
            <div className="text-xl font-black text-emerald-400 font-mono">
              ${dailyEarned.toFixed(2)} USD
            </div>
            <span className="text-[10px] text-slate-500">Calculated from confirmed sessions</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block mb-1">Past 7 Days:</span>
            <div className="text-xl font-black text-cyan-400 font-mono">
              ${weeklyEarned.toFixed(2)} USD
            </div>
            <span className="text-[10px] text-slate-500">Weekly cumulative volume</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block mb-1">Past 30 Days:</span>
            <div className="text-xl font-black text-amber-400 font-mono">
              ${monthlyEarned.toFixed(2)} USD
            </div>
            <span className="text-[10px] text-slate-500">Monthly confirmed node yield</span>
          </div>
        </div>
      </div>

      {/* Past Balance Snapshots Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            Historical Balance Audit Snapshots (Firestore Synced)
          </h3>
          <span className="text-xs font-mono text-slate-500">users/{user?.uid || 'guest'}/balanceSnapshots</span>
        </div>

        {pastSnapshots.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No historical balance snapshots recorded yet. Click &quot;Refresh Balance&quot; to perform an audit.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left font-mono">
              <thead className="text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Sync Timestamp</th>
                  <th className="py-2.5 px-3">Confirmed</th>
                  <th className="py-2.5 px-3">Pending</th>
                  <th className="py-2.5 px-3">Currency</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {pastSnapshots.map((snap) => (
                  <tr key={snap.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 text-slate-300">
                      {new Date(snap.syncTimestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">
                      ${snap.confirmedBalance.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-cyan-300">
                      ${(snap.pendingBalance || 0).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{snap.currency}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold">
                        {snap.syncStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-sans text-[11px]">{snap.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

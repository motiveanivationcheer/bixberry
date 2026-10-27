import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  BarChart3, 
  Plus, 
  Calendar, 
  Clock, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Calculator, 
  Users, 
  Trash2,
  Sparkles
} from 'lucide-react';
import type { EarningRecord } from '../types';
import { db, auth, OperationType, handleFirestoreError } from '../firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

interface Props {
  user: { uid: string } | null;
  overallScore: number;
}

export const EarningsBooster: React.FC<Props> = ({ user, overallScore }) => {
  const [records, setRecords] = useState<EarningRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New record form state
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formDataProcessed, setFormDataProcessed] = useState('750');
  const [formUptimeHours, setFormUptimeHours] = useState('24');
  const [formEarnedUsd, setFormEarnedUsd] = useState('0.45');
  const [formIsOptimized, setFormIsOptimized] = useState(true);
  const [formNotes, setFormNotes] = useState('Booster WakeLock and 5GHz Wi-Fi active');

  // Interactive Calculator state
  const [calcNodes, setCalcNodes] = useState(2);
  const [calcUptimeHours, setCalcUptimeHours] = useState(24);
  const [calcIsOptimized, setCalcIsOptimized] = useState(true);
  const [calcReferrals, setCalcReferrals] = useState(3);

  // Load earning records from Firestore
  useEffect(() => {
    if (!user) {
      // Default sample records if not logged in
      setRecords([
        {
          id: 'demo-1',
          userId: 'demo',
          date: '2026-10-14',
          dataProcessedMb: 820,
          uptimeHours: 24,
          amountEarnedUsd: 0.52,
          isOptimized: true,
          notes: 'Full 24h session with Booster WakeLock active',
          createdAt: new Date().toISOString()
        },
        {
          id: 'demo-2',
          userId: 'demo',
          date: '2026-10-13',
          dataProcessedMb: 310,
          uptimeHours: 8,
          amountEarnedUsd: 0.18,
          isOptimized: false,
          notes: 'Unoptimized Android node (slept after 8 hours)',
          createdAt: new Date().toISOString()
        }
      ]);
      return;
    }

    setLoading(true);
    const colRef = collection(db, 'users', user.uid, 'earningRecords');
    const q = query(colRef, orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: EarningRecord[] = [];
        snapshot.forEach((d) => {
          items.push(d.data() as EarningRecord);
        });
        setRecords(items);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}/earningRecords`);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Add new earning record to Firestore
  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please sign in with Google in the top bar to save session history to your cloud database.');
      return;
    }

    const recordId = `rec_${Date.now()}`;
    const newRecord: EarningRecord = {
      id: recordId,
      userId: user.uid,
      date: formDate,
      dataProcessedMb: parseFloat(formDataProcessed) || 0,
      uptimeHours: parseFloat(formUptimeHours) || 0,
      amountEarnedUsd: parseFloat(formEarnedUsd) || 0,
      isOptimized: formIsOptimized,
      notes: formNotes,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'users', user.uid, 'earningRecords', recordId), newRecord);
      setShowAddModal(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/earningRecords/${recordId}`);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'earningRecords', recordId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/earningRecords/${recordId}`);
    }
  };

  // Compare Optimized vs Unoptimized statistics
  const optimizedRecords = records.filter(r => r.isOptimized);
  const unoptimizedRecords = records.filter(r => !r.isOptimized);

  const avgOptimizedEarn = optimizedRecords.length > 0 
    ? (optimizedRecords.reduce((s, r) => s + r.amountEarnedUsd, 0) / optimizedRecords.length)
    : 0.48;

  const avgUnoptimizedEarn = unoptimizedRecords.length > 0
    ? (unoptimizedRecords.reduce((s, r) => s + r.amountEarnedUsd, 0) / unoptimizedRecords.length)
    : 0.19;

  const boostMultiplier = avgUnoptimizedEarn > 0 ? (avgOptimizedEarn / avgUnoptimizedEarn).toFixed(1) : '2.5';

  // Calculator projection
  const estimatedDailyPerNode = (calcIsOptimized ? 0.45 : 0.18) * (calcUptimeHours / 24);
  const totalDailyDirect = estimatedDailyPerNode * calcNodes;
  const referralBonusDaily = (calcReferrals * 0.35 * 0.10); // 10% commission on average $0.35/day node
  const totalMonthlyProjected = (totalDailyDirect + referralBonusDaily) * 30;

  return (
    <div className="space-y-6">

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Bixberry Earnings Booster &amp; Comparator
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">
                +{boostMultiplier}x Measured Yield
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Track real data processed, measure the impact of device optimization, and estimate returns
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition shadow-lg shadow-amber-950/40"
        >
          <Plus className="w-4 h-4" />
          <span>Log Earning Session</span>
        </button>
      </div>

      {/* Before vs After Optimization Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Unoptimized Card */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Standard Unoptimized Node</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400">Baseline</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-300">
              ${avgUnoptimizedEarn.toFixed(2)}
            </span>
            <span className="text-xs text-slate-500">/ day average</span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
            <div className="flex items-center justify-between">
              <span>Avg Daily Uptime:</span>
              <span className="font-mono text-slate-300">6 - 9 hours (Killed by Android Doze)</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Data Processed:</span>
              <span className="font-mono text-slate-300">~200 - 350 MB / day</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Socket Drops:</span>
              <span className="text-rose-400">Frequent NAT timeouts</span>
            </div>
          </div>
        </div>

        {/* Booster-Optimized Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-900 border border-emerald-500/30 space-y-3 shadow-lg shadow-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Booster-Optimized Node
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
              +{boostMultiplier}x Higher Volume
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400">
              ${avgOptimizedEarn.toFixed(2)}
            </span>
            <span className="text-xs text-emerald-500/80">/ day average</span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-300 border-t border-emerald-500/20 pt-3">
            <div className="flex items-center justify-between">
              <span>Avg Daily Uptime:</span>
              <span className="font-mono text-emerald-300 font-bold">24 / 24 hours (Zero Sleep Drops)</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Data Processed:</span>
              <span className="font-mono text-emerald-300 font-bold">~700 - 1,500 MB / day</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Latency Priority:</span>
              <span className="text-cyan-300">Sub-60ms Preferred Routing</span>
            </div>
          </div>
        </div>

      </div>

      {/* Multi-Node & Referral Calculator */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Projected Earnings &amp; Multi-Node Calculator</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Residential ISP Rates ($0.15 - $0.35 / GB)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-semibold">
              Active Residential Nodes (Distinct IPs):
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="8"
                value={calcNodes}
                onChange={(e) => setCalcNodes(parseInt(e.target.value))}
                className="w-full accent-amber-500"
              />
              <span className="font-mono font-bold text-white text-base w-6">{calcNodes}</span>
            </div>
            <span className="text-[10px] text-slate-500">Max 1-2 devices per residential IP</span>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">
              Daily Node Uptime Hours:
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="4"
                max="24"
                step="2"
                value={calcUptimeHours}
                onChange={(e) => setCalcUptimeHours(parseInt(e.target.value))}
                className="w-full accent-amber-500"
              />
              <span className="font-mono font-bold text-white text-base w-8">{calcUptimeHours}h</span>
            </div>
            <span className="text-[10px] text-slate-500">24h requires booster wake lock</span>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">
              Referred Active Friends (10% Commission):
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="20"
                value={calcReferrals}
                onChange={(e) => setCalcReferrals(parseInt(e.target.value))}
                className="w-full accent-amber-500"
              />
              <span className="font-mono font-bold text-white text-base w-6">{calcReferrals}</span>
            </div>
            <span className="text-[10px] text-slate-500">Official Bixberry referral tier</span>
          </div>
        </div>

        {/* Projection Outputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div>
            <span className="text-xs text-slate-400">Estimated Daily Direct:</span>
            <div className="text-xl font-black text-white mt-0.5">
              ${totalDailyDirect.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-500">From your {calcNodes} active node(s)</span>
          </div>

          <div>
            <span className="text-xs text-slate-400">Referral Bonus (10%):</span>
            <div className="text-xl font-black text-emerald-400 mt-0.5">
              +${(referralBonusDaily * 30).toFixed(2)} <span className="text-xs font-normal text-slate-500">/ mo</span>
            </div>
            <span className="text-[10px] text-slate-500">From {calcReferrals} referred operators</span>
          </div>

          <div>
            <span className="text-xs text-slate-400">Total 30-Day Potential:</span>
            <div className="text-2xl font-black text-amber-400 mt-0.5">
              ${totalMonthlyProjected.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-500">Redeemable in gift cards or crypto</span>
          </div>
        </div>

        <p className="text-[10px] text-slate-500 italic">
          * Note: Earnings vary dynamically based on real AI company query demands in your geographic subnet. Bixberry strictly prohibits artificial traffic injection.
        </p>
      </div>

      {/* Historical Session Log Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Historical Processing Sessions</h3>
          </div>
          {!user && (
            <span className="text-xs text-amber-400">
              Demo preview. Sign in to save private records to your Firestore.
            </span>
          )}
        </div>

        {records.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No session logs recorded yet. Click &quot;Log Earning Session&quot; to begin tracking!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Data Processed</th>
                  <th className="py-2.5 px-3">Uptime</th>
                  <th className="py-2.5 px-3">USD Earned</th>
                  <th className="py-2.5 px-3">Mode</th>
                  <th className="py-2.5 px-3">Notes</th>
                  {user && <th className="py-2.5 px-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3 text-slate-300">{r.date}</td>
                    <td className="py-2.5 px-3 text-cyan-300">{r.dataProcessedMb} MB</td>
                    <td className="py-2.5 px-3 text-slate-300">{r.uptimeHours} hrs</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-400">${r.amountEarnedUsd.toFixed(2)}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.isOptimized 
                          ? 'bg-emerald-500/20 text-emerald-300' 
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {r.isOptimized ? 'Booster ON' : 'Standard'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-400 max-w-xs truncate">
                      {r.notes || '-'}
                    </td>
                    {user && (
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleDeleteRecord(r.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl text-slate-200">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" />
              Log Daily Bixberry Processing Session
            </h3>

            <form onSubmit={handleAddRecord} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Session Date:</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Data Processed (MB):</label>
                <input
                  type="number"
                  value={formDataProcessed}
                  onChange={(e) => setFormDataProcessed(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Node Online Uptime (Hours):</label>
                <input
                  type="number"
                  step="0.5"
                  max="24"
                  value={formUptimeHours}
                  onChange={(e) => setFormUptimeHours(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">USD Earnings Recorded:</label>
                <input
                  type="number"
                  step="0.01"
                  value={formEarnedUsd}
                  onChange={(e) => setFormEarnedUsd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="optCheck"
                  checked={formIsOptimized}
                  onChange={(e) => setFormIsOptimized(e.target.checked)}
                  className="rounded border-slate-700 accent-emerald-500"
                />
                <label htmlFor="optCheck" className="text-slate-300 font-semibold cursor-pointer">
                  Booster Optimization policies were active during this session
                </label>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Session Notes:</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Samsung Galaxy S22 plugged in on 5GHz Wi-Fi"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

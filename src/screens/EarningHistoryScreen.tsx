import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  Plus, 
  Download, 
  Trash2, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  Database,
  Filter
} from 'lucide-react';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import type { EarningRecord } from '../types';

interface Props {
  user: { uid: string } | null;
}

export const EarningHistoryScreen: React.FC<Props> = ({ user }) => {
  const [records, setRecords] = useState<EarningRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'optimized' | 'standard'>('all');

  // Form states
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formDataProcessed, setFormDataProcessed] = useState('850');
  const [formUptimeHours, setFormUptimeHours] = useState('24');
  const [formEarnedUsd, setFormEarnedUsd] = useState('0.54');
  const [formIsOptimized, setFormIsOptimized] = useState(true);
  const [formNotes, setFormNotes] = useState('Booster 24/7 WakeLock + Doze exempt');

  useEffect(() => {
    if (!user) {
      setRecords([
        {
          id: 'sample-1',
          userId: 'demo',
          date: '2026-10-15',
          dataProcessedMb: 920,
          uptimeHours: 24,
          amountEarnedUsd: 0.58,
          status: 'confirmed',
          transactionId: 'TXN_20261015_01',
          isOptimized: true,
          notes: 'Full 24h session, latency 42ms, Android Doze exempt',
          createdAt: new Date().toISOString()
        },
        {
          id: 'sample-2',
          userId: 'demo',
          date: '2026-10-14',
          dataProcessedMb: 820,
          uptimeHours: 24,
          amountEarnedUsd: 0.52,
          status: 'confirmed',
          transactionId: 'TXN_20261014_01',
          isOptimized: true,
          notes: 'Booster WakeLock enabled, zero packet loss',
          createdAt: new Date().toISOString()
        },
        {
          id: 'sample-3',
          userId: 'demo',
          date: '2026-10-13',
          dataProcessedMb: 320,
          uptimeHours: 8,
          amountEarnedUsd: 0.19,
          status: 'confirmed',
          transactionId: 'TXN_20261013_01',
          isOptimized: false,
          notes: 'Standard node before booster (OS put socket to sleep)',
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

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Sign in with Google in the top bar to save session history to your cloud database.');
      return;
    }

    const recordId = `rec_${Date.now()}`;
    const transactionId = `TXN_${formDate.replace(/-/g, '')}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newRecord: EarningRecord = {
      id: recordId,
      userId: user.uid,
      date: formDate,
      dataProcessedMb: parseFloat(formDataProcessed) || 0,
      uptimeHours: parseFloat(formUptimeHours) || 0,
      amountEarnedUsd: parseFloat(formEarnedUsd) || 0,
      status: 'confirmed',
      transactionId,
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

  const handleDeleteRecord = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'earningRecords', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/earningRecords/${id}`);
    }
  };

  // Export records to CSV
  const handleExportCSV = () => {
    if (records.length === 0) return;
    const headers = ['Date', 'TransactionId', 'DataProcessedMB', 'UptimeHours', 'AmountEarnedUSD', 'Status', 'IsOptimized', 'Notes'];
    const rows = records.map(r => [
      r.date,
      r.transactionId || r.id,
      r.dataProcessedMb,
      r.uptimeHours,
      r.amountEarnedUsd,
      r.status || 'confirmed',
      r.isOptimized ? 'YES' : 'NO',
      `"${(r.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bixberry_earnings_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRecords = records.filter(r => {
    if (filterMode === 'optimized') return r.isOptimized;
    if (filterMode === 'standard') return !r.isOptimized;
    return true;
  });

  const optimizedCount = records.filter(r => r.isOptimized).length;
  const standardCount = records.filter(r => !r.isOptimized).length;

  return (
    <div className="space-y-6">

      {/* Screen Header */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Earning History &amp; Transaction Ledger
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold font-mono">
                Screen 4
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Transaction records, duplicate prevention, and before vs after performance tracking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition"
            title="Export CSV audit file"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition shadow-lg shadow-amber-950/40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Session</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg transition font-semibold ${filterMode === 'all' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
          >
            All Sessions ({records.length})
          </button>
          <button
            onClick={() => setFilterMode('optimized')}
            className={`px-3 py-1.5 rounded-lg transition font-semibold flex items-center gap-1 ${filterMode === 'optimized' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Optimized ({optimizedCount})</span>
          </button>
          <button
            onClick={() => setFilterMode('standard')}
            className={`px-3 py-1.5 rounded-lg transition font-semibold ${filterMode === 'standard' ? 'bg-slate-700 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
          >
            Standard ({standardCount})
          </button>
        </div>
        <span className="text-[11px] font-mono text-slate-500">
          Firestore: users/{user?.uid || 'guest'}/earningRecords
        </span>
      </div>

      {/* Ledger Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No earning records match the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left font-mono">
              <thead className="text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Transaction ID</th>
                  <th className="py-2.5 px-3">Data Processed</th>
                  <th className="py-2.5 px-3">Uptime</th>
                  <th className="py-2.5 px-3">USD Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Optimization</th>
                  <th className="py-2.5 px-3 font-sans">Notes</th>
                  {user && <th className="py-2.5 px-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 text-slate-300 font-bold">{r.date}</td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px]">{r.transactionId || r.id}</td>
                    <td className="py-2.5 px-3 text-cyan-300 font-bold">{r.dataProcessedMb} MB</td>
                    <td className="py-2.5 px-3 text-slate-300">{r.uptimeHours} hrs</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-400">${r.amountEarnedUsd.toFixed(2)}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold">
                        {r.status || 'confirmed'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.isOptimized 
                          ? 'bg-emerald-500/20 text-emerald-300' 
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {r.isOptimized ? 'Booster ON' : 'Standard'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-400 max-w-xs truncate text-[11px]">
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

      {/* Modal: Log Session */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl text-slate-200">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" />
              Log Verified Earning Session
            </h3>

            <form onSubmit={handleAddRecord} className="space-y-3 text-xs">
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
                <label className="block text-slate-400 mb-1">Online Uptime (Hours):</label>
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
                <label className="block text-slate-400 mb-1">USD Amount Earned:</label>
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
                  id="modalOptCheck"
                  checked={formIsOptimized}
                  onChange={(e) => setFormIsOptimized(e.target.checked)}
                  className="rounded border-slate-700 accent-emerald-500"
                />
                <label htmlFor="modalOptCheck" className="text-slate-300 font-semibold cursor-pointer">
                  Booster Optimization policies were active during session
                </label>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Session Notes:</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. 5GHz Wi-Fi, Samsung Galaxy plugged in, Doze exempt"
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

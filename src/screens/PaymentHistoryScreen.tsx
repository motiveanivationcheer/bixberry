import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Download, 
  Receipt, 
  ExternalLink, 
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import type { SubscriptionRecord } from '../types';

interface Props {
  user: { uid: string; email: string | null } | null;
}

export const PaymentHistoryScreen: React.FC<Props> = ({ user }) => {
  const [payments, setPayments] = useState<SubscriptionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<SubscriptionRecord | null>(null);

  useEffect(() => {
    if (!user) {
      setPayments([
        {
          id: 'demo-sub-1',
          userId: 'demo',
          planId: 'monthly_pro',
          planName: 'Monthly Pro Plan ($100/mo)',
          amount: 100,
          currency: 'USD',
          status: 'active',
          paymentReference: 'BXB_1729080000_TEST99',
          paymentProvider: 'flutterwave_sandbox',
          startDate: '2026-10-15T10:00:00Z',
          expiresAt: '2026-11-15T10:00:00Z',
          autoRenew: true,
          createdAt: '2026-10-15T10:00:00Z'
        }
      ]);
      return;
    }

    setLoading(true);
    const colRef = collection(db, 'users', user.uid, 'subscriptions');
    const q = query(colRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: SubscriptionRecord[] = [];
        snapshot.forEach((d) => {
          items.push(d.data() as SubscriptionRecord);
        });
        setPayments(items);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}/subscriptions`);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="space-y-6">

      {/* Screen Header */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Payment &amp; Subscription Invoices
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold font-mono">
                Screen 7
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Verified payment receipts, transaction references, renewal dates, and refund status
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          Firebase: users/{user?.uid || 'guest'}/subscriptions
        </span>
      </div>

      {/* Payment History Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        {payments.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <Receipt className="w-8 h-8 text-slate-600 mx-auto" />
            <p>No billing transactions found for this account.</p>
            <p className="text-[11px] text-slate-600">Subscriptions initiated on Screen 6 will appear here upon server verification.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left font-mono">
              <thead className="text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Plan Description</th>
                  <th className="py-2.5 px-3">Reference</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Processor</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Expiration</th>
                  <th className="py-2.5 px-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 text-slate-300">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 text-white font-sans font-semibold">
                      {p.planName}
                    </td>
                    <td className="py-2.5 px-3 text-cyan-300 text-[11px]">
                      {p.paymentReference}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-emerald-400">
                      ${p.amount}.00 {p.currency}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 uppercase text-[10px]">
                      {p.paymentProvider || 'flutterwave'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.status === 'active' || p.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                          : p.status === 'refunded'
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                      }`}>
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {new Date(p.expiresAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => setSelectedReceipt(p)}
                        className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition font-sans"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl text-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Payment Receipt</h3>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Close
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Transaction ID:</span>
                <span className="text-white">{selectedReceipt.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Payment Reference:</span>
                <span className="text-cyan-300">{selectedReceipt.paymentReference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Product / Plan:</span>
                <span className="text-white font-sans font-semibold">{selectedReceipt.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Amount Charged:</span>
                <span className="text-emerald-400 font-bold">${selectedReceipt.amount}.00 {selectedReceipt.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Transaction Date:</span>
                <span className="text-slate-300">{new Date(selectedReceipt.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Valid Until:</span>
                <span className="text-slate-300">{new Date(selectedReceipt.expiresAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Status:</span>
                <span className="text-emerald-400 font-bold">{selectedReceipt.status.toUpperCase()}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              Verified through Flutterwave sandbox/merchant gateway. Saved to your Google Cloud Firestore project encoded-meridian-m53bd.
            </p>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

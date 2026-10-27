import React, { useState } from 'react';
import { 
  Crown, 
  Check, 
  Zap, 
  ShieldCheck, 
  CreditCard, 
  RefreshCw, 
  AlertCircle, 
  Clock, 
  XCircle, 
  CheckCircle2, 
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import type { UserProfile, SubscriptionRecord } from '../types';

interface Props {
  user: { uid: string; email: string | null } | null;
  userProfile: UserProfile | null;
  onSubscriptionUpdated: () => void;
}

export const PremiumSubscriptionsScreen: React.FC<Props> = ({
  user,
  userProfile,
  onSubscriptionUpdated
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly_pro' | 'yearly_pro'>('monthly_pro');
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Cancellation state
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);

  const isCurrentPlanActive = userProfile?.subscriptionTier && userProfile.subscriptionTier !== 'free' && userProfile.subscriptionStatus === 'active';

  // Verify Payment on Server
  const verifyPaymentOnServer = async (ref: string, planId: string, txId?: string) => {
    if (!user) return;
    setIsProcessing(true);
    setPaymentError(null);

    try {
      const verifyRes = await fetch('/api/subscription/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentReference: ref,
          transactionId: txId,
          planId,
          userId: user.uid
        })
      });

      const verifyData = await verifyRes.json();
      if (!verifyData.success || !verifyData.verified) {
        throw new Error(verifyData.error || 'Server payment verification failed.');
      }

      const subRecord: SubscriptionRecord = verifyData.subscription;

      // Save subscription record to Firestore under users/{userId}/subscriptions/{subId}
      await setDoc(doc(db, 'users', user.uid, 'subscriptions', subRecord.id), subRecord);

      // Update user profile tier and expiration in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        subscriptionTier: subRecord.planId,
        subscriptionStatus: 'active',
        subscriptionExpiresAt: subRecord.expiresAt,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setPaymentSuccess(`✓ Payment confirmed! ${subRecord.planName} is active until ${new Date(subRecord.expiresAt).toLocaleDateString()}.`);
      setCheckoutModalOpen(false);
      onSubscriptionUpdated();
    } catch (err: any) {
      setPaymentError(err.message || 'Payment verification failed.');
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/subscriptions`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Initiate Server Checkout
  const handleStartCheckout = async (planId: 'monthly_pro' | 'yearly_pro') => {
    if (!user) {
      alert('Please sign in with Google in the top bar before subscribing.');
      return;
    }

    setSelectedPlan(planId);
    setIsProcessing(true);
    setPaymentError(null);
    setPaymentSuccess(null);

    try {
      const res = await fetch('/api/subscription/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          userId: user.uid,
          userEmail: user.email || 'bunnynurse53@gmail.com'
        })
      });

      const data = await res.json();
      if (data.success && data.paymentDetails) {
        setCheckoutData(data.paymentDetails);

        // If Flutterwave v3 SDK is loaded in window, launch native popup
        if (typeof (window as any).FlutterwaveCheckout === 'function') {
          (window as any).FlutterwaveCheckout({
            public_key: data.paymentDetails.public_key,
            tx_ref: data.paymentDetails.tx_ref,
            amount: data.paymentDetails.amount,
            currency: data.paymentDetails.currency,
            payment_options: data.paymentDetails.payment_options,
            customer: {
              email: user.email || 'bunnynurse53@gmail.com',
              name: userProfile?.displayName || 'Bixberry Node Operator'
            },
            customizations: data.paymentDetails.customizations,
            callback: async function (response: any) {
              await verifyPaymentOnServer(
                response.tx_ref || data.paymentDetails.tx_ref,
                planId,
                response.transaction_id ? String(response.transaction_id) : undefined
              );
            },
            onclose: function () {
              setIsProcessing(false);
            }
          });
        } else {
          // Open interactive verification modal fallback
          setCheckoutModalOpen(true);
        }
      } else {
        setPaymentError(data.error || 'Could not initiate checkout session.');
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Network error initiating payment.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Complete & Verify Server Payment via Modal Fallback
  const handleConfirmPayment = async () => {
    if (!checkoutData || !user) return;
    await verifyPaymentOnServer(checkoutData.tx_ref || checkoutData.reference, checkoutData.planId);
  };

  // Cancel Subscription
  const handleCancelSubscription = async () => {
    if (!user) return;
    if (!confirm('Are you sure you want to cancel your Pro subscription renewal? Your access will remain active until the end of your current term.')) {
      return;
    }

    setIsCancelling(true);
    try {
      const res = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: user.uid })
      });
      const data = await res.json();
      if (data.success) {
        await setDoc(doc(db, 'users', user.uid), {
          subscriptionStatus: 'cancelled',
          updatedAt: new Date().toISOString()
        }, { merge: true });
        setCancelMessage('Auto-renewal cancelled. You retain Pro features until your current expiration date.');
        onSubscriptionUpdated();
      }
    } catch {
      alert('Cancellation request could not be processed.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Screen Header */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Bixberry Booster Pro Subscriptions
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold font-mono">
                Screen 6
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              High-throughput keep-alive engine, priority AI dispatch, and enterprise multi-node monitoring
            </p>
          </div>
        </div>

        {isCurrentPlanActive && (
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>ACTIVE {userProfile?.subscriptionTier?.toUpperCase()}</span>
          </span>
        )}
      </div>

      {paymentSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-semibold">{paymentSuccess}</span>
        </div>
      )}

      {paymentError && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{paymentError}</span>
        </div>
      )}

      {/* Active Subscription Status Banner if subscribed */}
      {isCurrentPlanActive && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Crown className="w-4 h-4" />
              Active Pro Membership
            </span>
            <span className="text-xs font-mono text-slate-400">
              Renews / Expires: {userProfile?.subscriptionExpiresAt ? new Date(userProfile.subscriptionExpiresAt).toLocaleDateString() : 'Active'}
            </span>
          </div>

          <p className="text-xs text-slate-300">
            Your Pro benefits are enabled: 1-second ultra-low latency keep-alive socket, automated CSV transaction exports, and multi-node subnet telemetry.
          </p>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Payment Provider: Flutterwave Sandbox &bull; Status: Verified
            </span>
            <button
              onClick={handleCancelSubscription}
              disabled={isCancelling}
              className="text-xs text-rose-400 hover:text-rose-300 underline font-semibold transition"
            >
              {isCancelling ? 'Processing...' : 'Cancel Auto-Renewal'}
            </button>
          </div>
          {cancelMessage && (
            <p className="text-[11px] text-amber-300 font-semibold">{cancelMessage}</p>
          )}
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        
        {/* Monthly Plan ($100 USD) */}
        <div className={`p-6 rounded-2xl bg-slate-900 border transition flex flex-col justify-between space-y-6 ${
          userProfile?.subscriptionTier === 'monthly_pro' && isCurrentPlanActive
            ? 'border-emerald-500 ring-2 ring-emerald-500/30'
            : 'border-slate-800 hover:border-slate-700'
        }`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pro Plan</span>
                <h3 className="text-xl font-black text-white mt-0.5">Monthly Booster Pro</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 font-mono">
                Flexible
              </span>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-white font-mono">$100</span>
              <span className="text-sm font-semibold text-slate-400">USD / month</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Full optimization engine with high-frequency keep-alive heartbeat and verified transaction logging.
            </p>

            <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>1-Second Continuous Keep-Alive Heartbeat</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Automated Android Doze &amp; RAM Lock Watchdog</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Verified Balance Snapshots &amp; Firestore Sync</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Complete CSV Transaction Ledger Exports</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Server-Verified Transaction Protection</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleStartCheckout('monthly_pro')}
            disabled={isProcessing || (userProfile?.subscriptionTier === 'monthly_pro' && isCurrentPlanActive)}
            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold text-xs border border-slate-700 transition"
          >
            {userProfile?.subscriptionTier === 'monthly_pro' && isCurrentPlanActive ? 'Current Active Plan' : 'Subscribe Monthly ($100/mo)'}
          </button>
        </div>

        {/* Yearly Plan ($1,000 USD - $200 Discount) */}
        <div className={`p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-amber-950/20 border transition flex flex-col justify-between space-y-6 relative overflow-hidden shadow-2xl ${
          userProfile?.subscriptionTier === 'yearly_pro' && isCurrentPlanActive
            ? 'border-amber-500 ring-2 ring-amber-500/30'
            : 'border-amber-500/40 hover:border-amber-400'
        }`}>
          {/* Discount Ribbon */}
          <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-gradient-to-r from-amber-500 to-emerald-400 text-slate-950 shadow-md">
            Save $200 / Year
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Best Value</span>
                <h3 className="text-xl font-black text-white mt-0.5">Yearly Enterprise Pro</h3>
              </div>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-amber-400 font-mono">$1,000</span>
              <span className="text-sm font-semibold text-slate-400">USD / year</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Maximum throughput for serious residential node fleets with unlimited audit persistence.
            </p>

            <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-bold text-white">Everything in Monthly Pro</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Multi-Device Subnet Priority Routing Analysis</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Unlimited Historical Balance &amp; Network Audits</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Formal Cloudsquad Enterprise API Template Guidance</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Priority Developer Email Support</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleStartCheckout('yearly_pro')}
            disabled={isProcessing || (userProfile?.subscriptionTier === 'yearly_pro' && isCurrentPlanActive)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-400 hover:from-amber-400 hover:to-emerald-300 disabled:opacity-50 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-950/40"
          >
            {userProfile?.subscriptionTier === 'yearly_pro' && isCurrentPlanActive ? 'Current Active Plan' : 'Subscribe Yearly ($1,000/yr)'}
          </button>
        </div>

      </div>

      {/* Refund Policy & Security Box */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs text-slate-400">
        <h4 className="font-bold text-white flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Subscription Terms, Security &amp; Refund Policy
        </h4>
        <p className="leading-relaxed">
          <strong>Security Guarantee:</strong> We never collect or store card security codes (CVV) on client devices. Transactions are verified directly on the backend via Flutterwave sandbox / merchant integration.
        </p>
        <p className="leading-relaxed">
          <strong>Cancellation &amp; Refund:</strong> Subscriptions can be cancelled at any time before renewal. If a technical defect prevents node optimization, refund requests submitted within 7 days of payment are honored in full.
        </p>
        <p className="text-[11px] text-slate-500 italic">
          Disclaimer: Bixberry Booster Pro provides performance and connectivity optimization for legitimate residential nodes. We do not guarantee specific monetary earnings as payout volume is governed by Bixberry&apos;s decentralized AI demand.
        </p>
      </div>

      {/* Checkout Modal (Flutterwave / Sandbox Gateway) */}
      {checkoutModalOpen && checkoutData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl text-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Secure Checkout</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-indigo-500/20 text-indigo-300 font-bold">
                {checkoutData.isSandbox ? 'SANDBOX TEST MODE' : 'LIVE MERCHANT'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Plan:</span>
                <span className="font-bold text-white">{checkoutData.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Due:</span>
                <span className="font-mono text-emerald-400 font-extrabold text-base">
                  ${checkoutData.amount}.00 {checkoutData.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Reference:</span>
                <span className="font-mono text-slate-300 text-[11px]">{checkoutData.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Processor:</span>
                <span className="text-indigo-300 font-semibold uppercase">{checkoutData.provider}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Clicking &quot;Authorize &amp; Complete Payment&quot; triggers server-side transaction verification. Your subscription is activated in your Firebase database project <code className="text-emerald-400">encoded-meridian-m53bd</code> upon verification.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCheckoutModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold bg-slate-800 text-slate-300 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isProcessing}
                className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl transition shadow-lg shadow-emerald-950/40 flex items-center gap-1.5"
              >
                {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                <span>{isProcessing ? 'Verifying on Server...' : 'Authorize & Complete Payment'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

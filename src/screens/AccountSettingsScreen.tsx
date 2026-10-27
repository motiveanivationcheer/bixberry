import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  User, 
  Save, 
  CheckCircle2, 
  Sliders, 
  Bell, 
  Flame, 
  Database, 
  LogOut, 
  LogIn,
  Key,
  ShieldCheck
} from 'lucide-react';
import { db, OperationType, handleFirestoreError, signInWithGoogle, logOut } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { OptimizationEngine } from '../services/optimizationEngine';
import type { UserProfile, BoosterSetting } from '../types';

interface Props {
  user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null } | null;
  userProfile: UserProfile | null;
  onProfileUpdated: () => void;
}

export const AccountSettingsScreen: React.FC<Props> = ({
  user,
  userProfile,
  onProfileUpdated
}) => {
  const [displayName, setDisplayName] = useState(userProfile?.displayName || user?.displayName || '');
  const [bixberryEmail, setBixberryEmail] = useState(userProfile?.bixberryEmail || 'bunnynurse53@gmail.com');
  const [pingInterval, setPingInterval] = useState(5);
  const [alertHighLatency, setAlertHighLatency] = useState(true);
  const [alertDisconnection, setAlertDisconnection] = useState(true);
  const [thermalWatchdog, setThermalWatchdog] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load current settings from Firestore
  useEffect(() => {
    if (!user) return;
    const loadSettings = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid, 'settings', 'current'));
        if (snap.exists()) {
          const s = snap.data() as BoosterSetting;
          setPingInterval(s.autoPingIntervalSec || 5);
          setAlertHighLatency(s.alertOnHighLatency);
          setAlertDisconnection(s.alertOnDisconnection);
          setThermalWatchdog(s.thermalWatchdogEnabled ?? true);
        }
      } catch {
        // ignore
      }
    };
    loadSettings();
  }, [user]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Sign in with Google in the top bar before updating cloud preferences.');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(null);

    try {
      // Update BoosterSetting in Firestore
      const settingsData: BoosterSetting = {
        userId: user.uid,
        keepAwakeEnabled: true,
        autoPingIntervalSec: pingInterval,
        alertOnHighLatency: alertHighLatency,
        alertOnDisconnection: alertDisconnection,
        thermalWatchdogEnabled: thermalWatchdog,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid, 'settings', 'current'), settingsData);

      // Update UserProfile
      await setDoc(doc(db, 'users', user.uid), {
        displayName,
        bixberryEmail,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Apply ping interval to OptimizationEngine
      OptimizationEngine.setIntervalMs(pingInterval * 1000);

      setSaveSuccess('Configuration and preferences saved to Firebase project encoded-meridian-m53bd!');
      onProfileUpdated();
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/settings/current`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Screen Header */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Account &amp; System Configuration
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold font-mono">
                Screen 8
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Customize keep-alive polling frequency, latency alerts, and Firebase cloud persistence
            </p>
          </div>
        </div>

        {user ? (
          <button
            onClick={() => logOut()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-xs font-semibold transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        ) : (
          <button
            onClick={() => signInWithGoogle()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition shadow-lg shadow-emerald-950/40"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In with Google</span>
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-semibold">{saveSuccess}</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* User Identity Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-400" />
            Operator Identity &amp; Profile
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Display / Node Name:</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Primary Residential Node"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Bixberry Portal Email:</label>
              <input
                type="email"
                value={bixberryEmail}
                onChange={(e) => setBixberryEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                required
              />
            </div>
          </div>
        </div>

        {/* Polling & Engine Engine Tuning */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Booster Engine Polling Frequency
          </h3>

          <div className="space-y-2 text-xs">
            <label className="block text-slate-300 font-semibold">
              Keep-Alive Heartbeat Interval: <span className="font-mono text-cyan-300 font-bold">{pingInterval} seconds</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="15"
                step="1"
                value={pingInterval}
                onChange={(e) => setPingInterval(parseInt(e.target.value))}
                className="w-full accent-cyan-400"
              />
              <span className="font-mono text-white text-base w-8">{pingInterval}s</span>
            </div>
            <p className="text-[11px] text-slate-500">
              5 seconds is optimal for consumer Wi-Fi NAT routers. 1-2s available for Pro tier.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={alertHighLatency}
                onChange={(e) => setAlertHighLatency(e.target.checked)}
                className="rounded border-slate-700 accent-emerald-500"
              />
              <span className="text-slate-300 font-semibold">Alert on Latency &gt; 150ms</span>
            </label>

            <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={alertDisconnection}
                onChange={(e) => setAlertDisconnection(e.target.checked)}
                className="rounded border-slate-700 accent-emerald-500"
              />
              <span className="text-slate-300 font-semibold">Alert on Socket Drop</span>
            </label>

            <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={thermalWatchdog}
                onChange={(e) => setThermalWatchdog(e.target.checked)}
                className="rounded border-slate-700 accent-emerald-500"
              />
              <span className="text-slate-300 font-semibold">Thermal Load Watchdog</span>
            </label>
          </div>
        </div>

        {/* Firebase Project Binding Details */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-indigo-400" />
            Verified Cloud Firestore Project Environment
          </h3>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Firebase Project ID:</span>
              <span className="text-emerald-400 font-bold">encoded-meridian-m53bd</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Firestore Database ID:</span>
              <span className="text-cyan-300 font-bold">ai-studio-bixberryearningo-3a42a5fb-8223-4888-aade-089cc29eeec9</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Auth State:</span>
              <span className="text-white">{user ? `Authenticated (${user.email})` : 'Unauthenticated (Sign-in required for persistence)'}</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-950/40 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving to Firebase...' : 'Save All Preferences'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};

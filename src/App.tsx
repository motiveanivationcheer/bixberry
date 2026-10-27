/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
  Link2, 
  DollarSign, 
  TrendingUp, 
  Wifi, 
  Crown, 
  CreditCard, 
  Settings, 
  HelpCircle,
  Activity,
  ShieldCheck,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { InvestigationModal } from './components/InvestigationModal';

// 9 Screens
import { DashboardScreen } from './screens/DashboardScreen';
import { AccountConnectionScreen } from './screens/AccountConnectionScreen';
import { VerifiedBalanceScreen } from './screens/VerifiedBalanceScreen';
import { EarningHistoryScreen } from './screens/EarningHistoryScreen';
import { ConnectionOptimizationScreen } from './screens/ConnectionOptimizationScreen';
import { PremiumSubscriptionsScreen } from './screens/PremiumSubscriptionsScreen';
import { PaymentHistoryScreen } from './screens/PaymentHistoryScreen';
import { AccountSettingsScreen } from './screens/AccountSettingsScreen';
import { HelpSupportScreen } from './screens/HelpSupportScreen';

// Services & Firebase
import { OptimizationEngine } from './services/optimizationEngine';
import { BixberryService } from './services/bixberryService';
import { auth, db, validateFirestoreConnection } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import type { ScreenId, NetworkMetrics, DeviceHealth, UserProfile, BalanceSnapshot, BixberryConnectionStatus } from './types';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [balanceSnapshot, setBalanceSnapshot] = useState<BalanceSnapshot | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  const [investigationOpen, setInvestigationOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bixberryStatus, setBixberryStatus] = useState<BixberryConnectionStatus>(() => BixberryService.getConnectionStatus());
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string | null>(() => BixberryService.getLastSyncTimestamp());
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Listen to BixberryService status changes
  useEffect(() => {
    const unsub = BixberryService.subscribeConnection((status, syncTime) => {
      setBixberryStatus(status);
      setLastSyncTimestamp(syncTime);
    });
    return unsub;
  }, []);

  // Real engine metrics
  const [metrics, setMetrics] = useState<NetworkMetrics>(() => OptimizationEngine.getMetrics());
  const [deviceHealth, setDeviceHealth] = useState<DeviceHealth>(() => OptimizationEngine.getDeviceHealth());

  // Listen to OptimizationEngine subscriptions
  useEffect(() => {
    const unsubMetrics = OptimizationEngine.subscribeMetrics((newM) => setMetrics(newM));
    const unsubHealth = OptimizationEngine.subscribeDeviceHealth((newH) => setDeviceHealth(newH));
    setIsMonitoring(OptimizationEngine.getStatus());

    return () => {
      unsubMetrics();
      unsubHealth();
    };
  }, []);

  // Firebase Auth & Initial Boot
  useEffect(() => {
    validateFirestoreConnection();
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setCurrentUser(u);
      if (u) {
        // Listen to user profile
        const userDocRef = doc(db, 'users', u.uid);
        const unsubProfile = onSnapshot(userDocRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            setUserProfile(data);
            if (data.bixberryStatus === 'Connected' || data.bixberryStatus === 'Disconnected' || data.bixberryStatus === 'Session Expired') {
              setBixberryStatus(data.bixberryStatus);
            }
          }
        });

        // Load initial balance
        refreshBalance(u.uid);

        return () => unsubProfile();
      } else {
        setUserProfile(null);
        setBalanceSnapshot(null);
      }
    });

    return () => unsubAuth();
  }, []);

  const refreshBalance = useCallback(async (uid?: string) => {
    const targetUid = uid || currentUser?.uid;
    setIsRefreshingBalance(true);
    setConnectionError(null);
    try {
      const data = await BixberryService.syncBalance(targetUid);
      setLastSyncTimestamp(BixberryService.getLastSyncTimestamp());
      if (data) {
        setBalanceSnapshot({
          id: `snap_${Date.now()}`,
          userId: targetUid || 'guest',
          confirmedBalance: data.confirmedBalance ?? 0,
          pendingBalance: data.pendingBalance ?? 0,
          currency: data.currency || 'USD',
          source: data.source || 'bixberry_session_adapter',
          syncStatus: data.syncStatus || 'verified',
          syncTimestamp: data.syncTimestamp || new Date().toISOString()
        });
      }
    } catch (err: any) {
      setConnectionError(err.message || 'Balance synchronization failed');
    } finally {
      setIsRefreshingBalance(false);
    }
  }, [currentUser]);

  const handleReconnect = async () => {
    setIsReconnecting(true);
    setConnectionError(null);
    try {
      const email = userProfile?.bixberryEmail || 'bunnysusanfabio@gmail.com';
      const res = await BixberryService.attemptReconnection(email);
      setBixberryStatus(res.status);
      setLastSyncTimestamp(BixberryService.getLastSyncTimestamp());
      if (!res.success) {
        setConnectionError(res.error || 'Reconnection attempt failed');
      } else {
        await refreshBalance();
      }
    } catch (err: any) {
      setConnectionError(err.message || 'Reconnection error');
    } finally {
      setIsReconnecting(false);
    }
  };

  const handleToggleMonitoring = () => {
    if (isMonitoring) {
      OptimizationEngine.stopMonitoring();
      setIsMonitoring(false);
    } else {
      OptimizationEngine.startMonitoring();
      setIsMonitoring(true);
    }
  };

  const screens = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'connector' as const, label: 'Gateway Auth', icon: Link2 },
    { id: 'balance' as const, label: 'Verified Balance', icon: DollarSign },
    { id: 'earnings' as const, label: 'Earning History', icon: TrendingUp },
    { id: 'optimization' as const, label: 'Engine Optimization', icon: Wifi },
    { id: 'subscriptions' as const, label: 'Premium Plans', icon: Crown },
    { id: 'payments' as const, label: 'Invoices', icon: CreditCard },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
    { id: 'support' as const, label: 'Help & Docs', icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-24 sm:pb-8 selection:bg-emerald-500 selection:text-slate-950 font-sans">
      
      {/* Top Navbar */}
      <Navbar 
        user={currentUser}
        currentPing={metrics.currentLatency}
        overallScore={metrics.stabilityScore}
        bixberryStatus={bixberryStatus}
        onOpenInvestigation={() => setInvestigationOpen(true)}
        onOpenDashboard={() => BixberryService.openOfficialDashboard()}
        onConnectAccount={() => setCurrentScreen('connector')}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 flex-1 w-full space-y-5">
        
        {/* Navigation Bar / Screen Switcher (Desktop Full Bar) */}
        <div className="hidden lg:flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs overflow-x-auto">
          {screens.map((s) => {
            const Icon = s.icon;
            const isActive = currentScreen === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setCurrentScreen(s.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-600 text-slate-950 shadow-md shadow-emerald-950/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile Navigation Dropdown Button */}
        <div className="lg:hidden flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Screen:</span>
            <span className="text-xs font-bold text-white capitalize">
              {screens.find(s => s.id === currentScreen)?.label}
            </span>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            <span>All 9 Screens</span>
          </button>
        </div>

        {/* Mobile Expanded Screen Matrix Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden p-4 rounded-2xl bg-slate-900 border border-slate-800 grid grid-cols-2 gap-2 text-xs">
            {screens.map((s) => {
              const Icon = s.icon;
              const isActive = currentScreen === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setCurrentScreen(s.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 transition text-left font-bold ${
                    isActive
                      ? 'bg-emerald-600 text-slate-950 border-emerald-500'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{s.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Render Selected Screen */}
        {currentScreen === 'dashboard' && (
          <DashboardScreen
            metrics={metrics}
            deviceHealth={deviceHealth}
            userProfile={userProfile}
            balanceSnapshot={balanceSnapshot}
            isMonitoring={isMonitoring}
            onToggleMonitoring={handleToggleMonitoring}
            onNavigate={(screen) => setCurrentScreen(screen)}
            onRefreshBalance={() => refreshBalance()}
            isRefreshingBalance={isRefreshingBalance}
            bixberryStatus={bixberryStatus}
            lastSyncTimestamp={lastSyncTimestamp}
            onOpenDashboard={() => BixberryService.openOfficialDashboard()}
            onReconnect={handleReconnect}
            isReconnecting={isReconnecting}
            connectionError={connectionError}
          />
        )}

        {currentScreen === 'connector' && (
          <AccountConnectionScreen
            user={currentUser}
            userProfile={userProfile}
            onProfileUpdated={() => refreshBalance()}
            onOpenInvestigation={() => setInvestigationOpen(true)}
          />
        )}

        {currentScreen === 'balance' && (
          <VerifiedBalanceScreen
            user={currentUser}
            currentSnapshot={balanceSnapshot}
            onBalanceUpdated={() => refreshBalance()}
          />
        )}

        {currentScreen === 'earnings' && (
          <EarningHistoryScreen
            user={currentUser}
          />
        )}

        {currentScreen === 'optimization' && (
          <ConnectionOptimizationScreen
            user={currentUser}
            metrics={metrics}
            deviceHealth={deviceHealth}
            isMonitoring={isMonitoring}
            onToggleMonitoring={handleToggleMonitoring}
            onUpdateMetrics={(m) => setMetrics(prev => ({ ...prev, ...m }))}
            onUpdateDeviceHealth={(h) => setDeviceHealth(prev => ({ ...prev, ...h }))}
          />
        )}

        {currentScreen === 'subscriptions' && (
          <PremiumSubscriptionsScreen
            user={currentUser}
            userProfile={userProfile}
            onSubscriptionUpdated={() => refreshBalance()}
          />
        )}

        {currentScreen === 'payments' && (
          <PaymentHistoryScreen
            user={currentUser}
          />
        )}

        {currentScreen === 'settings' && (
          <AccountSettingsScreen
            user={currentUser}
            userProfile={userProfile}
            onProfileUpdated={() => refreshBalance()}
          />
        )}

        {currentScreen === 'support' && (
          <HelpSupportScreen />
        )}

      </main>

      {/* Mobile Bottom Quick Switcher */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 flex items-center justify-around py-2.5 px-2">
        <button
          onClick={() => setCurrentScreen('dashboard')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold transition ${
            currentScreen === 'dashboard' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setCurrentScreen('connector')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold transition ${
            currentScreen === 'connector' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Link2 className="w-5 h-5" />
          <span>Gateway</span>
        </button>

        <button
          onClick={() => setCurrentScreen('balance')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold transition ${
            currentScreen === 'balance' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-5 h-5" />
          <span>Balance</span>
        </button>

        <button
          onClick={() => setCurrentScreen('optimization')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold transition ${
            currentScreen === 'optimization' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wifi className="w-5 h-5" />
          <span>Optimizer</span>
        </button>

        <button
          onClick={() => setCurrentScreen('subscriptions')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold transition ${
            currentScreen === 'subscriptions' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Crown className="w-5 h-5" />
          <span>Premium</span>
        </button>
      </nav>

      {/* Investigation Dossier Modal */}
      <InvestigationModal 
        isOpen={investigationOpen}
        onClose={() => setInvestigationOpen(false)}
      />

    </div>
  );
}

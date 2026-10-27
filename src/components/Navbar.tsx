import React from 'react';
import { 
  Zap, 
  LogIn, 
  LogOut, 
  BookOpen, 
  ExternalLink,
  Link2,
  Activity,
  CheckCircle2,
  AlertTriangle,
  CircleDot
} from 'lucide-react';
import { signInWithGoogle, logOut } from '../firebase';
import type { BixberryConnectionStatus } from '../types';

interface Props {
  user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null } | null;
  currentPing: number;
  overallScore: number;
  bixberryStatus: BixberryConnectionStatus;
  onOpenInvestigation: () => void;
  onOpenDashboard: () => void;
  onConnectAccount: () => void;
}

export const Navbar: React.FC<Props> = ({ 
  user, 
  currentPing, 
  bixberryStatus,
  onOpenInvestigation,
  onOpenDashboard,
  onConnectAccount
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="font-extrabold text-sm sm:text-lg tracking-tight text-white whitespace-nowrap">
                Bixberry <span className="text-emerald-400">Booster Pro</span>
              </h1>
              <span className="hidden md:inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                PRO NODE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden lg:block">
              Decentralized AI Residential Bandwidth Optimizer
            </p>
          </div>
        </div>

        {/* Center / Actions: Open Dashboard & Connect Account */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Connection Status Indicator */}
          <button
            onClick={onConnectAccount}
            className={`flex items-center gap-1.5 px-2.5 py-1 sm:py-1.5 rounded-xl border text-xs font-mono font-bold transition ${
              bixberryStatus === 'Connected'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                : bixberryStatus === 'Session Expired'
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 hover:bg-rose-500/30 animate-pulse'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title={`Bixberry Node Status: ${bixberryStatus}. Click to manage connection.`}
          >
            {bixberryStatus === 'Connected' ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            ) : bixberryStatus === 'Session Expired' ? (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            ) : (
              <CircleDot className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            )}
            <span className="hidden xs:inline">{bixberryStatus}</span>
          </button>

          {/* Button: Open Bixberry Dashboard */}
          <button
            onClick={onOpenDashboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition shadow-sm"
            title="Open official Bixberry dashboard (https://dashboard.bixberry.com) in new tab"
          >
            <span className="hidden sm:inline">Open Bixberry Dashboard</span>
            <span className="sm:hidden">Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          </button>

          {/* Button: Connect Bixberry Account */}
          <button
            onClick={onConnectAccount}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
              bixberryStatus === 'Connected'
                ? 'bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-emerald-950/40'
            }`}
          >
            <Link2 className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">Connect Bixberry Account</span>
            <span className="md:hidden">Connect</span>
          </button>
        </div>

        {/* Right Utility & Auth */}
        <div className="flex items-center gap-2">
          {/* Live Ping Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
            <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-slate-300 font-semibold">{currentPing}ms</span>
          </div>

          {/* Investigation Dossier Button */}
          <button
            onClick={onOpenInvestigation}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-semibold transition"
            title="Read Phase 1 Bixberry Investigation Report"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Investigation Dossier</span>
          </button>

          {/* Firebase Authentication State */}
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-slate-800">
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    className="w-8 h-8 rounded-full border border-emerald-500/40" 
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs border border-emerald-500/30">
                    {(user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="hidden xl:block text-left text-xs leading-tight">
                  <div className="font-semibold text-white truncate max-w-[120px]">
                    {user.displayName || user.email?.split('@')[0]}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-mono">Synced to Firebase</div>
                </div>
              </div>
              <button
                onClick={() => logOut()}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                title="Sign out of Firebase"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => signInWithGoogle()}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition"
              title="Sign in with Google Firebase for cloud persistence"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sign In</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
};

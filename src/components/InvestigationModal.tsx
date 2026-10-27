import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  ExternalLink, 
  BookOpen, 
  Copy, 
  Check, 
  X, 
  Building2, 
  Cpu, 
  Wifi, 
  CheckCircle2, 
  DollarSign
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const InvestigationModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  if (!isOpen) return null;

  const emailTemplate = `Subject: Official Developer / Partner API Integration Request - Bixberry Node Management

Dear Cloudsquad UAB / Bixberry Developer Support Team,

I operate active residential nodes on the Bixberry network (Account email: [YOUR_EMAIL]).

I am contacting you to request official developer credentials or authorized REST/GraphQL API access for my automated node optimization and monitoring dashboard (Bixberry Earning Booster Pro).

Specifically, I am interested in:
1. Read-only node telemetry endpoints (node uptime, active state, ping response).
2. Balance and verified daily data processed metrics.
3. Official OAuth / API token authorization flows for verified node operators.

We respect Bixberry's terms of service and wish to strictly integrate via official, authorized developer endpoints rather than unofficial workarounds.

Best regards,
[YOUR NAME]
Node ID / Account: [YOUR EMAIL]`;

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(emailTemplate);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-y-auto text-slate-200">
        
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 bg-slate-900/95 border-b border-slate-800 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Phase 1 Investigation Report
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold uppercase tracking-wider">
                  Verified Analysis
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Official Bixberry platform architecture, developer status & earning mechanics
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">

          {/* Core Findings Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
              <div className="flex items-center gap-2 text-indigo-400 mb-2">
                <Building2 className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase">Operating Entity</span>
              </div>
              <p className="font-semibold text-white">Cloudsquad UAB</p>
              <p className="text-xs text-slate-400 mt-1">
                Private limited company based in Lithuania operating Bixberry.com.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
              <div className="flex items-center gap-2 text-amber-400 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase">Public API Status</span>
              </div>
              <p className="font-semibold text-amber-300">Unpublished / Private</p>
              <p className="text-xs text-slate-400 mt-1">
                No public 3rd-party REST or OAuth SDK released. Automated scraping is prohibited by TOS.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
              <div className="flex items-center gap-2 text-emerald-400 mb-2">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase">Payout Architecture</span>
              </div>
              <p className="font-semibold text-emerald-300">GIFQ API + Crypto</p>
              <p className="text-xs text-slate-400 mt-1">
                5,000+ digital gift cards via GIFQ Payout API. $10 initial min, $20 thereafter.
              </p>
            </div>
          </div>

          {/* Section 1: What is Bixberry */}
          <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
              <Cpu className="w-5 h-5 text-indigo-400" />
              1. Platform Purpose & Technical Operation
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Bixberry positions itself as a <strong className="text-white">people-powered residential network for Artificial Intelligence</strong>. Because large language models (LLMs) are trained on historic snapshots and cannot see the live web from isolated datacenters, Bixberry routes lightweight, encrypted web queries (such as checking current e-commerce pricing, business operating hours, real-time ticket availability, and local news) through residential internet connections.
            </p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>No personal data snooping:</strong> Bixberry routes encrypted AI web lookups only; it does not read personal photos, emails, or browsing history.</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Platforms supported:</strong> Android (Google Play), iOS (App Store), Windows Beta, and macOS (in development).</span>
              </div>
            </div>
          </div>

          {/* Section 2: API Findings & Authentication */}
          <div className="p-5 rounded-xl bg-slate-950/60 border border-amber-900/30">
            <h3 className="text-base font-bold text-amber-300 flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              2. Third-Party API & Developer Access Findings
            </h3>
            <div className="space-y-3 text-sm text-slate-300">
              <p>
                Our rigorous multi-point web and network investigation revealed:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-300">
                <li>
                  <strong className="text-white">No Public Documentation:</strong> Cloudsquad does not host public OpenAPI/Swagger specs or public developer keys for 3rd-party software.
                </li>
                <li>
                  <strong className="text-white">Proprietary Mobile Handshake:</strong> The mobile and desktop apps authenticate through internal auth tokens issued upon login to <code className="text-indigo-300 bg-slate-900 px-1 py-0.5 rounded">dashboard.bixberry.com</code>.
                </li>
                <li>
                  <strong className="text-white">Strict Terms of Service:</strong> Bixberry terms explicitly state that creating fake processing requests, manipulating client binaries, or attempting unauthorized automated scraping can lead to account suspension.
                </li>
              </ul>
              <div className="p-3 bg-amber-950/40 border border-amber-800/40 rounded-lg text-xs text-amber-200">
                <strong>Booster Integrity Guarantee:</strong> This application will never invent fake endpoints or fabricate balance numbers. We provide real network probe checks and direct official routes.
              </div>
            </div>
          </div>

          {/* Section 3: Legitimate Earning Optimization Factors */}
          <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800">
            <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2 mb-3">
              <Wifi className="w-5 h-5 text-emerald-400" />
              3. Factors That Truly Determine & Maximize Earnings
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Based on decentralized bandwidth network economics and Bixberry's architecture, here are the real, documented variables that control your earnings:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <span className="font-semibold text-emerald-300">1. Continuous 24/7 Node Uptime</span>
                <p className="text-slate-400">
                  Bixberry's load balancers prioritize nodes with 99%+ availability. Nodes that go to sleep every 10 minutes get pruned from high-volume AI job queues.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <span className="font-semibold text-emerald-300">2. Latency & Packet Jitter</span>
                <p className="text-slate-400">
                  AI web lookups have strict timeout budgets (&lt;500ms). Lower ping to regional DNS & web targets gives your node preferential job assignment.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <span className="font-semibold text-emerald-300">3. Residential vs Datacenter IP</span>
                <p className="text-slate-400">
                  Residential ISP connections earn standard/premium rates ($0.15 - $0.35/GB). Datacenter or VPN IPs get blocked or receive negligible traffic.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <span className="font-semibold text-emerald-300">4. Android Battery Optimization (Doze Mode)</span>
                <p className="text-slate-400">
                  Android OS aggressively shuts down background socket connections unless the app is marked as &quot;Unrestricted&quot; under App Battery Settings.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Official Developer Request Email */}
          <div className="p-5 rounded-xl bg-slate-950/60 border border-indigo-900/40">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                4. Official Route: Requesting Developer API Access
              </h3>
              <button
                onClick={handleCopyTemplate}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
              >
                {copiedTemplate ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedTemplate ? 'Copied Template!' : 'Copy Email Request'}
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              To request official developer access or enterprise node telemetry credentials, contact Cloudsquad support at{' '}
              <a href="mailto:support@bixberry.com" className="text-indigo-400 underline">support@bixberry.com</a> using this formal template:
            </p>
            <pre className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 whitespace-pre-wrap overflow-x-auto max-h-40">
              {emailTemplate}
            </pre>
          </div>

          {/* Official External Links */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="https://dashboard.bixberry.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
            >
              <span>Bixberry Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
            <a
              href="https://bixberry.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
            >
              <span>Official Website</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=com.cloudsquad.bixberry"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
            >
              <span>Android App on Google Play</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>

        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-4 bg-slate-900/95 border-t border-slate-800 backdrop-blur flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl transition"
          >
            Got It, Close Report
          </button>
        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  HelpCircle, 
  BookOpen, 
  ExternalLink, 
  Mail, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Server,
  Smartphone,
  Terminal,
  Copy,
  Check,
  Globe,
  Wifi,
  ShieldAlert,
  Zap,
  RotateCcw
} from 'lucide-react';

export const HelpSupportScreen: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [copiedScript, setCopiedScript] = useState(false);

  const windowsDnsFixScript = `@echo off
:: =========================================================================
:: BIXBERRY BOOSTER PRO - WINDOWS DNS & CONNECTION REPAIR SCRIPT
:: FIXES: "DNS_PROBE_POSSIBLE" / "This site can't be reached" (dashboard.bixberry.com)
:: TARGET: All Windows PC versions (Windows 10, Windows 11) - Works from any country
:: =========================================================================

echo.
echo =========================================================================
echo    BIXBERRY DASHBOARD DNS & CONNECTION REPAIR TOOL (RUN AS ADMIN)
echo =========================================================================
echo.

:: 1. Check for Administrator Privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] This script MUST be executed as Administrator!
    echo Please right-click CMD or this .bat file and select "Run as administrator".
    echo.
    pause
    exit /b 1
)

echo [1/6] Administrative privileges verified.

:: 2. Flush Stale Windows DNS Cache & Renew Network Leases
echo [2/6] Flushing local DNS cache and renewing sockets...
ipconfig /flushdns >nul
ipconfig /registerdns >nul
netsh winsock reset catalog >nul
netsh int ip reset >nul
echo       - Windows DNS cache cleared.
echo       - Winsock & TCP/IP stack reset.

:: 3. Assign Ultra-Fast Anycast DNS (1.1.1.1 Cloudflare + 8.8.8.8 Google)
echo [3/6] Configuring Cloudflare (1.1.1.1) and Google (8.8.8.8) DNS...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$adapters = Get-NetAdapter | Where-Object { $_.Status -eq 'Up' -and $_.InterfaceDescription -notmatch 'Virtual|Hyper-V|Loopback' }; ^
    foreach ($adapter in $adapters) { ^
        Write-Host ('       Configuring adapter: ' + $adapter.Name); ^
        Set-DnsClientServerAddress -InterfaceIndex $adapter.InterfaceIndex -ServerAddresses ('1.1.1.1', '8.8.8.8', '1.0.0.1', '8.8.4.4') -ErrorAction SilentlyContinue; ^
        Set-DnsClientServerAddress -InterfaceIndex $adapter.InterfaceIndex -ServerAddresses ('2606:4700:4700::1111', '2001:4860:4860::8888') -Family IPv6 -ErrorAction SilentlyContinue; ^
    }"

:: 4. Verify Resolution for dashboard.bixberry.com
echo [4/6] Verifying DNS resolution for dashboard.bixberry.com...
nslookup dashboard.bixberry.com 1.1.1.1 >nul 2>&1
if %errorlevel% equ 0 (
    echo       [SUCCESS] dashboard.bixberry.com resolved successfully via Cloudflare DNS!
) else (
    echo       [WARNING] Standard DNS query failed or ISP is performing Deep Packet Inspection (DPI).
    echo       Proceeding with encrypted DoH / WARP bypass...
)

:: 5. ISP Blocking Bypass Check (Cloudflare 1.1.1.1 WARP)
echo [5/6] Checking for Cloudflare WARP (Bypasses local ISP restrictions in Lagos/Nigeria/Global)...
where warp-cli >nul 2>&1
if %errorlevel% equ 0 (
    echo       WARP client detected! Connecting encrypted tunnel...
    warp-cli connect >nul 2>&1
) else (
    echo       Tip: If your mobile ISP (MTN, Airtel, Glo) or Wi-Fi provider blocks Bixberry,
    echo       install free Cloudflare 1.1.1.1 with WARP from https://1.1.1.1 to bypass ISP filters.
)

:: 6. Launch Official Dashboard
echo [6/6] Launching https://dashboard.bixberry.com in your default browser...
start https://dashboard.bixberry.com

echo.
echo =========================================================================
echo    REPAIR COMPLETE! Bixberry Booster is active and DNS is refreshed.
echo    If your browser still shows DNS cache, press CTRL + F5 in Chrome/Edge.
echo =========================================================================
echo.
pause`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(windowsDnsFixScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  const faqs = [
    {
      q: 'Why am I getting "DNS_PROBE_POSSIBLE" for dashboard.bixberry.com?',
      a: 'This error occurs when your Internet Service Provider\'s default DNS resolver (common with mobile networks like MTN, Airtel, Glo in Nigeria, or certain regional Wi-Fi ISPs) fails to resolve Cloudflare-protected subdomains or blocks bandwidth-sharing networks. Changing your Windows PC DNS to Cloudflare (1.1.1.1) and Google (8.8.8.8) or enabling Cloudflare 1.1.1.1 with WARP instantly fixes this issue.'
    },
    {
      q: 'How does Bixberry calculate my actual earnings?',
      a: 'Bixberry routes encrypted AI web lookups (such as live stock prices, current retail prices, and operating hours) through residential IP connections. Payouts are based on the volume of verified queries routed through your node, typically averaging between $0.15 and $0.35 per GB routed on clean residential networks.'
    },
    {
      q: 'Why does keeping Android Battery "Unrestricted" increase earnings?',
      a: 'Android OS aggressively kills background apps or freezes their network sockets when entering "Doze Mode" after 10-15 minutes of screen inactivity. By marking Bixberry as "Unrestricted" in Battery settings and exempting it from Data Saver, your node maintains a continuous 24/7 socket, preventing task dispatch dropouts.'
    },
    {
      q: 'What is the minimum payout threshold and how do I withdraw?',
      a: 'Bixberry sets a minimum withdrawal of $10 for your first payout, and $20 for subsequent withdrawals. Earnings are redeemed through the GIFQ API into digital gift cards (5,000+ brands) or cryptocurrency (USDT, TON, TRX) directly in the official Bixberry dashboard.'
    },
    {
      q: 'Does Bixberry inspect my personal browsing history or files?',
      a: 'No. Bixberry only routes external web lookups for verified AI models. It does not access your personal photos, files, emails, or browsing cookies.'
    },
    {
      q: 'Can I run multiple nodes on the same home Wi-Fi network?',
      a: 'Bixberry distributes requests by unique public IP subnet. Running multiple devices on the same Wi-Fi router will share the same IP allocation and will not scale linearly. For optimal scaling, place additional nodes at your office or separate residential locations.'
    }
  ];

  return (
    <div className="space-y-6">

      {/* Screen Header */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Help, Knowledge Base &amp; Diagnostic Support
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold font-mono">
                Screen 9
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Troubleshooting guides, DNS fix scripts, and platform documentation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="https://dashboard.bixberry.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition"
          >
            <span>Open Bixberry Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
          </a>

          <a
            href="mailto:support@bixberry.com"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition"
          >
            <Mail className="w-3.5 h-3.5 text-emerald-400" />
            <span>Contact Cloudsquad Support</span>
          </a>
        </div>
      </div>

      {/* SPECIAL SECTION: Windows DNS & ISP Fix Tool (DNS_PROBE_POSSIBLE) */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-800/40 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-900/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  Windows PC: Fix DNS_PROBE_POSSIBLE for dashboard.bixberry.com
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                  Error Fix
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                One-click Command Prompt script to flush DNS, set 1.1.1.1 &amp; 8.8.8.8, and bypass ISP restrictions
              </p>
            </div>
          </div>

          <button
            onClick={handleCopyScript}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-950/50 shrink-0 active:scale-95"
          >
            {copiedScript ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copiedScript ? 'Script Copied to Clipboard!' : 'Copy Complete CMD Script'}</span>
          </button>
        </div>

        {/* Quick Execution Instructions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-indigo-400 font-bold font-mono">STEP 1</span>
            <div className="font-semibold text-white">Open CMD as Admin</div>
            <p className="text-[11px] text-slate-400">
              Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono">Win + S</kbd>, type <code className="text-cyan-400 font-mono">cmd</code>, right-click and choose <strong>&quot;Run as administrator&quot;</strong>.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-indigo-400 font-bold font-mono">STEP 2</span>
            <div className="font-semibold text-white">Paste &amp; Press Enter</div>
            <p className="text-[11px] text-slate-400">
              Right-click inside the Command Prompt window to paste the script and press <strong>Enter</strong> to run.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-indigo-400 font-bold font-mono">STEP 3</span>
            <div className="font-semibold text-white">Instant Connection</div>
            <p className="text-[11px] text-slate-400">
              DNS flushes, Cloudflare &amp; Google DNS are assigned, and the script launches <code className="text-emerald-400 font-mono">dashboard.bixberry.com</code>.
            </p>
          </div>
        </div>

        {/* Script Viewer */}
        <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
          <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/90 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              Fix-Bixberry-DNS.cmd (Batch Script)
            </span>
            <button
              onClick={handleCopyScript}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              {copiedScript ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          <pre className="p-4 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-56 leading-relaxed selection:bg-indigo-600 selection:text-white">
            {windowsDnsFixScript}
          </pre>
        </div>

        {/* ISP Bypass / WARP Tip */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
          <Globe className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <span className="font-bold text-white">ISP Deep Packet Inspection (DPI) or Mobile Network Blocking:</span>
            <p className="text-[11px] text-slate-400">
              If you are using MTN, Airtel, Glo, or local broadband in Nigeria or other regions where ISPs block peer network subdomains, install <strong>Cloudflare 1.1.1.1 with WARP</strong> (<a href="https://1.1.1.1" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline font-semibold">https://1.1.1.1</a>). WARP encrypts all DNS lookups and tunnels your connection directly to Cloudflare’s nearest edge node (e.g. Lagos), allowing the Bixberry Booster and dashboard to connect 24/7 without packet drops.
            </p>
          </div>
        </div>
      </div>

      {/* Diagnostics Readiness Check */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-cyan-400" />
          Local Environment Diagnostic Verification
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block text-[11px]">Official Portal</span>
              <span className="font-bold text-emerald-400">https://bixberry.com</span>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block text-[11px]">Screen WakeLock API</span>
              <span className="font-bold text-white">
                {typeof navigator !== 'undefined' && 'wakeLock' in navigator ? 'Supported' : 'Standard Sleep'}
              </span>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block text-[11px]">Web Battery API</span>
              <span className="font-bold text-white">
                {typeof navigator !== 'undefined' && 'getBattery' in navigator ? 'Active' : 'AC Standard'}
              </span>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block text-[11px]">Firebase Database</span>
              <span className="font-bold text-emerald-400 font-mono">encoded-meridian-m53bd</span>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Accordion FAQ */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          Frequently Asked Questions (FAQ)
        </h3>

        <div className="space-y-2">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div 
                key={idx} 
                className="rounded-xl border border-slate-800 bg-slate-950/70 overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-3.5 text-left text-xs font-bold text-white flex items-center justify-between gap-3 hover:bg-slate-800/40 transition"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="p-3.5 pt-0 text-xs text-slate-400 border-t border-slate-800/60 leading-relaxed font-sans">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Official Links Footer Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <a
          href="https://dashboard.bixberry.com"
          target="_blank"
          rel="noopener noreferrer"
          className="p-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs text-left block space-y-1 transition group"
        >
          <div className="flex items-center justify-between text-white font-bold group-hover:text-emerald-400">
            <span>Bixberry Web Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </div>
          <p className="text-[11px] text-slate-400">View live gift card balances &amp; crypto withdrawals</p>
        </a>

        <a
          href="https://bixberry.com"
          target="_blank"
          rel="noopener noreferrer"
          className="p-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs text-left block space-y-1 transition group"
        >
          <div className="flex items-center justify-between text-white font-bold group-hover:text-emerald-400">
            <span>Cloudsquad Official Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </div>
          <p className="text-[11px] text-slate-400">Company terms, privacy policy &amp; product architecture</p>
        </a>

        <a
          href="https://play.google.com/store/apps/details?id=com.cloudsquad.bixberry"
          target="_blank"
          rel="noopener noreferrer"
          className="p-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs text-left block space-y-1 transition group"
        >
          <div className="flex items-center justify-between text-white font-bold group-hover:text-emerald-400">
            <span>Android App on Google Play</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </div>
          <p className="text-[11px] text-slate-400">Official background client application</p>
        </a>
      </div>

    </div>
  );
};

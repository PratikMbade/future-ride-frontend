/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-floating-promises */
import {  useState } from 'react';
import { useNavigate }         from '@tanstack/react-router';
import {
  useActiveAccount, useActiveWallet,
  useDisconnect, ConnectButton, darkTheme,
} from 'thirdweb/react';
import { bsc }         from 'thirdweb/chains';
import { signMessage } from 'thirdweb/utils';
import { createWallet, type Wallet } from 'thirdweb/wallets';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Loader2, LogOut, ArrowRight, AlertCircle,
  CheckCircle2, X, UserPlus, Shield,
  Zap, Lock, ExternalLink, Radar, Wallet as WalletIcon,
} from 'lucide-react';
import { client }     from '@/lib/client';
import { authClient } from '@/lib/authClient';
import { buildSiweMessage } from '@/utils/buildMessage';
import FutureRideLogo from '@/components/FutureRideLogo';

const API = import.meta.env.VITE_API_URL;

const wallets = [
  createWallet('io.metamask'),
  createWallet('com.coinbase.wallet'),
  createWallet('pro.tokenpocket'),
  createWallet('com.trustwallet.app'),
  createWallet('com.safepal'),
  createWallet('com.binance.wallet'),
];

function shortAddr(a: string) { return `${a.slice(0,6)}…${a.slice(-4)}`; }

/* ──────────────────────────────────────────────────────────
   SIWE
   ────────────────────────────────────────────────────────── */
// ROOT CAUSE OF THE STUCK-SKELETON BUG: this previously called
// authClient.$fetch('/siwe/nonce' | '/siwe/verify', ...) — a raw HTTP
// escape hatch that better-auth's client exposes for arbitrary custom
// endpoints. It correctly hits the server and sets the session cookie,
// but it does NOT go through better-auth's normal client action
// pipeline, which is what actually updates the shared session store
// (the nanostore atom) that useSession() subscribes to.
//
// The siweClient() plugin registered in authClient.ts exposes its OWN
// typed methods — authClient.siwe.nonce(...) and authClient.siwe.verify(...)
// — and THESE go through the standard pipeline, updating the session
// store as part of their normal implementation. Using them means
// useSession() finds out about the new session immediately, with no
// manual refresh workaround needed afterward.
const siweSignIn = async (wallet: Wallet) => {
  const account = wallet.getAccount();
  if (!account) throw new Error('No account found');
  const address = account.address;
  const chainId = 56;

  const sessionRes = await authClient.getSession();
  if (sessionRes?.data?.session) return sessionRes.data;

  const { data: nonceData, error: nonceError } = await authClient.siwe.nonce({
    walletAddress: address,
    chainId,
  });
  if (nonceError || !nonceData?.nonce) {
    throw new Error(nonceError?.message ?? 'Failed to get nonce');
  }

  const message = buildSiweMessage({
    domain: window.location.host, address,
    statement: 'Sign in to Future Ride', uri: window.location.origin,
    version: '1', chainId, nonce: nonceData.nonce,
  });

  const signature = await signMessage({ account, message });

  const { data, error: verifyError } = await authClient.siwe.verify({
    message,
    signature,
    walletAddress: address,
    chainId,
  });
  if (verifyError || !data) {
    throw new Error(verifyError?.message ?? 'SIWE verification failed');
  }
  return data;
};

/* ──────────────────────────────────────────────────────────
   ACCESS DIAL — signature element, mirrors the registration
   page's altitude dial. Three waypoints: Wallet → Sign → Verify.
   Center glyph flips to a confirmed check once regInfo resolves
   as registered; otherwise it just reflects raw progress.
   ────────────────────────────────────────────────────────── */
type AuthStage = 1 | 2 | 3;
function AccessDial({ stage, isChecking, isVerified }: {
  stage: AuthStage; isChecking: boolean; isVerified: boolean;
}) {
  const R = 70;
  const C = 2 * Math.PI * R;
  const frac = isVerified ? 1 : (stage - 1) / 3;
  const dash = C * Math.min(frac, 1);
  const labels = ['wallet', 'sign', 'verify'];

  return (
    <div className="relative w-[156px] h-[156px]" aria-hidden="true">
      <svg viewBox="0 0 156 156" className="w-full h-full -rotate-90">
        <circle cx="78" cy="78" r={R} fill="none" stroke="rgba(125,211,252,0.08)" strokeWidth="7" />
        <circle
          cx="78" cy="78" r={R} fill="none"
          stroke={isVerified ? '#22c55e' : '#38bdf8'}
          strokeWidth="7" strokeLinecap="round"
          strokeDasharray={`${dash} ${C - dash}`}
          className="transition-all duration-700 ease-out"
          style={{ filter: `drop-shadow(0 0 8px ${isVerified ? 'rgba(34,197,94,0.55)' : 'rgba(56,189,248,0.5)'})` }}
        />
        {[0, 1, 2].map(i => {
          const a = (i / 3) * 2 * Math.PI;
          const x = 78 + R * Math.cos(a);
          const y = 78 + R * Math.sin(a);
          const reached = i < stage;
          return <circle key={i} cx={x} cy={y} r={reached ? 4 : 2.75} fill={reached ? (isVerified ? '#22c55e' : '#38bdf8') : 'rgba(255,255,255,0.18)'} />;
        })}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        {isVerified ? (
          <>
            <span className="absolute w-[104px] h-[104px] rounded-full border border-[#22c55e]/30 animate-ping" />
            <CheckCircle2 size={26} className="text-[#22c55e] relative" />
            <span className="relative mt-1 font-mono text-[8.5px] tracking-[0.16em] uppercase text-[#4ade80]/80">verified</span>
          </>
        ) : isChecking ? (
          <>
            <Loader2 size={20} className="text-[#38bdf8] animate-spin" />
            <span className="mt-1 font-mono text-[8.5px] tracking-[0.16em] uppercase text-white/30">checking</span>
          </>
        ) : (
          <>
            <Radar size={13} className="text-[#38bdf8]/50 mb-1" />
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-white/55">{labels[stage - 1]}</span>
            <span className="font-mono text-[8.5px] tracking-[0.16em] uppercase text-white/25">{stage}/3</span>
          </>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   PANEL — bracket-cornered console card, shared visual language
   with the registration flow.
   ────────────────────────────────────────────────────────── */
function Panel({ index, title, children }: { index: number; title: string; children: React.ReactNode }) {
  return (
    <div className="relative rounded-xl border border-[rgba(125,211,252,0.14)] bg-[#081421]/75 px-5 py-5 sm:px-6 sm:py-6">
      {['-top-px -left-px border-t-2 border-l-2 rounded-tl-[10px]','-top-px -right-px border-t-2 border-r-2 rounded-tr-[10px]','-bottom-px -left-px border-b-2 border-l-2 rounded-bl-[10px]','-bottom-px -right-px border-b-2 border-r-2 rounded-br-[10px]'].map((c, i) => (
        <span key={i} className={`pointer-events-none absolute w-3 h-3 border-[#38bdf8]/45 ${c}`} />
      ))}
      <div className="flex items-center gap-2 mb-4">
        <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#38bdf8]/60">
          {String(index).padStart(2, '0')}
        </span>
        <span className="h-px flex-1 bg-white/[0.07]" />
        <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-white/35">{title}</span>
      </div>
      {children}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   TOAST — slim console strip instead of a frosted pill
   ────────────────────────────────────────────────────────── */
type ToastType = 'success' | 'error' | 'info';
function Toast({ msg, type, onClose }: { msg: string; type: ToastType; onClose: () => void }) {
  const cfg = {
    success: { cls: 'border-[#22c55e]/35 bg-[rgba(34,197,94,0.06)]', tag: 'OK',    tagCls: 'text-[#22c55e]', icon: <CheckCircle2 size={13} className="text-[#22c55e] shrink-0" /> },
    error:   { cls: 'border-[#fb7185]/35 bg-[rgba(251,113,133,0.06)]', tag: 'ERR',  tagCls: 'text-[#fb7185]', icon: <AlertCircle size={13} className="text-[#fb7185] shrink-0" /> },
    info:    { cls: 'border-[#38bdf8]/35 bg-[rgba(56,189,248,0.06)]', tag: 'INFO', tagCls: 'text-[#38bdf8]', icon: <Loader2 size={13} className="text-[#38bdf8] shrink-0 animate-spin" /> },
  }[type];

  return (
    <div
      data-testid={`toast-${type}`}
      className={`flex items-center gap-2.5 pl-3.5 pr-2.5 py-2.5 rounded-lg border ${cfg.cls}`}
      style={{ boxShadow: '0 12px 30px -10px rgba(0,0,0,0.6)' }}
    >
      {cfg.icon}
      <span className={`font-mono text-[9px] tracking-[0.14em] uppercase ${cfg.tagCls}`}>[{cfg.tag}]</span>
      <span className="flex-1 font-mono text-[11.5px] text-white/80">{msg}</span>
      <button
        data-testid="toast-close-btn"
        onClick={onClose}
        className="p-1 text-white/30 hover:text-white/70 transition-colors shrink-0"
      >
        <X size={11} />
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   NOT-REGISTERED MODAL — console panel treatment
   ────────────────────────────────────────────────────────── */
function NotRegisteredModal({
  address, onClose, onRegister,
}: { address: string; onClose: () => void; onRegister: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-[6px] animate-[fadeInOverlay_.25s_ease-out]"
        onClick={onClose}
      />

      <div className="relative w-full max-w-[380px] z-10 animate-[slideUp_.35s_cubic-bezier(.2,.8,.2,1)]">
        <div className="relative rounded-xl border border-[rgba(251,113,133,0.22)] bg-[#081421]/95 backdrop-blur-2xl overflow-hidden px-6 py-6"
          style={{ boxShadow: '0 -4px 80px rgba(0,0,0,0.85), 0 0 0 0.5px rgba(255,255,255,0.05)' }}
        >
          {['-top-px -left-px border-t-2 border-l-2 rounded-tl-[10px]','-top-px -right-px border-t-2 border-r-2 rounded-tr-[10px]','-bottom-px -left-px border-b-2 border-l-2 rounded-bl-[10px]','-bottom-px -right-px border-b-2 border-r-2 rounded-br-[10px]'].map((c, i) => (
            <span key={i} className={`pointer-events-none absolute w-3 h-3 border-[#fb7185]/55 ${c}`} />
          ))}

          <button
            data-testid="modal-close-btn"
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-white/40 hover:text-white/85 hover:bg-white/[0.1] hover:border-white/[0.2] transition-all"
          >
            <X size={12} />
          </button>

          <div className="flex items-center gap-2 mb-5">
            <AlertCircle size={14} className="text-[#fb7185]" />
            <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#fb7185]">alert — not registered</span>
          </div>

          <h2 className="m-0 font-heading text-[19px] font-bold text-white tracking-tight">
            Wallet not in the matrix
          </h2>
          <p className="mt-2 mb-5 text-[13px] text-white/55 font-body leading-relaxed">
            <span className="font-mono text-white/85 bg-white/[0.05] border border-white/[0.06] px-1.5 py-0.5 rounded-[6px] text-[12px]">
              {shortAddr(address)}
            </span>
            {' '}needs a sponsor's referral ID to join Future Ride.
          </p>

          <div className="rounded-lg border border-white/[0.08] overflow-hidden mb-5">
            {[
              { icon: Zap,    text: 'Earn passive income from your matrix' },
              { icon: Shield, text: 'Fully on-chain — trustless & transparent' },
              { icon: Lock,   text: 'Non-custodial — only you control your funds' },
            ].map(({ icon: Icon, text }, i, arr) => (
              <div
                key={text}
                className={`flex items-center gap-3 px-3.5 py-2.5 ${i < arr.length - 1 ? 'border-b border-white/[0.05]' : ''}`}
              >
                <Icon size={13} className="text-[#38bdf8]/70 shrink-0" />
                <span className="text-[11.5px] font-mono text-white/55 leading-tight text-left">{text}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              data-testid="modal-register-btn"
              onClick={onRegister}
              className="group relative w-full overflow-hidden flex items-center justify-center gap-2.5 py-3.5 rounded-full font-bold text-[13.5px] text-[#04111f] transition-all active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 50%, #7dd3fc 100%)',
                boxShadow: '0 0 26px rgba(56,189,248,0.32)',
              }}
            >
              <span
                className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"
                style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)' }}
              />
              <span className="relative inline-flex items-center gap-2">
                <UserPlus size={14} />
                Register with referral
                <ArrowRight size={13} />
              </span>
            </button>

            <button
              data-testid="modal-cancel-btn"
              onClick={onClose}
              className="w-full py-2.5 rounded-lg font-mono text-[11.5px] text-white/40 border border-white/[0.08] hover:text-white/70 hover:border-white/[0.16] transition-all"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInOverlay { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   PAGE
   ────────────────────────────────────────────────────────── */
export default function LoginPage() {
  const navigate = useNavigate();
  const account  = useActiveAccount();
  const wallet   = useActiveWallet();
  const { disconnect } = useDisconnect();

  const [signingIn,  setSigningIn]  = useState(false);
  const [toast,      setToast]      = useState<{ msg: string; type: ToastType } | null>(null);
  const [showNotReg, setShowNotReg] = useState(false);
  const queryClient = useQueryClient();

  // CONFIRMED via better-auth GitHub issues #7877 and #3608: useSession()'s
  // internal reactive atom is NOT automatically updated by getSession()
  // calls or even by the plugin's own siwe.verify() method — there is
  // currently no built-in mechanism in better-auth to revalidate
  // useSession() after a sign-in action that doesn't itself trigger a
  // full page reload. The documented workaround is to call useSession()'s
  // OWN refetch() function explicitly. We pull it here so handleConnect
  // can force the atom to update before navigating to /dashboard.
  const { refetch: refetchAuthSession } = authClient.useSession();

  // gates the register-info query so it only ever runs AFTER a SIWE
  // session actually exists — previously this query ran the instant the
  // wallet connected (enabled: !!account?.address), which is BEFORE
  // signing even starts. That fired a 401 from /api/register/info every
  // single connection, and while the bare 401 didn't directly redirect
  // here, it was firing wastefully and racing against the real
  // post-signin check. Gating on hasSession (set true only once
  // siweSignIn resolves) eliminates that premature, doomed request.
  const [hasSession, setHasSession] = useState(false);

  const showToast = (msg: string, type: ToastType, ms = 3500) => {
    setToast({ msg, type });
    if (ms > 0) setTimeout(() => setToast(null), ms);
  };

  const { data: regInfo, isLoading: checkingReg, refetch } = useQuery({
    queryKey: ['login-reg', account?.address],
    queryFn:  async () => {
      const res = await fetch(`${API}/api/register/info`, { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
    enabled:   !!account?.address && hasSession,
    staleTime: 30_000,
    retry:     false,
  });

  const handleConnect = async (w: Wallet) => {
    try {
      setSigningIn(true);
      showToast('Sign the message in your wallet…', 'info', 0);
      await siweSignIn(w);
      setToast(null);
      setHasSession(true);

      // EXPLICITLY force useSession()'s atom to refetch — this is the
      // step that was missing. siwe.verify() sets the cookie correctly
      // (confirmed: beforeLoad's getSession() always sees it), but
      // useSession() has no automatic way to learn about it. Without
      // this call, DashboardHomePage mounts with session: null,
      // isPending: false (confirmed via console.log) and every query
      // gated on it stays permanently disabled.
      await refetchAuthSession();

      // No manual session-store refresh needed here anymore — siweSignIn
      // now calls authClient.siwe.verify() (the plugin's real method),
      // which runs through better-auth's normal client action pipeline
      // and updates the session store itself as part of its own
      // implementation. useSession() on the destination page picks up
      // the new session correctly without any extra workaround.

      // Drive navigation directly off refetch's resolved value rather than
      // a separate useEffect reacting to regInfo on a later render — avoids
      // any gap where some other guard could read stale state in between.
      const { data: freshRegInfo } = await refetch();

      if (freshRegInfo?.isRegistered) {
        showToast('Welcome back!', 'success');
        setTimeout(() => navigate({ to: '/dashboard' as any }), 900);
      } else {
        setShowNotReg(true);
      }
    } catch (err: any) {
      setToast(null);
      const m = (err?.message ?? '').toLowerCase();
      if (m.includes('rejected') || m.includes('4001'))
        showToast('Signature rejected. Please try again.', 'error');
      else
        showToast('Sign-in failed. Try reconnecting.', 'error');
    } finally {
      setSigningIn(false);
    }
  };

  const handleDisconnect = async () => {
    try { await authClient.signOut(); } catch {}
    if (wallet) disconnect(wallet);
    setShowNotReg(false);
    setHasSession(false);
    // Wipe ALL cached query data on disconnect — defense in depth against
    // the next person to use this browser tab (even a different wallet)
    // ever seeing a previous session's cached dashboard data. Query keys
    // elsewhere are now scoped by address too, but clearing here means
    // any query we forget to scope can't leak data across users either.
    queryClient.clear();
    showToast('Wallet disconnected', 'info');
  };

  const isLoading = signingIn || checkingReg;
  const stage: AuthStage = !account ? 1 : !hasSession ? 2 : 3;
  const isVerified = !!regInfo?.isRegistered && !isLoading;

  return (
    <div className="min-h-screen bg-[#040a14] flex flex-col select-none selection:bg-[rgba(56,189,248,0.25)] selection:text-white">
      {/* ───────────── Ambient background — instrument-panel glow ───────────── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-44 left-1/2 -translate-x-1/2 w-[600px] h-[420px]"
          style={{ background: 'radial-gradient(ellipse at center top, rgba(56,189,248,0.10) 0%, transparent 62%)' }}
        />
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: 'radial-gradient(rgba(125,211,252,0.05) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            maskImage: 'radial-gradient(ellipse at top, black 15%, transparent 70%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.5) 100%)' }}
        />
      </div>

      {/* ───────────── Header ───────────── */}
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-8 h-[56px] border-b border-white/[0.06]">
        <a href="/" className="flex items-center gap-2.5">
          <FutureRideLogo/>
          <span className="font-heading text-[15px] font-bold text-white tracking-tight">Future Ride</span>
        </a>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-mono text-[9.5px] text-white/35 tracking-[0.1em] uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" style={{ boxShadow: '0 0 6px rgba(34,197,94,0.7)' }} />
            BNB Mainnet
          </span>

          {account && (
            <button
              data-testid="header-disconnect-btn"
              onClick={handleDisconnect}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[10.5px] text-white/40 border border-white/[0.07] hover:text-white/85 hover:border-white/[0.16] hover:bg-white/[0.04] transition-all"
            >
              <LogOut size={11} />
              <span className="hidden sm:inline">Disconnect</span>
            </button>
          )}
        </div>
      </header>

      {/* ───────────── Toast ───────────── */}
      {toast && (
        <div className="fixed top-[68px] left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-[360px] animate-[fadeIn_.25s_ease-out]">
          <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}

      {/* ───────────── Main ───────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-[400px] flex flex-col gap-7">

          {/* dial + status — replaces the old badge/logo/headline hero */}
          <div className="flex flex-col items-center text-center gap-3">
            <AccessDial stage={stage} isChecking={checkingReg} isVerified={isVerified} />
            <h1 className="m-0 font-heading text-[21px] font-bold text-white tracking-[-0.01em]">
              {isVerified ? 'Access granted' : 'Sign in to Future Ride'}
            </h1>
            <p className="m-0 text-[12.5px] text-white/40 font-body leading-relaxed max-w-[280px]">
              {isVerified
                ? 'Membership confirmed. Taking you to your dashboard…'
                : 'Connect your wallet and sign a free message to access the matrix dashboard.'}
            </p>
          </div>

          {/* ── auth panel ── */}
          {account ? (
            <Panel index={1} title="Wallet">
              <div className="rounded-lg border border-white/[0.08] overflow-hidden mb-3">
                <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/[0.05]">
                  <span className="flex items-center gap-2 text-[10.5px] font-mono tracking-[0.08em] uppercase text-white/35">
                    <WalletIcon size={12} className="text-[#38bdf8]" />
                    Address
                  </span>
                  <span data-testid="connected-address" className="text-[12.5px] font-medium text-white font-mono">
                    {shortAddr(account.address)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-3.5 py-2.5">
                  <span className="text-[10.5px] font-mono tracking-[0.08em] uppercase text-white/35">Status</span>
                  <span className="flex items-center gap-1.5 text-[12px] font-mono text-white/70">
                    {isLoading ? (
                      <>
                        <Loader2 size={12} className="text-[#38bdf8] animate-spin" />
                        {checkingReg ? 'checking…' : 'awaiting signature…'}
                      </>
                    ) : isVerified ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                        registered
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-white/25" />
                        connected
                      </>
                    )}
                  </span>
                </div>
              </div>

              {isVerified && (
                <button
                  data-testid="go-to-dashboard-btn"
                  onClick={() => navigate({ to: '/dashboard' as any})}
                  className="group relative w-full overflow-hidden flex items-center justify-center gap-2.5 py-3.5 rounded-full font-bold text-[13.5px] text-[#04111f] transition-all active:scale-[0.98] mb-3"
                  style={{
                    background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 50%, #7dd3fc 100%)',
                    boxShadow: '0 0 26px rgba(56,189,248,0.3)',
                  }}
                >
                  <span
                    className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"
                    style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)' }}
                  />
                  <span className="relative inline-flex items-center gap-2">
                    <CheckCircle2 size={14} />
                    Go to dashboard
                    <ArrowRight size={13} />
                  </span>
                </button>
              )}

              <a
                data-testid="bscscan-link"
                href={`https://bscscan.com/address/${account.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 font-mono text-[10.5px] text-white/30 hover:text-white/70 transition-colors mb-2"
              >
                <ExternalLink size={10} />
                View on BscScan
              </a>

              <button
                data-testid="disconnect-wallet-btn"
                onClick={handleDisconnect}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-white/[0.08] font-mono text-[11.5px] text-white/40 hover:text-white/80 hover:border-white/[0.18] transition-all"
              >
                <LogOut size={12} />
                Disconnect wallet
              </button>
            </Panel>
          ) : (
            <Panel index={1} title="Connect">
              <p className="mt-0 mb-4 text-[12.5px] text-white/45 font-body leading-relaxed">
                MetaMask, Trust Wallet, or any WalletConnect-compatible wallet on BNB Chain.
              </p>

              <div className="[&>div]:!w-full [&>div>button]:!w-full mb-4">
                <ConnectButton
                  client={client}
                  chains={[bsc]}
                  theme={darkTheme({ colors: { primaryButtonBg: '#38bdf8' } })}
                  connectButton={{
                    label: 'Connect wallet',
                    style: {
                      width: '100%',
                      height: '50px',
                      borderRadius: '10px',
                      color: '#04111f',
                      fontWeight: 700,
                      fontSize: '14px',
                      background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 50%, #7dd3fc 100%)',
                      boxShadow: '0 0 24px rgba(56,189,248,0.25)',
                      letterSpacing: '0.01em',
                    },
                  }}
                  connectModal={{ size: 'compact' }}
                  wallets={wallets}
                  onConnect={handleConnect}
                />
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="font-mono text-[9.5px] text-white/30 uppercase tracking-[0.14em]">New here?</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              <button
                data-testid="register-with-referral-btn"
                onClick={() => navigate({ to: '/registration' as any })}
                className="group w-full px-2 flex items-center justify-center gap-2 py-3 rounded-lg border border-white/[0.1] font-mono text-[11.5px] text-white/50 hover:text-white/85 hover:border-[rgba(56,189,248,0.30)] hover:bg-[rgba(56,189,248,0.04)] transition-all"
              >
                <UserPlus size={12} className="text-[#38bdf8]/70 group-hover:text-[#38bdf8] transition-colors" />
                Register with a referral ID
                <ArrowRight size={11} className="ml-auto opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </button>
            </Panel>
          )}

          {/* trust strip */}
          <div className="flex items-center justify-center gap-4 font-mono text-[9.5px] text-white/30 tracking-wide">
            {['Non-custodial', 'Trustless', 'Instant access'].map((label, i, arr) => (
              <span key={label} className="flex items-center gap-4">
                {label}
                {i < arr.length - 1 && <span className="text-white/15">·</span>}
              </span>
            ))}
          </div>

          {/* footer */}
          <p className="text-center text-[10.5px] font-mono text-white/25 tracking-wide -mt-1">
            Need help?{' '}
            <a
              data-testid="help-link"
              href="https://futureride.live"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#38bdf8]/60 hover:text-[#38bdf8] transition-colors"
            >
              Visit futureride.live →
            </a>
          </p>
        </div>
      </main>

      {/* modal */}
      {showNotReg && account && (
        <NotRegisteredModal
          address={account.address}
          onClose={() => setShowNotReg(false)}
          onRegister={() => { setShowNotReg(false); navigate({ to: '/registration' as any }); }}
        />
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  );
}
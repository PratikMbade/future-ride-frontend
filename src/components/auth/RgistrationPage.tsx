/* eslint-disable no-empty */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { useState, useEffect, useRef, type JSX } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Route } from '@/routes/registration/route';
import { useActiveAccount, useActiveWallet, useDisconnect, ConnectButton, darkTheme } from 'thirdweb/react';
import { bsc } from 'thirdweb/chains';
import { signMessage } from 'thirdweb/utils';
import { createWallet, type Wallet } from 'thirdweb/wallets';
import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import {
  CheckCircle2, XCircle, Loader2, ArrowRight,
  AlertCircle, Hash, Wallet as WalletIcon, ShieldCheck, ExternalLink,
  PenLine, Coins, Radar, HelpCircle, ThumbsUp, ThumbsDown,
} from 'lucide-react';
import { contractInstance } from '@/contract/contract';
import { usdtContractInstance } from '@/contract/usdt/usdtContract';
import { client } from '@/lib/client';
import { authClient } from '@/lib/authClient';
import { buildSiweMessage } from '@/utils/buildMessage';

const API = import.meta.env.VITE_API_URL;
function shortAddr(a: string) { return `${a.slice(0,6)}…${a.slice(-4)}`; }

// ─── Default sponsor used when the user has no referral ID.
//     This is the platform's own seed/root node — any registration
//     without a personal referrer is placed under it.
const DEFAULT_REFERRAL_ID = 'FR3c97187b';

const wallets = [
  createWallet('io.metamask'),
  createWallet('com.coinbase.wallet'),
  createWallet('pro.tokenpocket'),
  createWallet('com.trustwallet.app'),
  createWallet('com.safepal'),
  createWallet('com.binance.wallet'),
];

// ─── 5-step flow:
//   1  Wallet   — connect wallet
//   2  Sign     — SIWE message
//   3  Referral — "do you have a referral ID?" gate (NEW)
//   4  Sponsor  — enter / confirm referral (only if "yes"), or auto-filled if "no"
//   5  Join     — approve USDT + register on-chain
type StepState = 1 | 2 | 3 | 4 | 5;

type TxState =
  | 'idle'
  | 'checking-allowance'
  | 'approving'
  | 'approve-mining'
  | 'pending'
  | 'mining'
  | 'success'
  | 'error';

const PACKAGE_1_PRICE_USDT = '5';

interface ReferralInfo {
  valid: boolean; userAddress: string;
  displayAddress: string; futureRideId: string; highestPackage: number;
}

const FUTURE_RIDE_ID_RE = /^fr[a-f0-9]{6,}$/i;

// ─── SIWE ──────────────────────────────────────────────────
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
    message, signature, walletAddress: address, chainId,
  });
  if (verifyError || !data) throw new Error(verifyError?.message ?? 'SIWE verification failed');
  return data;
};

// ─────────────────────────────────────────────────────────
//  ALTITUDE DIAL — 5-waypoint ring sweeping from step 0 → 5.
// ─────────────────────────────────────────────────────────
function AltitudeDial({ step, sponsorLabel, isSuccess }: {
  step: StepState; sponsorLabel: string | null; isSuccess: boolean;
}) {
  const R = 78;
  const C = 2 * Math.PI * R;
  const frac = isSuccess ? 1 : (step - 1) / 5;
  const dash = C * Math.min(frac, 1);

  return (
    <div className="relative flex flex-col items-center" aria-hidden="true">
      <div className="relative w-[176px] h-[176px]">
        <svg viewBox="0 0 176 176" className="w-full h-full -rotate-90">
          <circle cx="88" cy="88" r={R} fill="none" stroke="rgba(125,211,252,0.08)" strokeWidth="8" />
          <circle
            cx="88" cy="88" r={R} fill="none"
            stroke={isSuccess ? '#22c55e' : '#38bdf8'}
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${dash} ${C - dash}`}
            className="transition-all duration-700 ease-out"
            style={{ filter: `drop-shadow(0 0 8px ${isSuccess ? 'rgba(34,197,94,0.55)' : 'rgba(56,189,248,0.5)'})` }}
          />
          {/* 5 waypoint ticks */}
          {[0, 1, 2, 3, 4].map(i => {
            const a = (i / 5) * 2 * Math.PI;
            const x = 88 + R * Math.cos(a);
            const y = 88 + R * Math.sin(a);
            const reached = i < step;
            return (
              <circle
                key={i}
                cx={x} cy={y}
                r={reached ? 4.5 : 3}
                fill={reached ? (isSuccess ? '#22c55e' : '#38bdf8') : 'rgba(255,255,255,0.18)'}
              />
            );
          })}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          {isSuccess ? (
            <>
              <span className="absolute w-[120px] h-[120px] rounded-full border border-[#22c55e]/30 animate-ping" />
              <CheckCircle2 size={30} className="text-[#22c55e] relative" />
              <span className="relative mt-1 font-mono text-[9px] tracking-[0.18em] uppercase text-[#4ade80]/80">on-chain</span>
            </>
          ) : (
            <>
              <Radar size={14} className="text-[#38bdf8]/50 mb-1" />
              <span className="font-mono text-[26px] font-bold text-white leading-none">
                {step}<span className="text-white/25 text-[15px]">/5</span>
              </span>
              <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-white/30">waypoint</span>
            </>
          )}
        </div>
      </div>

      {sponsorLabel && (
        <div className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#38bdf8]/30 bg-[rgba(56,189,248,0.06)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
          <span className="font-mono text-[10.5px] text-[#7dd3fc]">sponsor {sponsorLabel}</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  WAYPOINT RAIL — 5 stages
// ─────────────────────────────────────────────────────────
function WaypointRail({ stages, current }: {
  stages: { label: string }[]; current: StepState;
}) {
  return (
    <div className="flex items-center w-full">
      {stages.map((s, i) => {
        const num = (i + 1) as StepState;
        const done   = num < current;
        const active = num === current;
        return (
          <div key={s.label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div className={[
                'relative w-2.5 h-2.5 rotate-45 transition-all duration-300',
                done ? 'bg-[#22c55e]' : active ? 'bg-[#38bdf8]' : 'bg-white/15',
              ].join(' ')}>
                {active && <span className="absolute -inset-1.5 rotate-0 rounded-full border border-[#38bdf8]/40 animate-pulse" />}
              </div>
              <span className={[
                'font-mono text-[8.5px] tracking-[0.1em] uppercase whitespace-nowrap',
                done ? 'text-[#22c55e]/70' : active ? 'text-[#7dd3fc]' : 'text-white/25',
              ].join(' ')}>{s.label}</span>
            </div>
            {i < stages.length - 1 && (
              <div className={`h-px flex-1 mx-1.5 -translate-y-2.5 ${done ? 'bg-[#22c55e]/50' : 'bg-white/10'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  PANEL — bracket-cornered console card
// ─────────────────────────────────────────────────────────
function Panel({ index, title, children }: { index: number; title: string; children: React.ReactNode }) {
  return (
    <div className="relative rounded-xl border border-[rgba(125,211,252,0.14)] bg-[#081421]/70 px-5 py-5 sm:px-6 sm:py-6">
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

// ─────────────────────────────────────────────────────────
//  REFERRAL INPUT — validates a futureRideId live
// ─────────────────────────────────────────────────────────
function ReferralInput({ value, onChange, onValidated, disabled }: {
  value: string; onChange: (v: string) => void;
  onValidated: (i: ReferralInfo | null) => void; disabled: boolean;
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle');
  const [info,   setInfo]   = useState<ReferralInfo | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const v = value.trim();

    if (!v || !FUTURE_RIDE_ID_RE.test(v)) {
      setStatus('idle'); setInfo(null); onValidated(null); return;
    }

    setStatus('loading');
    timer.current = setTimeout(async () => {
      try {
        const res  = await fetch(`${API}/api/register/validate/${encodeURIComponent(v)}`, { credentials: 'include' });
        const data = await res.json();
        if (data.valid) { setStatus('valid');   setInfo(data); onValidated(data); }
        else            { setStatus('invalid'); setInfo(null); onValidated(null); }
      } catch { setStatus('invalid'); setInfo(null); onValidated(null); }
    }, 600);
  }, [value]);

  const ring =
    status === 'valid'   ? 'border-[#22c55e]/55' :
    status === 'invalid' ? 'border-[#fb7185]/55' :
    'border-white/[0.12] focus-within:border-[#38bdf8]/60';

  return (
    <div className="flex flex-col gap-3">
      <label className="font-mono text-[9.5px] tracking-[0.16em] uppercase text-white/35">Referral ID</label>
      <div className={`relative flex items-center rounded-lg border bg-black/30 transition-all duration-300 ${ring}`}>
        <Hash size={16} className="absolute left-3.5 text-white/30 pointer-events-none" />
        <input
          data-testid="referral-id-input"
          value={value}
          onChange={e => onChange(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16))}
          placeholder="FR76b85b17"
          maxLength={16}
          disabled={disabled}
          autoCapitalize="off" autoCorrect="off" spellCheck={false}
          className="w-full bg-transparent pl-10 pr-11 py-3.5 text-[16px] font-mono text-white placeholder-white/20 outline-none tracking-[0.06em] disabled:opacity-40 disabled:cursor-not-allowed"
        />
        <div className="absolute right-3.5">
          {status === 'loading' && <Loader2 size={16} className="text-white/40 animate-spin" />}
          {status === 'valid'   && <CheckCircle2 size={16} className="text-[#22c55e]" />}
          {status === 'invalid' && <XCircle size={16} className="text-[#fb7185]" />}
        </div>
      </div>

      {status === 'valid' && info && (
        <div data-testid="sponsor-preview" className="flex items-center justify-between px-3.5 py-3 rounded-lg border border-[#22c55e]/25 bg-[rgba(34,197,94,0.05)] animate-[riseIn_.3s_ease-out]">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 size={13} className="text-[#22c55e] shrink-0" />
            <span className="text-[12px] font-mono text-white/60 truncate">{info.displayAddress}</span>
          </div>
          <span className="font-mono text-[11px] text-[#4ade80] shrink-0 ml-2">{info.futureRideId}</span>
        </div>
      )}

      {status === 'invalid' && value.length >= 1 && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-[#fb7185]/25 bg-[rgba(251,113,133,0.05)]">
          <XCircle size={13} className="text-[#fb7185] shrink-0" />
          <p className="m-0 text-[11.5px] text-[#fb7185]/85">ID not found or sponsor unregistered</p>
        </div>
      )}
    </div>
  );
}

interface RegistrationSearch { ref: string; referralAddress: string; }

export default function RegisterPage() {
  const account  = useActiveAccount();
  const navigate = useNavigate();
  const search   = Route.useSearch() as RegistrationSearch;

  const [referralId,       setReferralId]       = useState<string>(search.ref || '');
  const [referrer,         setReferrer]          = useState<ReferralInfo | null>(null);
  const [step,             setStep]              = useState<StepState>(1);
  const [txState,          setTxState]           = useState<TxState>('idle');
  const [txHash,           setTxHash]            = useState('');
  const [txError,          setTxError]           = useState('');
  // ─── step-3 gate answer
  //   null  = not yet answered (show the Yes/No panel, step 3)
  //   'yes' = proceed to the sponsor input at step 4
  //           set by "Yes" button OR by "No" button (which also pre-fills
  //           DEFAULT_REFERRAL_ID so the ReferralInput auto-validates it)
  const [referralChoice,   setReferralChoice]    = useState<null | 'yes'>(null);

  const { data: session, isPending: sessionPending, refetch: refetchSession } = authClient.useSession();
  const [signingIn, setSigningIn] = useState(false);
  const [signError, setSignError] = useState('');
  const hasSession = !sessionPending && !!session?.user;
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();

  // ── Resolve ?referralAddress= query param to a futureRideId
  useEffect(() => {
    if (search.referralAddress && !search.ref) {
      fetch(`${API}/api/user/by-address/${search.referralAddress}`, { credentials: 'include' })
        .then(r => r.json())
        .then(d => { if (d?.futureRideId) setReferralId(String(d.futureRideId)); })
        .catch(() => {});
    }
  }, [search.referralAddress, search.ref]);

  const { data: regInfo, isLoading: checkingReg } = useQuery({
    queryKey: ['register-info', account?.address, hasSession],
    queryFn:  async () => {
      const res = await fetch(`${API}/api/register/info`, { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
    enabled:   !!account?.address && hasSession,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (regInfo?.isRegistered) navigate({ to: '/dashboard' as any });
  }, [regInfo, navigate]);

  // ── Step derivation — updated for 5-step flow
  useEffect(() => {
    if (!account?.address)       { setStep(1); return; }
    if (!hasSession)             { setStep(2); return; }
    if (referralChoice === null) { setStep(3); return; }   // choice gate
    if (!referrer)               { setStep(4); return; }   // enter / confirm sponsor
    setStep(5);
  }, [account?.address, hasSession, referralChoice, referrer]);

  // ── When user picks "No": pre-fill the input with the default sponsor
  //    ID and show the same referral panel as "Yes". The ReferralInput's
  //    own debounced useEffect picks up the pre-filled value, validates
  //    it server-side, and calls setReferrer — identical path to typing
  //    the ID manually. No separate fetch here; the input is the single
  //    source of truth for validation.
  const handleNoReferral = () => {
    setReferralId(DEFAULT_REFERRAL_ID);
    setReferralChoice('yes');
  };

  const handleConnect = async (w: Wallet) => {
    try {
      setSigningIn(true); setSignError('');
      await siweSignIn(w);
      await refetchSession();
    } catch (err: any) {
      const m = (err?.message ?? '').toLowerCase();
      if (m.includes('rejected') || m.includes('4001'))
        setSignError('Signature rejected — try again to continue.');
      else
        setSignError('Sign-in failed. Please try again.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleRetrySign = async () => {
    setSignError('');
    if (wallet) {
      try { await authClient.signOut().catch(() => {}); disconnect(wallet); } catch {}
    }
  };

  const handleRegister = async () => {
    if (!referrer || !account) return;
    setTxError(''); setTxHash('');

    try {
      const usdtContract  = await usdtContractInstance(account);
      const ficonContract = await contractInstance(account);
      if (!usdtContract)  throw new Error('Could not initialize USDT contract');
      if (!ficonContract) throw new Error('Could not initialize contract');

      const requiredAmount = ethers.utils.parseUnits(PACKAGE_1_PRICE_USDT, 18);

      setTxState('checking-allowance');
      const currentAllowance: ethers.BigNumber = await usdtContract.allowance(
        account.address, ficonContract.address,
      );

      if (currentAllowance.lt(requiredAmount)) {
        setTxState('approving');
        const approveTx = await usdtContract.approve(ficonContract.address, requiredAmount);
        setTxState('approve-mining');
        setTxHash(approveTx.hash);
        await approveTx.wait(1);
      }

      setTxState('pending');
      setTxHash('');
      const tx = await ficonContract.registrations(account.address, referrer.userAddress);
      setTxState('mining');
      setTxHash(tx.hash);
      await tx.wait(1);
      setTxState('success');

      fetch(`${API}/api/register/fallback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ transactionHash: tx.hash }),
      }).catch(() => {});

      setTimeout(() => navigate({ to: '/dashboard' as any }), 2800);

    } catch (err: any) {
      console.log('error ', err);
      setTxState('error');
      const msg: string = err?.reason ?? err?.data?.message ?? err?.message ?? '';
      if (msg.toLowerCase().includes('user rejected') || msg.includes('4001'))
        setTxError('You rejected the transaction.');
      else if (msg.toLowerCase().includes('already'))
        setTxError('This wallet is already registered.');
      else if (msg.toLowerCase().includes('insufficient'))
        setTxError(`Insufficient USDT balance. You need at least ${PACKAGE_1_PRICE_USDT} USDT.`);
      else if (msg.toLowerCase().includes('referal') || msg.toLowerCase().includes('referral'))
        setTxError('Invalid sponsor address. Please check the referral ID.');
      else
        setTxError(msg.slice(0, 130) || 'Transaction failed. Please try again.');
    }
  };

  const isBusy = ['checking-allowance','approving','approve-mining','pending','mining'].includes(txState);
  const isApprovalPhase = txState === 'approving' || txState === 'approve-mining';
  const isSuccess   = txState === 'success';
  const canRegister = !!account?.address && hasSession && !!referrer && !isBusy && !isSuccess;

  const stages = [
    { label: 'Wallet' }, { label: 'Sign' }, { label: 'Referral' }, { label: 'Sponsor' }, { label: 'Join' },
  ];

  const stageTitle = ['Connect', 'Sign-in', 'Have a referral?', 'Your sponsor', 'Confirm'][step - 1];

  // ── Floating CTA — step 4 "Continue" after referrer validated, step 5 "Join"
  let primaryAction: { label: JSX.Element; onClick: () => void; disabled: boolean } | null = null;
  if (step === 4 && referrer) {
    primaryAction = {
      label:    <>Continue<ArrowRight size={16} /></>,
      onClick:  () => setStep(5),
      disabled: false,
    };
  } else if (step === 5 && !isSuccess) {
    primaryAction = {
      label: isBusy
        ? (isApprovalPhase
            ? <><Coins size={16} className="animate-pulse" />{txState === 'approving' ? 'Confirm approval…' : 'Approving…'}</>
            : <><Loader2 size={16} className="animate-spin" />{txState === 'pending' ? 'Confirm in wallet…' : 'Joining…'}</>)
        : <><ShieldCheck size={16} />Join FutureRide<ArrowRight size={16} /></>,
      onClick:  handleRegister,
      disabled: !canRegister,
    };
  }

  return (
    <div className="min-h-screen bg-[#040a14] flex flex-col selection:bg-[rgba(56,189,248,0.25)] selection:text-white">
      {/* ambient backdrop */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[560px] h-[420px]"
          style={{ background: 'radial-gradient(ellipse at center, rgba(56,189,248,0.09) 0%, transparent 65%)' }}
        />
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: 'radial-gradient(rgba(125,211,252,0.05) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            maskImage: 'radial-gradient(ellipse at top, black 15%, transparent 70%)',
          }}
        />
      </div>

      {/* header */}
      <header className="relative z-10 flex items-center justify-between px-5 sm:px-8 h-[56px] border-b border-white/[0.06]">
        <a href="/" className="flex items-center gap-2 font-mono text-[11px] text-white/40 hover:text-[#7dd3fc] transition-colors tracking-wide">
          <span className="w-1.5 h-1.5 rotate-45 bg-[#38bdf8]" />
          futureride.live
        </a>
        <span className="flex items-center gap-1.5 font-mono text-[9.5px] text-white/35 tracking-[0.1em] uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" style={{ boxShadow: '0 0 6px rgba(34,197,94,0.7)' }} />
          BNB Mainnet
        </span>
      </header>

      <main className="flex-1 flex flex-col px-5 sm:px-8 pt-7 pb-32 max-w-[460px] w-full mx-auto">

        {/* waypoint rail */}
        <div className="mb-7">
          <WaypointRail stages={stages} current={step} />
        </div>

        {/* dial */}
        <div className="flex flex-col items-center mb-8">
          <AltitudeDial
            step={step}
            sponsorLabel={referrer ? referrer.futureRideId : null}
            isSuccess={isSuccess}
          />
          <h1 className="mt-5 mb-0 text-[20px] font-bold text-white tracking-[-0.01em] text-center">
            {isSuccess ? 'Position locked' : stageTitle}
          </h1>
          <p className="mt-1 mb-0 text-[13px] text-white/40 text-center max-w-[300px]">
            {isSuccess
              ? 'Your node is registered on-chain. Redirecting…'
              : 'Five checks to lock your position beneath your sponsor — fully on-chain.'}
          </p>
        </div>

        {/* ── stage panels ── */}
        <div className="flex flex-col gap-4 mt-24 lg:mt-0">

          {/* step 1 — connect wallet */}
          {step === 1 && (
            <Panel index={1} title="Wallet">
              <p className="mt-0 mb-4 text-[13px] text-white/45 leading-relaxed">
                MetaMask, Trust Wallet, or any WalletConnect-compatible wallet on BNB Chain.
              </p>
              <div className="[&>div]:!w-full [&>div>button]:!w-full">
                <ConnectButton
                  client={client}
                  chains={[bsc]}
                  theme={darkTheme({ colors: { primaryButtonBg: '#38bdf8' } })}
                  connectButton={{
                    label: 'Connect wallet',
                    style: {
                      width: '100%', height: '52px', borderRadius: '10px',
                      color: '#04111f', fontWeight: 700, fontSize: '14.5px',
                      background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 60%, #7dd3fc 100%)',
                      boxShadow: '0 0 24px rgba(56,189,248,0.22)',
                    },
                  }}
                  connectModal={{ size: 'compact' }}
                  wallets={wallets}
                  onConnect={handleConnect}
                />
              </div>
            </Panel>
          )}

          {/* step 2 — sign-in */}
          {step === 2 && (
            <Panel index={2} title="Sign-in">
              <p className="mt-0 mb-4 text-[13px] text-white/45 leading-relaxed">
                Sign a free message to prove this wallet is yours. No gas, no transaction.
              </p>
              <div className="flex items-center justify-between px-3.5 py-3 rounded-lg border border-white/[0.08] bg-black/25 mb-3">
                <div className="flex items-center gap-2.5">
                  <WalletIcon size={14} className="text-[#38bdf8]" />
                  <span className="font-mono text-[9px] tracking-[0.14em] uppercase text-white/35">connected</span>
                </div>
                <span className="font-mono text-[12.5px] text-white">{account ? shortAddr(account.address) : ''}</span>
              </div>

              {signingIn ? (
                <div className="flex items-center gap-2.5 px-4 py-3.5 rounded-lg border border-[#38bdf8]/20 bg-[rgba(56,189,248,0.04)] justify-center">
                  <Loader2 size={14} className="text-[#38bdf8] animate-spin shrink-0" />
                  <span className="font-mono text-[12px] text-white/55">awaiting signature…</span>
                </div>
              ) : (
                <button
                  data-testid="sign-in-retry-btn"
                  onClick={handleRetrySign}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg border border-[#38bdf8]/35 bg-[rgba(56,189,248,0.08)] font-semibold text-[13.5px] text-[#7dd3fc] hover:bg-[rgba(56,189,248,0.14)] transition-all active:scale-[0.98]"
                >
                  <PenLine size={14} />
                  Reconnect to sign
                </button>
              )}
              {signError && <p className="m-0 mt-3 text-center text-[11.5px] text-[#fb7185]/85">{signError}</p>}
            </Panel>
          )}

          {/* ─────────────────────────────────────────────────────
              step 3 — "Do you have a referral ID?" gate
              "No" pre-fills the input with DEFAULT_REFERRAL_ID and
              opens the same sponsor panel as "Yes" — the ReferralInput
              validates it automatically via its own debounced effect.
              ───────────────────────────────────────────────────── */}
          {step === 3 && (
            <Panel index={3} title="Referral">
              <div className="flex flex-col items-center text-center gap-5 py-2">
                <div className="w-14 h-14 rounded-2xl bg-[#38bdf8]/10 border border-[#38bdf8]/30 flex items-center justify-center">
                  <HelpCircle size={26} className="text-[#7dd3fc]" />
                </div>
                <div>
                  <h2 className="m-0 text-[18px] font-bold text-white leading-tight">
                    Do you have a referral ID?
                  </h2>
                  <p className="mt-2 mb-0 text-[13px] text-white/50 leading-relaxed max-w-[300px] mx-auto">
                    If someone invited you, enter their ID. If not, we'll place you under a default sponsor.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full">
                  {/* YES */}
                  <button
                    data-testid="referral-yes-btn"
                    onClick={() => setReferralChoice('yes')}
                    className="group relative overflow-hidden flex flex-col items-center gap-2.5 py-5 px-4 rounded-2xl border-2 border-[#38bdf8]/40 bg-[#38bdf8]/08 hover:border-[#38bdf8] hover:bg-[#38bdf8]/15 transition-all active:scale-[0.97]"
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#38bdf8]/15 border border-[#38bdf8]/35 flex items-center justify-center">
                      <ThumbsUp size={20} className="text-[#7dd3fc]" />
                    </div>
                    <div>
                      <p className="m-0 text-[15px] font-bold text-white leading-none">Yes</p>
                      <p className="m-0 mt-1 text-[11px] font-mono text-white/50">I have a referral ID</p>
                    </div>
                  </button>

                  {/* NO — pre-fills DEFAULT_REFERRAL_ID into the input */}
                  <button
                    data-testid="referral-no-btn"
                    onClick={handleNoReferral}
                    className="group relative overflow-hidden flex flex-col items-center gap-2.5 py-5 px-4 rounded-2xl border-2 border-white/15 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.07] transition-all active:scale-[0.97]"
                  >
                    <div className="w-11 h-11 rounded-xl bg-white/[0.06] border border-white/15 flex items-center justify-center">
                      <ThumbsDown size={20} className="text-white/60" />
                    </div>
                    <div>
                      <p className="m-0 text-[15px] font-bold text-white leading-none">No</p>
                      <p className="m-0 mt-1 text-[11px] font-mono text-white/50">Use default sponsor</p>
                    </div>
                  </button>
                </div>
              </div>
            </Panel>
          )}

          {/* step 4 — sponsor input, shown for BOTH yes and no paths.
              When "No" was chosen, referralId is already pre-filled with
              DEFAULT_REFERRAL_ID and the ReferralInput validates it
              automatically — the user sees the ID, the spinner, then
              the green "verified" row. "Yes" starts with an empty field. */}
          {step === 4 && referralChoice === 'yes' && (
            <Panel index={4} title="Sponsor">
              <p className="mt-0 mb-4 text-[13px] text-white/45 leading-relaxed">
                {referralId === DEFAULT_REFERRAL_ID
                  ? 'You\'ll be placed under the default sponsor. You can change the ID below if you have one.'
                  : 'Enter the Future Ride ID of the person who invited you.'}
              </p>
              <ReferralInput
                value={referralId}
                onChange={v => { setReferralId(v); setReferrer(null); }}
                onValidated={setReferrer}
                disabled={checkingReg}
              />
              <button
                onClick={() => { setReferralChoice(null); setReferralId(''); setReferrer(null); }}
                className="mt-4 text-[12px] font-mono text-white/35 hover:text-white/65 transition-colors flex items-center gap-1.5"
              >
                ← Back to referral question
              </button>
            </Panel>
          )}

          {/* step 5 — confirm & register */}
          {step === 5 && !isSuccess && (
            <Panel index={5} title="Confirm">
              <p className="mt-0 mb-4 text-[13px] text-white/45 leading-relaxed">
                Two wallet confirmations: approve {PACKAGE_1_PRICE_USDT} USDT, then register on-chain.
              </p>

              {account && referrer && (
                <div className="rounded-lg border border-white/[0.08] overflow-hidden mb-3">
                  {[
                    { label: 'Wallet',     value: shortAddr(account.address) },
                    { label: 'Sponsor',    value: referrer.displayAddress    },
                    { label: 'Sponsor ID', value: referrer.futureRideId      },
                    { label: 'Cost',       value: `${PACKAGE_1_PRICE_USDT} USDT` },
                    { label: 'Via',        value: referralId === DEFAULT_REFERRAL_ID ? 'Default sponsor' : 'Personal referral' },
                  ].map(({ label, value }, i, arr) => (
                    <div
                      key={label}
                      className={`flex items-center justify-between px-3.5 py-2.5 ${i < arr.length - 1 ? 'border-b border-white/[0.05]' : ''}`}
                    >
                      <span className="text-[10.5px] font-mono tracking-[0.08em] uppercase text-white/35">{label}</span>
                      <span className={`text-[12.5px] font-medium font-mono truncate ml-3 ${label === 'Via' && referralId === DEFAULT_REFERRAL_ID ? 'text-[#7dd3fc]' : 'text-white'}`}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {txState !== 'idle' && <TxBanner state={txState} txHash={txHash} error={txError} />}
            </Panel>
          )}

          {step === 5 && isSuccess && (
            <Panel index={5} title="Confirmed">
              <TxBanner state={txState} txHash={txHash} error={txError} />
            </Panel>
          )}
        </div>

        {account && hasSession && !checkingReg && !regInfo?.isRegistered && !isBusy && step < 5 && (
          <p className="text-center mt-6 text-[12px] text-white/35">
            Already registered?{' '}
            <button
              onClick={() => navigate({ to: '/dashboard' as any })}
              className="text-[#7dd3fc]/85 hover:text-[#7dd3fc] transition-colors underline-offset-4 hover:underline font-medium"
            >
              Go to dashboard
            </button>
          </p>
        )}
      </main>

      {/* floating capsule CTA */}
      {primaryAction && !isSuccess && (
        <div className="fixed bottom-0 inset-x-0 z-20 px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-6 pointer-events-none">
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[140px]"
            style={{ background: 'linear-gradient(to top, #040a14 55%, transparent)' }}
          />
          <div className="relative max-w-[460px] mx-auto pointer-events-auto">
            <button
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
              className={[
                'group relative w-full overflow-hidden flex items-center justify-center gap-2.5 py-4 rounded-full font-bold text-[14.5px] tracking-wide transition-all duration-200 active:scale-[0.98] border',
                !primaryAction.disabled
                  ? 'text-[#04111f] cursor-pointer border-transparent'
                  : 'bg-white/[0.04] text-white/25 cursor-not-allowed border-white/[0.08]',
              ].join(' ')}
              style={!primaryAction.disabled ? {
                background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 50%, #7dd3fc 100%)',
                boxShadow: '0 10px 30px rgba(56,189,248,0.32)',
              } : undefined}
            >
              {!primaryAction.disabled && (
                <span
                  className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"
                  style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)' }}
                />
              )}
              <span className="relative inline-flex items-center gap-2.5">{primaryAction.label}</span>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap');
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  TX BANNER
// ─────────────────────────────────────────────────────────
function TxBanner({ state, txHash, error }: { state: TxState; txHash: string; error: string }) {
  if (state === 'idle') return null;

  if (state === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <div
          className="relative w-[56px] h-[56px] rounded-full bg-[rgba(34,197,94,0.12)] border border-[#22c55e]/35 flex items-center justify-center"
          style={{ boxShadow: '0 0 30px rgba(34,197,94,0.22)' }}
        >
          <CheckCircle2 size={26} className="text-[#22c55e]" />
        </div>
        <div>
          <p className="m-0 text-[15px] font-bold text-white">You're in.</p>
          <p className="m-0 mt-1 font-mono text-[11.5px] text-white/45">Taking you to your dashboard…</p>
          {txHash && (
            <a href={`https://bscscan.com/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-[11px] font-mono text-white/40 hover:text-white/75 transition-colors">
              {txHash.slice(0,12)}… <ExternalLink size={9} />
            </a>
          )}
        </div>
      </div>
    );
  }

  const map: Record<Exclude<TxState, 'idle' | 'success'>, { cls: string; icon: JSX.Element; msg: string }> = {
    'checking-allowance': { cls: 'border-[#38bdf8]/25 bg-[rgba(56,189,248,0.04)]', icon: <Loader2 size={14} className="text-[#38bdf8] animate-spin shrink-0 mt-0.5" />, msg: 'Checking USDT allowance…' },
    approving:            { cls: 'border-[#38bdf8]/25 bg-[rgba(56,189,248,0.04)]', icon: <Loader2 size={14} className="text-[#38bdf8] animate-spin shrink-0 mt-0.5" />, msg: `Confirm USDT approval (${PACKAGE_1_PRICE_USDT} USDT) in your wallet…` },
    'approve-mining':     { cls: 'border-[#38bdf8]/25 bg-[rgba(56,189,248,0.04)]', icon: <Loader2 size={14} className="text-[#38bdf8] animate-spin shrink-0 mt-0.5" />, msg: 'Approval submitted — confirming…' },
    pending:              { cls: 'border-[#38bdf8]/25 bg-[rgba(56,189,248,0.04)]', icon: <Loader2 size={14} className="text-[#38bdf8] animate-spin shrink-0 mt-0.5" />, msg: 'Confirm registration in your wallet…' },
    mining:               { cls: 'border-[#38bdf8]/25 bg-[rgba(56,189,248,0.04)]', icon: <Loader2 size={14} className="text-[#38bdf8] animate-spin shrink-0 mt-0.5" />, msg: 'Submitted — confirming on-chain…' },
    error:                { cls: 'border-[#fb7185]/30 bg-[rgba(251,113,133,0.04)]', icon: <AlertCircle size={14} className="text-[#fb7185] shrink-0 mt-0.5" />,  msg: error || 'Transaction failed' },
  };
  const c = map[state as Exclude<TxState, 'idle' | 'success'>];
  return (
    <div className={`flex items-start gap-3 px-3.5 py-3.5 rounded-lg border ${c.cls}`}>
      {c.icon}
      <div className="flex-1 min-w-0">
        <p className="m-0 text-[12.5px] text-white/85">{c.msg}</p>
        {txHash && (
          <a href={`https://bscscan.com/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-mono text-white/40 hover:text-white/75 transition-colors">
            {txHash.slice(0,12)}… <ExternalLink size={9} />
          </a>
        )}
      </div>
    </div>
  );
}
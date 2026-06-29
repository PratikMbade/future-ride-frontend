/* eslint-disable no-empty */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { useState, useEffect, useRef, type JSX } from 'react';
import { useActiveAccount, ConnectButton, darkTheme } from 'thirdweb/react';
import { bsc } from 'thirdweb/chains';
import { createWallet, type Wallet } from 'thirdweb/wallets';
import { ethers } from 'ethers';
import {
  CheckCircle2, XCircle, Loader2, ArrowRight, AlertCircle,
  Hash, ShieldCheck, ExternalLink, Search, UserPlus, Package, Zap,
} from 'lucide-react';
import { contractInstance, FUTURE_RIDE_CONTRACT_ADDRESS } from '@/contract/contract';
import { usdtContractInstance } from '@/contract/usdt/usdtContract';
import { client } from '@/lib/client';

const API = import.meta.env.VITE_API_URL;
const PACKAGE_1_PRICE_USDT = '5';
const FUTURE_RIDE_ID_RE = /^fr[a-f0-9]{6,}$/i;

function shortAddr(a: string) { return `${a.slice(0,6)}…${a.slice(-4)}`; }
function usd(n: number) { return `$${n.toLocaleString()}`; }

const wallets = [
  createWallet('io.metamask'),
  createWallet('com.coinbase.wallet'),
  createWallet('pro.tokenpocket'),
  createWallet('com.trustwallet.app'),
  createWallet('com.safepal'),
  createWallet('com.binance.wallet'),
];

// price/name table for levels 2–12 — the "buy for other user" flow
// never touches level 1, since that's what registration itself covers
const PKGS: Record<number, { price: number; headline: string }> = {
  2:  { price: 10,    headline: 'Foundation' },
  3:  { price: 20,    headline: 'Builder' },
  4:  { price: 40,    headline: 'Leverage' },
  5:  { price: 80,    headline: 'Growth' },
  6:  { price: 160,   headline: 'Momentum' },
  7:  { price: 320,   headline: 'Accelerator' },
  8:  { price: 640,   headline: 'Elite' },
  9:  { price: 1280,  headline: 'Apex' },
  10: { price: 2560,  headline: 'Summit' },
  11: { price: 5120,  headline: 'Vanguard' },
  12: { price: 10240, headline: 'Pinnacle' },
};

interface ReferralInfo {
  valid: boolean; userAddress: string;
  displayAddress: string; futureRideId: string; highestPackage: number;
}

interface LookupInfo {
  userAddress: string; isRegistered: boolean;
  futureRideId: string | null; highestPackage: number; nextPackage: number | null;
}

type TxState =
  | 'idle' | 'checking-allowance' | 'approving' | 'approve-mining'
  | 'pending' | 'mining' | 'success' | 'error';

/* ──────────────────────────────────────────────────────────
   PANEL — bracket-cornered console card, shared visual language
   with the registration / login pages. Text inside is always
   solid white — never dimmed — per this tool's readability bar.
   ────────────────────────────────────────────────────────── */
function Panel({ index, title, icon: Icon, children }: {
  index: number; title: string; icon: any; children: React.ReactNode;
}) {
  return (
    <div className="relative rounded-2xl border-2 border-[#38bdf8]/30 bg-[#081421] px-5 py-6 sm:px-7 sm:py-7">
      {['-top-px -left-px border-t-[3px] border-l-[3px] rounded-tl-2xl','-top-px -right-px border-t-[3px] border-r-[3px] rounded-tr-2xl','-bottom-px -left-px border-b-[3px] border-l-[3px] rounded-bl-2xl','-bottom-px -right-px border-b-[3px] border-r-[3px] rounded-br-2xl'].map((c, i) => (
        <span key={i} className={`pointer-events-none absolute w-4 h-4 border-[#38bdf8] ${c}`} />
      ))}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-[#38bdf8]/15 border border-[#38bdf8]/40 flex items-center justify-center shrink-0">
          <Icon size={17} className="text-[#7dd3fc]" />
        </div>
        <div>
          <span className="block font-mono text-[11px] font-bold tracking-[0.16em] uppercase text-[#7dd3fc]">
            Step {String(index).padStart(2, '0')}
          </span>
          <span className="block text-[16px] font-bold text-white leading-tight">{title}</span>
        </div>
      </div>
      {children}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   ADDRESS FIELD — shared text input for "0x…" wallet addresses
   ────────────────────────────────────────────────────────── */
function AddressField({ label, value, onChange, isValid, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  isValid: boolean; placeholder?: string;
}) {
  const showState = value.length > 0;
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[14px] font-bold text-white">{label}</label>
      <div className={[
        'relative flex items-center rounded-xl border-2 bg-black/40 transition-colors',
        showState ? (isValid ? 'border-[#22c55e]' : 'border-[#fb7185]') : 'border-[#38bdf8]/35 focus-within:border-[#38bdf8]',
      ].join(' ')}>
        <Hash size={18} className="absolute left-4 text-[#7dd3fc]" />
        <input
          value={value}
          onChange={e => onChange(e.target.value.trim())}
          placeholder={placeholder ?? '0x0000000000000000000000000000000000000000'}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className="w-full bg-transparent pl-11 pr-11 py-4 text-[15px] font-mono font-medium text-white placeholder-white/40 outline-none tracking-[0.01em]"
        />
        {showState && (
          <span className="absolute right-4">
            {isValid ? <CheckCircle2 size={18} className="text-[#22c55e]" /> : <XCircle size={18} className="text-[#fb7185]" />}
          </span>
        )}
      </div>
      {showState && !isValid && (
        <p className="m-0 text-[13px] font-semibold text-[#fb7185]">Enter a valid wallet address (0x + 40 hex chars)</p>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   STATUS BANNER — shared tx/lookup feedback strip
   ────────────────────────────────────────────────────────── */
function StatusBanner({ tone, icon: Icon, children, txHash }: {
  tone: 'info' | 'success' | 'error'; icon: any; children: React.ReactNode; txHash?: string;
}) {
  const cls = {
    info:    'border-[#38bdf8] bg-[#38bdf8]/10',
    success: 'border-[#22c55e] bg-[#22c55e]/10',
    error:   'border-[#fb7185] bg-[#fb7185]/10',
  }[tone];
  const iconCls = {
    info: 'text-[#7dd3fc]', success: 'text-[#22c55e]', error: 'text-[#fb7185]',
  }[tone];

  return (
    <div className={`flex items-start gap-3 px-4 py-4 rounded-xl border-2 ${cls}`}>
      <Icon size={20} className={`${iconCls} shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <p className="m-0 text-[14px] font-semibold text-white leading-snug">{children}</p>
        {txHash && (
          <a href={`https://bscscan.com/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-2 text-[13px] font-mono font-semibold text-[#7dd3fc] hover:text-white transition-colors">
            {shortAddr(txHash)} <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   PRIMARY BUTTON — solid sky gradient, dark text, big tap target
   ────────────────────────────────────────────────────────── */
function PrimaryButton({ onClick, disabled, children }: {
  onClick: () => void; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        'group relative w-full overflow-hidden flex items-center justify-center gap-2.5 py-4 rounded-full font-bold text-[16px] transition-all active:scale-[0.98]',
        disabled ? 'bg-white/10 text-white/50 cursor-not-allowed border-2 border-white/15' : 'text-[#04111f] cursor-pointer',
      ].join(' ')}
      style={!disabled ? {
        background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 50%, #7dd3fc 100%)',
        boxShadow: '0 8px 30px rgba(56,189,248,0.35)',
      } : undefined}
    >
      {!disabled && (
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)' }} />
      )}
      <span className="relative inline-flex items-center gap-2.5">{children}</span>
    </button>
  );
}

/* ──────────────────────────────────────────────────────────
   TAB 1 — REGISTER OTHER USER
   ────────────────────────────────────────────────────────── */
function RegisterOtherUserTab({ account }: { account: any }) {
  const [targetAddress, setTargetAddress] = useState('');
  const [referralId,    setReferralId]    = useState('');
  const [referrer,      setReferrer]      = useState<ReferralInfo | null>(null);
  const [refStatus,     setRefStatus]     = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle');
  const [txState,       setTxState]       = useState<TxState>('idle');
  const [txHash,        setTxHash]        = useState('');
  const [txError,       setTxError]       = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addressValid = ethers.utils.isAddress(targetAddress);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const v = referralId.trim();
    if (!v || !FUTURE_RIDE_ID_RE.test(v)) {
      setRefStatus('idle'); setReferrer(null); return;
    }
    setRefStatus('loading');
    timer.current = setTimeout(async () => {
      try {
        const res  = await fetch(`${API}/api/register/validate/${encodeURIComponent(v)}`, { credentials: 'include' });
        const data = await res.json();
        if (data.valid) { setRefStatus('valid'); setReferrer(data); }
        else            { setRefStatus('invalid'); setReferrer(null); }
      } catch { setRefStatus('invalid'); setReferrer(null); }
    }, 600);
  }, [referralId]);

  const isBusy = ['checking-allowance', 'approving', 'approve-mining', 'pending', 'mining'].includes(txState);
  const isSuccess = txState === 'success';
  const canSubmit = addressValid && !!referrer && account && !isBusy && !isSuccess;

  const handleRegisterOther = async () => {
    if (!referrer || !account || !addressValid) return;
    setTxError(''); setTxHash('');

    try {
      const usdtContract  = await usdtContractInstance(account);
      const ficonContract = await contractInstance(account);
      if (!usdtContract)  throw new Error('Could not initialize USDT contract');
      if (!ficonContract) throw new Error('Could not initialize contract');

      const requiredAmount = ethers.utils.parseUnits(PACKAGE_1_PRICE_USDT, 18);

      setTxState('checking-allowance');
      const currentAllowance: ethers.BigNumber = await usdtContract.allowance(
        account.address,
        ficonContract.address,
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
      // first arg is the user BEING registered (target), not the admin
      // wallet paying for it — second is the sponsor's on-chain address
      const tx = await ficonContract.registrations(targetAddress, referrer.userAddress);
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

    } catch (err: any) {
      setTxState('error');
      const msg: string = err?.reason ?? err?.data?.message ?? err?.message ?? '';
      if (msg.toLowerCase().includes('user rejected') || msg.includes('4001'))
        setTxError('You rejected the transaction.');
      else if (msg.toLowerCase().includes('already'))
        setTxError('This address is already registered.');
      else if (msg.toLowerCase().includes('insufficient'))
        setTxError(`Insufficient USDT balance in your connected wallet. Need at least ${PACKAGE_1_PRICE_USDT} USDT.`);
      else if (msg.toLowerCase().includes('referal') || msg.toLowerCase().includes('referral'))
        setTxError('Invalid sponsor address. Please check the referral ID.');
      else
        setTxError(msg.slice(0, 150) || 'Transaction failed. Please try again.');
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <Panel index={1} title="Target wallet" icon={UserPlus}>
        <p className="m-0 mb-4 text-[14px] font-medium text-white leading-relaxed">
          The wallet address you want to register. Your connected wallet pays the {PACKAGE_1_PRICE_USDT} USDT registration fee on their behalf.
        </p>
        <AddressField
          label="User address to register"
          value={targetAddress}
          onChange={setTargetAddress}
          isValid={addressValid}
        />
      </Panel>

      <Panel index={2} title="Sponsor" icon={Hash}>
        <p className="m-0 mb-4 text-[14px] font-medium text-white leading-relaxed">
          Enter the sponsor's referral Future Ride ID. This is who the target wallet gets placed under.
        </p>
        <div className="flex flex-col gap-2">
          <label className="text-[14px] font-bold text-white">Referral Future Ride ID</label>
          <div className={[
            'relative flex items-center rounded-xl border-2 bg-black/40 transition-colors',
            refStatus === 'valid' ? 'border-[#22c55e]' : refStatus === 'invalid' ? 'border-[#fb7185]' : 'border-[#38bdf8]/35 focus-within:border-[#38bdf8]',
          ].join(' ')}>
            <Hash size={18} className="absolute left-4 text-[#7dd3fc]" />
            <input
              value={referralId}
              onChange={e => setReferralId(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16))}
              placeholder="FR76b85b17"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              className="w-full bg-transparent pl-11 pr-11 py-4 text-[15px] font-mono font-medium text-white placeholder-white/40 outline-none tracking-[0.04em]"
            />
            <span className="absolute right-4">
              {refStatus === 'loading' && <Loader2 size={18} className="text-[#7dd3fc] animate-spin" />}
              {refStatus === 'valid'   && <CheckCircle2 size={18} className="text-[#22c55e]" />}
              {refStatus === 'invalid' && <XCircle size={18} className="text-[#fb7185]" />}
            </span>
          </div>

          {refStatus === 'valid' && referrer && (
            <div className="flex items-center justify-between px-4 py-3 rounded-xl border-2 border-[#22c55e] bg-[#22c55e]/10 mt-1">
              <span className="text-[14px] font-mono font-semibold text-white">{referrer.displayAddress}</span>
              <span className="text-[14px] font-mono font-bold text-white">{referrer.futureRideId}</span>
            </div>
          )}
          {refStatus === 'invalid' && referralId.length > 0 && (
            <p className="m-0 text-[13px] font-semibold text-[#fb7185] mt-1">Referral ID not found or sponsor not registered</p>
          )}
        </div>
      </Panel>

      <Panel index={3} title="Confirm & register" icon={ShieldCheck}>
        {!account ? (
          <div className="flex flex-col gap-3">
            <p className="m-0 text-[14px] font-medium text-white">Connect your wallet to pay and sign this registration.</p>
            <div className="[&>div]:!w-full [&>div>button]:!w-full">
              <ConnectButton
                client={client}
                chains={[bsc]}
                theme={darkTheme({ colors: { primaryButtonBg: '#38bdf8' } })}
                connectButton={{
                  label: 'Connect wallet',
                  style: {
                    width: '100%', height: '52px', borderRadius: '999px',
                    color: '#04111f', fontWeight: 700, fontSize: '16px',
                    background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 50%, #7dd3fc 100%)',
                    boxShadow: '0 0 26px rgba(56,189,248,0.3)',
                  },
                }}
                connectModal={{ size: 'compact' }}
                wallets={wallets}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border-2 border-white/15 overflow-hidden">
              {[
                { label: 'Paying wallet', value: shortAddr(account.address) },
                { label: 'Registering',   value: addressValid ? shortAddr(targetAddress) : '—' },
                { label: 'Sponsor',       value: referrer?.futureRideId ?? '—' },
                { label: 'Cost',          value: `${PACKAGE_1_PRICE_USDT} USDT` },
              ].map(({ label, value }, i, arr) => (
                <div key={label} className={`flex items-center justify-between px-4 py-3 ${i < arr.length - 1 ? 'border-b-2 border-white/10' : ''}`}>
                  <span className="text-[13px] font-bold text-white">{label}</span>
                  <span className="text-[14px] font-mono font-semibold text-white">{value}</span>
                </div>
              ))}
            </div>

            {txState !== 'idle' && (
              isSuccess ? (
                <StatusBanner tone="success" icon={CheckCircle2} txHash={txHash}>
                  Registered on-chain. The fallback sync has been notified.
                </StatusBanner>
              ) : txState === 'error' ? (
                <StatusBanner tone="error" icon={AlertCircle}>{txError || 'Transaction failed'}</StatusBanner>
              ) : (
                <StatusBanner tone="info" icon={Loader2} txHash={txHash}>
                  {txState === 'checking-allowance' && 'Checking USDT allowance…'}
                  {txState === 'approving' && `Confirm USDT approval (${PACKAGE_1_PRICE_USDT} USDT) in your wallet…`}
                  {txState === 'approve-mining' && 'Approval submitted — confirming…'}
                  {txState === 'pending' && 'Confirm registration in your wallet…'}
                  {txState === 'mining' && 'Submitted — confirming on-chain…'}
                </StatusBanner>
              )
            )}

            {!isSuccess && (
              <PrimaryButton onClick={handleRegisterOther} disabled={!canSubmit}>
                {isBusy
                  ? <><Loader2 size={18} className="animate-spin" />Processing…</>
                  : <><UserPlus size={18} />Register this wallet<ArrowRight size={18} /></>}
              </PrimaryButton>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   TAB 2 — BUY PACKAGE FOR OTHER USER
   ────────────────────────────────────────────────────────── */
function BuyPackageOtherUserTab({ account }: { account: any }) {
  const [targetAddress, setTargetAddress] = useState('');
  const [lookup,        setLookup]        = useState<LookupInfo | null>(null);
  const [lookupStatus,  setLookupStatus]  = useState<'idle' | 'loading' | 'found' | 'not-found' | 'error'>('idle');
  const [step,          setStep]          = useState<'idle' | 'approving' | 'approved' | 'buying' | 'done' | 'error'>('idle');
  const [txHash,        setTxHash]        = useState('');
  const [errorMsg,      setErrorMsg]      = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addressValid = ethers.utils.isAddress(targetAddress);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    setStep('idle'); setTxHash(''); setErrorMsg('');
    if (!addressValid) { setLookup(null); setLookupStatus('idle'); return; }

    setLookupStatus('loading');
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/api/packages/lookup/${targetAddress}`, { credentials: 'include' });
        if (res.status === 404) { setLookup(null); setLookupStatus('not-found'); return; }
        if (!res.ok) { setLookup(null); setLookupStatus('error'); return; }
        const data = await res.json();
        setLookup(data); setLookupStatus('found');
      } catch { setLookup(null); setLookupStatus('error'); }
    }, 600);
  }, [targetAddress]);

  const nextLevel = lookup ? Math.max(lookup.highestPackage + 1, 2) : null;
  const nextPkg   = nextLevel && nextLevel <= 12 ? PKGS[nextLevel] : null;
  const blockedNoRegistration = lookup && lookup.highestPackage === 0;
  const blockedMaxed = lookup && lookup.highestPackage >= 12;

  const handleApprove = async () => {
    if (!account || !nextPkg) return;
    setStep('approving'); setErrorMsg('');
    try {
      const usdt = await usdtContractInstance(account);
      if (!usdt) throw new Error('Could not initialize USDT contract');
      const amount = ethers.utils.parseUnits(nextPkg.price.toString(), 18);
      const allowance: ethers.BigNumber = await usdt.allowance(account.address, FUTURE_RIDE_CONTRACT_ADDRESS);
      if (allowance.lt(amount)) {
        const tx = await usdt.approve(FUTURE_RIDE_CONTRACT_ADDRESS, amount);
        await tx.wait();
      }
      setStep('approved');
    } catch (err: any) {
      setStep('error');
      const msg = err?.code === 4001 || err?.message?.includes('user rejected')
        ? 'You rejected the approval in your wallet.'
        : (err?.message ?? 'Approval failed. Please try again.');
      setErrorMsg(msg);
    }
  };

  const handleActivate = async () => {
    if (!account || !nextPkg || !addressValid || !nextLevel) return;
    setStep('buying'); setErrorMsg('');
    try {
      const contract = await contractInstance(account);
      if (!contract) throw new Error('Could not initialize contract');
      const tx = await contract.packageBuy_user(targetAddress, false);
      setTxHash(tx.hash);
      await tx.wait();
      setStep('done');

      fetch(`${API}/api/packages/buy-for`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userAddress:     targetAddress,
          packageNumber:   nextLevel,
          transactionHash: tx.hash,
        }),
      }).catch(() => {});

    } catch (err: any) {
      setStep('error');
      const msg = err?.code === 4001 || err?.message?.includes('user rejected')
        ? 'You rejected the transaction in your wallet.'
        : err?.message?.includes('insufficient')
          ? 'Insufficient USDT balance in your connected wallet.'
          : (err?.message ?? 'Transaction failed. Please try again.');
      setErrorMsg(msg);
    }
  };

  const isBusy = step === 'approving' || step === 'buying';

  return (
    <div className="flex flex-col gap-5">
      <Panel index={1} title="Target wallet" icon={Search}>
        <p className="m-0 mb-4 text-[14px] font-medium text-white leading-relaxed">
          Enter the wallet address you want to buy the next package for. Your connected wallet pays the USDT.
        </p>
        <AddressField
          label="User address"
          value={targetAddress}
          onChange={setTargetAddress}
          isValid={addressValid}
        />

        {lookupStatus === 'loading' && (
          <div className="mt-4">
            <StatusBanner tone="info" icon={Loader2}>Looking up this wallet's package status…</StatusBanner>
          </div>
        )}
        {lookupStatus === 'not-found' && (
          <div className="mt-4">
            <StatusBanner tone="error" icon={AlertCircle}>
              This address hasn't registered yet. Use the "Register user" tab first.
            </StatusBanner>
          </div>
        )}
        {lookupStatus === 'error' && (
          <div className="mt-4">
            <StatusBanner tone="error" icon={AlertCircle}>Couldn't reach the lookup service. Try again.</StatusBanner>
          </div>
        )}
      </Panel>

      {lookupStatus === 'found' && lookup && (
        <Panel index={2} title="Package status" icon={Package}>
          <div className="rounded-xl border-2 border-white/15 overflow-hidden mb-4">
            {[
              { label: 'Wallet',          value: shortAddr(lookup.userAddress) },
              { label: 'Future Ride ID',  value: lookup.futureRideId ?? '—' },
              { label: 'Highest package', value: String(lookup.highestPackage) },
            ].map(({ label, value }, i, arr) => (
              <div key={label} className={`flex items-center justify-between px-4 py-3 ${i < arr.length - 1 ? 'border-b-2 border-white/10' : ''}`}>
                <span className="text-[13px] font-bold text-white">{label}</span>
                <span className="text-[14px] font-mono font-semibold text-white">{value}</span>
              </div>
            ))}
          </div>

          {blockedNoRegistration && (
            <StatusBanner tone="error" icon={AlertCircle}>
              This wallet owns 0 packages — they must complete registration before any package can be bought for them.
            </StatusBanner>
          )}

          {blockedMaxed && (
            <StatusBanner tone="success" icon={CheckCircle2}>
              This wallet already owns package 12 — the maximum. There's nothing left to buy.
            </StatusBanner>
          )}

          {nextPkg && nextLevel && !blockedNoRegistration && !blockedMaxed && (
            <div className="rounded-xl border-2 border-[#38bdf8] bg-[#38bdf8]/10 px-4 py-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[15px] font-bold text-white">Package {nextLevel} · {nextPkg.headline}</span>
                <span className="text-[16px] font-mono font-bold text-white">{usd(nextPkg.price)}</span>
              </div>
              <p className="m-0 text-[13px] font-medium text-white">This is the next package this wallet is eligible to buy.</p>
            </div>
          )}
        </Panel>
      )}

      {lookupStatus === 'found' && lookup && nextPkg && nextLevel && !blockedNoRegistration && !blockedMaxed && (
        <Panel index={3} title="Approve & activate" icon={Zap}>
          {!account ? (
            <div className="flex flex-col gap-3">
              <p className="m-0 text-[14px] font-medium text-white">Connect your wallet to pay for this package.</p>
              <div className="[&>div]:!w-full [&>div>button]:!w-full">
                <ConnectButton
                  client={client}
                  chains={[bsc]}
                  theme={darkTheme({ colors: { primaryButtonBg: '#38bdf8' } })}
                  connectButton={{
                    label: 'Connect wallet',
                    style: {
                      width: '100%', height: '52px', borderRadius: '999px',
                      color: '#04111f', fontWeight: 700, fontSize: '16px',
                      background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 50%, #7dd3fc 100%)',
                      boxShadow: '0 0 26px rgba(56,189,248,0.3)',
                    },
                  }}
                  connectModal={{ size: 'compact' }}
                  wallets={wallets}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {step === 'done' ? (
                <StatusBanner tone="success" icon={CheckCircle2} txHash={txHash}>
                  Package {nextLevel} activated for {shortAddr(targetAddress)}.
                </StatusBanner>
              ) : step === 'error' ? (
                <StatusBanner tone="error" icon={AlertCircle}>{errorMsg || 'Something went wrong'}</StatusBanner>
              ) : step === 'buying' ? (
                <StatusBanner tone="info" icon={Loader2} txHash={txHash}>Confirming purchase on-chain…</StatusBanner>
              ) : step === 'approving' ? (
                <StatusBanner tone="info" icon={Loader2}>Confirm USDT approval in your wallet…</StatusBanner>
              ) : null}

              {step !== 'done' && (
                <div className="grid grid-cols-2 gap-3">
                  <PrimaryButton onClick={handleApprove} disabled={isBusy || step === 'approved'}>
                    {step === 'approving'
                      ? <><Loader2 size={18} className="animate-spin" />Approving…</>
                      : step === 'approved'
                        ? <><CheckCircle2 size={18} />Approved</>
                        : <><ShieldCheck size={18} />Approve</>}
                  </PrimaryButton>
                  <PrimaryButton onClick={handleActivate} disabled={step !== 'approved'}>
                    {step === 'buying'
                      ? <><Loader2 size={18} className="animate-spin" />Activating…</>
                      : <><Zap size={18} />Activate</>}
                  </PrimaryButton>
                </div>
              )}
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   PAGE — tab switcher
   ────────────────────────────────────────────────────────── */
export default function AdminUserOperationsPage() {
  const account = useActiveAccount();
  const [tab, setTab] = useState<'register' | 'package'>('register');

  return (
    <div className="min-h-screen bg-[#040a14] flex flex-col">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-44 left-1/2 -translate-x-1/2 w-[600px] h-[420px]"
          style={{ background: 'radial-gradient(ellipse at center top, rgba(56,189,248,0.12) 0%, transparent 62%)' }}
        />
      </div>

      <main className="flex-1 px-4 sm:px-6 py-8 max-w-[860px] w-full mx-auto">
        <div className="mb-7">
          <h1 className="m-0 text-[24px] sm:text-[28px] font-bold text-white tracking-tight">Register and Package Buy For Other User</h1>
          <p className="mt-2 mb-0 text-[15px] font-medium text-white leading-relaxed">
            Register a wallet or activate a package on behalf of another user. Your connected wallet pays the USDT.
          </p>
        </div>

        {/* connected wallet readout */}
        <div className="flex items-center justify-between gap-3 mb-6 px-4 py-3 rounded-xl border-2 border-white/15 bg-white/5">
          <span className="text-[14px] font-bold text-white">Paying wallet</span>
          {account ? (
            <span className="text-[14px] font-mono font-semibold text-[#7dd3fc]">{shortAddr(account.address)}</span>
          ) : (
            <span className="text-[14px] font-mono font-semibold text-[#fb7185]">Not connected</span>
          )}
        </div>

        {/* tabs */}
        <div className="grid grid-cols-2 gap-2 mb-6 p-1.5 rounded-2xl border-2 border-[#38bdf8]/25 bg-black/30">
          {[
            { id: 'register' as const, label: 'Register user', icon: UserPlus },
            { id: 'package'  as const, label: 'Buy package',   icon: Package },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={[
                'flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-bold transition-all',
                tab === id ? 'text-[#04111f]' : 'text-white',
              ].join(' ')}
              style={tab === id ? {
                background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 50%, #7dd3fc 100%)',
                boxShadow: '0 4px 18px rgba(56,189,248,0.35)',
              } : undefined}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {tab === 'register'
          ? <RegisterOtherUserTab account={account} />
          : <BuyPackageOtherUserTab account={account} />}
      </main>
    </div>
  );
}
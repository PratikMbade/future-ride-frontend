/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-floating-promises */
import { useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, ShieldCheck, Zap, Lock, Crown } from "lucide-react";
import { usdtContractInstance } from "@/contract/usdt/usdtContract";
import { ethers } from "ethers";
import { contractInstance, FUTURE_RIDE_CONTRACT_ADDRESS } from "@/contract/contract";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

// ─── types ────────────────────────────────────────────────
type TxStep = "idle" | "approving" | "approved" | "buying" | "done" | "error";

interface Pkg {
  level: number;
  price: number;
  tag?: string;
  headline: string;
  isRoyalty:boolean;
  sub: string;
}

// ─── theme tokens (dark blue / sky blue glass system) ──────
// owned + active share the green "completed/owned" family.
// next = violet (this is the actionable package right now).
// future = dim sky blue glass (queued, not yet actionable).
const THEME = {
  owned:  { c: "#22C55E", soft: "rgba(34,197,94,0.10)",  border: "rgba(34,197,94,0.30)",  glow: "rgba(34,197,94,0.18)"  },
  active: { c: "#22C55E", soft: "rgba(34,197,94,0.14)",  border: "rgba(34,197,94,0.45)",  glow: "rgba(34,197,94,0.28)"  },
  next:   { c: "#A855F7", soft: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.45)", glow: "rgba(168,85,247,0.30)" },
  future: { c: "#38BDF8", soft: "rgba(56,189,248,0.05)", border: "rgba(56,189,248,0.16)", glow: "rgba(56,189,248,0.08)" },
} as const;
const ROYALTY_TIER: Record<number, { name: string; c: string }> = {
  3:  { name: "Silver royalty unlocked",   c: "#C0C7D1" },
  5:  { name: "Gold royalty unlocked",     c: "#F5A623" },
  7:  { name: "Platinum royalty unlocked", c: "#7DD3FC" },
  9:  { name: "Diamond royalty unlocked",  c: "#E879F9" },
};
// ─── package definitions ──────────────────────────────────
const PKGS: Pkg[] = [
  { level: 1,  price: 5,     headline: "Entry",          sub: "Activates direct income & matrix position"  ,isRoyalty:false },
  { level: 2,  price: 10,    headline: "Foundation",     sub: "Opens generation 2 matrix earnings"        ,isRoyalty:false   },
  { level: 3,  price: 20,    headline: "Builder",        sub: "Silver Royalty unlocked"         ,isRoyalty:true  },
  { level: 4,  price: 40,    tag: "Auto",  headline: "Leverage",  sub: "Auto-upgrade engine activates from here" ,isRoyalty:false  },
  { level: 5,  price: 80,    headline: "Growth",        sub: "Gold Royalty unlocked"          ,isRoyalty:true    },
  { level: 6,  price: 160,   headline: "Momentum",       sub: "Deep matrix unlocked — gen 6 active"       ,isRoyalty:false  },
  { level: 7,  price: 320,   headline: "Accelerator",     sub: "Platinum Royalty unlocked"        ,isRoyalty:true    },
  { level: 8,  price: 640,   headline: "Elite",          sub: "Elite compounding — gen 8 active"         ,isRoyalty:false    },
  { level: 9,  price: 1280,  headline: "Apex",           sub: "Diamond Royalty unlocked"       ,isRoyalty:true    },
  { level: 10, price: 2560,  headline: "Summit",         sub: "Generation 10 compounding — near the top"  ,isRoyalty:false  },
  { level: 11, price: 5120,  headline: "Vanguard",       sub: "Generation 11 unlocked — elite tier"      ,isRoyalty:false    },
  { level: 12, price: 10240, tag: "Max",   headline: "Pinnacle", sub: "All 12 generations active. Full matrix.",isRoyalty:false  },
];

function usd(n: number) {
  return `$${n.toLocaleString()}`;
}
function usdFull(n: number) {
  return `$${n.toLocaleString("en-US")}`;
}

// ─────────────────────────────────────────────────────────
//  PACKAGE CARD
// ─────────────────────────────────────────────────────────
function PkgCard({
  pkg, status, step, onApprove, onActivate,
}: {
  pkg: Pkg;
  status: "owned" | "active" | "next" | "future";
  step: TxStep;
  onApprove: () => void;
  onActivate: () => void;
}) {
  const owned   = status === "owned";
  const active  = status === "active";
  const next    = status === "next";
  const future  = status === "future";

  const approving = step === "approving";
  const approved  = step === "approved";
  const buying    = step === "buying";
  const done      = step === "done";
  const errored   = step === "error";

  const t = THEME[status];
const royalty = pkg.isRoyalty ? ROYALTY_TIER[pkg.level] : undefined;

  return (
    <div
      className="group relative flex flex-col rounded-2xl overflow-hidden backdrop-blur-xl transition-all duration-300"
      style={{
        background: `linear-gradient(165deg, ${t.soft}, rgba(8,15,38,0.65))`,
        border: `1px solid ${t.border}`,
        boxShadow: active || next ? `0 0 28px -6px ${t.glow}` : "none",
      }}
    >
      {/* ── coloured top rail ── */}
      <div
        className="h-[2.5px] w-full shrink-0"
        style={{ background: future ? `${t.c}40` : t.c }}
      />

      <div className="flex flex-col flex-1 p-5 gap-4">

        {/* ── top meta row ── */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-[10px] tracking-[0.18em] uppercase"
              style={{ color: future ? "#38bdf8" : `${t.c}cc` }}
            >
              L{String(pkg.level).padStart(2, "0")}
            </span>
            {pkg.tag && (
              <span
                className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] px-1.5 py-[2px] rounded-[4px]"
                style={{
                  color: "#38BDF8",
                  background: "rgba(56,189,248,0.12)",
                  border: "1px solid rgba(56,189,248,0.3)",
                }}
              >
                {pkg.tag}
              </span>

              
            )}

            {royalty && (
  <span
    className="flex items-center gap-1 font-mono text-[12px] font-bold uppercase tracking-[0.12em] px-1.5 py-[2px] rounded-[4px]"
    style={{
      color: royalty.c,
      background: `${royalty.c}1F`,
      border: `2px solid ${royalty.c}4D`,
      opacity: future ? 0.55 : 1,
    }}
  >
    <Crown size={9} />
    {royalty.name}
  </span>
)}
          </div>

          {owned && <CheckCircle2 size={13} style={{ color: t.c }} className="shrink-0 mt-0.5" />}
          {active && (
            <div className="flex items-center gap-1 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: t.c }} />
              <span className="font-mono text-[9px] uppercase tracking-[0.12em]" style={{ color: t.c }}>Active</span>
            </div>
          )}
          {future && <Lock size={12} className="text-[#38bdf8] shrink-0 mt-0.5" />}
        </div>

        {/* ── price ── */}
        <div>
          <div
            className="font-heading text-[28px] font-bold leading-none tracking-[-0.03em]"
            style={{ color: future ? "rgba(255,255,255,0.55)" : owned ? "rgba(255,255,255,0.85)" : t.c }}
          >
            {usd(pkg.price)}
            <span
              className="font-mono text-[11px] font-normal ml-1.5"
              style={{ color: future ? "#38bdf8" : `${t.c}99` }}
            >
              USDT
            </span>
          </div>
        </div>

        <div className="flex-1" />

        {/* ── owned footer ── */}
        {owned && (
          <div className="pt-3 border-t" style={{ borderColor: "rgba(34,197,94,0.15)" }}>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={11} style={{ color: t.c }} />
              <span className="font-mono text-[10px] tracking-[0.06em]" style={{ color: `${t.c}cc` }}>Purchased</span>
            </div>
          </div>
        )}

        {/* ── active footer ── */}
        {active && (
          <div className="pt-3 border-t" style={{ borderColor: "rgba(34,197,94,0.25)" }}>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: t.c }} />
              <span className="font-mono text-[10px] tracking-[0.06em]" style={{ color: `${t.c}99` }}>Current package</span>
            </div>
          </div>
        )}

        {/* ── future footer ── */}
        {future && (
          <div className="pt-3 border-t border-white/[0.06]">
            <span className="font-mono text-[10px] text-[#38bdf8] tracking-[0.06em]">
              Requires PKG {String(pkg.level - 1).padStart(2, "0")}
            </span>
          </div>
        )}

        {/* ── NEXT: action area (violet — this is what needs buying now) ── */}
        {next && (
          <div className="pt-3 border-t space-y-3" style={{ borderColor: "rgba(168,85,247,0.2)" }}>

            {/* mini progress track */}
            <div className="flex items-center gap-1.5">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all"
                style={{
                  background: approved || buying || done ? "#22C55E" : approving ? "rgba(56,189,248,0.18)" : "rgba(255,255,255,0.06)",
                  border: approving ? "1px solid #38BDF8" : "1px solid rgba(255,255,255,0.15)",
                }}
              >
                {approved || buying || done
                  ? <CheckCircle2 size={9} className="text-black" />
                  : approving
                    ? <Loader2 size={8} className="text-[#38BDF8] animate-spin" />
                    : <span className="text-[8px] font-mono text-white/40">1</span>}
              </div>

              <div className="flex-1 h-px transition-colors" style={{ background: approved || buying || done ? "rgba(34,197,94,0.5)" : "rgba(255,255,255,0.1)" }} />

              <div
                className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all"
                style={{
                  background: done ? "#22C55E" : buying ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.06)",
                  border: buying ? "1px solid #A855F7" : "1px solid rgba(255,255,255,0.15)",
                }}
              >
                {done
                  ? <CheckCircle2 size={9} className="text-black" />
                  : buying
                    ? <Loader2 size={8} className="text-[#A855F7] animate-spin" />
                    : <span className="text-[8px] font-mono text-white/50">2</span>}
              </div>

              <div className="flex-1" />
              <span className="font-mono text-[9px] text-white/30 tracking-[0.06em]">
                {done ? "Done" : approved ? "Approve ✓" : "Approve · Activate"}
              </span>
            </div>

            {/* buttons */}
            {done ? (
              <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)" }}>
                <CheckCircle2 size={13} className="text-[#22C55E]" />
                <span className="font-mono text-[12px] text-[#22C55E] font-semibold tracking-[0.05em]">
                  Activated
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {/* approve btn — sky blue */}
                <button
                  type="button"
                  onClick={onApprove}
                  disabled={approving || approved || buying}
                  className={[
                    "relative flex items-center justify-center gap-1.5 py-[9px] rounded-xl",
                    "text-[11px] font-mono font-semibold tracking-[0.05em]",
                    "border transition-all duration-200",
                    "focus:outline-none focus-visible:ring-1 focus-visible:ring-[#38BDF8]/50",
                    approved
                      ? "bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E] cursor-default"
                      : approving
                        ? "bg-[#38BDF8]/10 border-[#38BDF8]/30 text-[#38BDF8] cursor-wait"
                        : "bg-[#38BDF8]/10 border-[#38BDF8]/30 text-[#38BDF8] hover:bg-[#38BDF8]/20 hover:shadow-[0_0_16px_-2px_rgba(56,189,248,0.5)] active:scale-[0.98]",
                  ].join(" ")}
                >
                  {approving
                    ? <Loader2 size={12} className="animate-spin" />
                    : approved
                      ? <CheckCircle2 size={12} />
                      : <ShieldCheck size={12} />}
                  {approved ? "Done" : "Approve"}
                </button>

                {/* activate btn — violet (matches card identity) */}
                <button
                  type="button"
                  onClick={onActivate}
                  disabled={!approved || buying}
                  className={[
                    "relative flex items-center justify-center gap-1.5 py-[9px] rounded-xl",
                    "text-[11px] font-mono font-semibold tracking-[0.05em]",
                    "border transition-all duration-200",
                    "focus:outline-none focus-visible:ring-1 focus-visible:ring-[#A855F7]/50",
                    buying
                      ? "bg-[#A855F7]/10 border-[#A855F7]/30 text-[#A855F7] cursor-wait"
                      : approved
                        ? "bg-[#A855F7]/10 border-[#A855F7]/30 text-[#A855F7] hover:bg-[#A855F7]/20 hover:shadow-[0_0_16px_-2px_rgba(168,85,247,0.5)] active:scale-[0.98]"
                        : "bg-white/[0.03] border-white/[0.08] text-white/20 cursor-not-allowed",
                  ].join(" ")}
                >
                  {buying ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                  Activate
                </button>
              </div>
            )}

            {errored && (
              <p className="m-0 text-center text-[10px] font-mono text-[#f31260]/80">
                Failed — check wallet and retry
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  PAGE
// ─────────────────────────────────────────────────────────
export default function PackageBuyPage() {
  const account     = useActiveAccount();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<TxStep>("idle");
  const [lastTxHash, setLastTxHash] = useState<string>('');
  const navigate = useNavigate();

  const { data: currentLevel = 0 } = useQuery({
    queryKey: ["user-package", account?.address],
    queryFn: async () => {
       const res = await fetch(`${import.meta.env.VITE_API_URL}/api/packages`, { credentials: "include" });
       return (await res.json()).highestPackage as number;
    },
    enabled: true,
  });

  const nextLevel = currentLevel + 1;
  const nextPkg   = PKGS.find((p) => p.level === nextLevel);

  const approve = useMutation({
    mutationFn: async () => {
      if(!account){
          toast.info('Connect Wallet to Activate the packages')
          navigate({to:'/'});
          return;
      }
      if (!nextPkg) throw new Error("No wallet or package");
      setStep("approving");

      const usdt = await usdtContractInstance(account);
      if (!usdt) throw new Error("Failed to get USDT contract instance");

      const amount = ethers.utils.parseUnits(nextPkg.price.toString(), 18);

      const allowance: ethers.BigNumber = await usdt.allowance(
        account.address,
        FUTURE_RIDE_CONTRACT_ADDRESS
      );

      if (allowance.gte(amount)) {
        return { alreadyApproved: true };
      }

      const tx = await usdt.approve(FUTURE_RIDE_CONTRACT_ADDRESS, amount);
      await tx.wait();
      return { alreadyApproved: false };
    },
    onSuccess: (result) => {
      setStep("approved");
      if (result?.alreadyApproved) {
        toast.success("Already approved", {
          description: `You have sufficient USDT allowance for ${nextPkg?.headline}. You can activate now.`,
        });
      } else {
        toast.success("Approval confirmed", {
          description: "USDT spend approved. Proceed to activate your package.",
        });
      }
    },
    onError: (e: any) => {
      setStep("error");
      console.log('account',account);
      const msg = e?.code === 4001 || e?.message?.includes("user rejected")
        ? "You rejected the approval in your wallet."
        : e?.message ?? "Approval failed. Please try again.";
      toast.error("Approval failed", { description: msg });
      console.error("❌ Approve error:", e);
    },
  });

  const activate = useMutation({
    mutationFn: async () => {
      if (!account || !nextPkg) throw new Error("No wallet or package");
      setStep("buying");
      const contract = await contractInstance(account);
      if (!contract) throw new Error("Failed to get contract instance");
      const tx = await contract.packageBuy_user(account.address, false);
      setLastTxHash(tx.hash);
      await tx.wait();
    },
    onSuccess: async() => {
      setStep("done");
      try {
          await fetch(`${import.meta.env.VITE_API_URL}/api/packages/buy`,{
              method:'POST',
              credentials:'include',
              headers:{'Content-Type':'application/json'},
              body:JSON.stringify({
                   packageNumber: nextPkg!.level,
          transactionHash: lastTxHash,
              })
          })
      } catch (error) {
      console.log('Fallback POST failed (non-fatal):', error);
      }
      toast.success(`Package ${String(nextLevel).padStart(2, "0")} activated!`, {
      description: `${nextPkg?.headline} is now active.`,
    });
    queryClient.invalidateQueries({ queryKey: ["user-package"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    setTimeout(() => setStep("idle"), 2200);
    },
    onError: (e: any) => {
      setStep("error");
      const msg = e?.code === 4001 || e?.message?.includes("user rejected")
        ? "You rejected the transaction in your wallet."
        : e?.message?.includes("Operation aborted")
          ? "Contract is currently paused. Contact support."
          : e?.message?.includes("insufficient")
            ? "Insufficient USDT balance."
            : "Transaction failed. Please try again.";
      toast.error("Activation failed", { description: msg });
      console.error("❌ Activate error:", e);
    },
  });

  return (
    <div className="flex flex-col gap-8">

      {/* ── page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-[3px] h-[14px] rounded-full bg-gradient-to-b from-[#38BDF8] to-[#1B4FD8]" />
            <span className="text-[11px] font-mono tracking-[0.12em] uppercase text-[#38BDF8]">Packages</span>
          </div>
          <h1 className="m-0 font-heading text-2xl sm:text-[28px] font-bold text-white tracking-[-0.025em]">
            Package Upgrade
          </h1>
          <p className="mt-2 m-0 text-[13px] text-[#38bdf8] max-w-md leading-relaxed">
            Each package unlocks the next generation of matrix earnings.
            Upgrade in sequence — packages cannot be skipped.
          </p>
        </div>

        {/* progress summary chip — glassy */}
        <div
          className="shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-xl backdrop-blur-xl"
          style={{ border: "1px solid rgba(56,189,248,0.18)", background: "linear-gradient(165deg, rgba(27,79,216,0.10), rgba(8,15,38,0.6))" }}
        >
          <div className="flex items-center gap-1.5">
            {PKGS.map((p) => (
              <div
                key={p.level}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: p.level <= currentLevel || p.level === nextLevel ? "16px" : "8px",
                  background: p.level <= currentLevel
                    ? "#22C55E"
                    : p.level === nextLevel
                      ? "#A855F7"
                      : "rgba(56,189,248,0.15)",
                }}
              />
            ))}
          </div>
          <span className="font-mono text-[11px] text-[#38BDF8] whitespace-nowrap">
            {currentLevel} / {PKGS.length}
          </span>
        </div>
      </div>

      {/* ── "up next" banner — violet, glassy ── */}
      {nextPkg && (
        <div
          className="flex items-center justify-between gap-4 px-5 py-3.5 rounded-[12px] backdrop-blur-xl"
          style={{ border: "1px solid rgba(168,85,247,0.3)", background: "linear-gradient(120deg, rgba(168,85,247,0.08), rgba(56,189,248,0.04))" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(168,85,247,0.14)", border: "1px solid rgba(168,85,247,0.3)" }}>
              <Zap size={14} className="text-[#A855F7]" />
            </div>
            <div>
              <p className="m-0 text-[11px] font-mono text-[#A855F7]/80 tracking-[0.06em] uppercase">Up next</p>
              <p className="m-0 text-[13px] font-heading font-semibold text-white">
                Package {String(nextPkg.level).padStart(2, "0")} · {nextPkg.headline}
                <span className="ml-2 font-mono font-normal text-white/40 text-[12px]">
                  {usdFull(nextPkg.price)} USDT
                </span>
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-[#38BDF8]/60">
            <span>Approve</span>
            <div className="w-8 h-px bg-gradient-to-r from-[#38BDF8]/40 to-[#A855F7]/40" />
            <span>Activate</span>
          </div>
        </div>
      )}

      {/* ── package grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3">
        {PKGS.map((pkg) => {
          let status: "owned" | "active" | "next" | "future";
          if      (pkg.level < currentLevel)  status = "owned";
          else if (pkg.level === currentLevel) status = "active";
          else if (pkg.level === nextLevel)    status = "next";
          else                                 status = "future";

          return (
            <PkgCard
                  key={pkg.level}
                  pkg={pkg}
                  status={status}
                  step={status === "next" ? step : "idle"}
                  onApprove={() => approve.mutate()}
                  onActivate={() => activate.mutate()}          />
          );
        })}
      </div>

      {/* ── legend ── */}
      <div className="flex items-center gap-6 flex-wrap">
        {[
          { rail: "#22C55E", label: "Owned / Active" },
          { rail: "#A855F7", label: "Needs purchase (next)" },
          { rail: "rgba(56,189,248,0.4)", label: "Locked" },
        ].map(({ rail, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-4 h-[2.5px] rounded-full" style={{ background: rail }} />
            <span className="text-[11px] font-mono text-white/35">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
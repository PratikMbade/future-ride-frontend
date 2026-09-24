import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Lock } from "lucide-react";

type Tone = "gold" | "blue" | "green";

interface PackageItem {
  level: number;
  price: number;
  autoUpgrade?: boolean;
  recommended?: boolean;
}

interface HighlightProps {
  label: string;
  value: string;
  tone: Tone;
}

// Doubling packages starting at $5 (matches typical 12-level matrix doubling design)
const packages: PackageItem[] = [
  { level: 1, price: 5 },
  { level: 2, price: 10 },
  { level: 3, price: 20 },
  { level: 4, price: 40, autoUpgrade: true },
  { level: 5, price: 80 },
  { level: 6, price: 160 },
  { level: 7, price: 320 },
  { level: 8, price: 640 },
  { level: 9, price: 1280 },
  { level: 10, price: 2560 },
  { level: 11, price: 5120 },
  { level: 12, price: 10240, recommended: true },
];

function formatUsd(n: number): string {
  return n.toLocaleString("en-US");
}

import {
  CheckCircle2, Medal, Award, CircleDot, Trophy, Gem, Shield, Diamond, Heart, Hexagon, Castle, Crown, Star,
  type LucideIcon,
} from "lucide-react";

interface Pkg {
  level: number;
  price: number;
  tag?: string;
  headline: string;
  sub: string;
  icon: LucideIcon;
  color: string;
}

const THEME = {
  owned:  { c: "#22C55E", soft: "rgba(34,197,94,0.10)",  border: "rgba(34,197,94,0.30)",  glow: "rgba(34,197,94,0.18)"  },
  active: { c: "#22C55E", soft: "rgba(34,197,94,0.14)",  border: "rgba(34,197,94,0.45)",  glow: "rgba(34,197,94,0.28)"  },
  next:   { c: "#A855F7", soft: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.45)", glow: "rgba(168,85,247,0.30)" },
  future: { c: "#38BDF8", soft: "rgba(56,189,248,0.05)", border: "rgba(56,189,248,0.16)", glow: "rgba(56,189,248,0.08)" },
} as const;

const PKGS: Pkg[] = [
  { level: 1,  price: 5,     headline: "Bronze",   sub: "Activates direct income & matrix position", icon: Medal,     color: "#CD7F32" },
  { level: 2,  price: 10,    headline: "Silver",   sub: "Opens generation 2 matrix earnings",        icon: Award,     color: "#C0C7D1" },
  { level: 3,  price: 20,    headline: "Pearl",    sub: "Generation 3 matrix unlocked",              icon: CircleDot, color: "#F1E5D8" },
  { level: 4,  price: 40,    tag: "Auto", headline: "Gold", sub: "Auto-upgrade engine activates from here", icon: Trophy, color: "#F5B301" },
  { level: 5,  price: 80,    headline: "Sapphire", sub: "Generation 5 matrix unlocked",              icon: Gem,       color: "#3B82F6" },
  { level: 6,  price: 160,   headline: "Platinum", sub: "Deep matrix unlocked — gen 6 active",       icon: Shield,    color: "#7DD3FC" },
  { level: 7,  price: 320,   headline: "Diamond",  sub: "Generation 7 matrix unlocked",              icon: Diamond,   color: "#E879F9" },
  { level: 8,  price: 640,   headline: "Ruby",     sub: "Elite compounding — gen 8 active",          icon: Heart,     color: "#F43F5E" },
  { level: 9,  price: 1280,  headline: "Emerald",  sub: "Generation 9 matrix unlocked",              icon: Hexagon,   color: "#10B981" },
  { level: 10, price: 2560,  headline: "Royal",    sub: "Generation 10 compounding — near the top",  icon: Castle,    color: "#8B5CF6" },
  { level: 11, price: 5120,  headline: "Crown",    sub: "Generation 11 unlocked — elite tier",       icon: Crown,     color: "#FBBF24" },
  { level: 12, price: 10240, tag: "Max", headline: "Imperial", sub: "All 12 generations active. Full matrix.", icon: Star, color: "#FB923C" },
];

const usd = (n: number) => `$${n.toLocaleString()}`;

function PkgCard({ pkg }: { pkg: Pkg }) {
  const t = THEME.future;
  const Icon = pkg.icon;

  return (
    <div
      className="group relative flex flex-col rounded-2xl overflow-hidden backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5"
      style={{
        background: `linear-gradient(165deg, ${t.soft}, rgba(8,15,38,0.65))`,
        border: `1px solid ${t.border}`,
      }}
    >
      <div className="h-[2.5px] w-full shrink-0" style={{ background: t.c }} />

      <div className="flex flex-col flex-1 p-5 gap-4">
        {/* top meta row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10px] tracking-[0.18em] uppercase" style={{ color: `${t.c}cc` }}>
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

          </div>

          <Lock size={12} className="text-[#38bdf8] shrink-0 mt-0.5" />
        </div>

        {/* price */}
        <div>
          <div
            className="font-heading text-[28px] font-bold leading-none tracking-[-0.03em]"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            {usd(pkg.price)}
            <span className="font-mono text-[11px] font-normal ml-1.5 text-[#38bdf8]">USDT</span>
          </div>
        </div>

        {/* icon + name + sub */}
        <div className="flex items-start gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: `radial-gradient(circle at 30% 25%, ${pkg.color}40, ${pkg.color}10 70%)`,
              border: `1px solid ${pkg.color}66`,
              boxShadow: `0 0 18px -4px ${pkg.color}80, inset 0 1px 0 rgba(255,255,255,0.12)`,
            }}
          >
            <Icon size={22} strokeWidth={1.75} style={{ color: pkg.color }} />
          </div>
          <div className="min-w-0">
            <p className="m-0 font-heading text-[17px] font-semibold text-white">{pkg.headline}</p>
            <p className="mt-1 m-0 text-[11px] leading-relaxed text-white/40">{pkg.sub}</p>
          </div>
        </div>

        <div className="flex-1" />

        {/* footer */}
        <div className="pt-3 border-t border-white/[0.06] flex items-center gap-1.5">
          {pkg.level === 1 ? (
            <>
              <CheckCircle2 size={11} className="text-[#38bdf8]" />
              <span className="font-mono text-[10px] text-[#38bdf8] tracking-[0.06em]">Starting package</span>
            </>
          ) : (
            <span className="font-mono text-[10px] text-[#38bdf8] tracking-[0.06em]">
              Requires PKG {String(pkg.level - 1).padStart(2, "0")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PackagesTemplate() {
  return (
    <section id="packages" className="relative isolate py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-16"
        >
          <span className="inline-block px-4 py-1.5 text-xs font-bold tracking-widest uppercase rounded-full border border-[#F5A623]/25 bg-[#F5A623]/8 text-[#F5A623] mb-5">
            Choose Your Entry Point
          </span>
          <h2 className="font-black text-white text-4xl sm:text-5xl lg:text-6xl leading-tight tracking-tight">
            Start small. Scale fast.
            <br />
            <span className="text-brand">Every level earns.</span>
          </h2>

        </motion.div>


        
  <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3">
        {PKGS.map((pkg) => (
          <PkgCard key={pkg.level} pkg={pkg} />
        ))}
      </div>

   
      </div>
    </section>
  );
}

function Highlight({ label, value, tone }: HighlightProps) {
  const t: Record<Tone, string> = {
    gold: "text-gold",
    blue: "text-blue-accent",
    green: "text-green-accent",
  };
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-4">
      <div className="text-[10px] uppercase tracking-[0.22em] text-white/50">
        {label}
      </div>
      <div className={`mt-1 font-mono text-lg font-semibold ${t[tone]}`}>
        {value}
      </div>
    </div>
  );
}

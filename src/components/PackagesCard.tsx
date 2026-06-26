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

        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {packages.map((p, i) => (
            <div
              key={p.level}
              className={`glass-card group relative overflow-hidden p-5 fade-up transition-transform duration-300 hover:-translate-y-1 ${
                p.recommended ? "border-gold/50 gold-glow" : ""
              }`}
              style={{
                animationDelay: `${i * 50}ms`,
                // Dark blue glass body (gold for the recommended card)
                background: p.recommended
                  ? "linear-gradient(160deg, rgba(245,166,35,0.16), rgba(255,255,255,0.02))"
                  : "linear-gradient(160deg, rgba(56,120,210,0.22) 0%, rgba(18,32,64,0.45) 45%, rgba(8,14,30,0.5) 100%)",
                border: p.recommended
                  ? undefined
                  : "1px solid rgba(120,180,255,0.18)",
                backdropFilter: "blur(20px) saturate(140%)",
                boxShadow: p.recommended
                  ? "0 12px 40px rgba(245,166,35,0.28), inset 0 1px 0 rgba(255,255,255,0.12)"
                  : "0 8px 28px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
              }}
            >
              {/* Sky-blue shine — subtle diagonal sweep + top-right glow */}
              {!p.recommended && (
                <>
                  <div
                    className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-70"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(150,210,255,0.18) 0%, rgba(150,210,255,0.04) 22%, transparent 45%)",
                    }}
                  />
                  <div
                    className="pointer-events-none absolute right-0 top-0 h-[55%] w-[60%] rounded-[inherit]"
                    style={{
                      background:
                        "radial-gradient(120% 120% at 100% 0%, rgba(110,180,255,0.16), transparent 60%)",
                    }}
                  />
                </>
              )}

              {p.recommended && (
                <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
                  <Sparkles className="h-3 w-3" /> Top
                </div>
              )}
              {p.autoUpgrade && (
                <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-green-accent/50 bg-green-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-accent">
                  <TrendingUp className="h-3 w-3" /> Auto
                </div>
              )}

              <div className="relative z-10">
                <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">
                  Level
                </div>
                <div className="font-heading text-2xl font-bold text-white">
                  {String(p.level).padStart(2, "0")}
                </div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span
                    className={`font-mono text-2xl font-semibold ${
                      p.recommended ? "text-gold" : "text-white"
                    }`}
                  >
                    ${formatUsd(p.price)}
                  </span>
                  <span className="font-mono text-xs text-white/40">USDT</span>
                </div>
                <div className="mt-4 h-px bg-white/10" />
                <div className="mt-3 text-xs text-white/55">
                  {p.level === 1
                    ? "Entry · activates direct income"
                    : p.autoUpgrade
                      ? "Auto-upgrade starts from here"
                      : "Unlocks deeper level income"}
                </div>
              </div>
            </div>
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

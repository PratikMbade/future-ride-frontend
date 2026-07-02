import { Workflow } from "lucide-react";

type Tone = "gold" | "blue" | "green";

interface NodeProps {
  label: string;
  tone: Tone;
  highlight?: boolean;
  small?: boolean;
}

export default function TreeStructure() {
  return (
    <section data-testid={"Business"} className="relative isolate">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 grid-bg opacity-30"
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mt-14 grid grid-cols-1 gap-6">

          {/* Matrix Visual */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
            <div className="flex items-center gap-3 text-blue-accent">
              <Workflow className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-[0.25em]">
                2×2 Matrix · 12 Levels
              </span>
            </div>
            <h3 className="mt-3 font-heading text-2xl font-semibold text-white sm:text-3xl">
              How the matrix grows
            </h3>

            {/* Tree visual */}
            <div className="mt-8 flex flex-col items-center gap-2">

              {/* YOU */}
              <Node label="YOU" tone="gold" highlight />
              <Arrow />

              {/* Level 1 */}
              <div className="flex gap-8 sm:gap-16">
                <Node label="L1 · A" tone="blue" />
                <Node label="L1 · B" tone="blue" />
              </div>
              <Arrow />

              {/* Level 2 */}
              <div className="flex gap-2 sm:gap-6">
                <Node label="L2·1" tone="green" small />
                <Node label="L2·2" tone="green" small />
                <Node label="L2·3" tone="green" small />
                <Node label="L2·4" tone="green" small />
              </div>
              <Arrow />

              {/* Level 3 — 2×4 grid on mobile, single row on lg */}
              <div className="grid grid-cols-4 gap-2 sm:gap-3 lg:flex lg:flex-row lg:gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <Node key={n} label={`L3·${n}`} tone="green" small />
                ))}
              </div>

              <div className="text-center text-xs uppercase tracking-[0.25em] text-white/40 mt-4">
                … continues through{" "}
                <span className="text-gold">Level 12</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

function Node({ label, tone, highlight, small }: NodeProps) {
  const t: Record<Tone, { ring: string; text: string; glow: string; bg: string }> = {
    gold: {
      ring: "border-gold/70",
      text: "text-gold",
      glow: "gold-glow",
      bg: "bg-[#1a1200]",
    },
    blue: {
      ring: "border-blue-accent/70",
      text: "text-blue-accent",
      glow: "blue-glow",
      bg: "bg-[#00101a]",
    },
    green: {
      ring: "border-green-accent/70",
      text: "text-green-accent",
      glow: "green-glow",
      bg: "bg-[#001a0a]",
    },
  };
  const styles = t[tone];
  return (
    <div
      className={`
        flex items-center justify-center rounded-xl border
        ${styles.bg}
        ${styles.ring}
        ${highlight ? styles.glow : ""}
        ${small
          ? "h-9 px-3 w-full text-[10px] sm:h-10 sm:w-16"
          : "h-14 w-24 text-xs"
        }
        font-mono font-semibold ${styles.text}
      `}
    >
      {label}
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex justify-center my-1">
      <svg
        width="12"
        height="28"
        viewBox="0 0 12 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shaft */}
        <line
          x1="6"
          y1="0"
          x2="6"
          y2="20"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Arrowhead */}
        <path
          d="M1 18L6 26L11 18"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}
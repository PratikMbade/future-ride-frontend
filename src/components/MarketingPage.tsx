import { useRef, useEffect } from "react";

import { Navbar } from "./Navbar";
import { SpaceBackground } from "./SpaceBackground";
const englishPdf = "/future-ride-plan-english.pdf";
const hindiPdf = "/future-ride-plan-hindi.pdf";
// ─── Types ───────────────────────────────────────────────────────────────────
interface PdfCardProps {
  lang: "English" | "Hindi";
  langNative: string;
  description: string;
  pdfSrc: string;
  accent: string;
}

// ─── Shimmer Canvas (ambient glow background) ────────────────────────────────
function GlowOrb({ className }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute rounded-full blur-[120px] opacity-20 ${className}`}
    />
  );
}

// ─── Decorative corner brackets ──────────────────────────────────────────────
function Brackets() {
  return (
    <>
      {/* TL */}
      <span className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-sky-400 rounded-tl-sm" />
      {/* TR */}
      <span className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-sky-400 rounded-tr-sm" />
      {/* BL */}
      <span className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-sky-400 rounded-bl-sm" />
      {/* BR */}
      <span className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-sky-400 rounded-br-sm" />
    </>
  );
}

// ─── PDF Card ────────────────────────────────────────────────────────────────
function PdfCard({
  lang,
  langNative,
  description,
  pdfSrc,
}: PdfCardProps) {
  const handleOpen = () => {
    window.open(pdfSrc, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="group relative flex flex-col items-center">
      {/* Glow ring on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-700/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />

      {/* Card */}
      <div className="relative w-full rounded-2xl border border-sky-500/25 bg-gradient-to-b from-[#0f2040] to-[#091529] p-8 flex flex-col items-center gap-6 shadow-[0_0_40px_0_rgba(56,189,248,0.07)] group-hover:shadow-[0_0_60px_0_rgba(56,189,248,0.18)] group-hover:border-sky-400/50 transition-all duration-500">
        <Brackets />

        {/* Flag + Lang badge */}
        <div className="flex flex-col items-center gap-3">

          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-semibold tracking-widest uppercase">
              {lang}
            </span>
            {langNative !== lang && (
              <span className="px-3 py-0.5 rounded-full bg-blue-800/40 border border-blue-600/30 text-blue-200 text-xs font-medium">
                {langNative}
              </span>
            )}
          </div>
        </div>

        {/* Document icon */}
        <div className="relative flex items-center justify-center w-28 h-36 rounded-xl bg-gradient-to-b from-[#0d2a4d] to-[#091929] border border-sky-500/20 shadow-inner overflow-hidden group-hover:scale-105 transition-transform duration-500">
          {/* Faux PDF lines */}
          <div className="absolute top-5 left-4 right-4 flex flex-col gap-2">
            {[100, 80, 100, 60, 100, 70, 100].map((w, i) => (
              <div
                key={i}
                className="h-[3px] rounded-full bg-sky-400/20"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
          {/* PDF label */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center">
            <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-bold tracking-widest border border-sky-500/30">
              PDF
            </span>
          </div>
          {/* Shimmer sweep */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        </div>

        {/* Description */}
        <p className="text-center text-blue-200/70 text-sm leading-relaxed max-w-[240px]">
          {description}
        </p>

        {/* CTA Button */}
        <button
          onClick={handleOpen}
          aria-label={`View ${lang} Smart Contract PDF`}
          className="relative mt-1 w-full py-3 px-6 rounded-xl font-semibold text-sm tracking-wide text-white overflow-hidden
            bg-gradient-to-r from-sky-600 to-blue-700
            hover:from-sky-500 hover:to-blue-600
            active:scale-95
            shadow-[0_4px_20px_rgba(56,189,248,0.25)]
            hover:shadow-[0_4px_30px_rgba(56,189,248,0.45)]
            transition-all duration-300 group/btn"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {/* Eye icon */}
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            View {lang} PDF
            {/* Arrow */}
            <svg
              className="w-4 h-4 -translate-x-1 group-hover/btn:translate-x-0 opacity-0 group-hover/btn:opacity-100 transition-all duration-200"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </span>
          {/* Shine sweep */}
          <span className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-500 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </button>
      </div>
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────
function GlowDivider() {
  return (
    <div className="relative flex items-center justify-center">
      <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-sky-500/40 to-transparent" />
      <div className="relative z-10 flex items-center gap-2 px-4 bg-[#080f1e]">
        <div className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_2px_rgba(56,189,248,0.6)]" />
        <div className="w-1.5 h-1.5 rounded-full bg-sky-400/60" />
        <div className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_2px_rgba(56,189,248,0.6)]" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MarketingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animated star-field canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const stars = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.3,
      speed: Math.random() * 0.15 + 0.05,
      opacity: Math.random() * 0.5 + 0.2,
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(186,230,253,${s.opacity})`;
        ctx.fill();
        s.y -= s.speed;
        if (s.y < -5) {
          s.y = canvas.height + 5;
          s.x = Math.random() * canvas.width;
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="relative">
          <SpaceBackground />
    
            <Navbar/>
        
        <div className="relative min-h-screen  flex flex-col items-center overflow-hidden font-sans">
      {/* Star canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Ambient glow orbs */}
      <GlowOrb className="w-[500px] h-[500px] bg-sky-500 top-[-180px] left-[10%]" />
      <GlowOrb className="w-[400px] h-[400px] bg-blue-700 top-[30%] right-[-100px]" />
      <GlowOrb className="w-[300px] h-[300px] bg-sky-600 bottom-[5%] left-[-80px]" />

      {/* ── Content ── */}
      <main className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 flex flex-col gap-14">

        {/* ── Header ── */}
        <header className="flex flex-col items-center gap-5 text-center">
          {/* Eyebrow */}
          <div className="flex items-center gap-2.5">
            <div className="h-px w-10 bg-gradient-to-r from-transparent to-sky-400" />
            <span className="text-sky-400 text-xs font-bold tracking-[0.25em] uppercase">
              Smart Contract Documentation
            </span>
            <div className="h-px w-10 bg-gradient-to-l from-transparent to-sky-400" />
          </div>

          {/* Main heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
            <span className="bg-gradient-to-br from-white via-sky-200 to-sky-400 bg-clip-text text-transparent">
              Future Ride
            </span>
            <br />
            <span className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
              Matrix Plan
            </span>
          </h1>

          {/* Sub-label */}
          <div className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sky-500/30 bg-sky-500/5">
            <svg
              className="w-4 h-4 text-sky-400 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span className="text-sky-300/80 text-xs font-medium tracking-wide">
              Verified On-Chain · BNB Chain Smart Contract
            </span>
          </div>

          {/* Description */}
          <p className="text-blue text-sm sm:text-base leading-relaxed max-w-xl">
            Download and review the complete smart contract documentation for the
            Future Ride Matrix referral program — available in English and Hindi
            for maximum accessibility.
          </p>
        </header>

        <GlowDivider />

        {/* ── Cards Grid ── */}
        <section
          aria-label="PDF Documents"
          className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8"
        >
          <PdfCard
            lang="English"
            langNative="English"
            description="Complete smart contract plan in English — covering all matrix levels."
            pdfSrc={englishPdf}
            accent="sky"
          />
          <PdfCard
            lang="Hindi"
            langNative="हिंदी"

            description="स्मार्ट कॉन्ट्रैक्ट की पूरी योजना हिंदी में — सभी मैट्रिक्स स्तरों और पुरस्कार संरचना के साथ।"
            pdfSrc={hindiPdf}
            accent="blue"
          />
        </section>

        <GlowDivider />

        {/* ── Footer note ── */}
        <footer className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2 text-blue-400 text-xs">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
              />
            </svg>
            PDFs open in a new browser tab
          </div>
          <p className="text-blue-300 text-xs max-w-sm">
            Documents are read-only. Contract ownership has been renounced — all
            rules are governed immutably on-chain.
          </p>
        </footer>
      </main>
      </div>
     </div>
  );
}
/**
 * ContractsPage.tsx
 * Route: /contracts  (or wherever you wire it in TanStack Router)
 *
 * Shows the two FutureRide smart contracts with addresses, BSCScan links,
 * copy buttons, and feature highlights.
 * Fully self-contained — no external icon libs needed.
 */

import { motion } from "framer-motion";
import { useState, useCallback } from "react";

// ─── Keyframes & Hover CSS ─────────────────────────────────────────────────────
const KEYFRAMES = `
  @keyframes fr-shimmer {
    0%   { opacity: 0; transform: translateX(-120%); }
    20%  { opacity: 1; }
    80%  { opacity: 1; }
    100% { opacity: 0; transform: translateX(120%); }
  }
  @keyframes fr-bnb-pulse {
    0%, 100% { box-shadow: 0 0 6px rgba(240,185,11,0.25); }
    50%       { box-shadow: 0 0 18px rgba(240,185,11,0.65); }
  }
  @keyframes fr-fade-up {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fr-spin-halo {
    to { transform: rotate(360deg); }
  }
  @keyframes fr-dot-blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }

  /* Card entrance */
  .fr-card-0 { animation: fr-fade-up 0.55s ease both; }
  .fr-card-1 { animation: fr-fade-up 0.55s 0.15s ease both; }

  /* Shimmer sweep overlay */
  .fr-sweep {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255,255,255,0.18) 50%,
      transparent 100%
    );
    animation: fr-shimmer 6s ease-in-out infinite;
  }
  .fr-card-1 .fr-sweep { animation-delay: 3s; }

  /* Link chips */
  .fr-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 999px;
    font-size: 11px;
    font-family: ui-monospace, monospace;
    background: rgba(56,189,248,0.04);
    border: 1px solid rgba(56,189,248,0.14);
    color: rgba(148,163,184,0.8);
    text-decoration: none;
    transition: background 0.17s, border-color 0.17s, color 0.17s, transform 0.17s;
    white-space: nowrap;
    cursor: pointer;
  }
  .fr-chip:hover {
    background: rgba(56,189,248,0.12);
    border-color: rgba(56,189,248,0.45);
    color: #38bdf8;
    transform: translateY(-1px);
  }

  /* Copy button */
  .fr-copy {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 10px; border-radius: 6px;
    font-size: 11px; font-family: ui-monospace, monospace;
    background: rgba(56,189,248,0.07);
    border: 1px solid rgba(56,189,248,0.2);
    color: rgba(148,163,184,0.8);
    cursor: pointer;
    transition: background 0.17s, color 0.17s;
    white-space: nowrap;
  }
  .fr-copy:hover { background: rgba(56,189,248,0.18); color: #38bdf8; }

  /* Feature pills */
  .fr-feat {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 12px; border-radius: 8px;
    transition: background 0.17s, transform 0.17s;
    cursor: default;
  }
  .fr-feat:hover { transform: translateX(3px); }

  /* Trust cards */
  .fr-trust {
    padding: 20px; border-radius: 12px;
    background: rgba(8,20,33,0.55);
    border: 1px solid rgba(56,189,248,0.09);
    backdrop-filter: blur(12px);
    transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
  }
  .fr-trust:hover {
    background: rgba(56,189,248,0.06);
    transform: translateY(-3px);
    box-shadow: 0 8px 28px rgba(0,0,0,0.35);
  }
`;

// ─── Contract data ─────────────────────────────────────────────────────────────
interface ContractDef {
  id: string;
  label: string;      // short mono label
  name: string;
  subtitle: string;
  address: string;
  description: string;
  features: string[];
  accent: string;
  accentRgb: string;
}

const CONTRACTS: ContractDef[] = [
  {
    id: "matrix",
    label: "MATRIX",
    name: "FutureRide Matrix",
    subtitle: "Community Reward Contract",
    address: "0x4b723b4E500d99493ed4003705Bd7840927AEa62",
    description:
      "The core matrix smart contract powering FutureRide's community reward ecosystem. Handles package purchases, multi-level referral tracking, and automatic on-chain reward distribution across 12 package tiers.",
    features: [
      "12-Tier Package Matrix",
      "Auto Reward Distribution",
      "On-Chain Referral Tree",
      "Immutable & Trustless",
    ],
    accent: "#38bdf8",
    accentRgb: "56,189,248",
  },
  {
    id: "royalty",
    label: "ROYALTY",
    name: "Royalty Fund Pool",
    subtitle: "Royalty Distribution Contract",
    address: "0x95c1A8a724472725e37aaaB939c101eD0Ba9c84b",
    description:
      "Manages the royalty pool distributions for qualifying FutureRide participants. Handles phase-based eligibility verification and proportional reward allocation across Silver, Gold, Platinum, and Diamond tiers.",
    features: [
      "4-Tier Royalty Levels",
      "Phase-Based Eligibility",
      "Claimable On-Demand",
      "Transparent Distribution",
    ],
    accent: "#34d399",
    accentRgb: "52,211,153",
  },
];

const BSCSCAN = "https://bscscan.com/address";

// ─── Sub-components ────────────────────────────────────────────────────────────

/** Decorative bracket corner */
function Bracket({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const top = pos === "tl" || pos === "tr";
  const left = pos === "tl" || pos === "bl";
  return (
    <span
      style={{
        position: "absolute",
        width: 13,
        height: 13,
        [top ? "top" : "bottom"]: 0,
        [left ? "left" : "right"]: 0,
        borderTop: top ? "1.5px solid rgba(56,189,248,0.45)" : "none",
        borderBottom: !top ? "1.5px solid rgba(56,189,248,0.45)" : "none",
        borderLeft: left ? "1.5px solid rgba(56,189,248,0.45)" : "none",
        borderRight: !left ? "1.5px solid rgba(56,189,248,0.45)" : "none",
      }}
    />
  );
}

/** Matrix grid SVG icon */
function MatrixIcon({ color }: { color: string }) {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <rect x="1" y="1" width="10" height="10" rx="2.5"
        fill={`rgba(${56},${189},${248},0.15)`} stroke={color} strokeWidth="1.4"/>
      <rect x="15" y="1" width="10" height="10" rx="2.5"
        fill={`rgba(${56},${189},${248},0.07)`} stroke={color} strokeWidth="1" strokeOpacity="0.5"/>
      <rect x="1" y="15" width="10" height="10" rx="2.5"
        fill={`rgba(${56},${189},${248},0.07)`} stroke={color} strokeWidth="1" strokeOpacity="0.5"/>
      <rect x="15" y="15" width="10" height="10" rx="2.5"
        fill={`rgba(${56},${189},${248},0.04)`} stroke={color} strokeWidth="0.8" strokeOpacity="0.3"/>
      <line x1="11" y1="6" x2="15" y2="6" stroke={color} strokeWidth="1" strokeOpacity="0.45"/>
      <line x1="6" y1="11" x2="6" y2="15" stroke={color} strokeWidth="1" strokeOpacity="0.45"/>
    </svg>
  );
}

/** Star/royalty SVG icon */
function RoyaltyIcon({ color }: { color: string }) {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <polygon
        points="13,1.5 16,9 24,9.5 18,15 20,23 13,19 6,23 8,15 2,9.5 10,9"
        fill={`rgba(52,211,153,0.12)`} stroke={color} strokeWidth="1.4" strokeLinejoin="round"
      />
      <polygon
        points="13,5 15.5,10.5 21.5,11 17,15.5 18.5,21.5 13,18.5 7.5,21.5 9,15.5 4.5,11 10.5,10.5"
        fill={`rgba(52,211,153,0.1)`}
      />
    </svg>
  );
}

/** Copy address button */
function CopyButton({ text, accent }: { text: string; accent: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    try { await navigator.clipboard.writeText(text); } catch { /* fallback */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button onClick={copy} className="fr-copy" style={{ color: copied ? accent : undefined }}>
      {copied ? (
        <>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M1.5 5.5l3 3 5-5" stroke={accent} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <rect x="3.5" y="1" width="6.5" height="7.5" rx="1" stroke="currentColor" strokeWidth="1.1"/>
            <rect x="1" y="2.5" width="6.5" height="7.5" rx="1"
              fill="rgba(56,189,248,0.04)" stroke="currentColor" strokeWidth="1.1"/>
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

/** Individual contract card */
function ContractCard({ c, idx }: { c: ContractDef; idx: number }) {
  const url = `${BSCSCAN}/${c.address}`;
  const { accent, accentRgb } = c;

  return (
    <div className={`fr-card-${idx} relative p-0.5`}>
      {/* Bracket corners sit on the outer wrapper */}
      <Bracket pos="tl" />
      <Bracket pos="tr" />
      <Bracket pos="bl" />
      <Bracket pos="br" />

      {/* Glass card */}
      <div
        className="relative flex flex-col h-full rounded-xl overflow-hidden"
        style={{
          background: `linear-gradient(148deg, rgba(${accentRgb},0.07) 0%, rgba(8,20,33,0.96) 45%, rgba(4,10,20,0.99) 100%)`,
          border: `1px solid rgba(${accentRgb},0.2)`,
          backdropFilter: "blur(28px) saturate(140%)",
          boxShadow: [
            `0 0 0 1px rgba(${accentRgb},0.07)`,
            "0 4px 6px rgba(0,0,0,0.35)",
            "0 16px 40px rgba(0,0,0,0.55)",
            `0 0 70px rgba(${accentRgb},0.05)`,
          ].join(", "),
        }}
      >
        {/* ── Top shimmer line ── */}
        <div
          className="relative h-px overflow-hidden"
          style={{
            background: `linear-gradient(90deg, transparent 0%, rgba(${accentRgb},0.65) 50%, transparent 100%)`,
          }}
        >
          <div className="fr-sweep" />
        </div>

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3 p-6 pb-3">
          {/* Icon + title */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-11 h-11 rounded-xl flex-shrink-0"
              style={{
                background: `rgba(${accentRgb},0.1)`,
                border: `1px solid rgba(${accentRgb},0.3)`,
                boxShadow: `0 0 18px rgba(${accentRgb},0.18)`,
              }}
            >
              {c.id === "matrix"
                ? <MatrixIcon color={accent} />
                : <RoyaltyIcon color={accent} />}
            </div>
            <div>
              <p
                className="text-xs font-mono tracking-[0.2em] mb-0.5 uppercase"
                style={{ color: accent, opacity: 0.65 }}
              >
                {`0${idx + 1} — ${c.label}`}
              </p>
              <h3 className="text-white font-semibold text-lg leading-tight">{c.name}</h3>
              <p className="text-xs mt-0.5" style={{ color: "rgba(148,163,184,0.6)" }}>
                {c.subtitle}
              </p>
            </div>
          </div>

          {/* BNB Chain badge */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 mt-1"
            style={{
              background: "rgba(240,185,11,0.07)",
              border: "1px solid rgba(240,185,11,0.28)",
              color: "#F0B90B",
              animation: `fr-bnb-pulse 3s ease-in-out ${idx * 1.5}s infinite`,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              {/* BNB-ish diamond mark */}
              <path d="M7 1.5L9.5 4l-2.5 2.5L4.5 4z" fill="#F0B90B" opacity="0.9"/>
              <path d="M1.5 7L4 9.5 7 6.5l3 3 2.5-2.5L7 1.5z" fill="#F0B90B" opacity="0.6"/>
              <path d="M4 9.5L7 12.5l3-3-3-3z" fill="#F0B90B"/>
            </svg>
            BNB Chain
          </div>
        </div>

        {/* ── Description ── */}
        <p className="px-6 text-sm leading-relaxed mb-5" style={{ color: "rgba(148,163,184,0.82)" }}>
          {c.description}
        </p>

        {/* ── Address box ── */}
        <div className="px-6 mb-5">
          <p
            className="text-xs font-mono tracking-[0.18em] mb-2 uppercase"
            style={{ color: "rgba(148,163,184,0.45)" }}
          >
            Contract Address
          </p>
          <div
            className="flex items-center gap-2 p-3 rounded-lg"
            style={{
              background: "rgba(4,10,20,0.72)",
              border: `1px solid rgba(${accentRgb},0.16)`,
            }}
          >
            {/* Full address on ≥sm, truncated on mobile */}
            <span className="font-mono text-sm flex-1 min-w-0 text-white/85">
              <span className="hidden sm:inline break-all">{c.address}</span>
              <span className="sm:hidden">
                {c.address.slice(0, 10)}
                <span style={{ color: "rgba(148,163,184,0.45)" }}>···</span>
                {c.address.slice(-8)}
              </span>
            </span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <CopyButton text={c.address} accent={accent} />
              {/* External link icon button */}
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="fr-copy"
                style={{ padding: "5px 7px", border: `1px solid rgba(${accentRgb},0.18)` }}
                title="View on BSCScan"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M4.5 1.5H2a1 1 0 00-1 1v7.5a1 1 0 001 1h7.5a1 1 0 001-1V7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  <path d="M7 1h4m0 0v4M11 1 5.5 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* ── BSCScan links ── */}
        <div className="px-6 mb-5 flex flex-wrap gap-2">
          {[
            { label: "BSCScan Explorer", href: url },
            { label: "Source Code",      href: `${url}#code` },
            { label: "Transactions",     href: `${url}#transactions` },
            { label: "Token Transfers",  href: `${url}#tokentxns` },
          ].map((link) => (
            <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="fr-chip">
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                <path d="M3.5 1H1.5a.5.5 0 00-.5.5v6a.5.5 0 00.5.5h6a.5.5 0 00.5-.5V5.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                <path d="M5.5 1H8m0 0v2.5M8 1 4 5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {link.label}
            </a>
          ))}
        </div>

        {/* ── Divider ── */}
        <div
          className="mx-6 mb-4"
          style={{ height: 1, background: `linear-gradient(90deg, transparent, rgba(${accentRgb},0.18), transparent)` }}
        />

        {/* ── Features ── */}
        <div className="px-6 pb-6">
          <p
            className="text-xs font-mono tracking-[0.18em] mb-3 uppercase"
            style={{ color: "rgba(148,163,184,0.4)" }}
          >
            Key Features
          </p>
          <div className="grid grid-cols-2 gap-2">
            {c.features.map((feat) => (
              <div
                key={feat}
                className="fr-feat"
                style={{
                  background: `rgba(${accentRgb},0.05)`,
                  border: `1px solid rgba(${accentRgb},0.12)`,
                  borderRadius: 8,
                }}
              >
                <span
                  style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: accent, flexShrink: 0,
                    boxShadow: `0 0 6px ${accent}`,
                  }}
                />
                <span className="text-xs text-white/80">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Verified status footer */}
        <div
          className="mx-6 mb-5 flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.12)" }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1L8 2.5H10.5V5L12 6.5 10.5 8v2.5H8L6.5 12 5 10.5H2.5V8L1 6.5 2.5 5V2.5H5z"
              stroke="#34d399" strokeWidth="1.2" strokeLinejoin="round"/>
            <path d="M4.5 6.5l1.5 1.5 2.5-2.5" stroke="#34d399" strokeWidth="1.2"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-xs font-mono" style={{ color: "#34d399" }}>
            Deployed &amp; Verified on BNB Smart Chain Mainnet
          </span>
          <span
            style={{
              marginLeft: "auto", width: 7, height: 7, borderRadius: "50%",
              background: "#34d399",
              animation: "fr-dot-blink 2s ease-in-out infinite",
              boxShadow: "0 0 6px #34d399",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Trust section data ────────────────────────────────────────────────────────
const TRUST = [
  {
    emoji: "🔒",
    title: "Immutable Code",
    body: "Once deployed, no one — not even the team — can alter the contract logic.",
  },
  {
    emoji: "👁",
    title: "Open Source",
    body: "Full source code is verified and publicly readable on BSCScan.",
  },
  {
    emoji: "⛓",
    title: "On-Chain Transparency",
    body: "Every transaction, every reward, every claim is permanently auditable.",
  },
  {
    emoji: "🔑",
    title: "No Admin Keys",
    body: "Fully decentralized — no privileged addresses, no back doors.",
  },
  {
    emoji: "💎",
    title: "BNB Chain Powered",
    body: "Fast finality and low fees on BSC mainnet for every participant.",
  },
  {
    emoji: "🤝",
    title: "Code is Law",
    body: "Rules are enforced autonomously by the smart contract, not by people.",
  },
];

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function SmartContract() {
  return (
    <div
    id="smart-contract"
      className="min-h-screen w-full relative"
      // style={{
      //   background: "linear-gradient(180deg, #040a14 0%, #050d1b 55%, #040a14 100%)",
      // }}
    >      <span aria-hidden className="sec-num -top-4 -right-4">04</span>


      <style>{KEYFRAMES}</style>

      {/* ── Fixed background blobs (give backdrop-filter something to refract) ── */}
      <div
        aria-hidden
        style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}
      >
        <div style={{ position: "absolute", top: "8%",  left: "18%",  width: 500, height: 500, borderRadius: "50%", background: "rgba(56,189,248,0.045)", filter: "blur(90px)" }} />
        <div style={{ position: "absolute", top: "50%", right: "10%", width: 350, height: 350, borderRadius: "50%", background: "rgba(52,211,153,0.03)",  filter: "blur(70px)" }} />
        <div style={{ position: "absolute", bottom: "5%", left: "30%", width: 400, height: 300, borderRadius: "50%", background: "rgba(56,189,248,0.025)", filter: "blur(80px)" }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">

       <motion.div
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="mb-16"
        >
          <span className="inline-block px-4 py-1.5 text-xs font-bold tracking-widest uppercase rounded-full border border-[#F5A623]/25 bg-[#F5A623]/8 text-[#F5A623] mb-5">
            Smart Contracts
          </span>
          <h2 className="font-black text-white text-4xl sm:text-5xl lg:text-6xl leading-tight tracking-tight">
            On Chain<br />
            <span className="text-brand">Infrastructure</span>
          </h2>

            <p
            className="text-base sm:text-lg max-w-2xl"

          >
            All FutureRide contracts are deployed on BNB Smart Chain, source-verified,
            and fully open source. No middlemen. No trust required.
          </p>
        </motion.div>
   

        {/* ── Contract cards ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 ">
          {CONTRACTS.map((c, i) => (
            <ContractCard key={c.id} c={c} idx={i} />
          ))}
        </div>



   
      </div>
    </div>
  );
}
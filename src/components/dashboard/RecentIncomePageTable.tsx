/* eslint-disable @typescript-eslint/non-nullable-type-assertion-style */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-floating-promises */
// src/components/dashboard/income/IncomePageTable.tsx
import { useState, useRef } from "react";
import {
  Search, ChevronLeft, ChevronRight,
  ExternalLink, Copy, Check, Filter,
} from "lucide-react";

// ─── package filter options ───────────────────────────────
const PKG_OPTIONS = [
  { value: 0, label: "All Packages" },
  ...Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `PKG ${String(i + 1).padStart(2, "0")}`,
  })),
];

// ─── level filter options ─────────────────────────────────
const LEVEL_OPTIONS = [
  { value: 0, label: "All Levels" },
  ...Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `LVL ${String(i + 1).padStart(2, "0")}`,
  })),
];

export type IncomeTypeValue = "direct" | "generation" | "laps";

export interface IncomeRow {
  id: string;
  fromUserAddress: string;
  fromContractRegId: number | null;
  incomeType: IncomeTypeValue;
  packageNumber: number;
  packageName: string;
  amount: string;
  timestamp: string;
  transactionHash: string;
  level?: number;
  createdAt: string;
}

export interface IncomePageData {
  success: boolean;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  records: IncomeRow[];
}

const INCOME_TYPE_OPTIONS = [
  { value: "all" as const, label: "All Types" },
  { value: "direct" as const, label: "Direct Income" },
  { value: "generation" as const, label: "Generation Income" },
  { value: "laps" as const, label: "Laps Income" },
];

const INCOME_TYPE_CONFIG: Record<IncomeTypeValue, { label: string; short: string; color: string }> = {
  direct: { label: "Direct", short: "DIRECT", color: "#22C55E" },
  generation: { label: "Generation", short: "GEN", color: "#38BDF8" },
  laps: { label: "Laps", short: "LAPS", color: "#F5A623" },
};

interface IncomePageTableProps {
  data: IncomePageData | undefined;
  isLoading: boolean;
  isFetching: boolean;
  page: number;
  pageSize: number;
  search: string;
  pkgFilter?: number;
  levelFilter?: number | undefined;
  typeFilter?: string;
  onPage: (p: number) => void;
  onPageSize: (n: number) => void;
  onSearch: (s: string) => void;
  onPkgFilter?: (v: number) => void;
  onLevelFilter?: (v: number | undefined) => void;
  onTypeFilter?: (v: string) => void;
  showLevel?: boolean;
  bscScanBase?: string;
  showUserId?: boolean;   // NEW — hide the User ID column when false
  showType?: boolean;     // NEW — hide the Type column when false
}

const DESKTOP_MINW = "min-w-[1100px]";
const TABLET_MINW = "min-w-[720px]";

// ─── helpers ──────────────────────────────────────────────
function shortAddr(a: string) { return `${a.slice(0, 6)}…${a.slice(-4)}`; }
function shortHash(h: string) { return `${h.slice(0, 8)}…${h.slice(-6)}`; }
function usd(s: string) {
  return `$${parseFloat(s).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
}
function formatDate(ts: string) {
  const d = new Date(parseInt(ts) * 1000);
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}
function formatDateTime(ts: string) {
  const d = new Date(parseInt(ts) * 1000);
  return (
    d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
    + " · "
    + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
  );
}

// ─── badges ───────────────────────────────────────────────
function IncomeTypeBadge({ type }: { type: IncomeTypeValue }) {
  const c = INCOME_TYPE_CONFIG[type] ?? { label: "—", short: "—", color: "#8a8a8a" };
  return (
    <span
      className="inline-flex px-2.5  py-1 w-fit rounded-[6px] font-mono text-[13px] font-bold whitespace-nowrap"
      style={{ background: `${c.color}26`, border: `1px solid ${c.color}66`, color: c.color }}
    >
      {c.short}
    </span>
  );
}

function RegIdBadge({ id }: { id: number | null }) {
  return id != null
    ? <span className="font-mono text-[14px] font-bold text-[#38BDF8] whitespace-nowrap">#{id}</span>
    : <span className="font-mono text-[13px] text-white/35">—</span>;
}

function PkgBadge({ num }: { num: number }) {
  return (
    <span className="inline-flex px-2.5 py-1 w-fit rounded-[6px] bg-[rgba(245,166,35,0.15)] border border-[rgba(245,166,35,0.4)] text-[#F5A623] font-mono text-[14px] font-bold whitespace-nowrap">
      PKG {String(num).padStart(2, "0")}
    </span>
  );
}

function LevelBadge({ level }: { level: number }) {
  return (
    <span className="inline-flex px-2.5 py-1 w-fit rounded-[6px] bg-[rgba(56,189,248,0.15)] border border-[rgba(56,189,248,0.4)] text-[#38BDF8] font-mono text-[14px] font-bold whitespace-nowrap">
      LVL {String(level).padStart(2, "0")}
    </span>
  );
}

// ─── copy button ──────────────────────────────────────────
function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={e => {
        e.stopPropagation();
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="p-1.5 rounded-[5px] text-white/90 hover:text-white hover:bg-white/[0.06] transition-all shrink-0"
    >
      {copied ? <Check size={15} className="text-[#22C55E]" /> : <Copy size={15} />}
    </button>
  );
}

// ─── income type filter dropdown ──────────────────────────
function IncomeTypeFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const isActive = value !== "all";
  const selected = INCOME_TYPE_OPTIONS.find(o => o.value === value) ?? INCOME_TYPE_OPTIONS[0];

  const handleOpen = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
    setOpen(o => !o);
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className={[
          "flex items-center gap-2 px-3.5 py-2.5 rounded-lg border text-[13px] font-mono font-semibold transition-all whitespace-nowrap",
          isActive
            ? "bg-[rgba(56,189,248,0.12)] border-[rgba(56,189,248,0.4)] text-[#38BDF8]"
            : "bg-white/5 border-white/10 text-white hover:border-white/35",
        ].join(" ")}
      >
        <span className={`text-[12px] font-bold shrink-0 ${isActive ? "text-[#38BDF8]" : "text-white"}`}>TYPE</span>
        <span className="hidden sm:inline">{selected.label}</span>
        <span className="sm:hidden">{isActive ? selected.label.split(" ")[0] : "All"}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="fixed z-20 w-48 bg-[#080F26] border border-white/10 rounded-[10px] overflow-y-auto shadow-xl shadow-black/60 py-1 max-h-64"
            style={{ top: dropPos.top, right: dropPos.right }}
          >
            {INCOME_TYPE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={[
                  "w-full text-left px-3.5 py-2.5 font-mono text-[13px] transition-colors",
                  opt.value === value
                    ? "text-[#38BDF8] bg-[rgba(56,189,248,0.1)] font-semibold"
                    : "text-white hover:bg-white/[0.06]",
                ].join(" ")}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── package filter dropdown ───────────────────────────────
function PackageFilter({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const selected = PKG_OPTIONS.find(o => o.value === value) ?? PKG_OPTIONS[0];

  const handleOpen = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
    setOpen(o => !o);
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className={[
          "flex items-center gap-2 px-3.5 py-2.5 rounded-lg border text-[13px] font-mono font-semibold transition-all whitespace-nowrap",
          value > 0
            ? "bg-[rgba(245,166,35,0.12)] border-[rgba(245,166,35,0.4)] text-[#F5A623]"
            : "bg-white/5 border-white/10 text-white hover:border-white/35",
        ].join(" ")}
      >
        <Filter size={13} className={value > 0 ? "text-[#F5A623]" : "text-white"} />
        <span className="hidden sm:inline">{selected.label}</span>
        <span className="sm:hidden">{value > 0 ? `P${value}` : "Filter"}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="fixed z-20 w-44 bg-[#080F26] border border-white/10 rounded-[10px] overflow-y-auto shadow-xl shadow-black/60 py-1 max-h-64"
            style={{ top: dropPos.top, right: dropPos.right }}
          >
            {PKG_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={[
                  "w-full text-left px-3.5 py-2.5 font-mono text-[13px] transition-colors",
                  opt.value === value
                    ? "text-[#F5A623] bg-[rgba(245,166,35,0.1)] font-semibold"
                    : "text-white hover:bg-white/[0.06]",
                ].join(" ")}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── level filter dropdown ─────────────────────────────────
function LevelFilter({ value, onChange }: { value: number | undefined; onChange: (v: number | undefined) => void }) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const isActive = value !== undefined;
  const selected = LEVEL_OPTIONS.find(o => o.value === (value ?? 0)) ?? LEVEL_OPTIONS[0];

  const handleOpen = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
    setOpen(o => !o);
  };

  const handleSelect = (v: number) => {
    onChange(v === 0 ? undefined : v);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className={[
          "flex items-center gap-2 px-3.5 py-2.5 rounded-lg border text-[13px] font-mono font-semibold transition-all whitespace-nowrap",
          isActive
            ? "bg-[rgba(56,189,248,0.12)] border-[rgba(56,189,248,0.4)] text-[#38BDF8]"
            : "bg-white/5 border-white/10 text-white hover:border-white/35",
        ].join(" ")}
      >
        <span className={`text-[12px] font-bold shrink-0 ${isActive ? "text-[#38BDF8]" : "text-white"}`}>LVL</span>
        <span className="hidden sm:inline">{selected.label}</span>
        <span className="sm:hidden">{isActive ? `L${value}` : "All"}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="fixed z-20 w-36 bg-[#080F26] border border-white/10 rounded-[10px] overflow-y-auto shadow-xl shadow-black/60 py-1 max-h-64"
            style={{ top: dropPos.top, right: dropPos.right }}
          >
            {LEVEL_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={[
                  "w-full text-left px-3.5 py-2.5 font-mono text-[13px] transition-colors",
                  opt.value === (value ?? 0)
                    ? "text-[#38BDF8] bg-[rgba(56,189,248,0.1)] font-semibold"
                    : "text-white hover:bg-white/[0.06]",
                ].join(" ")}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── skeleton ──────────────────────────────────────────────
function Skeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-5 border-b border-white/[0.06] animate-pulse">
          <div className="flex-1 space-y-2.5">
            <div className="h-4 rounded bg-white/[0.08] w-40" />
            <div className="h-3 rounded bg-white/[0.06] w-24" />
          </div>
          <div className="hidden sm:block w-20 h-6 rounded bg-white/[0.07]" />
          <div className="w-24 h-4 rounded bg-white/[0.07]" />
          <div className="hidden md:block w-28 h-4 rounded bg-white/[0.07]" />
        </div>
      ))}
    </>
  );
}

// ─── empty ─────────────────────────────────────────────────
function Empty({ searched, filtered }: { searched: boolean; filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center px-4">
      <div className="w-12 h-12 rounded-full border border-white/10 bg-white/[0.03] flex items-center justify-center">
        <span className="text-white font-mono text-[18px]">$</span>
      </div>
      <p className="font-heading text-[16px] font-semibold text-white m-0">
        {searched || filtered ? "No matching records" : "No income yet"}
      </p>
      <p className="font-mono text-[13px] text-white/90 m-0">
        {searched || filtered
          ? "Try adjusting your search or filters"
          : "Income will appear here once payouts are received"}
      </p>
    </div>
  );
}

// ─── pagination ────────────────────────────────────────────
function Pagination({ page, totalPages, total, pageSize, onPage }: {
  page: number; totalPages: number; total: number;
  pageSize: number; onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const range: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) range.push(i);
  } else {
    range.push(1);
    if (page > 3) range.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) range.push(i);
    if (page < totalPages - 2) range.push("…");
    range.push(totalPages);
  }

  const btn = "w-9 h-9 rounded-lg flex items-center justify-center font-mono text-[13px] font-semibold border transition-all";
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-4 border-t border-white/[0.08]">
      <span className="font-mono text-[13px] text-white/70 order-2 sm:order-1">
        Showing <span className="font-bold text-white">{from}–{to}</span> of <span className="font-bold text-white">{total.toLocaleString()}</span> records
      </span>
      <div className="flex items-center gap-1.5 order-1 sm:order-2">
        <button onClick={() => onPage(page - 1)} disabled={page === 1}
          className={`${btn} ${page === 1 ? "border-white/10 text-white/30 cursor-not-allowed" : "border-white/10 text-white hover:bg-white/10"}`}>
          <ChevronLeft size={14} />
        </button>
        {range.map((p, i) =>
          p === "…"
            ? <span key={`e-${i}`} className="w-9 text-center font-mono text-[13px] text-white/50">…</span>
            : <button key={p} onClick={() => onPage(p as number)}
              className={`${btn} ${p === page ? "border-[#38BDF8]/40 bg-[#38BDF8]/25 text-[#38BDF8]" : "border-white/10 text-white hover:bg-white/10"}`}>
              {p}
            </button>
        )}
        <button onClick={() => onPage(page + 1)} disabled={page === totalPages}
          className={`${btn} ${page === totalPages ? "border-white/10 text-white/30 cursor-not-allowed" : "border-white/10 text-white hover:bg-white/10"}`}>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── mobile row (stacked card, no grid) ────────────────────
function MobileRow({ r, showLevel, showUserId, showType, bscScanBase }: {
  r: IncomeRow; showLevel: boolean; showUserId: boolean; showType: boolean; bscScanBase: string;
}) {
  return (
    <div className="px-4 py-5 border-b border-white/[0.06] last:border-0 flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[16px] text-white font-semibold truncate">
          {shortAddr(r.fromUserAddress)}
        </span>
        <CopyBtn value={r.fromUserAddress} />
      </div>

      {showUserId && (
        <div className="flex items-center justify-between">
          <span className="font-mono text-[12px] text-white/90 uppercase tracking-[0.06em]">User ID</span>
          <RegIdBadge id={r.fromContractRegId} />
        </div>
      )}

      {showType && (
        <div className="flex items-center justify-between">
          <span className="font-mono text-[12px] text-white/90 uppercase tracking-[0.06em]">Type</span>
          <IncomeTypeBadge type={r.incomeType} />
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="font-mono text-[12px] text-white/90 uppercase tracking-[0.06em]">Amount</span>
        <span className="font-mono text-[18px] font-bold text-[#22C55E]">{usd(r.amount)}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="font-mono text-[12px] text-white/90 uppercase tracking-[0.06em]">Package</span>
        <PkgBadge num={r.packageNumber} />
      </div>

      {showLevel && r.level !== undefined && (
        <div className="flex items-center justify-between">
          <span className="font-mono text-[12px] text-white/90 uppercase tracking-[0.06em]">Level</span>
          <LevelBadge level={r.level} />
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="font-mono text-[12px] text-white/90 uppercase tracking-[0.06em]">Date</span>
        <span className="font-mono text-[15px] text-[#38BDF8] font-semibold">{formatDateTime(r.timestamp)}</span>
      </div>

      <a
        href={`${bscScanBase}${r.transactionHash}`}
        target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 mt-1 py-2.5 rounded-lg bg-white/5 border border-white/10 font-mono text-[13px] text-white/70 active:bg-white/10 transition-colors"
      >
        {shortHash(r.transactionHash)} <ExternalLink size={12} />
      </a>
    </div>
  );
}

// ─── tablet row (grid, gridStyle MUST match tablet header) ──────
function TabletRow({ r, showLevel, showUserId, showType, gridStyle }: {
  r: IncomeRow; showLevel: boolean; showUserId: boolean; showType: boolean; gridStyle: React.CSSProperties;
}) {
  return (
    <div
      className="grid items-center gap-2 px-4 py-3.5 border-b border-white/[0.06] last:border-0 hover:bg-white/[0.04] transition-colors"
      style={gridStyle}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="font-mono text-[14px] text-white truncate">{shortAddr(r.fromUserAddress)}</span>
        <CopyBtn value={r.fromUserAddress} />
      </div>
      {showUserId && <RegIdBadge id={r.fromContractRegId} />}
      {showType && <IncomeTypeBadge type={r.incomeType} />}
      {showLevel && <LevelBadge level={r.level ?? 0} />}
      <PkgBadge num={r.packageNumber} />
      <span className="font-mono text-[14px] font-semibold text-[#22C55E] whitespace-nowrap">{usd(r.amount)}</span>
    </div>
  );
}

// ─── desktop row (grid, gridStyle MUST match desktop header) ────
function DesktopRow({ r, showLevel, showUserId, showType, bscScanBase, gridStyle }: {
  r: IncomeRow; showLevel: boolean; showUserId: boolean; showType: boolean; bscScanBase: string; gridStyle: React.CSSProperties;
}) {
  return (
    <div
      className="grid items-center gap-2 px-5 py-3.5 border-b border-white/[0.06] last:border-0 hover:bg-white/[0.04] transition-colors group"
      style={gridStyle}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-mono text-[15px] text-white truncate">{r.fromUserAddress}</span>
        <CopyBtn value={r.fromUserAddress} />
      </div>
      {showUserId && <RegIdBadge id={r.fromContractRegId} />}
      {showType && <IncomeTypeBadge type={r.incomeType} />}
      {showLevel && <LevelBadge level={r.level ?? 0} />}
      <PkgBadge num={r.packageNumber} />
      <span className="font-mono text-[15px] font-bold text-[#22C55E] whitespace-nowrap">{usd(r.amount)}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        <a
          href={`${bscScanBase}${r.transactionHash}`}
          target="_blank" rel="noopener noreferrer"
          className="font-mono text-[13px] text-[#38BDF8] hover:text-[#38BDF8]/70 transition-colors truncate"
        >
          {shortHash(r.transactionHash)}
        </a>
        <a
          href={`${bscScanBase}${r.transactionHash}`}
          target="_blank" rel="noopener noreferrer"
          className="text-[#38BDF8] hover:text-[#38BDF8]/70 transition-colors shrink-0"
        >
          <ExternalLink size={13} />
        </a>
      </div>
      <span className="font-mono text-[13px] text-white/70 whitespace-nowrap">{formatDate(r.timestamp)}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  MAIN TABLE
// ─────────────────────────────────────────────────────────
export function RecentIncomePageTable({
  data, isLoading, isFetching,
  page, pageSize, search, pkgFilter = 0, levelFilter, typeFilter = "all",
  onPage, onSearch, onPkgFilter, onLevelFilter, onTypeFilter,
  showLevel = false,
  showUserId = true,   // NEW
  showType = true,     // NEW
  bscScanBase = "https://bscscan.com/tx/",
}: IncomePageTableProps) {
  const [searchInput, setSearchInput] = useState(search);

  const records = data?.records ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const hasFilters =
    !!search || pkgFilter > 0 || levelFilter !== undefined || typeFilter !== "all";

  // ── dynamic grid templates ──
  // Tailwind can't JIT arbitrary classes built at runtime, so we compute the
  // template strings and apply them via inline style. Headers + rows share
  // the exact same template, so columns always line up.
  // Desktop: From | [UserID] | [Type] | [Level] | Package | Amount | TxHash | Date
  const desktopTemplate = [
    "minmax(320px,1fr)",
    showUserId ? "120px" : null,
    showType ? "110px" : null,
    showLevel ? "90px" : null,
    "120px", "130px", "180px", "120px",
  ].filter(Boolean).join(" ");

  // Tablet: From | [UserID] | [Type] | [Level] | Package | Amount
  const tabletTemplate = [
    "minmax(200px,1fr)",
    showUserId ? "80px" : null,
    showType ? "100px" : null,
    showLevel ? "90px" : null,
    "100px", "110px",
  ].filter(Boolean).join(" ");

  const desktopGridStyle: React.CSSProperties = { gridTemplateColumns: desktopTemplate };
  const tabletGridStyle: React.CSSProperties = { gridTemplateColumns: tabletTemplate };

  const desktopHeaders = [
    "From Wallet",
    showUserId ? "User ID" : null,
    showType ? "Type" : null,
    showLevel ? "Level" : null,
    "Package", "Amount", "Tx Hash", "Date",
  ].filter(Boolean) as string[];

  const tabletHeaders = [
    "From",
    showUserId ? "User ID" : null,
    showType ? "Type" : null,
    showLevel ? "Level" : null,
    "Package", "Amount",
  ].filter(Boolean) as string[];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput.trim());
    onPage(1);
  };

  return (
    <div className="bg-[#080F26] border border-white/10 rounded-2xl overflow-hidden">

      {/* ── toolbar ── */}
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">

          {/* search */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 w-full sm:max-w-sm">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search wallet…"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-[13px] font-mono text-white placeholder-white/40 outline-none focus:border-[#38BDF8]/50 focus:bg-white/[0.06] transition-all"
              />
            </div>
            <button type="submit"
              className="px-3.5 py-2.5 rounded-lg bg-[rgba(56,189,248,0.1)] border border-[rgba(56,189,248,0.28)] text-[#38BDF8] text-[12px] font-mono font-semibold hover:bg-[rgba(56,189,248,0.16)] transition-colors whitespace-nowrap">
              Search
            </button>
          </form>

          {/* right controls */}
          <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
            {onTypeFilter && (
              <IncomeTypeFilter value={typeFilter} onChange={v => { onTypeFilter(v); onPage(1); }} />
            )}
            {onPkgFilter && (
              <PackageFilter value={pkgFilter} onChange={v => { onPkgFilter(v); onPage(1); }} />
            )}
            {onLevelFilter && (
              <LevelFilter value={levelFilter} onChange={v => { onLevelFilter(v); onPage(1); }} />
            )}
            {hasFilters && (
              <button
                onClick={() => {
                  setSearchInput("");
                  onSearch("");
                  onPkgFilter?.(0);
                  onLevelFilter?.(undefined);
                  onTypeFilter?.("all");
                  onPage(1);
                }}
                className="px-3 py-2.5 rounded-lg border border-white/10 text-white text-[12px] font-mono font-semibold hover:border-white/35 transition-colors whitespace-nowrap"
              >
                Clear
              </button>
            )}
            {isFetching && !isLoading && (
              <span className="font-mono text-[11px] text-white/50">Updating…</span>
            )}
          </div>
        </div>

        {/* active filter pills */}
        {(pkgFilter > 0 || levelFilter !== undefined || typeFilter !== "all") && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="font-mono text-[12px] text-white/50">Filtered by:</span>
            {typeFilter !== "all" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(56,189,248,0.12)] border border-[rgba(56,189,248,0.4)] font-mono text-[12px] text-[#38BDF8] font-semibold">
                {INCOME_TYPE_OPTIONS.find(o => o.value === typeFilter)?.label ?? typeFilter}
                <button onClick={() => { onTypeFilter?.("all"); onPage(1); }} className="hover:text-white transition-colors">×</button>
              </span>
            )}
            {pkgFilter > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(245,166,35,0.12)] border border-[rgba(245,166,35,0.4)] font-mono text-[12px] text-[#F5A623] font-semibold">
                PKG {String(pkgFilter).padStart(2, "0")}
                <button onClick={() => { onPkgFilter?.(0); onPage(1); }} className="hover:text-white transition-colors">×</button>
              </span>
            )}
            {levelFilter !== undefined && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(56,189,248,0.12)] border border-[rgba(56,189,248,0.4)] font-mono text-[12px] text-[#38BDF8] font-semibold">
                LVL {String(levelFilter).padStart(2, "0")}
                <button onClick={() => { onLevelFilter?.(undefined); onPage(1); }} className="hover:text-white transition-colors">×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── MOBILE (stacked cards, no horizontal scroll needed) ── */}
      <div className="sm:hidden">
        {isLoading ? (
          <Skeleton />
        ) : records.length === 0 ? (
          <Empty searched={!!search} filtered={pkgFilter > 0 || levelFilter !== undefined || typeFilter !== "all"} />
        ) : (
          records.map(r => (
            <MobileRow key={r.id} r={r} showLevel={showLevel} showUserId={showUserId} showType={showType} bscScanBase={bscScanBase} />
          ))
        )}
      </div>

      {/* ── TABLET (grid + horizontal scroll) ── */}
      <div className="hidden sm:block lg:hidden overflow-x-auto">
        <div className={TABLET_MINW}>
          <div className="grid gap-2 px-4 py-4 border-b border-white/10 bg-white/[0.04]" style={tabletGridStyle}>
            {tabletHeaders.map(h => (
              <span key={h} className="font-mono text-[13px] tracking-wider uppercase text-white whitespace-nowrap">{h}</span>
            ))}
          </div>
          {isLoading ? (
            <Skeleton />
          ) : records.length === 0 ? (
            <Empty searched={!!search} filtered={pkgFilter > 0 || levelFilter !== undefined || typeFilter !== "all"} />
          ) : (
            records.map(r => (
              <TabletRow key={r.id} r={r} showLevel={showLevel} showUserId={showUserId} showType={showType} gridStyle={tabletGridStyle} />
            ))
          )}
        </div>
      </div>

      {/* ── DESKTOP (grid + horizontal scroll) ── */}
      <div className="hidden lg:block overflow-x-auto">
        <div className={DESKTOP_MINW}>
          <div className="grid gap-2 px-5 py-4 border-b border-white/10 bg-white/[0.04]" style={desktopGridStyle}>
            {desktopHeaders.map(h => (
              <span key={h} className="font-mono text-[14px] tracking-wider uppercase text-white whitespace-nowrap">{h}</span>
            ))}
          </div>
          {isLoading ? (
            <Skeleton />
          ) : records.length === 0 ? (
            <Empty searched={!!search} filtered={pkgFilter > 0 || levelFilter !== undefined || typeFilter !== "all"} />
          ) : (
            records.map(r => (
              <DesktopRow key={r.id} r={r} showLevel={showLevel} showUserId={showUserId} showType={showType} bscScanBase={bscScanBase} gridStyle={desktopGridStyle} />
            ))
          )}
        </div>
      </div>

      {/* ── footer ── */}
      {!isLoading && records.length > 0 && (
        <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPage={onPage} />
      )}
    </div>
  );
}
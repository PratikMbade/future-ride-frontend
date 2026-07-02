import React from 'react'



/* ─── Inline styles ────────────────────────────────────────────────────────── */
const css = `
@keyframes shimmer {
  0%   { transform: translateX(-100%) skewX(-12deg); }
  100% { transform: translateX(220%)  skewX(-12deg); }
}
@keyframes borderGlow {
  0%, 100% { opacity: 0.5; }
  50%       { opacity: 1;   }
}
@keyframes pulseRing {
  0%   { transform: scale(1);   opacity: 0.6; }
  70%  { transform: scale(1.6); opacity: 0;   }
  100% { transform: scale(1.6); opacity: 0;   }
}
@keyframes floatGlow {
  0%, 100% { opacity: 0.10; transform: translateY(0px);   }
  50%       { opacity: 0.18; transform: translateY(-6px); }
}
.ownership-card {
  position: relative;
  background: linear-gradient(
    145deg,
    rgba(8,20,33,0.95) 0%,
    rgba(4,10,20,0.98) 50%,
    rgba(6,15,28,0.96) 100%
  );
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border: 1px solid rgba(56,189,248,0.18);
  border-radius: 12px;
  overflow: hidden;
}
.ownership-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(56,189,248,0.05) 0%,
    transparent 50%,
    rgba(56,189,248,0.03) 100%
  );
  border-radius: 12px;
  pointer-events: none;
}
.shimmer-sweep {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  border-radius: 12px;
}
.shimmer-sweep::after {
  content: '';
  position: absolute;
  top: 0; bottom: 0;
  width: 50%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(56,189,248,0.06) 40%,
    rgba(56,189,248,0.12) 50%,
    rgba(56,189,248,0.06) 60%,
    transparent 100%
  );
  animation: shimmer 4s ease-in-out infinite;
  animation-delay: 1.5s;
}
.top-glow-border {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(56,189,248,0.3) 20%,
    rgba(56,189,248,0.9) 50%,
    rgba(56,189,248,0.3) 80%,
    transparent 100%
  );
  animation: borderGlow 3s ease-in-out infinite;
}
.ambient-glow {
  position: absolute;
  top: -60px; left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 120px;
  background: radial-gradient(ellipse, rgba(56,189,248,0.15) 0%, transparent 70%);
  pointer-events: none;
  animation: floatGlow 5s ease-in-out infinite;
}
.shield-wrapper {
  position: relative;
  width: 52px;
  height: 52px;
  flex-shrink: 0;
}
.shield-wrapper::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 12px;
  background: radial-gradient(circle, rgba(56,189,248,0.2) 0%, transparent 70%);
  animation: pulseRing 2.5s ease-out infinite;
}
.shield-icon {
  width: 52px;
  height: 52px;
  border-radius: 10px;
  background: linear-gradient(
    135deg,
    rgba(56,189,248,0.20) 0%,
    rgba(56,189,248,0.08) 100%
  );
  border: 1px solid rgba(56,189,248,0.30);
  box-shadow:
    0 0 12px rgba(56,189,248,0.15),
    inset 0 1px 0 rgba(255,255,255,0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}
.verified-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 4px;
  background: linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.08) 100%);
  border: 1px solid rgba(16,185,129,0.35);
  box-shadow: 0 0 8px rgba(16,185,129,0.12);
  font-size: 9px;
  letter-spacing: 0.15em;
  color: #4ade80;
  text-transform: uppercase;
}
.renounced-callout {
  position: relative;
  padding: 14px 14px 14px 18px;
  background: linear-gradient(
    135deg,
    rgba(16,185,129,0.08) 0%,
    rgba(16,185,129,0.03) 100%
  );
  border: 1px solid rgba(16,185,129,0.20);
  border-radius: 8px;
  overflow: hidden;
}
.renounced-callout::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, #10b981 0%, rgba(16,185,129,0.3) 100%);
  box-shadow: 0 0 8px rgba(16,185,129,0.4);
}
.glass-table {
  background: rgba(4,10,20,0.6);
  border: 1px solid rgba(56,189,248,0.10);
  border-radius: 8px;
  overflow: hidden;
  backdrop-filter: blur(8px);
}
.glass-table-row {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 4px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(56,189,248,0.07);
  transition: background 0.2s;
}
.glass-table-row:last-child { border-bottom: none; }
.glass-table-row:hover { background: rgba(56,189,248,0.04); }
@media (min-width: 480px) {
  .glass-table-row {
    flex-direction: row;
    align-items: center;
    gap: 12px;
  }
}
.feature-chip {
  padding: 12px;
  background: linear-gradient(
    145deg,
    rgba(56,189,248,0.07) 0%,
    rgba(56,189,248,0.02) 100%
  );
  border: 1px solid rgba(56,189,248,0.12);
  border-radius: 8px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
  transition: border-color 0.25s, background 0.25s;
}
.feature-chip:hover {
  border-color: rgba(56,189,248,0.25);
  background: linear-gradient(
    145deg,
    rgba(56,189,248,0.11) 0%,
    rgba(56,189,248,0.04) 100%
  );
}
.cta-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 6px;
  background: linear-gradient(
    135deg,
    rgba(56,189,248,0.12) 0%,
    rgba(56,189,248,0.05) 100%
  );
  border: 1px solid rgba(56,189,248,0.35);
  box-shadow:
    0 0 0 1px rgba(56,189,248,0.05),
    0 4px 16px rgba(56,189,248,0.08),
    inset 0 1px 0 rgba(255,255,255,0.07);
  text-decoration: none;
  transition: all 0.25s ease;
  cursor: pointer;
}
.cta-button:hover {
  border-color: rgba(56,189,248,0.65);
  background: linear-gradient(
    135deg,
    rgba(56,189,248,0.18) 0%,
    rgba(56,189,248,0.08) 100%
  );
  box-shadow:
    0 0 0 1px rgba(56,189,248,0.1),
    0 4px 24px rgba(56,189,248,0.18),
    inset 0 1px 0 rgba(255,255,255,0.10);
  transform: translateY(-1px);
}
.copy-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 3px;
  border-radius: 4px;
  color: rgba(56,189,248,0.45);
  transition: color 0.2s, background 0.2s;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}
.copy-btn:hover {
  color: #38bdf8;
  background: rgba(56,189,248,0.08);
}
`

/* ─── Sub-components ───────────────────────────────────────────────────────── */
function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button onClick={handleCopy} className="copy-btn" title="Copy to clipboard">
      {copied ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-4 10h6a2 2 0 002-2v-8a2 2 0 00-2-2h-6a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  )
}

function CornerAccent({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const size = 14
  const d = {
    tl: `M${size},2 L2,2 L2,${size}`,
    tr: `M2,2 L${size},2 L${size},${size}`,
    bl: `M${size},${size} L2,${size} L2,2`,
    br: `M2,${size} L${size},${size} L${size},2`,
  }[pos]
  const style: React.CSSProperties = {
    position: 'absolute',
    top:    pos.startsWith('t') ? 0 : 'auto',
    bottom: pos.startsWith('b') ? 0 : 'auto',
    left:   pos.endsWith('l')   ? 0 : 'auto',
    right:  pos.endsWith('r')   ? 0 : 'auto',
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={style}>
      <path d={d} fill="none" stroke="rgba(56,189,248,0.55)" strokeWidth={1.5} />
    </svg>
  )
}

function AddressRow({
  label, value, href,
}: { label: string; value: string; href?: string }) {

  return (
    <div className="glass-table-row">
      <span style={{
        fontSize: 11,
        letterSpacing: '0.18em',
        color: 'rgba(56,189,248,1)',
        textTransform: 'uppercase',
        minWidth: 110,
        flexShrink: 0,
      }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, minWidth: 0, flex: 1 }}>
        <span style={{
          fontSize: 14,
          color: 'rgba(255,255,255,0.80)',
          wordBreak: 'break-all',   // ← breaks long hex strings/addresses
          flex: 1,
          minWidth: 0,
        }}>
          {value}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, paddingTop: 1 }}>
          <CopyButton value={value} />
          {href && (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              title="View on BscScan"
              style={{ color: 'rgba(56,189,248,0.45)', display: 'flex' }}
              className="hover:text-[#38bdf8] transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Main Export ──────────────────────────────────────────────────────────── */
export function ContractOwnershipBanner() {
  return (
    <section
    
      aria-label="Contract ownership verification"
      className='max-w-7xl mx-auto'
  style={{ padding: '40px 16px', display: 'flex', justifyContent: 'center', overflowX: 'hidden', width: '100%'}}
    >
      <style>{css}</style>

      <div style={{ width: '100%' }} className=''>

        {/* ── Eyebrow ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }} className=''>
          <span style={{
            fontSize: 20,
            letterSpacing: '0.22em',
            color: 'white',
            textTransform: 'uppercase',
          }}>
           Trust &amp; Verification
          </span>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(56,189,248,0.15) 0%, transparent 100%)' }} />
        </div>

        {/* ── Card shell ── */}
        <div style={{ position: 'relative' }}>

          {/* Outer ambient glow */}
          <div className="ambient-glow" />

          {/* Card */}
          <div className="ownership-card " >
            <div className="top-glow-border" />
            <div className="shimmer-sweep" />

            <div style={{ position: 'relative', padding: '28px 24px' }}>
              <CornerAccent pos="tl" />
              <CornerAccent pos="tr" />
              <CornerAccent pos="bl" />
              <CornerAccent pos="br" />

              {/* ── Header ── */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>

                {/* Shield */}
                <div className="shield-wrapper">
                  <div className="shield-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                      stroke="url(#shieldGrad)" strokeWidth={1.5}>
                      <defs>
                        <linearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#7dd3fc" />
                          <stop offset="100%" stopColor="#38bdf8" />
                        </linearGradient>
                      </defs>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  </div>
                </div>

                {/* Title block */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Contract 1: Future Ride Matrix */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h2 style={{
                      fontSize: 15,
                      fontWeight: 600,
                      letterSpacing: '0.20em',
                      color: '#ffffff',
                      textTransform: 'uppercase',
                      margin: 0,
                    }}>
                      Future Ride Matrix & Royalty 
                    </h2>
                    <div className="verified-badge">
                      <svg width="9" height="9" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      On-chain verified
                    </div>
                  </div>
               
                  <p style={{
                    fontSize: 13,
                    letterSpacing: '0.12em',
                    color: 'rgba(56,189,248,3.45)',
                    textTransform: 'uppercase',
                    margin: 0,
                  }}>
                    BNB Smart Chain — Ownership Renounced
                  </p>
                </div>
              </div>

              {/* ── Renounced callout ── */}
              <div className="renounced-callout" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="#34d399" strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p style={{
                      fontSize: 13,
                      color: '#6ee7b7',
                      letterSpacing: '0.08em',
                      marginBottom: 4,
                      fontWeight: 600,
                    }}>
                      Owner Key Public
                    </p>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,1.38)', lineHeight: 1.7, margin: 0 }}>
                      Contract ownership has been permanently transferred to the zero address.
                      No wallet — including the deployer — can modify, pause, or upgrade
                      this contract. Rules are enforced by code alone.
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Address table ── */}
              <div className="glass-table" style={{ marginBottom: 20 }}>
                <AddressRow label="Matrix Contract Address"     value={"0x4b723b4E500d99493ed4003705Bd7840927AEa62"} href={`https://bscscan.com/address/0x4b723b4e500d99493ed4003705bd7840927aea62`} />
                <AddressRow label="Royalty Contract Address"     value={"0x95c1A8a724472725e37aaaB939c101eD0Ba9c84b"} href={`https://bscscan.com/address/0x95c1A8a724472725e37aaaB939c101eD0Ba9c84b`} />


                <AddressRow label="Owner Private Key" value={"0x00c6701e0cbd27d6a2cc383a2d9bc86f271da2e95b0cbcb80a7e5476b302dcff"} />
                 <AddressRow label="Owner Key Pharse" value={"pause return milk hat pupil chapter immune history have life salmon chase"} />

              </div>

   


            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
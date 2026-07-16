import { useRef, useState } from 'react'

interface PageSizeDropdownProps {
  value: number
  options: number[]
  onChange: (v: number) => void
  testId?: string
}

export function PageSizeDropdown({ value, options, onChange, testId }: PageSizeDropdownProps) {
  const [open, setOpen] = useState(false)
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  const handleOpen = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      // Opens upward — this control lives at the bottom of the table,
      // so a downward menu would clip on short viewports / mobile.
      setDropPos({ top: rect.top - 6, left: rect.left })
    }
    setOpen((o) => !o)
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        data-testid={testId}
        onClick={handleOpen}
        type="button"
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-mono hover:bg-white/10 transition-colors"
      >
        <span>{value}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="fixed z-20 bg-[#080F26] border border-white/10 rounded-[10px] overflow-y-auto shadow-xl shadow-black/60 py-1"
            style={{ left: dropPos.left, top: dropPos.top, transform: 'translateY(-100%)', minWidth: 72 }}
          >
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false) }}
                className="w-full text-left px-3.5 py-2 font-mono text-[13px] transition-colors"
                style={
                  opt === value
                    ? { color: '#38BDF8', background: 'rgba(56,189,248,0.1)', fontWeight: 600 }
                    : { color: '#fff' }
                }
                onMouseEnter={(e) => { if (opt !== value) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                onMouseLeave={(e) => { if (opt !== value) e.currentTarget.style.background = 'transparent' }}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface Props {
  address: string
  truncate?: boolean
  showCopy?: boolean
  className?: string
  'data-testid'?: string
}

export function WalletAddress({ address, truncate = true, showCopy = true, className = '', 'data-testid': testId }: Props) {
  const [copied, setCopied] = useState(false)
  const display = truncate ? `${address.slice(0, 6)}...${address.slice(-4)}` : address

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <span data-testid={testId} className={`inline-flex items-center gap-1.5 font-mono text-sm ${className}`}>
      <span>{display}</span>
      {showCopy && (
        <button
          onClick={handleCopy}
          data-testid={testId ? `${testId}-copy` : undefined}
          className="text-[#38BDF8]/50 hover:text-[#38BDF8] transition-colors p-0.5 rounded"
          title="Copy address"
        >
          {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
        </button>
      )}
    </span>
  )
}

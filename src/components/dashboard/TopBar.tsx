import { Menu, User, Bell } from 'lucide-react'
import { WalletAddress } from './WalletAddress'
import { useActiveAccount } from 'thirdweb/react'

interface Props {
  title: string
  walletAddress?: string
  onMenuOpen: () => void
}

export function TopBar({ title, walletAddress, onMenuOpen }: Props) {
  const account = useActiveAccount()
  return (
    <header
      data-testid="topbar"
      className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 h-17 bg-[#050A18]/90 backdrop-blur-md border-b border-white/[0.05]"
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          data-testid="hamburger-menu"
          aria-label="Open sidebar menu"
          onClick={onMenuOpen}
          className="lg:hidden p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold tracking-widest uppercase text-white">{title}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-pulse" />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {account && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/50">
            <WalletAddress address={account.address!} truncate showCopy={false} className="text-xs text-white/50" />
          </div>
        )}
        <button data-testid="topbar-profile" className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1B4FD8] to-[#38BDF8] flex items-center justify-center text-white hover:opacity-90 transition-opacity">
          <User size={15} />
        </button>
      </div>
    </header>
  )
}

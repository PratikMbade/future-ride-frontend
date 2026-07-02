// future ride dashboard sidebar
import React, { useState } from 'react'
import { Link, useRouterState, useNavigate } from '@tanstack/react-router'
import {
  Home, Settings, Users, GitBranch, TrendingUp,
  DollarSign, Search, User, LogOut, ChevronDown,
  ChevronRight, X, Zap,
  LucideCardSim,
  Link2,
  Merge,
  Layers,
  Copy,
  Check,
} from 'lucide-react'
import { useActiveAccount, useActiveWallet, useDisconnect } from 'thirdweb/react'
import { LOGO_URL } from '../../constants/assets'
import { authClient } from '#/lib/authClient'

interface NavChild { label: string; href: string; icon: React.ReactNode }
interface NavItem {
  label: string; href: string; icon: React.ReactNode
  children?: NavChild[]
}

const NAV: NavItem[] = [
  { label: 'Home',              href: '/dashboard/',                icon: <Home size={17} /> },
  { label: 'Future Ride System',href: '/dashboard/future-ride-system',  icon: <Zap size={17} /> },
    { label: 'Royalty',href: '/dashboard/royalty',  icon: <Layers size={17} /> },
    { label: 'User Register & Package Buy',href: '/dashboard/other-user',  icon: <Users size={17} /> },

   {
    label: 'Team', href: '/dashboard/team/', icon: <Users size={17} />,
    children: [
      { label: 'Direct Team',     href: '/dashboard/team/direct-team',       icon: <Link2 size={14} /> },
      { label: 'Generation Team', href: '/dashboard/team/generation-team',    icon: <Merge size={14} /> },
    ],
  },
  { label: 'Generation Tree',   href: '/dashboard/generation-tree',     icon: <GitBranch size={17} /> },
  {
    label: 'Income', href: '/dashboard/income/direct', icon: <TrendingUp size={17} />,
    children: [
      { label: 'Direct Income',     href: '/dashboard/income/direct-income',       icon: <DollarSign size={14} /> },
      { label: 'Generation Income', href: '/dashboard/income/generation-income',    icon: <TrendingUp size={14} /> },
            { label: 'Laps Income', href: '/dashboard/income/laps-income',    icon: <DollarSign size={14} /> },
                  // { label: 'Royalty Income', href: '/dashboard/income/royalty-income',    icon: <LucideCardSim size={14} /> },
                  { label: 'Lost Income', href: '/dashboard/income/lost-income',    icon: <DollarSign size={14} /> },

    ],
  },

]

interface Props { open: boolean; onClose: () => void }

// ─── copy address button ──────────────────────────────────
function CopyAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-[6px] text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all shrink-0"
      title="Copy address"
    >
      {copied
        ? <Check className="h-3 w-3 text-[#17c964]" />
        : <Copy className="h-3 w-3" />}
    </button>
  )
}

export function Sidebar({ open, onClose }: Props) {
  const state = useRouterState()
  const navigate = useNavigate()
  const pathname = state.location.pathname
  const [expanded, setExpanded] = useState<string[]>([])

  const account = useActiveAccount()
  const wallet = useActiveWallet()
  const { disconnect } = useDisconnect()

  const toggle = (label: string) =>
    setExpanded((e) => e.includes(label) ? e.filter((x) => x !== label) : [...e, label])

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`

  // ── logout: disconnect wallet ──────────────────────────
  const handleLogout = async () => {
    try {
      await authClient.signOut();
    } catch {}
    if (wallet) disconnect(wallet);
    await navigate({ to: "/login" as any });
  };

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}

      <aside
        data-testid="sidebar"
        className={`
          fixed lg:sticky inset-y-0 lg:top-0 left-0 z-40 flex flex-col
          w-[250px] h-screen lg:h-screen bg-[#050D24] border-r border-white/[0.05]
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-1.5 border-b border-white/[0.05]">
          <Link to="/dashboard" onClick={onClose} className="flex  w-full items-center gap-1 mx-auto ">
            <img src={LOGO_URL} alt="FutureRide" className="w-14 h-14 object-contain drop-shadow-[0_0_12px_rgba(56,189,248,0.4)]" style={{ mixBlendMode: 'screen' }} />
            <span className="font-black text-lg ml-2  tracking-tight">
              <span className="text-[#38BDF8]">FUTURE</span>
              <span className="text-[#F5A623]">RIDE</span>
            </span>
          </Link>
          <button onClick={onClose} className="lg:hidden absolute right-3 top-4 text-white/40 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5 scrollbar-thin">
          {NAV.map((item) => {
            const active = isActive(item.href)
            const childActive = item.children?.some((c) => isActive(c.href)) ?? false
            const isOpen = expanded.includes(item.label)

            if (item.children) {
              return (
                <div key={item.label}>
                  <button
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => toggle(item.label)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-lg font-medium transition-all duration-200 group
                      ${childActive ? 'text-[#38BDF8] bg-[#38BDF8]/8' : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'}`}
                  >
                    <span className={childActive ? 'text-[#38BDF8]' : 'text-white/40 group-hover:text-white/60'}>{item.icon}</span>
                    <span className="flex-1 text-left ">{item.label}</span>
                    {isOpen ? <ChevronDown size={13} className="opacity-50" /> : <ChevronRight size={13} className="opacity-50" />}
                  </button>
                  {isOpen && (
                    <div className="ml-4 mt-0.5 space-y-0.5 border-l border-white/[0.06] pl-3">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          to={child.href as '/dashboard/income/direct-income'}
                          onClick={onClose}
                          data-testid={`nav-${child.label.toLowerCase().replace(/\s+/g, '-')}`}
                          className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-md font-medium transition-all duration-200
                            ${isActive(child.href) ? 'text-[#38BDF8] bg-[#38BDF8]/10' : 'text-white/70 hover:text-white/70 hover:bg-white/[0.03]'}`}
                        >
                          <span className={isActive(child.href) ? 'text-[#38BDF8]' : ''}>{child.icon}</span>
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Link
                key={item.href}
                to={item.href as '/dashboard'}
                onClick={onClose}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-lg font-medium transition-all duration-200 group
                  ${active ? 'text-white bg-gradient-to-r from-[#1B4FD8] to-[#1E56D9] shadow-[0_0_16px_rgba(27,79,216,0.3)]' : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'}`}
              >
                <span className={active ? 'text-white' : 'text-white/40 group-hover:text-white/60'}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Wallet + Logout */}
        <div className="p-3 border-t border-white/[0.05] space-y-2">
          {/* connected wallet card */}
          {account && (
            <div className="rounded-[10px] border border-white/[0.08] bg-white/[0.025] px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#38bdf8] mb-1">
                Connected Wallet
              </p>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-1.5 h-1.5 rounded-full bg-[#17c964] shrink-0"
                  style={{ boxShadow: '0 0 6px rgba(23,201,100,0.7)' }}
                />
                <span className="flex-1 min-w-0 truncate font-mono text-[12px] text-white/80">
                  {shortAddr(account.address)}
                </span>
                <CopyAddress address={account.address} />
              </div>
            </div>
          )}

          <button
            data-testid="nav-logout"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400/70 hover:text-red-400 hover:bg-red-400/8 transition-all duration-200"
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      </aside>
    </>
  )
}
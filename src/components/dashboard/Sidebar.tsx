import React, { useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import {
  Home, Settings, Users, GitBranch, TrendingUp,
  DollarSign, Search, User, LogOut, ChevronDown,
  ChevronRight, X, Zap,
} from 'lucide-react'
import { LOGO_URL } from '../../constants/assets'

interface NavChild { label: string; href: string; icon: React.ReactNode }
interface NavItem {
  label: string; href: string; icon: React.ReactNode
  children?: NavChild[]
}

const NAV: NavItem[] = [
  { label: 'Home',              href: '/dashboard/home',                icon: <Home size={17} /> },
  { label: 'Future Ride System',href: '/dashboard/future-ride-system',  icon: <Zap size={17} /> },
  { label: 'Direct Team',       href: '/dashboard/direct-team',         icon: <Users size={17} /> },
  { label: 'Generation Tree',   href: '/dashboard/generation-tree',     icon: <GitBranch size={17} /> },
  {
    label: 'Income', href: '/dashboard/income/direct', icon: <TrendingUp size={17} />,
    children: [
      { label: 'Direct Income',     href: '/dashboard/income/direct',       icon: <DollarSign size={14} /> },
      { label: 'Generation Income', href: '/dashboard/income/generation',    icon: <TrendingUp size={14} /> },
      { label: 'Preview Other User',href: '/dashboard/income/preview-user',  icon: <Search size={14} /> },
    ],
  },
  { label: 'Profile', href: '/dashboard/profile', icon: <User size={17} /> },
]

interface Props { open: boolean; onClose: () => void }

export function Sidebar({ open, onClose }: Props) {
  const state = useRouterState()
  const pathname = state.location.pathname
  const [expanded, setExpanded] = useState<string[]>(['Income'])

  const toggle = (label: string) =>
    setExpanded((e) => e.includes(label) ? e.filter((x) => x !== label) : [...e, label])

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

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
          fixed lg:static inset-y-0 left-0 z-40 flex flex-col
          w-[220px] bg-[#050D24] border-r border-white/[0.05]
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ minHeight: '100dvh' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 pt-5 pb-4 border-b border-white/[0.05]">
          <Link to="/dashboard/home" onClick={onClose} className="flex flex-col items-center gap-1 mx-auto">
            <img src={LOGO_URL} alt="FutureRide" className="w-14 h-14 object-contain drop-shadow-[0_0_12px_rgba(56,189,248,0.4)]" style={{ mixBlendMode: 'screen' }} />
            <span className="font-black text-sm tracking-tight">
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
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                      ${childActive ? 'text-[#38BDF8] bg-[#38BDF8]/8' : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'}`}
                  >
                    <span className={childActive ? 'text-[#38BDF8]' : 'text-white/40 group-hover:text-white/60'}>{item.icon}</span>
                    <span className="flex-1 text-left">{item.label}</span>
                    {isOpen ? <ChevronDown size={13} className="opacity-50" /> : <ChevronRight size={13} className="opacity-50" />}
                  </button>
                  {isOpen && (
                    <div className="ml-4 mt-0.5 space-y-0.5 border-l border-white/[0.06] pl-3">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          to={child.href as '/dashboard/income/direct'}
                          onClick={onClose}
                          data-testid={`nav-${child.label.toLowerCase().replace(/\s+/g, '-')}`}
                          className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-200
                            ${isActive(child.href) ? 'text-[#38BDF8] bg-[#38BDF8]/10' : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'}`}
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
                to={item.href as '/dashboard/home'}
                onClick={onClose}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                  ${active ? 'text-white bg-gradient-to-r from-[#1B4FD8] to-[#1E56D9] shadow-[0_0_16px_rgba(27,79,216,0.3)]' : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'}`}
              >
                <span className={active ? 'text-white' : 'text-white/40 group-hover:text-white/60'}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/[0.05]">
          <button
            data-testid="nav-logout"
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

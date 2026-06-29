import React, { useState } from 'react'
import { Outlet, useRouterState } from '@tanstack/react-router'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { TopBar } from '@/components/dashboard/TopBar'

const TITLES: Record<string, string> = {
  '/dashboard/home':                 'Dashboard',
  '/dashboard/future-ride-system':   'Future Ride System',
  '/dashboard/direct-team':          'Direct Team',
  '/dashboard/generation-tree':      'Generation Tree',
  '/dashboard/income/direct':        'Direct Income',
  '/dashboard/income/generation':    'Generation Income',
  '/dashboard/income/preview-user':  'Preview Other User',
  '/dashboard/profile':              'Profile',
}

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const state = useRouterState()
  const pathname = state.location.pathname
  const title = TITLES[pathname] ?? 'Dashboard'

  return (
    <div data-testid="dashboard-layout" className="flex h-screen overflow-hidden bg-[#050A18] font-sans">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopBar
          title={title}
          walletAddress="0xA1B2C3D4E5F6789012345678901234567890ABCD"
          onMenuOpen={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
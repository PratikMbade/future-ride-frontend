import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { QueryClientProvider } from '@tanstack/react-query'

import appCss from '../styles.css?url'
import { queryClient } from '../lib/query-client'
import { AutoConnect, ThirdwebProvider } from 'thirdweb/react'
import { createWallet, inAppWallet } from 'thirdweb/wallets'
import { client } from "@/lib/client";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'TanStack Start Starter' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  notFoundComponent: () => (
    <div className="flex flex-col items-center justify-center min-h-screen gap-2">
      <p className="text-lg font-semibold">Page not found</p>
      <a href="/" className="text-[#38BDF8] text-sm">Go home</a>
    </div>
  ),
  shellComponent: RootDocument,
})
const wallets = [
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  inAppWallet(),
];


function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
    <ThirdwebProvider>
           <AutoConnect
        client={client}
        wallets={wallets}
        timeout={10000}
      />
          <QueryClientProvider client={queryClient}>
          {children}
          <TanStackDevtools
            config={{ position: 'bottom-right' }}
            plugins={[
              { name: 'Tanstack Router', render: <TanStackRouterDevtoolsPanel /> },
            ]}
          />
        </QueryClientProvider>
    </ThirdwebProvider>
        <Scripts />
      </body>
    </html>
  )
}
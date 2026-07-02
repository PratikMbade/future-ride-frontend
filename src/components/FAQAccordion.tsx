import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'

const FAQS = [
  { q: 'What is FutureRide?', a: 'FutureRide is a decentralized community growth and reward ecosystem built on BNB Smart Chain. It is a peer-to-peer participation model that distributes rewards automatically via verified smart contracts — no company, no admins, no central control.' },
  { q: 'How do I get started with FutureRide?', a: 'Connect your BNB Smart Chain compatible wallet (MetaMask, Token Pocket, or SafePal), choose a package starting from just $5, and begin building your network. Everything is automated by smart contract.' },
  { q: 'Which wallets are supported?', a: 'MetaMask, Token Pocket, and SafePal Wallet are all supported. Ensure your wallet is connected to the BNB Smart Chain (BSC) network before participating.' },
  { q: 'How are rewards distributed?', a: 'Rewards split automatically: 20% Direct Income (instant referral), 50% Upgrade Income (team upgrades), and 30% Daily Royalty Distribution. Zero human involvement — purely smart contract driven.' },
  { q: 'Is FutureRide a financial investment?', a: 'No. FutureRide is a decentralized community participation platform, not a financial advisor or investment company. All information is educational only. Participants are responsible for their own financial decisions.' },
  { q: 'Are earnings guaranteed?', a: 'No. All earnings and income examples shown are illustrative only. Results depend on individual participation, network growth, and market conditions. Cryptocurrency carries inherent risks — please participate responsibly.' },
  { q: 'How secure is the platform?', a: 'Built on BNB Smart Chain with audited and verified smart contracts. All transactions are 100% peer-to-peer, fully automated, and completely on-chain. No funds are held by any central entity.' },
  { q: 'Are my package slots permanent?', a: 'Yes. Once you activate a package level, your rank slot is permanent — no time limits, no expiry. Your position in the FutureRide structure lasts for life, ensuring long-term opportunity at every level.' },
]

export function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" data-testid="faq-section" className="relative py-28 md:py-36 overflow-hidden">
      <span aria-hidden className="sec-num -top-4 right-4">10</span>

      <div className="max-w-4xl mx-auto px-5 md:px-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="mb-14"
        >
          <span className="inline-block px-4 py-1.5 text-xs font-bold tracking-widest uppercase rounded-full border border-[#38BDF8]/25 bg-[#38BDF8]/8 text-[#38BDF8] mb-5">
            FAQ
          </span>
          <h2 className="font-black text-white text-4xl sm:text-5xl lg:text-6xl leading-tight tracking-tight">
            Got Questions?<br /><span className="text-brand">We Have Answers.</span>
          </h2>
        </motion.div>

        <div className="space-y-0">
          {FAQS.map((faq, i) => (
            <motion.div
              key={i}
              data-testid={`faq-item-${i}`}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.3) }}
              className="border-b border-white/8"
            >
              <button
                data-testid={`faq-toggle-${i}`}
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-start justify-between py-6 text-left gap-6 group"
              >
                <div className="flex items-start gap-4">
                  <span className="font-mono-custom font-bold text-xs shrink-0 mt-1" style={{ color: open === i ? '#38BDF8' : 'rgba(56,189,248,0.3)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className={`font-semibold text-sm sm:text-base transition-colors duration-200 ${open === i ? 'text-white' : 'text-white group-hover:text-white'}`}>
                    {faq.q}
                  </span>
                </div>
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 mt-0.5 ${open === i ? 'bg-[#38BDF8]/15 border border-[#38BDF8]/30' : 'bg-white/5 border border-white/10 group-hover:bg-white/8'}`}>
                  {open === i ? <Minus size={13} className="text-[#38BDF8]" /> : <Plus size={13} className="text-white" />}
                </div>
              </button>

              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <p className="text-white text-sm leading-relaxed pb-7 pl-10 pr-14">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

import { motion } from 'framer-motion'
import { Gift, Users, Coins, Zap } from 'lucide-react'

const STEPS = [
  {
    Icon: Users, c: '#38BDF8', title: 'Qualify',
    desc: 'Refer 2 direct members across the packages to qualify for the current pool.',
  },
  {
    Icon: Coins, c: '#F5A623', title: 'Shared Equally',
    desc: 'When a pool closes, its locked funds are split equally among all qualified members.',
  },
  {
    Icon: Zap, c: '#22C55E', title: 'Claim On-Chain',
    desc: 'Claim your share directly from the smart contract — no middlemen, no delays.',
  },
]

export function RoyaltyCards() {
  return (
    <section id="royalty" data-testid="royalty-section" className="relative py-20 sm:py-28 md:py-36 overflow-hidden">
      <span aria-hidden className="sec-num -top-4 left-0">07</span>

      <div className="max-w-7xl mx-auto px-4 sm:px-5 md:px-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="mb-10 sm:mb-14"
        >
          <span className="inline-block px-4 py-1.5 text-xs font-bold tracking-widest uppercase rounded-full border border-[#A855F7]/25 bg-[#A855F7]/8 text-[#A855F7] mb-5">
            Daily Royalty Pool
          </span>
          <h2 className="font-black text-white text-3xl sm:text-5xl lg:text-6xl leading-tight tracking-tight">
            5% Daily <span className="text-brand">Royalty Pool</span>
          </h2>
          <p className="text-white/55 text-sm sm:text-base mt-4 max-w-xl">
            A share of the ecosystem is set aside in the Daily Royalty Pool and distributed to every qualified member — automatically, on-chain.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4 sm:gap-5">
          <motion.div
            initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            data-testid="royalty-pool-rate"
            className="relative rounded-2xl overflow-hidden p-6 sm:p-8 flex flex-col justify-between gap-6"
            style={{
              background: 'linear-gradient(135deg, rgba(168,85,247,0.28), rgba(56,189,248,0.10) 55%, rgba(3,13,40,0.95))',
              border: '1px solid rgba(168,85,247,0.45)',
              boxShadow: '0 20px 50px -20px rgba(168,85,247,0.55)',
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#A855F7] to-transparent" />
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(168,85,247,0.18)', border: '1px solid rgba(168,85,247,0.5)' }}
            >
              <Gift className="w-6 h-6 text-[#C084FC]" />
            </div>
            <div>
              <div className="font-black text-6xl sm:text-7xl leading-none tracking-tight text-white">5%</div>
              <div className="mt-2 text-xs sm:text-sm font-bold tracking-[0.18em] uppercase text-[#C084FC]">Daily Royalty Pool</div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: (i + 1) * 0.12 }}
                className="relative rounded-2xl p-5 sm:p-6 flex flex-col gap-4 transition-transform duration-300 hover:-translate-y-1"
                style={{
                  background: `linear-gradient(135deg, ${s.c}1F, rgba(3,13,40,0.95))`,
                  border: `1px solid ${s.c}55`,
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-[1.5px]" style={{ background: `linear-gradient(90deg, transparent, ${s.c}99, transparent)` }} />
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center"
                  style={{ background: `${s.c}1F`, border: `1px solid ${s.c}55` }}
                >
                  <s.Icon className="w-5 h-5" style={{ color: s.c }} />
                </div>
                <div>
                  <div className="font-extrabold text-lg tracking-tight mb-1.5" style={{ color: s.c }}>{s.title}</div>
                  <p className="text-white/60 text-xs sm:text-sm leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

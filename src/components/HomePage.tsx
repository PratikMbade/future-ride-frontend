import  { useEffect } from 'react'
import { Navbar } from './Navbar'
import { Hero } from './Hero'
import { StatsMarquee } from './StatsMarquee'
import { About } from './About'
import { Features } from './Feature'
import { HowItWorks } from './HowItWorks'
import { IncomeDistribution } from './IncomeDistribution'
import { Packages } from './Packages'
import { RoyaltyCards } from './RoyaltyCards'
import { Benefits } from './Benefits'
import { StatsSection } from './StatsSection'
import { FAQAccordion } from './FAQAccordion'
import { CTASection } from './CTASection'
import { Footer } from './Footer'
import { SpaceBackground } from './SpaceBackground'
import PackagesTemplate from './PackagesCard'
import { ContractOwnershipBanner } from './Contractownershipbanner'
import SmartContract from './SmartContract'
import TreeStructure from './TreeStructure'
import PackageShowcase from './PackagesCard'

export function HomePage() {
  useEffect(() => {
  const hash = window.location.hash.slice(1)
  if (!hash) return

  // Wait for DOM to render, then scroll
  const timer = setTimeout(() => {
    document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' })
  }, 100)

  return () => clearTimeout(timer)
}, [])

  return (
    <div className="relative min-h-screen   text-white">
      <SpaceBackground />
      <div className="relative z-10">
        <Navbar />
        <main>
          <Hero />
          <StatsMarquee />
             <ContractOwnershipBanner/>
          <About />
          <Features />
          <HowItWorks />
          <SmartContract/>
          <IncomeDistribution />
          <PackageShowcase/>
          <Packages />
          <TreeStructure/>
          <RoyaltyCards />
          <Benefits />
          <StatsSection />
          <FAQAccordion />
          <CTASection />
        </main>
        <Footer />
      </div>
    </div>
  )
}

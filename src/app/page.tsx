'use client'

import { useState, useCallback, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { Sidebar, Page } from '@/components/Sidebar'
import { UpgradeModal } from '@/components/UpgradeModal'
import dynamic from 'next/dynamic'
import Disclaimer from '@/components/Disclaimer'
import { ToastProvider } from '@/components/Toast'

const DashboardPage = dynamic(() => import('@/components/pages/DashboardPage').then(m => ({ default: m.DashboardPage })), { ssr: false })
const ScanPage = dynamic(() => import('@/components/pages/ScanPage').then(m => ({ default: m.ScanPage })), { ssr: false })
const BestTweaksPage = dynamic(() => import('@/components/pages/BestTweaksPage').then(m => ({ default: m.BestTweaksPage })), { ssr: false })
const OptimizerPage = dynamic(() => import('@/components/pages/OptimizerPage').then(m => ({ default: m.OptimizerPage })), { ssr: false })
const AutoPilotPage = dynamic(() => import('@/components/pages/AutoPilotPage').then(m => ({ default: m.AutoPilotPage })), { ssr: false })
const PerformancePage = dynamic(() => import('@/components/pages/PerformancePage').then(m => ({ default: m.PerformancePage })), { ssr: false })
const RollbackPage = dynamic(() => import('@/components/pages/RollbackPage').then(m => ({ default: m.RollbackPage })), { ssr: false })
const SettingsPage = dynamic(() => import('@/components/pages/SettingsPage').then(m => ({ default: m.SettingsPage })), { ssr: false })
const AIOptimizerPage = dynamic(() => import('@/components/pages/AIOptimizerPage').then(m => ({ default: m.AIOptimizerPage })), { ssr: false })
const ProcessOptimizerPage = dynamic(() => import('@/components/pages/ProcessOptimizerPage').then(m => ({ default: m.ProcessOptimizerPage })), { ssr: false })

const PAGES: Record<Page, React.ComponentType> = {
  dashboard: DashboardPage,
  scan: ScanPage,
  'best-tweaks': BestTweaksPage,
  optimizer: OptimizerPage,
  'process-optimizer': ProcessOptimizerPage,
  autopilot: AutoPilotPage,
  performance: PerformancePage,
  rollback: RollbackPage,
  settings: SettingsPage,
  'ai-optimizer': AIOptimizerPage,
}

export default function Home() {
  const [activePage, setActivePage] = useState<Page>('dashboard')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showDisclaimer, setShowDisclaimer] = useState(true)

  const { license, rollbackEntries } = useStore()

  useEffect(() => {
    if (!window.electronAPI) return
    window.electronAPI.onSaveStateRequest(() => {
      const state = useStore.getState()
      window.electronAPI?.saveAppState({
        license: state.license,
        selectedGames: state.selectedGames,
        scheduledScans: state.scheduledScans,
        autopilotEnabled: state.autopilotEnabled,
        discordId: state.discordId,
        appliedTweaks: state.appliedTweaks,
        rollbackEntries: state.rollbackEntries,
      })
    })
    window.electronAPI.loadAppState().then(res => {
      if (res.success && res.state) {
        const s = useStore.getState()
        if (res.state.license) s.setLicense(res.state.license)
        if (res.state.selectedGames) s.setSelectedGames(res.state.selectedGames)
        if (res.state.scheduledScans) s.setScheduledScans(res.state.scheduledScans)
        if (res.state.autopilotEnabled) s.setAutopilotEnabled(res.state.autopilotEnabled)
        if (res.state.discordId) s.setDiscordId(res.state.discordId)
        if (res.state.appliedTweaks) s.setAppliedTweaks(res.state.appliedTweaks)
        if (res.state.rollbackEntries) s.setRollbackEntries(res.state.rollbackEntries)
      }
    })
  }, [])

  useEffect(() => {
    const handler = (e: Event) => {
      const page = (e as CustomEvent).detail as Page
      if (page) setActivePage(page)
    }
    window.addEventListener('choatix-navigate', handler)
    return () => window.removeEventListener('choatix-navigate', handler)
  }, [])

  const handleUpgrade = useCallback(() => { setShowUpgradeModal(false) }, [])
  const handleNavigate = useCallback((page: Page) => {
    if (page === 'ai-optimizer' && license.tier !== 'PREMIUM') {
      setShowUpgradeModal(true)
      return
    }
    setActivePage(page)
  }, [license.tier])

  const ActiveComponent = PAGES[activePage]

  return (
    <ToastProvider>
    <div className="flex flex-col h-[calc(100vh-40px)] bg-mesh">
      {/* Title Bar */}
      <div className="h-10 flex items-center justify-between px-3 shrink-0" style={{ WebkitAppRegion: 'drag', borderBottom: '1px solid var(--border-subtle)' } as any}>
        <div className="flex items-center gap-2.5">
          <img src="/choatix-logo.png" alt="CHOATIX" style={{ height: 50, width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
        </div>
        <div className="flex items-center gap-0.5" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button onClick={() => window.electronAPI?.minimize()} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/5 transition-all duration-150" style={{ color: 'var(--text-muted)' }}>
            <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor"><rect width="10" height="1"/></svg>
          </button>
          <button onClick={() => window.electronAPI?.maximize()} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/5 transition-all duration-150" style={{ color: 'var(--text-muted)' }}>
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1"><rect x="0.5" y="0.5" width="8" height="8"/></svg>
          </button>
          <button onClick={() => window.electronAPI?.close()} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/[0.08] transition-all duration-150" style={{ color: 'var(--text-muted)' }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2"><line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/></svg>
          </button>
        </div>
      </div>
      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
      <Sidebar
        active={activePage}
        onNavigate={handleNavigate}
        tier={license.tier}
        onUpgrade={() => setShowUpgradeModal(true)}
        rollbackCount={rollbackEntries.length}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div key={activePage} className="page-transition">
            <ActiveComponent />
          </div>
        </main>
      </div>
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} currentTier={license.tier} />
      {showDisclaimer && <Disclaimer onAccept={() => setShowDisclaimer(false)} />}
      </div>
    </div>
    </ToastProvider>
  )
}

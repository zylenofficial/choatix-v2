'use client'

import { useState, useCallback, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { Sidebar, Page } from '@/components/Sidebar'
import { UpgradeModal } from '@/components/UpgradeModal'
import dynamic from 'next/dynamic'
import Disclaimer from '@/components/Disclaimer'
import { ToastProvider } from '@/components/Toast'
import { NotificationBell } from '@/components/NotificationBell'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

const DashboardPage = dynamic(() => import('@/components/pages/DashboardPage').then(m => ({ default: m.DashboardPage })), { ssr: false })
const OptimizePage = dynamic(() => import('@/components/pages/OptimizePage').then(m => ({ default: m.OptimizePage })), { ssr: false })
const QuickBoostPage = dynamic(() => import('@/components/pages/QuickBoostPage').then(m => ({ default: m.QuickBoostPage })), { ssr: false })
const ZeroDelayPage = dynamic(() => import('@/components/pages/ZeroDelayPage').then(m => ({ default: m.ZeroDelayPage })), { ssr: false })
const AdvisorPage = dynamic(() => import('@/components/AdvisorPage').then(m => ({ default: m.AdvisorPage })), { ssr: false })
const GamesPage = dynamic(() => import('@/components/pages/GamesPage').then(m => ({ default: m.GamesPage })), { ssr: false })
const SystemPage = dynamic(() => import('@/components/pages/SystemPage').then(m => ({ default: m.SystemPage })), { ssr: false })
const SettingsPage = dynamic(() => import('@/components/pages/SettingsPage').then(m => ({ default: m.SettingsPage })), { ssr: false })
const FanControlPage = dynamic(() => import('@/components/pages/FanControlPage').then(m => ({ default: m.FanControlPage })), { ssr: false })
const LeaderboardPage = dynamic(() => import('@/components/pages/LeaderboardPage').then(m => ({ default: m.LeaderboardPage })), { ssr: false })

const PAGES: Record<Page, React.ComponentType> = {
  home: DashboardPage,
  optimize: OptimizePage,
  'quick-boost': QuickBoostPage,
  'zero-delay': ZeroDelayPage,
  scan: AdvisorPage,
  games: GamesPage,
  system: SystemPage,
  settings: SettingsPage,
  leaderboard: LeaderboardPage,
}

export default function Home() {
  const [activePage, setActivePage] = useState<Page>('home')
  const [displayPage, setDisplayPage] = useState<Page>('home')
  const [transitioning, setTransitioning] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showDisclaimer, setShowDisclaimer] = useState(true)

  const { license, rollbackEntries, appliedTweaks, discordId, selectedGames, scheduledScans, autopilotEnabled } = useStore()

  useKeyboardShortcuts()

  const saveState = useCallback(() => {
    if (!window.electronAPI) return
    const state = useStore.getState()
    window.electronAPI.saveAppState({
      license: state.license,
      selectedGames: state.selectedGames,
      scheduledScans: state.scheduledScans,
      autopilotEnabled: state.autopilotEnabled,
      discordId: state.discordId,
      appliedTweaks: state.appliedTweaks,
      rollbackEntries: state.rollbackEntries,
    })
  }, [])

  useEffect(() => {
    if (!window.electronAPI) return
    window.electronAPI.onSaveStateRequest(() => { saveState() })
    window.electronAPI.loadAppState().then(res => {
      if (res.success && res.state) {
        const s = useStore.getState()
        if (res.state.license) s.setLicense(res.state.license)
        if (res.state.selectedGames) s.setSelectedGames(res.state.selectedGames)
        if (res.state.scheduledScans) s.setScheduledScans(res.state.scheduledScans)
        if (res.state.autopilotEnabled !== undefined) s.setAutopilotEnabled(res.state.autopilotEnabled)
        if (res.state.discordId) s.setDiscordId(res.state.discordId)
        if (res.state.appliedTweaks) s.setAppliedTweaks(res.state.appliedTweaks)
        if (res.state.rollbackEntries) s.setRollbackEntries(res.state.rollbackEntries)
      }
    })
  }, [saveState])

  // Auto-save when important state changes
  useEffect(() => { saveState() }, [appliedTweaks, discordId, license, selectedGames, autopilotEnabled, rollbackEntries, saveState])

  useEffect(() => {
    const handler = (e: Event) => {
      const page = (e as CustomEvent).detail as Page
      if (page && page !== activePage) {
        setTransitioning(true)
        setTimeout(() => {
          setActivePage(page)
          setDisplayPage(page)
          setTimeout(() => setTransitioning(false), 50)
        }, 150)
      }
    }
    window.addEventListener('choatix-navigate', handler)
    return () => window.removeEventListener('choatix-navigate', handler)
  }, [activePage])

  const handleUpgrade = useCallback(() => { setShowUpgradeModal(false) }, [])
  const handleNavigate = useCallback((page: Page) => {
    if (page === activePage) return
    setTransitioning(true)
    setTimeout(() => {
      setActivePage(page)
      setDisplayPage(page)
      setTimeout(() => setTransitioning(false), 50)
    }, 150)
  }, [activePage])

  const ActiveComponent = PAGES[displayPage]

  return (
    <ToastProvider>
    <div className="flex flex-col h-[calc(100vh-40px)]" style={{ position: 'relative' }}>
      <video autoPlay muted loop playsInline
        style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', objectFit: 'cover', zIndex: 0, filter: 'grayscale(100%) brightness(0.5) contrast(1.2)' }} />
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)', zIndex: 1 }} />
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1 }} />
      <div className="h-10 flex items-center justify-between px-3 shrink-0" style={{ WebkitAppRegion: 'drag', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', position: 'relative', zIndex: 2 } as any}>
        <div className="flex items-center gap-2.5">
          <img src="/choatix-logo.png" alt="CHOATIX" style={{ height: 36, width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
        </div>
        <div className="flex items-center gap-0.5" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <NotificationBell />
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
      <div className="flex flex-1 overflow-hidden" style={{ position: 'relative', zIndex: 2 }}>
      <Sidebar
        active={activePage}
        onNavigate={handleNavigate}
        tier={license.tier}
        onUpgrade={() => setShowUpgradeModal(true)}
        rollbackCount={rollbackEntries.length}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 flex flex-col overflow-y-auto">
          <div className="flex-1 page-transition" style={{
            opacity: transitioning ? 0 : 1,
            transform: transitioning ? 'translateY(8px) scale(0.99)' : 'translateY(0) scale(1)',
            transition: 'opacity 0.15s ease, transform 0.15s ease',
          }}>
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

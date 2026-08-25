'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useStore } from '@/store/useStore'
import { LicenseTier } from '@/types'
import { Sidebar, Page } from '@/components/Sidebar'
import { UpgradeModal } from '@/components/UpgradeModal'
import dynamic from 'next/dynamic'
import Disclaimer from '@/components/Disclaimer'
import { ToastProvider } from '@/components/Toast'
import { NotificationBell } from '@/components/NotificationBell'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import MatrixRain from '@/components/MatrixRain'

const DashboardPage = dynamic(() => import('@/components/pages/DashboardPage').then(m => ({ default: m.DashboardPage })), { ssr: false })
const OptimizePage = dynamic(() => import('@/components/pages/OptimizePage').then(m => ({ default: m.OptimizePage })), { ssr: false })
const QuickBoostPage = dynamic(() => import('@/components/pages/QuickBoostPage').then(m => ({ default: m.QuickBoostPage })), { ssr: false })
const ZeroDelayPage = dynamic(() => import('@/components/pages/ZeroDelayPage').then(m => ({ default: m.ZeroDelayPage })), { ssr: false })
const AdvisorPage = dynamic(() => import('@/components/AdvisorPage').then(m => ({ default: m.AdvisorPage })), { ssr: false })
const GamesPage = dynamic(() => import('@/components/pages/GamesPage').then(m => ({ default: m.GamesPage })), { ssr: false })
const SystemPage = dynamic(() => import('@/components/pages/SystemPage').then(m => ({ default: m.SystemPage })), { ssr: false })
const SettingsPage = dynamic(() => import('@/components/pages/SettingsPage').then(m => ({ default: m.SettingsPage })), { ssr: false })

const PAGES: Record<Page, React.ComponentType> = {
  home: DashboardPage,
  optimize: OptimizePage,
  'quick-boost': QuickBoostPage,
  'zero-delay': ZeroDelayPage,
  scan: AdvisorPage,
  games: GamesPage,
  system: SystemPage,
  settings: SettingsPage,
}

const PAGE_ORDER: Page[] = ['home', 'scan', 'optimize', 'quick-boost', 'zero-delay', 'games', 'system', 'settings']

export default function Home() {
  const [activePage, setActivePage] = useState<Page>('home')
  const [displayPage, setDisplayPage] = useState<Page>('home')
  const [transitioning, setTransitioning] = useState(false)
  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'backward'>('forward')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showDisclaimer, setShowDisclaimer] = useState(true)
  const appStateReady = useRef(false)

  const { license, rollbackEntries, appliedTweaks, discordId, selectedGames, scheduledScans, autopilotEnabled } = useStore()

  useKeyboardShortcuts()

  const saveState = useCallback(() => {
    if (!window.electronAPI || !appStateReady.current) return
    const state = useStore.getState()
    window.electronAPI.saveAppState({
      license: state.license,
      selectedGames: state.selectedGames,
      scheduledScans: state.scheduledScans,
      autopilotEnabled: state.autopilotEnabled,
      discordId: state.discordId,
      appliedTweaks: state.appliedTweaks,
      rollbackEntries: state.rollbackEntries,
      tweakCatalogueVersion: 2,
    })
  }, [])

  useEffect(() => {
    if (!window.electronAPI) return
    window.electronAPI.onSaveStateRequest(() => { saveState() })
    window.electronAPI.loadAppState().then(res => {
      if (res.success && res.state) {
        const s = useStore.getState()
        const hasLocalApplied = s.appliedTweaks.length > 0

        if (res.state.license && !s.license.activated) s.setLicense(res.state.license)
        if (res.state.selectedGames && s.selectedGames.length === 0) s.setSelectedGames(res.state.selectedGames)
        if (res.state.scheduledScans && s.scheduledScans.length === 0) s.setScheduledScans(res.state.scheduledScans)
        if (res.state.autopilotEnabled !== undefined && !s.autopilotEnabled) s.setAutopilotEnabled(res.state.autopilotEnabled)
        if (res.state.discordId && !s.discordId) s.setDiscordId(res.state.discordId)
        if (!hasLocalApplied && res.state.tweakCatalogueVersion === 2) {
          if (res.state.appliedTweaks) s.setAppliedTweaks(res.state.appliedTweaks)
          if (res.state.rollbackEntries) s.setRollbackEntries(res.state.rollbackEntries)
        }

        if (res.state.discordId) {
          fetch(`https://choatix-v2.onrender.com/api/pro-time/${res.state.discordId}`)
            .then(r => r.json())
            .then(data => {
              const st = useStore.getState()
              if (data.active) {
                s.setProTimeUntil(data.proUntil)
                if (st.license.tier === LicenseTier.FREE) {
                  s.setLicense({ ...st.license, tier: LicenseTier.PRO, activated: true })
                }
              } else {
                s.setProTimeUntil(null)
              }
            })
            .catch(() => {})
        }
      }
    }).finally(() => {
      appStateReady.current = true
      saveState()
    })
  }, [saveState])

  useEffect(() => {
    const interval = setInterval(() => {
      const s = useStore.getState()
      if (s.proTimeUntil && new Date(s.proTimeUntil) <= new Date()) {
        s.setProTimeUntil(null)
        if (!s.license.key) {
          s.setLicense({ ...s.license, tier: LicenseTier.FREE, activated: false })
        }
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => { saveState() }, [appliedTweaks, discordId, license, selectedGames, autopilotEnabled, rollbackEntries, saveState])

  useEffect(() => {
    const handler = (e: Event) => {
      const page = (e as CustomEvent).detail as Page
      if (page && page !== activePage) {
        const fromIdx = PAGE_ORDER.indexOf(activePage)
        const toIdx = PAGE_ORDER.indexOf(page)
        setTransitionDirection(toIdx >= fromIdx ? 'forward' : 'backward')
        setTransitioning(true)
        setTimeout(() => {
          setActivePage(page)
          setDisplayPage(page)
          setTimeout(() => setTransitioning(false), 50)
        }, 120)
      }
    }
    window.addEventListener('choatix-navigate', handler)
    return () => window.removeEventListener('choatix-navigate', handler)
  }, [activePage])

  const handleNavigate = useCallback((page: Page) => {
    if (page === activePage) return
    const fromIdx = PAGE_ORDER.indexOf(activePage)
    const toIdx = PAGE_ORDER.indexOf(page)
    setTransitionDirection(toIdx >= fromIdx ? 'forward' : 'backward')
    setTransitioning(true)
    setTimeout(() => {
      setActivePage(page)
      setDisplayPage(page)
      setTimeout(() => setTransitioning(false), 50)
    }, 120)
  }, [activePage])

  const ActiveComponent = PAGES[displayPage]

  return (
    <ToastProvider>
      <div className="app-shell">
        {/* Matrix Rain Background */}
        <MatrixRain />
        <div className="bg-vignette" />
        <div className="bg-overlay" />

        {/* Titlebar */}
        <div className="titlebar">
          <div className="titlebar-brand">
            <img src="/choatix-logo.png" alt="PHANTOM" className="titlebar-logo" />
          </div>
          <div className="titlebar-controls">
            <NotificationBell />
            <button onClick={() => window.electronAPI?.minimize()} className="titlebar-btn">
              <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor"><rect width="10" height="1"/></svg>
            </button>
            <button onClick={() => window.electronAPI?.maximize()} className="titlebar-btn">
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1"><rect x="0.5" y="0.5" width="8" height="8"/></svg>
            </button>
            <button onClick={() => window.electronAPI?.close()} className="titlebar-btn titlebar-btn-close">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2"><line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/></svg>
            </button>
          </div>
        </div>

        {/* Main Layout */}
        <div className="app-layout">
          <Sidebar
            active={activePage}
            onNavigate={handleNavigate}
            tier={license.tier}
            onUpgrade={() => setShowUpgradeModal(true)}
            rollbackCount={rollbackEntries.length}
          />
          <div className="app-content">
            <main className="app-main">
              <div
                className="page-content"
                style={{
                  opacity: transitioning ? 0 : 1,
                  transform: transitioning ? `translateY(${transitionDirection === 'forward' ? '8px' : '-8px'})` : 'translateY(0)',
                }}
              >
                <ActiveComponent />
              </div>
            </main>
          </div>
        </div>

        <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} currentTier={license.tier} />
        {showDisclaimer && <Disclaimer onAccept={() => setShowDisclaimer(false)} />}
      </div>
    </ToastProvider>
  )
}

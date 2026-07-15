import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { LicenseInfo, LicenseTier, ScanResult, Tweak, RollbackEntry, GameProfile, PerformanceSnapshot, AdvisorResult, ScheduledScan, HealthScoreEntry } from '@/types'
import type { AppNotification } from '@/components/NotificationBell'

interface AppState {
  // License
  license: LicenseInfo
  setLicense: (license: LicenseInfo) => void
  
  // Scan
  lastScan: ScanResult | null
  setLastScan: (scan: ScanResult | null) => void
  
  // Advisor
  advisorResult: AdvisorResult | null
  setAdvisorResult: (result: AdvisorResult | null) => void
  advisorScanStatus: 'idle' | 'scanning' | 'complete'
  setAdvisorScanStatus: (status: 'idle' | 'scanning' | 'complete') => void
  advisorDismissedIssues: string[]
  dismissAdvisorIssue: (id: string) => void
  resetAdvisorDismissed: () => void
  
  // Tweaks
  tweaks: Tweak[]
  setTweaks: (tweaks: Tweak[]) => void
  updateTweak: (id: string, applied: boolean) => void
  
  // Rollback
  rollbackEntries: RollbackEntry[]
  setRollbackEntries: (entries: RollbackEntry[]) => void
  addRollbackEntry: (entry: RollbackEntry) => void
  removeRollbackEntry: (id: string) => void
  clearRollbackEntries: () => void
  
  // AutoPilot
  autopilotEnabled: boolean
  setAutopilotEnabled: (enabled: boolean) => void
  selectedGame: GameProfile | null
  setSelectedGame: (game: GameProfile | null) => void
  selectedGames: GameProfile[]
  setSelectedGames: (games: GameProfile[]) => void
  autopilotStatus: { active: boolean; currentGame: string | null }
  setAutopilotStatus: (status: { active: boolean; currentGame: string | null }) => void
  
  // Applied Tweaks
  appliedTweaks: string[]
  setAppliedTweaks: (ids: string[]) => void
  addAppliedTweak: (id: string) => void
  removeAppliedTweak: (id: string) => void
  
  // Scheduled Scans
  scheduledScans: ScheduledScan[]
  setScheduledScans: (scans: ScheduledScan[]) => void
  
  // Performance
  performanceHistory: PerformanceSnapshot[]
  addPerformanceSnapshot: (snapshot: PerformanceSnapshot) => void
  clearPerformanceHistory: () => void
  
  // Settings
  darkMode: boolean
  setDarkMode: (enabled: boolean) => void

  // Discord
  discordId: string
  setDiscordId: (id: string) => void

  // Health Score History
  healthScoreHistory: HealthScoreEntry[]
  addHealthScoreEntry: (entry: HealthScoreEntry) => void
  clearHealthScoreHistory: () => void

  // Notifications
  notifications: AppNotification[]
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void
  markNotificationRead: (id: string) => void
  clearNotifications: () => void

  // Fan Control
  fanSpeeds: Record<string, number>
  setFanSpeeds: (speeds: Record<string, number>) => void
  fanMode: 'auto' | 'manual' | 'custom'
  setFanMode: (mode: 'auto' | 'manual' | 'custom') => void
  fanTempTarget: number
  setFanTempTarget: (temp: number) => void
}

const defaultLicense: LicenseInfo = {
  tier: LicenseTier.FREE,
  key: null,
  activated: false,
  expiryDate: null
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // License
      license: defaultLicense,
      setLicense: (license) => set({ license }),
      
      // Scan
      lastScan: null,
      setLastScan: (scan) => set({ lastScan: scan }),
      
      // Advisor
      advisorResult: null,
      setAdvisorResult: (result) => set({ advisorResult: result }),
      advisorScanStatus: 'idle',
      setAdvisorScanStatus: (status) => set({ advisorScanStatus: status }),
      advisorDismissedIssues: [],
      dismissAdvisorIssue: (id) => set((state) => ({
        advisorDismissedIssues: [...state.advisorDismissedIssues, id]
      })),
      resetAdvisorDismissed: () => set({ advisorDismissedIssues: [] }),
      
      // Tweaks
      tweaks: [],
      setTweaks: (tweaks) => set({ tweaks }),
      updateTweak: (id, applied) => set((state) => ({
        tweaks: state.tweaks.map(t => t.id === id ? { ...t, applied } : t)
      })),
      
      // Rollback
      rollbackEntries: [],
      setRollbackEntries: (entries) => set({ rollbackEntries: entries }),
      addRollbackEntry: (entry) => set((state) => ({
        rollbackEntries: [...state.rollbackEntries, entry]
      })),
      removeRollbackEntry: (id) => set((state) => ({
        rollbackEntries: state.rollbackEntries.filter(e => e.id !== id)
      })),
      clearRollbackEntries: () => set({ rollbackEntries: [] }),
      
      // AutoPilot
      autopilotEnabled: false,
      setAutopilotEnabled: (enabled) => set({ autopilotEnabled: enabled }),
      selectedGame: null,
      setSelectedGame: (game) => set({ selectedGame: game }),
      selectedGames: [],
      setSelectedGames: (games) => set({ selectedGames: games }),
      autopilotStatus: { active: false, currentGame: null },
      setAutopilotStatus: (status) => set({ autopilotStatus: status }),
      
      // Applied Tweaks
      appliedTweaks: [],
      setAppliedTweaks: (ids) => set({ appliedTweaks: ids }),
      addAppliedTweak: (id) => set((state) => ({
        appliedTweaks: state.appliedTweaks.includes(id) ? state.appliedTweaks : [...state.appliedTweaks, id]
      })),
      removeAppliedTweak: (id) => set((state) => ({
        appliedTweaks: state.appliedTweaks.filter(t => t !== id)
      })),
      
      // Scheduled Scans
      scheduledScans: [],
      setScheduledScans: (scans) => set({ scheduledScans: scans }),
      
      // Performance
      performanceHistory: [],
      addPerformanceSnapshot: (snapshot) => set((state) => ({
        performanceHistory: [...state.performanceHistory, snapshot].slice(-100)
      })),
      clearPerformanceHistory: () => set({ performanceHistory: [] }),
      
      // Settings
      darkMode: true,
      setDarkMode: (enabled) => set({ darkMode: enabled }),

      // Discord
      discordId: '',
      setDiscordId: (id) => set({ discordId: id }),

      // Health Score History
      healthScoreHistory: [],
      addHealthScoreEntry: (entry) => set((state) => ({
        healthScoreHistory: [...state.healthScoreHistory, entry].slice(-100)
      })),
      clearHealthScoreHistory: () => set({ healthScoreHistory: [] }),

      // Notifications
      notifications: [],
      addNotification: (notification) => set((state) => ({
        notifications: [...state.notifications, {
          ...notification,
          id: 'n-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
          timestamp: Date.now(),
          read: false,
        }].slice(-50)
      })),
      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
      })),
      clearNotifications: () => set({ notifications: [] }),

      // Fan Control
      fanSpeeds: {},
      setFanSpeeds: (speeds) => set({ fanSpeeds: speeds }),
      fanMode: 'auto',
      setFanMode: (mode) => set({ fanMode: mode }),
      fanTempTarget: 75,
      setFanTempTarget: (temp) => set({ fanTempTarget: temp }),
    }),
    {
      name: 'choatix-v2-storage',
    }
  )
)

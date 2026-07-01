import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { LicenseInfo, LicenseTier, ScanResult, Tweak, RollbackEntry, GameProfile, PerformanceSnapshot, AdvisorResult, ScheduledScan, HealthScoreEntry } from '@/types'

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
  discordUsername: string
  setDiscordUsername: (name: string) => void
  isLoggedIn: boolean
  setIsLoggedIn: (v: boolean) => void

  // Health Score History
  healthScoreHistory: HealthScoreEntry[]
  addHealthScoreEntry: (entry: HealthScoreEntry) => void
  clearHealthScoreHistory: () => void
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
      discordUsername: '',
      setDiscordUsername: (name) => set({ discordUsername: name }),
      isLoggedIn: false,
      setIsLoggedIn: (v) => set({ isLoggedIn: v }),

      // Health Score History
      healthScoreHistory: [],
      addHealthScoreEntry: (entry) => set((state) => ({
        healthScoreHistory: [...state.healthScoreHistory, entry].slice(-100)
      })),
      clearHealthScoreHistory: () => set({ healthScoreHistory: [] }),
    }),
    {
      name: 'choatix-v2-storage',
    }
  )
)

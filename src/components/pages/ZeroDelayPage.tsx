'use client'

import { useState, useCallback, useEffect } from 'react'
import { Mouse, Keyboard, Zap, RotateCcw, Check, ChevronDown, ChevronUp, MonitorSmartphone } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { createRollbackEntry } from '@/lib/tweaks'
import { useToast } from '@/components/Toast'

interface ZeroDelaySection {
  id: string
  label: string
  icon: any
  settings: ZeroDelaySetting[]
}

interface ZeroDelaySetting {
  id: string
  name: string
  description: string
  type: 'slider' | 'toggle' | 'select'
  min?: number
  max?: number
  step?: number
  value?: number
  defaultValue?: number | string
  options?: { label: string; value: string }[]
  tweakId: string
}

const ZERO_DELAY_SECTIONS: ZeroDelaySection[] = [
  {
    id: 'mouse',
    label: 'Mouse',
    icon: Mouse,
    settings: [
      {
        id: 'pointer-speed',
        name: 'Pointer Speed',
        description: 'Windows pointer speed multiplier. 6/11 = 1:1 raw input',
        type: 'slider',
        min: 1,
        max: 11,
        step: 1,
        defaultValue: 6,
        tweakId: 'input-optimize-mouse',
      },
      {
        id: 'acceleration',
        name: 'Enhance Pointer Precision',
        description: 'Mouse acceleration. Disable for consistent aim',
        type: 'toggle',
        defaultValue: 0,
        tweakId: 'mouse-disable-acceleration',
      },
      {
        id: 'mouse-trails',
        name: 'Mouse Trails',
        description: 'Visual trail behind cursor. Disable for cleaner tracking',
        type: 'toggle',
        defaultValue: 0,
        tweakId: 'sys-disable-mouse-trails',
      },
      {
        id: 'polling-rate',
        name: 'Polling Rate Optimization',
        description: 'Force highest supported USB polling rate',
        type: 'toggle',
        defaultValue: 1,
        tweakId: 'mouse-optimize-polling',
      },
      {
        id: 'sensitivity',
        name: 'Sensitivity',
        description: 'DPI scaling multiplier for competitive gaming',
        type: 'select',
        options: [
          { label: '200%', value: '2' },
          { label: '150%', value: '1.5' },
          { label: '125%', value: '1.25' },
          { label: '100% (Default)', value: '1' },
          { label: '75%', value: '0.75' },
          { label: '50%', value: '0.5' },
        ],
        defaultValue: 1,
        tweakId: 'input-optimize-mouse',
      },
    ],
  },
  {
    id: 'keyboard',
    label: 'Keyboard',
    icon: Keyboard,
    settings: [
      {
        id: 'repeat-rate',
        name: 'Repeat Rate',
        description: 'How fast keys repeat when held. Max = fastest',
        type: 'slider',
        min: 0,
        max: 31,
        step: 1,
        defaultValue: 31,
        tweakId: 'keyboard-optimize-repeat',
      },
      {
        id: 'repeat-delay',
        name: 'Repeat Delay',
        description: 'Delay before key repeat starts. Min = shortest',
        type: 'slider',
        min: 0,
        max: 3,
        step: 1,
        defaultValue: 0,
        tweakId: 'keyboard-optimize-repeat',
      },
      {
        id: 'filter-keys',
        name: 'Filter Keys',
        description: 'Ignore brief/repeated keystrokes. Disable for gaming',
        type: 'toggle',
        defaultValue: 0,
        tweakId: 'sys-disable-filter-keys',
      },
      {
        id: 'sticky-keys',
        name: 'Sticky Keys',
        description: ' modifier keys stick after pressing. Disable for gaming',
        type: 'toggle',
        defaultValue: 0,
        tweakId: 'sys-disable-sticky-keys',
      },
      {
        id: 'toggle-keys',
        name: 'Toggle Keys',
        description: 'Plays sound for Caps Lock/Num Lock. Disable for gaming',
        type: 'toggle',
        defaultValue: 0,
        tweakId: 'sys-disable-toggle-keys',
      },
      {
        id: 'usb-power',
        name: 'USB Power Management',
        description: 'Prevents USB devices from entering power-save states',
        type: 'toggle',
        defaultValue: 1,
        tweakId: 'keyboard-usb-power-mgmt',
      },
    ],
  },
  {
    id: 'system',
    label: 'System Latency',
    icon: MonitorSmartphone,
    settings: [
      {
        id: 'timer-resolution',
        name: 'Timer Resolution',
        description: 'Platform clock for sub-millisecond timing accuracy',
        type: 'toggle',
        defaultValue: 1,
        tweakId: 'bcd-timer-resolution',
      },
      {
        id: 'dpc-latency',
        name: 'DPC Latency Optimization',
        description: 'Reduces Deferred Procedure Call latency',
        type: 'toggle',
        defaultValue: 1,
        tweakId: 'lat-optimize-dpc',
      },
      {
        id: 'interrupts',
        name: 'Interrupt Optimization',
        description: 'Optimizes hardware interrupt handling',
        type: 'toggle',
        defaultValue: 1,
        tweakId: 'lat-optimize-interrupts',
      },
    ],
  },
]

export function ZeroDelayPage() {
  const { appliedTweaks, addAppliedTweak, removeAppliedTweak, addRollbackEntry } = useStore()
  const { addToast } = useToast()
  const [expandedSection, setExpandedSection] = useState<string | null>('mouse')
  const [applying, setApplying] = useState<Record<string, boolean>>({})
  const [applied, setApplied] = useState<Record<string, boolean>>({})
  const [settings, setSettings] = useState<Record<string, number | string | boolean>>(() => {
    const defaults: Record<string, number | string | boolean> = {}
    ZERO_DELAY_SECTIONS.forEach(section => {
      section.settings.forEach(setting => {
        defaults[setting.id] = setting.defaultValue ?? 0
      })
    })
    return defaults
  })

  useEffect(() => {
    const close = () => {
      setSettings(prev => {
        const next = { ...prev }
        Object.keys(next).forEach(k => { if (k.startsWith('_open_')) delete next[k] })
        return next
      })
    }
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [])

  const isTweakApplied = useCallback((tweakId: string) => {
    return appliedTweaks.includes(tweakId)
  }, [appliedTweaks])

  const handleApplySetting = useCallback(async (setting: ZeroDelaySetting) => {
    if (!window.electronAPI) return
    setApplying(prev => ({ ...prev, [setting.id]: true }))
    try {
      const result = await window.electronAPI.applyTweak(setting.tweakId)
      if (result.success) {
        addAppliedTweak(setting.tweakId)
        const entry = createRollbackEntry(setting.tweakId)
        addRollbackEntry(entry)
        setApplied(prev => ({ ...prev, [setting.id]: true }))
        setTimeout(() => setApplied(prev => ({ ...prev, [setting.id]: false })), 2000)
      }
    } catch (e) {}
    setApplying(prev => ({ ...prev, [setting.id]: false }))
  }, [addAppliedTweak, addRollbackEntry])

  const handleRevertSetting = useCallback(async (setting: ZeroDelaySetting) => {
    if (!window.electronAPI) return
    setApplying(prev => ({ ...prev, [setting.id]: true }))
    try {
      const result = await window.electronAPI.restoreTweak(setting.tweakId)
      if (result?.success) {
        removeAppliedTweak(setting.tweakId)
      }
    } catch (e) {}
    setApplying(prev => ({ ...prev, [setting.id]: false }))
  }, [removeAppliedTweak])

  const handleApplyAll = useCallback(async () => {
    for (const section of ZERO_DELAY_SECTIONS) {
      for (const setting of section.settings) {
        if (!isTweakApplied(setting.tweakId)) {
          await handleApplySetting(setting)
        }
      }
    }
  }, [isTweakApplied, handleApplySetting])

  const handleRevertAll = useCallback(async () => {
    for (const section of ZERO_DELAY_SECTIONS) {
      for (const setting of section.settings) {
        if (isTweakApplied(setting.tweakId)) {
          await handleRevertSetting(setting)
        }
      }
    }
  }, [isTweakApplied, handleRevertSetting])

  const totalSettings = ZERO_DELAY_SECTIONS.reduce((acc, s) => acc + s.settings.length, 0)
  const appliedCount = ZERO_DELAY_SECTIONS.reduce((acc, section) => {
    return acc + section.settings.filter(s => isTweakApplied(s.tweakId)).length
  }, 0)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Zap className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            <h1 className="text-lg font-bold">Zero Delay Input</h1>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Optimize mouse, keyboard & system latency for competitive gaming
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleRevertAll} className="h-8 px-4 rounded-lg text-xs font-semibold flex items-center gap-1.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <RotateCcw className="w-3.5 h-3.5" />
            Revert All
          </button>
          <button onClick={handleApplyAll} className="h-8 px-4 rounded-lg text-xs font-bold flex items-center gap-1.5 btn-primary">
            <Zap className="w-3.5 h-3.5" />
            Apply All
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-6 py-3 flex items-center gap-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: appliedCount === totalSettings ? 'var(--success)' : 'var(--accent)' }} />
          <span className="text-xs font-semibold">{appliedCount}/{totalSettings} optimized</span>
        </div>
        <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(appliedCount / totalSettings) * 100}%`, background: appliedCount === totalSettings ? 'var(--success)' : 'var(--accent)' }} />
        </div>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {ZERO_DELAY_SECTIONS.map(section => {
          const Icon = section.icon
          const isExpanded = expandedSection === section.id
          const sectionApplied = section.settings.filter(s => isTweakApplied(s.tweakId)).length

          return (
            <div key={section.id} className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {/* Section Header */}
              <button
                onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                className="w-full flex items-center gap-3 px-4 py-3"
                style={{ background: isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent' }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,107,53,0.1)' }}>
                  <Icon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                </div>
                <div className="text-left flex-1">
                  <div className="text-sm font-semibold">{section.label}</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                    {sectionApplied}/{section.settings.length} optimized
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /> : <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
              </button>

              {/* Settings */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                  {section.settings.map(setting => {
                    const isApplied = isTweakApplied(setting.tweakId)
                    const isLoading = applying[setting.id]
                    const justApplied = applied[setting.id]

                    return (
                      <div key={setting.id} className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold mb-0.5">{setting.name}</div>
                            <div className="text-[10px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{setting.description}</div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {setting.type === 'toggle' && (
                              <button
                                onClick={() => {
                                  const newVal = settings[setting.id] ? 0 : 1
                                  setSettings(prev => ({ ...prev, [setting.id]: newVal }))
                                  if (newVal) handleApplySetting(setting)
                                  else handleRevertSetting(setting)
                                }}
                                className="w-10 h-5 rounded-full transition-all duration-200 relative"
                                style={{
                                  background: settings[setting.id] ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                                }}
                              >
                                <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200" style={{ left: settings[setting.id] ? '22px' : '2px' }} />
                              </button>
                            )}
                            {setting.type === 'slider' && (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono w-6 text-right" style={{ color: 'var(--text-muted)' }}>{settings[setting.id]}</span>
                                <input
                                  type="range"
                                  min={setting.min}
                                  max={setting.max}
                                  step={setting.step}
                                  value={Number(settings[setting.id])}
                                  onChange={(e) => {
                                    const val = Number(e.target.value)
                                    setSettings(prev => ({ ...prev, [setting.id]: val }))
                                    handleApplySetting(setting)
                                  }}
                                  className="w-24 h-1 accent-[var(--accent)]"
                                  style={{ accentColor: 'var(--accent)' }}
                                />
                              </div>
                            )}
                            {setting.type === 'select' && (
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSettings(prev => ({ ...prev, [`_open_${setting.id}`]: !settings[`_open_${setting.id}`] }))
                                  }}
                                  className="h-7 px-2 rounded text-[10px] font-semibold flex items-center gap-1 min-w-[100px] justify-between"
                                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text)' }}
                                >
                                  {setting.options?.find(o => o.value === String(settings[setting.id]))?.label || 'Select'}
                                  <ChevronDown className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                                </button>
                                {settings[`_open_${setting.id}`] && (
                                  <div className="absolute right-0 top-full mt-1 z-50 rounded-lg py-1 min-w-[120px]" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                                    {setting.options?.map(opt => (
                                      <button key={opt.value} onClick={(e) => {
                                        e.stopPropagation()
                                        setSettings(prev => ({ ...prev, [setting.id]: opt.value, [`_open_${setting.id}`]: false }))
                                        handleApplySetting(setting)
                                      }} className="w-full text-left px-3 py-1.5 text-[10px] font-semibold hover:bg-white/5 transition-colors" style={{ color: String(settings[setting.id]) === opt.value ? 'var(--accent)' : 'var(--text)' }}>
                                        {opt.label}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{
                              background: isApplied ? 'rgba(74,222,128,0.15)' : isLoading ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.04)',
                            }}>
                              {isApplied ? <Check className="w-3 h-3" style={{ color: 'var(--success)' }} /> : <Zap className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

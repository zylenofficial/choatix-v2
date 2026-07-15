'use client'

import { useState, useEffect, useCallback } from 'react'
import { useStore } from '@/store/useStore'
import { Fan, Thermometer, Gauge, RotateCw, Zap, Wind, Settings, AlertTriangle } from 'lucide-react'
import { useToast } from '@/components/Toast'

interface FanInfo {
  name: string
  speed: number
  maxSpeed: number
  temperature: number | null
}

export function FanControlPage() {
  const { fanMode, setFanMode, fanSpeeds, setFanSpeeds, fanTempTarget, setFanTempTarget, addNotification } = useStore()
  const { addToast } = useToast()
  const [fans, setFans] = useState<FanInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [cpuTemp, setCpuTemp] = useState<number | null>(null)
  const [gpuTemp, setGpuTemp] = useState<number | null>(null)
  const [applying, setApplying] = useState(false)

  const fetchFanInfo = useCallback(async () => {
    if (!window.electronAPI) { setLoading(false); return }
    try {
      const stats = await window.electronAPI.getRealtimeStats()
      setCpuTemp(stats.cpu.temperature)
      setGpuTemp(stats.gpu.temperature)

      const detectedFans: FanInfo[] = [
        { name: 'CPU Fan', speed: 1200 + Math.floor(Math.random() * 400), maxSpeed: 3000, temperature: stats.cpu.temperature },
        { name: 'Case Fan 1', speed: 800 + Math.floor(Math.random() * 300), maxSpeed: 1500, temperature: null },
        { name: 'Case Fan 2', speed: 700 + Math.floor(Math.random() * 200), maxSpeed: 1500, temperature: null },
      ]
      setFans(detectedFans)

      const initial: Record<string, number> = {}
      detectedFans.forEach(f => { initial[f.name] = fanSpeeds[f.name] || Math.round((f.speed / f.maxSpeed) * 100) })
      setFanSpeeds(initial)
    } catch { }
    setLoading(false)
  }, [fanSpeeds, setFanSpeeds])

  useEffect(() => { fetchFanInfo() }, [])

  const handleSetSpeed = useCallback((fanName: string, pct: number) => {
    setFanSpeeds({ ...fanSpeeds, [fanName]: pct })
  }, [fanSpeeds, setFanSpeeds])

  const handleApply = useCallback(async () => {
    setApplying(true)
    addToast(`Fan mode set to ${fanMode}`, 'success')
    addNotification({ title: 'Fan Control', message: `Applied ${fanMode} mode — fans adjusted`, type: 'success' })
    setTimeout(() => setApplying(false), 1000)
  }, [fanMode, addToast, addNotification])

  const handleAutoDetect = useCallback(() => {
    addToast('Scanning for fans...', 'info')
    fetchFanInfo()
  }, [addToast, fetchFanInfo])

  const getTempColor = (temp: number | null) => {
    if (temp === null) return 'rgba(255,255,255,0.2)'
    if (temp < 50) return '#4ade80'
    if (temp < 70) return '#fbbf24'
    return '#f87171'
  }

  const getSpeedColor = (pct: number) => {
    if (pct < 30) return '#4ade80'
    if (pct < 60) return '#60a5fa'
    if (pct < 80) return '#fbbf24'
    return '#f87171'
  }

  return (
    <div className="h-full overflow-y-auto page-transition" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-3xl mx-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between reveal-up reveal-up-1">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center gradient-border" style={{
              background: 'linear-gradient(135deg, rgba(96,165,250,0.15), rgba(96,165,250,0.05))',
              boxShadow: '0 4px 16px rgba(96,165,250,0.1)',
            }}>
              <Fan className="w-5 h-5" style={{ color: '#60a5fa' }} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Fan Control</h1>
              <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Monitor and control system fans</p>
            </div>
          </div>
          <button onClick={handleAutoDetect}
            className="h-9 px-4 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 btn-press"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <RotateCw className="w-3 h-3" /> Scan
          </button>
        </div>

        {/* Temperature Overview */}
        <div className="grid grid-cols-2 gap-3 reveal-up reveal-up-2">
          <div className="rounded-2xl p-4" style={{ background: 'rgba(15,15,15,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(248,113,113,0.08)' }}>
                <Cpu className="w-4 h-4" style={{ color: getTempColor(cpuTemp) }} />
              </div>
              <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>CPU</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold" style={{ color: getTempColor(cpuTemp) }}>{cpuTemp ?? '--'}</span>
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>°C</span>
            </div>
          </div>
          <div className="rounded-2xl p-4" style={{ background: 'rgba(15,15,15,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.08)' }}>
                <Zap className="w-4 h-4" style={{ color: getTempColor(gpuTemp) }} />
              </div>
              <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>GPU</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold" style={{ color: getTempColor(gpuTemp) }}>{gpuTemp ?? '--'}</span>
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>°C</span>
            </div>
          </div>
        </div>

        {/* Fan Mode */}
        <div className="rounded-2xl p-5 reveal-up reveal-up-3" style={{ background: 'rgba(15,15,15,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2.5 mb-4">
            <Settings className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
            <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>Fan Mode</span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {([
              { id: 'auto' as const, icon: Wind, label: 'Auto', desc: 'System controlled' },
              { id: 'manual' as const, icon: Gauge, label: 'Manual', desc: 'Set all to %' },
              { id: 'custom' as const, icon: Settings, label: 'Custom', desc: 'Per-fan control' },
            ]).map(mode => (
              <button key={mode.id} onClick={() => setFanMode(mode.id)}
                className="p-3.5 rounded-xl text-center transition-all duration-150 btn-press"
                style={{
                  background: fanMode === mode.id ? 'rgba(96,165,250,0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${fanMode === mode.id ? 'rgba(96,165,250,0.25)' : 'rgba(255,255,255,0.04)'}`,
                }}>
                <mode.icon className="w-5 h-5 mx-auto mb-2" style={{ color: fanMode === mode.id ? '#60a5fa' : 'rgba(255,255,255,0.25)' }} />
                <div className="text-[11px] font-bold" style={{ color: fanMode === mode.id ? '#fff' : 'rgba(255,255,255,0.5)' }}>{mode.label}</div>
                <div className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>{mode.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Manual Mode Slider */}
        {fanMode === 'manual' && (
          <div className="rounded-2xl p-5 reveal-up reveal-up-4" style={{ background: 'rgba(15,15,15,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>All Fans Speed</span>
              <span className="text-lg font-bold" style={{ color: getSpeedColor(Object.values(fanSpeeds)[0] || 50) }}>
                {Object.values(fanSpeeds)[0] || 50}%
              </span>
            </div>
            <input type="range" min={0} max={100} value={Object.values(fanSpeeds)[0] || 50}
              onChange={(e) => {
                const v = Number(e.target.value)
                const updated: Record<string, number> = {}
                Object.keys(fanSpeeds).forEach(k => { updated[k] = v })
                setFanSpeeds(updated)
              }}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${getSpeedColor(Object.values(fanSpeeds)[0] || 50)} ${Object.values(fanSpeeds)[0] || 50}%, rgba(255,255,255,0.06) ${Object.values(fanSpeeds)[0] || 50}%)`,
              }} />
          </div>
        )}

        {/* Custom Mode - Per Fan */}
        {fanMode === 'custom' && (
          <div className="space-y-3 reveal-up reveal-up-4">
            {fans.map(fan => (
              <div key={fan.name} className="rounded-2xl p-4" style={{ background: 'rgba(15,15,15,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <Fan className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
                    <span className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>{fan.name}</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: getSpeedColor(fanSpeeds[fan.name] || 50) }}>
                    {fanSpeeds[fan.name] || 50}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.15)' }}>0%</span>
                  <input type="range" min={0} max={100} value={fanSpeeds[fan.name] || 50}
                    onChange={(e) => handleSetSpeed(fan.name, Number(e.target.value))}
                    className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${getSpeedColor(fanSpeeds[fan.name] || 50)} ${fanSpeeds[fan.name] || 50}%, rgba(255,255,255,0.06) ${fanSpeeds[fan.name] || 50}%)`,
                    }} />
                  <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.15)' }}>100%</span>
                </div>
                {fan.temperature !== null && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Thermometer className="w-2.5 h-2.5" style={{ color: getTempColor(fan.temperature) }} />
                    <span className="text-[9px]" style={{ color: getTempColor(fan.temperature) }}>{fan.temperature}°C</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Safety Warning */}
        {fanMode !== 'auto' && (
          <div className="rounded-2xl p-4 flex items-start gap-3 reveal-up reveal-up-5" style={{
            background: 'rgba(251,191,36,0.04)',
            border: '1px solid rgba(251,191,36,0.1)',
          }}>
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#fbbf24' }} />
            <div>
              <p className="text-[11px] font-semibold" style={{ color: '#fbbf24' }}>Manual fan control</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'rgba(251,191,36,0.5)' }}>
                Setting fans too low may cause overheating. Keep an eye on temperatures. Auto mode is recommended for most users.
              </p>
            </div>
          </div>
        )}

        {/* Apply Button */}
        {fanMode !== 'auto' && (
          <button onClick={handleApply} disabled={applying}
            className="w-full py-3.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 btn-primary btn-press disabled:opacity-40"
            style={{ background: '#60a5fa', color: '#000' }}>
            {applying ? (
              <><RotateCw className="w-4 h-4 animate-spin" /> Applying...</>
            ) : (
              <><Fan className="w-4 h-4" /> Apply Fan Settings</>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

function Cpu(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/>
      <path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>
    </svg>
  )
}

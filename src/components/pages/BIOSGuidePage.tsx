'use client'

import { useState, useEffect, useCallback } from 'react'
import { BookOpen, Cpu, MemoryStick, Monitor, Zap, ChevronRight, CheckCircle, AlertTriangle, Loader2, RefreshCw, Info } from 'lucide-react'

type Brand = 'asus' | 'msi' | 'gigabyte' | 'asrock' | 'unknown'

interface BiosCheck {
  status: 'enabled' | 'disabled' | 'info'
  detail?: string
}

interface BiosData {
  success: boolean
  motherboard?: { manufacturer: string; product: string; brand: Brand }
  bios?: { version: string; date: string }
  cpu?: string
  ram?: { total: string; speed: string }
  gpu?: string
  checks?: Record<string, BiosCheck>
  error?: string
}

interface GuideStep {
  id: string
  title: string
  description: string
  importance: 'critical' | 'recommended' | 'optional'
  difficulty: 'easy' | 'medium' | 'hard'
  benefits: string[]
  brandSteps: Record<Brand, string[]>
  warning?: string
  checkKey?: string
  idealState?: 'enabled' | 'disabled'
}

const BIOS_GUIDES: GuideStep[] = [
  {
    id: 'xmp',
    title: 'Enable XMP / DOCP / EXPO',
    description: 'Unlock your RAM full speed. Most PCs ship with RAM running at half speed.',
    importance: 'critical',
    difficulty: 'easy',
    benefits: ['10-30% FPS increase', 'Faster load times', 'Smoother gameplay'],
    checkKey: 'xmp',
    idealState: 'enabled',
    brandSteps: {
      asus: ['Restart → press DEL or F2', 'AI Tweaker → AI Overclock Tuner → Select "XMP I" or "XMP II"', 'Press F10 → Save & Exit'],
      msi: ['Restart → press DEL', 'OC → DRAM Setting → Extreme Memory Profile (X.M.P.) → Enable', 'Press F10 → Save & Exit'],
      gigabyte: ['Restart → press DEL', 'Tweaker → Memory Frequency → Select XMP profile', 'Press F10 → Save & Exit'],
      asrock: ['Restart → press DEL or F2', 'OC Tweaker → DRAM Configuration → Load XMP Profile', 'Press F10 → Save & Exit'],
      unknown: ['Restart → press DEL, F2, or F12', 'Find "Memory" or "Overclocking" section', 'Enable XMP/DOCP/EXPO profile', 'Press F10 → Save & Exit'],
    },
    warning: 'Safe to enable. If PC fails to boot, clear CMOS (remove battery for 30s).',
  },
  {
    id: 'game-dvr',
    title: 'Disable Game DVR / Game Bar',
    description: 'Game DVR records in the background, eating FPS and CPU usage.',
    importance: 'critical',
    difficulty: 'easy',
    benefits: ['5-15% FPS gain', 'Less CPU usage', 'No recording overhead'],
    checkKey: 'gameDvr',
    idealState: 'disabled',
    brandSteps: {
      asus: ['This is a Windows setting, not BIOS', 'Settings → Gaming → Game Bar → Turn off', 'Settings → Gaming → Captures → Turn off background recording'],
      msi: ['This is a Windows setting, not BIOS', 'Settings → Gaming → Game Bar → Turn off', 'Settings → Gaming → Captures → Turn off background recording'],
      gigabyte: ['This is a Windows setting, not BIOS', 'Settings → Gaming → Game Bar → Turn off', 'Settings → Gaming → Captures → Turn off background recording'],
      asrock: ['This is a Windows setting, not BIOS', 'Settings → Gaming → Game Bar → Turn off', 'Settings → Gaming → Captures → Turn off background recording'],
      unknown: ['This is a Windows setting, not BIOS', 'Settings → Gaming → Game Bar → Turn off', 'Settings → Gaming → Captures → Turn off background recording'],
    },
  },
  {
    id: 'c-states',
    title: 'Disable CPU C-States',
    description: 'Stop your CPU from downclocking during gaming. Keeps it at max speed.',
    importance: 'critical',
    difficulty: 'medium',
    benefits: ['Lower input lag', 'More consistent FPS', 'Reduced micro-stutters'],
    brandSteps: {
      asus: ['Advanced → CPU Configuration → CPU Power Management', 'Disable: "Intel C-States", "CFG Lock"', 'Also disable: "Intel SpeedStep (EIST)"', 'F10 → Save & Exit'],
      msi: ['OC → CPU Features → Intel C-State / AMD Cool & Quiet', 'Set "Intel C-State" to Disabled', 'Set "C1E Support" to Disabled', 'F10 → Save & Exit'],
      gigabyte: ['Tweaker → Advanced CPU Settings → CPU Enhance Settings', 'Disable: "CPU EIST Function", "CPU C-State Control"', 'F10 → Save & Exit'],
      asrock: ['Advanced → CPU Configuration → CPU C-State Control', 'Disable "CPU C-State Support"', 'F10 → Save & Exit'],
      unknown: ['Enter BIOS → find "CPU Configuration"', 'Find "C-States" or "CPU Power Management"', 'Disable C-States and SpeedStep/Cool & Quiet', 'F10 → Save & Exit'],
    },
    warning: 'Increases idle power by 10-30W. Only if you game daily.',
  },
  {
    id: 'resizable-bar',
    title: 'Enable Resizable BAR (ReBAR)',
    description: 'Let your GPU access all VRAM at once. Modern GPUs benefit from this.',
    importance: 'recommended',
    difficulty: 'medium',
    benefits: ['5-15% FPS in GPU-bound games', 'Better GPU memory access', 'Free performance'],
    checkKey: 'reBar',
    idealState: 'enabled',
    brandSteps: {
      asus: ['Advanced → System Agent (SA) → Above 4G Decoding → Enabled', 'Advanced → System Agent (SA) → Resizable BAR → Enabled', 'F10 → Save & Exit'],
      msi: ['Settings → Advanced → PCI Subsystem Settings', 'Above 4G Memory → Enabled', 'Re-Size BAR Support → Enabled', 'F10 → Save & Exit'],
      gigabyte: ['Settings → IO Ports → Above 4G Decoding → Enabled', 'Settings → IO Ports → Re-Size BAR Support → Enabled', 'F10 → Save & Exit'],
      asrock: ['Advanced → Chipset → Above 4G Decoding → Enabled', 'Advanced → Chipset → Re-Size BAR Support → Enabled', 'F10 → Save & Exit'],
      unknown: ['Enter BIOS → find "PCI Configuration"', 'Enable "Above 4G Decoding"', 'Enable "Resizable BAR"', 'F10 → Save & Exit'],
    },
    warning: 'Requires RTX 30xx+ or RX 6000+ GPU.',
  },
  {
    id: 'hpet',
    title: 'Disable HPET',
    description: 'High Precision Event Timer can cause timing issues and micro-stutters.',
    importance: 'recommended',
    difficulty: 'medium',
    benefits: ['Reduced input latency', 'Smoother frame pacing', 'Better frame timing'],
    checkKey: 'hpet',
    idealState: 'disabled',
    brandSteps: {
      asus: ['Advanced → System Agent → HPET → Disabled', 'F10 → Save & Exit', 'Open CMD as Admin → bcdedit /deletevalue useplatformclock'],
      msi: ['Settings → Advanced → PCI Subsystem → HPET → Disabled', 'F10 → Save & Exit', 'Open CMD as Admin → bcdedit /deletevalue useplatformclock'],
      gigabyte: ['Settings → IO Ports → HPET → Disabled', 'F10 → Save & Exit', 'Open CMD as Admin → bcdedit /deletevalue useplatformclock'],
      asrock: ['Advanced → PCH → HPET → Disabled', 'F10 → Save & Exit', 'Open CMD as Admin → bcdedit /deletevalue useplatformclock'],
      unknown: ['Enter BIOS → find "Chipset" or "PCI"', 'Find and disable HPET', 'F10 → Save & Exit', 'Open CMD as Admin → bcdedit /deletevalue useplatformclock'],
    },
    warning: 'Some audio production software may need HPET.',
  },
  {
    id: 'virtualization',
    title: 'Disable Virtualization (if not using VMs)',
    description: 'VT-x/AMD-V adds overhead. Disable if you don\'t run virtual machines.',
    importance: 'optional',
    difficulty: 'easy',
    benefits: ['Lower CPU overhead', 'Marginal FPS gain (1-3%)'],
    checkKey: 'virtualization',
    idealState: 'disabled',
    brandSteps: {
      asus: ['Advanced → CPU Configuration → Intel Virtualization Technology → Disabled', 'F10 → Save & Exit'],
      msi: ['OC → CPU Features → Intel Virtualization Tech → Disabled', 'F10 → Save & Exit'],
      gigabyte: ['Tweaker → Advanced CPU Settings → SVM Mode → Disabled', 'F10 → Save & Exit'],
      asrock: ['Advanced → CPU Configuration → Intel Virtualization Technology → Disabled', 'F10 → Save & Exit'],
      unknown: ['Enter BIOS → CPU Configuration', 'Find "VT-x" or "AMD-V" or "SVM"', 'Disable it → F10 → Save & Exit'],
    },
    warning: 'Do NOT disable if you use Docker, WSL2, Hyper-V, or Android emulators.',
  },
  {
    id: 'turbo-boost',
    title: 'Verify Turbo Boost / Precision Boost',
    description: 'Make sure your CPU boost technology is enabled for maximum clocks.',
    importance: 'critical',
    difficulty: 'easy',
    benefits: ['Higher CPU clocks', 'Better single-thread performance', 'More FPS'],
    brandSteps: {
      asus: ['Advanced → CPU Configuration → Intel Turbo Boost → Enabled', 'AMD: Core Performance Boost → Enabled', 'F10 → Save & Exit'],
      msi: ['OC → CPU Features → Intel Turbo Boost → Enabled', 'AMD: Core Performance Boost → Enabled', 'F10 → Save & Exit'],
      gigabyte: ['Tweaker → Advanced CPU Settings → Turbo Boost → Enabled', 'AMD: Core Performance Boost → Enabled', 'F10 → Save & Exit'],
      asrock: ['Advanced → CPU Configuration → Intel Turbo Boost → Enabled', 'AMD: Core Performance Boost → Enabled', 'F10 → Save & Exit'],
      unknown: ['Enter BIOS → CPU Configuration', 'Ensure "Turbo Boost" or "Precision Boost" is ENABLED', 'F10 → Save & Exit'],
    },
    warning: 'Should be enabled by default. Check again after BIOS updates.',
  },
  {
    id: 'fan-curve',
    title: 'Set Aggressive Fan Curves',
    description: 'Keep components cool for sustained boost clocks. Throttling kills FPS.',
    importance: 'recommended',
    difficulty: 'medium',
    benefits: ['Prevents thermal throttling', 'Sustained boost clocks', 'Lower temps'],
    brandSteps: {
      asus: ['Monitor → Q-Fan Configuration → CPU Fan → Full Speed or Custom', 'Set curve: 40% @ 50°C, 70% @ 70°C, 100% @ 80°C', 'GPU: use MSI Afterburner for custom fan curve', 'F10 → Save & Exit'],
      msi: ['Settings → Hardware Monitor → CPU Fan → Customize', 'Set fan speed curve or select "Full Speed"', 'GPU: use MSI Afterburner for custom fan curve', 'F10 → Save & Exit'],
      gigabyte: ['Settings → PC Health Status → CPU Fan Speed Control → Manual', 'Set curve points or use "Full Speed"', 'GPU: use MSI Afterburner for custom fan curve', 'F10 → Save & Exit'],
      asrock: ['H/W Monitor → CPU Fan 1 Setting → Performance Mode', 'Or: Custom mode → Set aggressive curve', 'GPU: use MSI Afterburner for custom fan curve', 'F10 → Save & Exit'],
      unknown: ['Enter BIOS → find "Hardware Monitor" or "Fan Control"', 'Set CPU fan to aggressive curve', 'GPU: use MSI Afterburner for custom fan curve', 'F10 → Save & Exit'],
    },
    warning: 'Louder fans. Consider if noise bothers you.',
  },
  {
    id: 'fast-boot',
    title: 'Enable Fast Boot',
    description: 'Skip hardware initialization during boot. Faster startup.',
    importance: 'optional',
    difficulty: 'easy',
    benefits: ['Faster boot times', 'Skip POST checks'],
    checkKey: 'fastBoot',
    idealState: 'enabled',
    brandSteps: {
      asus: ['Boot → Fast Boot → Enabled', 'F10 → Save & Exit'],
      msi: ['Settings → Advanced → Windows OS Configuration → Fast Boot → Enabled', 'F10 → Save & Exit'],
      gigabyte: ['BIOS → Fast Boot → Enabled', 'F10 → Save & Exit'],
      asrock: ['Boot → Fast Boot → Enabled', 'F10 → Save & Exit'],
      unknown: ['Enter BIOS → Boot section', 'Enable "Fast Boot"', 'F10 → Save & Exit'],
    },
    warning: 'To access BIOS later: hold Shift + click Restart → Troubleshoot → UEFI Firmware.',
  },
]

function getImportanceColor(imp: string) {
  if (imp === 'critical') return 'var(--danger)'
  if (imp === 'recommended') return 'var(--warning)'
  return 'var(--info)'
}

function getDifficultyColor(diff: string) {
  if (diff === 'easy') return 'var(--success)'
  if (diff === 'medium') return 'var(--warning)'
  return 'var(--danger)'
}

function getStatusColor(status: string) {
  if (status === 'enabled') return 'var(--success)'
  if (status === 'disabled') return 'var(--danger)'
  return 'var(--text-muted)'
}

const BRAND_LABELS: Record<Brand, string> = {
  asus: 'ASUS', msi: 'MSI', gigabyte: 'Gigabyte', asrock: 'ASRock', unknown: 'Unknown',
}

export function BIOSGuidePage() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'critical' | 'recommended' | 'optional'>('all')
  const [biosData, setBiosData] = useState<BiosData | null>(null)
  const [scanning, setScanning] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const scanBios = useCallback(async () => {
    setScanning(true)
    try {
      const api = (window as any).electronAPI
      if (api?.scanBios) {
        const data = await api.scanBios()
        setBiosData(data)
      }
    } catch {}
    setScanning(false)
  }, [])

  useEffect(() => { scanBios() }, [scanBios])

  const brand: Brand = biosData?.motherboard?.brand || 'unknown'
  const filtered = filter === 'all' ? BIOS_GUIDES : BIOS_GUIDES.filter(g => g.importance === filter)

  const completedCount = BIOS_GUIDES.filter(g => {
    if (!g.checkKey || !biosData?.checks) return false
    const check = biosData.checks[g.checkKey]
    return check && g.idealState && check.status === g.idealState
  }).length

  return (
    <div className="h-full overflow-y-auto page-transition" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-4xl mx-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4 fade-in">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#ffffff' }}>
            <BookOpen className="w-6 h-6 text-black" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white tracking-tight">BIOS Guide</h1>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Optimize your BIOS for maximum gaming performance</p>
          </div>
          <button onClick={scanBios} disabled={scanning}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold transition-all btn-press"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? 'Scanning...' : 'Rescan'}
          </button>
        </div>

        {/* Hardware Info Card */}
        {biosData?.success && (
          <div className="card-widget p-5 fade-in">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4" style={{ color: 'var(--info)' }} />
              <span className="text-xs font-bold text-white">Detected Hardware</span>
              <span className="status-badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '9px' }}>
                {BRAND_LABELS[brand] || 'Unknown'} Motherboard
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'MOTHERBOARD', value: biosData.motherboard?.product || 'Unknown' },
                { label: 'BIOS', value: biosData.bios?.version || 'Unknown' },
                { label: 'CPU', value: biosData.cpu || 'Unknown' },
                { label: 'RAM', value: biosData.ram ? `${biosData.ram.total} GB @ ${biosData.ram.speed} MHz` : 'Unknown' },
              ].map((item, i) => (
                <div key={i} className="px-3 py-2 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                  <div className="text-[8px] font-bold tracking-widest" style={{ color: 'var(--text-muted)' }}>{item.label}</div>
                  <div className="text-[11px] font-semibold text-white mt-0.5 truncate">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scanning state */}
        {scanning && (
          <div className="card-widget p-8 flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs text-[var(--text-secondary)]">Scanning hardware and BIOS settings...</span>
          </div>
        )}

        {/* Warning banner */}
        <div className="card-widget p-4" style={{ borderColor: 'rgba(251,191,36,0.2)' }}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
            <div>
              <div className="text-xs font-bold text-white">BIOS changes are safe but require caution</div>
              <div className="text-[11px] text-[var(--text-secondary)] mt-1">
                All settings are reversible. If something goes wrong, reset BIOS by removing the CMOS battery for 30 seconds.
              </div>
            </div>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2">
          {(['all', 'critical', 'recommended', 'optional'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-xl text-[11px] font-bold transition-all"
              style={{
                background: filter === f ? '#fff' : 'rgba(255,255,255,0.04)',
                color: filter === f ? '#000' : 'var(--text-secondary)',
                border: filter === f ? '2px solid #fff' : '2px solid rgba(255,255,255,0.06)',
              }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-3">
          <div className="card-widget p-3 text-center">
            <div className="text-xl font-bold" style={{ color: 'var(--danger)' }}>
              {BIOS_GUIDES.filter(g => g.importance === 'critical').length}
            </div>
            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Critical</div>
          </div>
          <div className="card-widget p-3 text-center">
            <div className="text-xl font-bold" style={{ color: 'var(--warning)' }}>
              {BIOS_GUIDES.filter(g => g.importance === 'recommended').length}
            </div>
            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Recommended</div>
          </div>
          <div className="card-widget p-3 text-center">
            <div className="text-xl font-bold" style={{ color: 'var(--info)' }}>
              {BIOS_GUIDES.filter(g => g.importance === 'optional').length}
            </div>
            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Optional</div>
          </div>
          <div className="card-widget p-3 text-center">
            <div className="text-xl font-bold" style={{ color: 'var(--success)' }}>
              {completedCount}/{BIOS_GUIDES.filter(g => g.checkKey).length}
            </div>
            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Detected</div>
          </div>
        </div>

        {/* Guide cards */}
        <div className="space-y-3">
          {filtered.map(guide => {
            const isExpanded = expandedId === guide.id
            const check = guide.checkKey && biosData?.checks ? biosData.checks[guide.checkKey] : null
            const isOptimal = check && guide.idealState && check.status === guide.idealState
            const currentBrandSteps = guide.brandSteps[brand] || guide.brandSteps.unknown

            return (
              <div key={guide.id} className="card-widget overflow-hidden"
                style={{ borderColor: isOptimal ? 'rgba(74,222,128,0.2)' : undefined }}>
                <button onClick={() => setExpandedId(isExpanded ? null : guide.id)}
                  className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-white/[0.015] transition-colors">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${getImportanceColor(guide.importance)}15` }}>
                    {guide.id === 'xmp' && <MemoryStick className="w-5 h-5" style={{ color: getImportanceColor(guide.importance) }} />}
                    {(guide.id === 'c-states' || guide.id === 'turbo-boost') && <Cpu className="w-5 h-5" style={{ color: getImportanceColor(guide.importance) }} />}
                    {(guide.id === 'resizable-bar' || guide.id === 'hpet' || guide.id === 'virtualization') && <Zap className="w-5 h-5" style={{ color: getImportanceColor(guide.importance) }} />}
                    {(guide.id === 'fan-curve' || guide.id === 'fast-boot' || guide.id === 'game-dvr') && <Monitor className="w-5 h-5" style={{ color: getImportanceColor(guide.importance) }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white">{guide.title}</span>
                      <span className="status-badge" style={{
                        background: `${getImportanceColor(guide.importance)}15`,
                        color: getImportanceColor(guide.importance),
                        border: `1px solid ${getImportanceColor(guide.importance)}30`,
                        fontSize: '9px',
                      }}>
                        {guide.importance}
                      </span>
                      <span className="status-badge" style={{
                        background: `${getDifficultyColor(guide.difficulty)}15`,
                        color: getDifficultyColor(guide.difficulty),
                        border: `1px solid ${getDifficultyColor(guide.difficulty)}30`,
                        fontSize: '9px',
                      }}>
                        {guide.difficulty}
                      </span>
                      {check && (
                        <span className="status-badge" style={{
                          background: `${getStatusColor(check.status)}15`,
                          color: getStatusColor(check.status),
                          border: `1px solid ${getStatusColor(check.status)}30`,
                          fontSize: '9px',
                        }}>
                          {check.status}{check.detail ? ` (${check.detail})` : ''}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{guide.description}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0" style={{
                    color: 'var(--text-muted)',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }} />
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 space-y-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <div className="flex items-center gap-2 flex-wrap mt-3">
                      {guide.benefits.map((b, i) => (
                        <span key={i} className="status-badge success" style={{ fontSize: '10px' }}>
                          <CheckCircle className="w-3 h-3" />
                          {b}
                        </span>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">Steps for</span>
                        <span className="text-xs font-bold" style={{ color: 'var(--info)' }}>
                          {BRAND_LABELS[brand] || 'Your Motherboard'}
                        </span>
                      </div>
                      {currentBrandSteps.map((step, i) => (
                        <div key={i} className="flex items-start gap-3 px-3 py-2 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                            style={{ background: 'var(--accent-dim)', color: '#fff' }}>
                            {i + 1}
                          </span>
                          <span className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{step}</span>
                        </div>
                      ))}
                    </div>

                    {guide.warning && (
                      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl" style={{ background: 'var(--warning-dim)', border: '1px solid rgba(251,191,36,0.15)' }}>
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
                        <span className="text-[11px]" style={{ color: 'var(--warning)' }}>{guide.warning}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

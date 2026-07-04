'use client'

import { useState } from 'react'
import { BookOpen, Cpu, MemoryStick, Monitor, Zap, ChevronRight, CheckCircle, AlertTriangle, ExternalLink, Search } from 'lucide-react'

interface GuideStep {
  id: string
  title: string
  description: string
  importance: 'critical' | 'recommended' | 'optional'
  difficulty: 'easy' | 'medium' | 'hard'
  steps: string[]
  warning?: string
  benefits: string[]
}

const BIOS_GUIDES: GuideStep[] = [
  {
    id: 'xmp',
    title: 'Enable XMP / DOCP / EXPO',
    description: 'Unlock your RAM full speed. Most PCs ship with RAM running at half speed.',
    importance: 'critical',
    difficulty: 'easy',
    benefits: ['10-30% FPS increase', 'Faster load times', 'Smoother gameplay'],
    steps: [
      'Restart your PC and enter BIOS (press DEL, F2, or F12 during boot)',
      'Find "Memory" or "Overclocking" section (varies by motherboard)',
      'Look for "XMP" (Intel), "DOCP" (ASUS AMD), or "EXPO" (AMD)',
      'Enable Profile 1 or the highest speed profile',
      'Save & Exit (usually F10)',
    ],
    warning: 'Safe to enable. RAM manufacturers certify XMP profiles. Worst case: boot failure (reset BIOS to fix).',
  },
  {
    id: 'c-states',
    title: 'Disable CPU C-States',
    description: 'Stop your CPU from downclocking during gaming. Keeps it at max speed.',
    importance: 'critical',
    difficulty: 'medium',
    benefits: ['Lower input lag', 'More consistent FPS', 'Reduced micro-stutters'],
    steps: [
      'Enter BIOS and find "Advanced" → "CPU Configuration"',
      'Find "C-States" or "CPU Power Management"',
      'Disable "C1E", "C6/C7", and "Package C-State"',
      'Also disable "Intel SpeedStep" or "AMD Cool & Quiet"',
      'Save & Exit (F10)',
    ],
    warning: 'Increases idle power consumption by 10-30W. Only recommended if you game daily.',
  },
  {
    id: 'resizable-bar',
    title: 'Enable Resizable BAR (ReBAR)',
    description: 'Let your GPU access all VRAM at once. Modern GPUs benefit from this.',
    importance: 'recommended',
    difficulty: 'medium',
    benefits: ['5-15% FPS in GPU-bound games', 'Better GPU memory access', 'Free performance'],
    steps: [
      'Enter BIOS and find "Advanced" → "PCI Configuration"',
      'Find "Above 4G Decoding" and enable it',
      'Find "Resizable BAR" or "ReBAR" and enable it',
      'Save & Exit (F10)',
      'After Windows boots, verify in NVIDIA Control Panel → System Information',
    ],
    warning: 'Requires GPU support (RTX 30xx+ or RX 6000+). Check your GPU compatibility first.',
  },
  {
    id: 'hpet',
    title: 'Disable HPET (High Precision Event Timer)',
    description: 'HPET can cause timing issues and micro-stutters in games.',
    importance: 'recommended',
    difficulty: 'medium',
    benefits: ['Reduced input latency', 'Smoother frame pacing', 'Better frame timing'],
    steps: [
      'Enter BIOS → "Advanced" → "PCI Configuration" or "Chipset"',
      'Find "High Precision Event Timer" or "HPET"',
      'Disable it',
      'Save & Exit (F10)',
      'After boot, open CMD as admin and run: bcdedit /deletevalue useplatformclock',
    ],
    warning: 'Some older applications may need HPET. Re-enable if you encounter issues.',
  },
  {
    id: 'virtualization',
    title: 'Disable Virtualization (if not using VMs)',
    description: 'VT-x/AMD-V adds overhead. Disable if you don\'t run virtual machines.',
    importance: 'optional',
    difficulty: 'easy',
    benefits: ['Slightly lower CPU overhead', 'Marginal FPS gain (1-3%)'],
    steps: [
      'Enter BIOS → "Advanced" → "CPU Configuration"',
      'Find "Intel Virtualization Technology" (VT-x) or "AMD-V"',
      'Disable it',
      'Save & Exit (F10)',
    ],
    warning: 'Disable only if you don\'t use Docker, WSL2, Hyper-V, or virtual machines.',
  },
  {
    id: 'turbo-boost',
    title: 'Verify Turbo Boost / Precision Boost',
    description: 'Make sure your CPU boost technology is enabled for maximum clock speeds.',
    importance: 'critical',
    difficulty: 'easy',
    benefits: ['Higher CPU clocks', 'Better single-thread performance', 'More FPS'],
    steps: [
      'Enter BIOS → "Advanced" → "CPU Configuration"',
      'Find "Intel Turbo Boost" or "AMD Precision Boost"',
      'Ensure it\'s ENABLED',
      'Also check "Core Performance Boost" is enabled (AMD)',
      'Save & Exit (F10)',
    ],
    warning: 'This should be enabled by default. Double-check after updating BIOS.',
  },
  {
    id: 'fan-curve',
    title: 'Set Aggressive Fan Curves',
    description: 'Keep components cool for sustained boost clocks. Throttling kills FPS.',
    importance: 'recommended',
    difficulty: 'medium',
    benefits: ['Prevents thermal throttling', 'Sustained boost clocks', 'Lower temps'],
    steps: [
      'Enter BIOS → "Hardware Monitor" or "Fan Control"',
      'Set CPU fan to "Full Speed" or create aggressive curve',
      'For GPU: use MSI Afterburner to set custom fan curve',
      'Aim for: 40% at 50°C, 70% at 70°C, 100% at 80°C',
      'Save & Exit (F10)',
    ],
    warning: 'Louder fans. Consider this if noise is a concern.',
  },
  {
    id: 'fast-boot',
    title: 'Enable Fast Boot',
    description: 'Skip hardware initialization during boot. Faster startup, same gaming performance.',
    importance: 'optional',
    difficulty: 'easy',
    benefits: ['Faster boot times', 'Skip POST checks', 'Same gaming performance'],
    steps: [
      'Enter BIOS → "Boot" or "Advanced"',
      'Find "Fast Boot" or "Ultra Fast Boot"',
      'Enable it',
      'Save & Exit (F10)',
    ],
    warning: 'You may need to hold Shift when clicking Restart to access BIOS after enabling this.',
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

export function BIOSGuidePage() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'critical' | 'recommended' | 'optional'>('all')

  const filtered = filter === 'all' ? BIOS_GUIDES : BIOS_GUIDES.filter(g => g.importance === filter)

  return (
    <div className="h-full overflow-y-auto page-transition" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-4xl mx-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4 fade-in">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#ffffff' }}>
            <BookOpen className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">BIOS Guide</h1>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Optimize your BIOS for maximum gaming performance</p>
          </div>
        </div>

        {/* Warning banner */}
        <div className="card-widget p-4" style={{ borderColor: 'rgba(251,191,36,0.2)' }}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
            <div>
              <div className="text-xs font-bold text-white">BIOS changes are safe but require caution</div>
              <div className="text-[11px] text-[var(--text-secondary)] mt-1">
                All settings listed here are reversible. If something goes wrong, reset BIOS by removing the CMOS battery for 30 seconds.
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

        {/* Quick summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card-widget p-4 text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--danger)' }}>
              {BIOS_GUIDES.filter(g => g.importance === 'critical').length}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mt-1">Critical</div>
          </div>
          <div className="card-widget p-4 text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--warning)' }}>
              {BIOS_GUIDES.filter(g => g.importance === 'recommended').length}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mt-1">Recommended</div>
          </div>
          <div className="card-widget p-4 text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--info)' }}>
              {BIOS_GUIDES.filter(g => g.importance === 'optional').length}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mt-1">Optional</div>
          </div>
        </div>

        {/* Guide cards */}
        <div className="space-y-3">
          {filtered.map(guide => {
            const isExpanded = expandedId === guide.id
            return (
              <div key={guide.id} className="card-widget overflow-hidden">
                <button onClick={() => setExpandedId(isExpanded ? null : guide.id)}
                  className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-white/[0.015] transition-colors">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${getImportanceColor(guide.importance)}15` }}>
                    {guide.id === 'xmp' && <MemoryStick className="w-5 h-5" style={{ color: getImportanceColor(guide.importance) }} />}
                    {(guide.id === 'c-states' || guide.id === 'turbo-boost') && <Cpu className="w-5 h-5" style={{ color: getImportanceColor(guide.importance) }} />}
                    {(guide.id === 'resizable-bar' || guide.id === 'hpet' || guide.id === 'virtualization') && <Zap className="w-5 h-5" style={{ color: getImportanceColor(guide.importance) }} />}
                    {(guide.id === 'fan-curve' || guide.id === 'fast-boot') && <Monitor className="w-5 h-5" style={{ color: getImportanceColor(guide.importance) }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
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
                    {/* Benefits */}
                    <div className="flex items-center gap-2 flex-wrap mt-3">
                      {guide.benefits.map((b, i) => (
                        <span key={i} className="status-badge success" style={{ fontSize: '10px' }}>
                          <CheckCircle className="w-3 h-3" />
                          {b}
                        </span>
                      ))}
                    </div>

                    {/* Steps */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-white">Steps:</div>
                      {guide.steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-3 px-3 py-2 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                            style={{ background: 'var(--accent-dim)', color: '#fff' }}>
                            {i + 1}
                          </span>
                          <span className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{step}</span>
                        </div>
                      ))}
                    </div>

                    {/* Warning */}
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

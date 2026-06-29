'use client'

import { useState, useCallback } from 'react'
import { useStore } from '@/store/useStore'
import { verifyWithBackend } from '@/lib/license'
import { Settings, Monitor, Info, ExternalLink, Key, CheckCircle, XCircle, User, Download, Upload, RefreshCw, Save, Shield, MessageSquare, Send, Loader2, Star } from 'lucide-react'
import type { UpdateInfo, FeedbackData } from '@/types'

export function SettingsPage() {
  const { license, setLicense, discordId, setDiscordId } = useStore()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [statusMsg, setStatusMsg] = useState('')
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [exportStatus, setExportStatus] = useState<string | null>(null)
  const [importStatus, setImportStatus] = useState<string | null>(null)
  const [feedbackType, setFeedbackType] = useState<FeedbackData['type']>('general')
  const [feedbackSubject, setFeedbackSubject] = useState('')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [feedbackEmail, setFeedbackEmail] = useState('')
  const [feedbackIncludeLogs, setFeedbackIncludeLogs] = useState(false)
  const [feedbackRating, setFeedbackRating] = useState(0)
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState('')

  const handleVerifyDiscord = useCallback(async () => {
    if (!discordId.trim()) { setStatus('error'); setStatusMsg('Enter your Discord ID'); return }
    setLoading(true); setStatus('idle')
    const result = await verifyWithBackend(discordId.trim())
    setLoading(false)
    if (!result.valid) { setStatus('error'); setStatusMsg(result.error!); return }
    setLicense({ tier: result.tier!, key: null, activated: true, expiryDate: null })
    setStatus('success'); setStatusMsg(`Activated ${result.tier} plan via Discord`)
  }, [discordId, setLicense])

  const handleDeactivate = useCallback(() => {
    setLicense({ tier: 'FREE' as any, key: null, activated: false, expiryDate: null })
    setStatus('idle'); setStatusMsg('')
  }, [setLicense])

  const handleCheckUpdate = useCallback(async () => {
    if (!window.electronAPI) return
    setCheckingUpdate(true)
    const info = await window.electronAPI.checkForUpdates()
    setUpdateInfo(info); setCheckingUpdate(false)
  }, [])

  const handleExport = useCallback(async () => {
    if (!window.electronAPI) return
    setExportStatus('Exporting...')
    const res = await window.electronAPI.saveSettingsToFile()
    setExportStatus(res.success ? 'Exported successfully' : 'Export failed')
    setTimeout(() => setExportStatus(null), 3000)
  }, [])

  const handleImport = useCallback(async () => {
    if (!window.electronAPI) return
    setImportStatus('Importing...')
    const res = await window.electronAPI.loadSettingsFromFile()
    setImportStatus(res.success ? 'Imported - restart to apply' : 'Import failed')
    setTimeout(() => setImportStatus(null), 3000)
  }, [])

  const handleSendFeedback = useCallback(async () => {
    if (!feedbackSubject.trim() || !feedbackMessage.trim()) {
      setFeedbackStatus('error')
      setFeedbackMsg('Please fill in subject and message')
      return
    }
    if (!window.electronAPI) return
    setFeedbackLoading(true)
    setFeedbackStatus('idle')
    const feedback: FeedbackData & { rating?: number; discordId?: string } = {
      type: feedbackType,
      subject: feedbackSubject.trim(),
      message: feedbackMessage.trim(),
      email: feedbackEmail.trim() || undefined,
      includeLogs: feedbackIncludeLogs,
      rating: feedbackRating || undefined,
      discordId: discordId.trim() || undefined,
    }
    const res = await window.electronAPI.sendFeedback(feedback)
    setFeedbackLoading(false)
    if (res.success) {
      setFeedbackStatus('success')
      setFeedbackMsg(feedbackRating
        ? `Thanks for the ${feedbackRating}-star feedback! We'll review it shortly.`
        : 'Feedback sent successfully! We\'ll review it shortly.'
      )
      setFeedbackSubject('')
      setFeedbackMessage('')
      setFeedbackEmail('')
      setFeedbackIncludeLogs(false)
      setFeedbackRating(0)
    } else {
      setFeedbackStatus('error')
      setFeedbackMsg(res.error || 'Failed to send. Please try again.')
    }
  }, [feedbackType, feedbackSubject, feedbackMessage, feedbackEmail, feedbackIncludeLogs, feedbackRating])

  return (
    <div className="h-full overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-3xl mx-auto p-6 space-y-6 fade-in">

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#ffffff' }}>
            <Settings className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Settings</h1>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Account, preferences, and feedback</p>
          </div>
        </div>

        {/* ─── ACCOUNT ─── */}
        <Section title="Account">
          <div className="rounded-2xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            {/* Current plan */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs font-semibold text-white">Current Plan</div>
                <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Your license tier</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: license.tier === 'FREE' ? 'var(--text-muted)' : '#fff' }} />
                <span className="text-sm font-bold text-white">{license.tier}</span>
              </div>
            </div>

            {/* Active key */}
            {license.activated && (
              <div className="flex items-center justify-between p-3 rounded-xl mb-4" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center gap-2">
                  <Key className="w-3 h-3 text-[var(--text-muted)]" />
                  <span className="text-[10px] font-mono tracking-wider text-[var(--text-secondary)]">{license.key || 'Discord Verified'}</span>
                </div>
                <button onClick={handleDeactivate} className="text-[10px] px-2 py-1 rounded-lg transition-colors" style={{ color: '#999', background: 'var(--bg-secondary)' }}>Deactivate</button>
              </div>
            )}

            {/* Discord verify */}
            <div className="mb-3">
              <div className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-medium mb-2">Verify with Discord</div>
              <div className="flex gap-2">
                <input type="text" placeholder="Your Discord ID" value={discordId} onChange={(e) => {
                  const val = e.target.value
                  setDiscordId(val)
                  setStatus('idle')
                }}
                onBlur={() => {
                  if (window.electronAPI && discordId !== undefined) {
                     const state = useStore.getState()
                     window.electronAPI.saveAppState({
                       license: state.license,
                       selectedGames: state.selectedGames,
                       scheduledScans: state.scheduledScans,
                       autopilotEnabled: state.autopilotEnabled,
                       discordId: state.discordId,
                       appliedTweaks: state.appliedTweaks,
                     })
                  }
                }}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs outline-none"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }} />
                <button onClick={handleVerifyDiscord} disabled={loading}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 btn-primary disabled:opacity-50">
                  <User className="w-3 h-3" />{loading ? '...' : 'Lookup'}
                </button>
              </div>
              <p className="text-[9px] mt-1.5 text-[var(--text-muted)]">Already redeemed in Discord? Enter your Discord ID above.</p>
            </div>

            {/* Status */}
            {status !== 'idle' && (
              <div className="flex items-center gap-2 mt-3">
                {status === 'success' ? <CheckCircle className="w-3 h-3 text-white" /> : <XCircle className="w-3 h-3" style={{ color: '#999' }} />}
                <span className="text-[10px]" style={{ color: status === 'success' ? '#fff' : '#999' }}>{statusMsg}</span>
              </div>
            )}

            <p className="text-[10px] mt-4 text-[var(--text-muted)]">
              Join the <a href="https://discord.gg/Y92hMwVaUc" target="_blank" rel="noreferrer" className="font-bold text-white hover:underline">CHOATIX Discord</a> to purchase a key.
            </p>
          </div>
        </Section>

        {/* ─── UPDATES ─── */}
        <Section title="Updates">
          <div className="rounded-2xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
                  <RefreshCw className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Check for Updates</div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Current: v{updateInfo?.currentVersion || '2.0.0'}</div>
                </div>
              </div>
              <button onClick={handleCheckUpdate} disabled={checkingUpdate}
                className="h-9 px-4 rounded-xl text-[11px] font-semibold disabled:opacity-50"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                {checkingUpdate ? 'Checking...' : 'Check'}
              </button>
            </div>
            {updateInfo && updateInfo.updateAvailable && (
              <div className="flex items-center gap-2 p-3 rounded-xl mt-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <CheckCircle className="w-3.5 h-3.5 text-white" />
                <span className="text-[11px] text-white">v{updateInfo.latestVersion} available</span>
                {updateInfo.downloadUrl && (
                  <a href={updateInfo.downloadUrl} target="_blank" rel="noreferrer" className="text-[10px] font-bold ml-auto text-white hover:underline">Download</a>
                )}
              </div>
            )}
            {updateInfo && !updateInfo.updateAvailable && (
              <div className="flex items-center gap-2 p-3 rounded-xl mt-3" style={{ background: 'var(--bg-tertiary)' }}>
                <CheckCircle className="w-3.5 h-3.5 text-white" />
                <span className="text-[11px] text-[var(--text-secondary)]">You are up to date</span>
              </div>
            )}
          </div>
        </Section>

        {/* ─── DATA ─── */}
        <Section title="Data">
          <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            {/* Export */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
                  <Save className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Export Settings</div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Save settings to a JSON file</div>
                </div>
              </div>
              <button onClick={handleExport} className="h-9 px-4 rounded-xl text-[11px] font-semibold flex items-center gap-1.5"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                <Download className="w-3 h-3" />Export
              </button>
            </div>
            {exportStatus && <span className="text-[10px]" style={{ color: exportStatus.includes('success') ? '#fff' : '#999' }}>{exportStatus}</span>}

            <div className="h-px" style={{ background: 'var(--border-subtle)' }} />

            {/* Import */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
                  <Upload className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Import Settings</div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Load settings from a JSON file</div>
                </div>
              </div>
              <button onClick={handleImport} className="h-9 px-4 rounded-xl text-[11px] font-semibold flex items-center gap-1.5"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                <Upload className="w-3 h-3" />Import
              </button>
            </div>
            {importStatus && <span className="text-[10px]" style={{ color: importStatus.includes('success') ? '#fff' : '#999' }}>{importStatus}</span>}
          </div>
        </Section>

        {/* ─── ABOUT ─── */}
        <Section title="About">
          <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            {[
              { icon: Monitor, label: 'Version', value: '2.0.0' },
              { icon: Info, label: 'Build', value: 'Production' },
              { icon: ExternalLink, label: 'Support', value: 'Discord', link: 'https://discord.gg/Y92hMwVaUc' },
              { icon: Shield, label: 'Crash Reporting', value: 'Discord Webhook' },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <row.icon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span className="text-[11px] text-[var(--text-secondary)]">{row.label}</span>
                </div>
                {row.link ? (
                  <a href={row.link} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-white hover:underline">{row.value}</a>
                ) : (
                  <span className="text-[11px] font-medium text-white">{row.value}</span>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* ─── FEEDBACK ─── */}
        <Section title="Feedback">
          <div className="rounded-2xl p-5 space-y-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Send Feedback</div>
                <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Report bugs, suggest features, or share thoughts</div>
              </div>
            </div>

            {/* Type selector - card style */}
            <div>
              <label className="text-[10px] uppercase tracking-widest font-medium mb-2 block text-[var(--text-muted)]">Type</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: 'bug' as const, icon: '🐛', label: 'Bug Report', desc: 'Something broke' },
                  { id: 'feature' as const, icon: '💡', label: 'Feature', desc: 'Suggest improvement' },
                  { id: 'general' as const, icon: '💬', label: 'General', desc: 'Questions, thoughts' },
                ]).map(t => (
                  <button key={t.id} onClick={() => setFeedbackType(t.id)}
                    className="p-3 rounded-xl text-left transition-all duration-200"
                    style={{
                      background: feedbackType === t.id ? 'rgba(255,255,255,0.08)' : 'var(--bg-tertiary)',
                      border: `1px solid ${feedbackType === t.id ? 'rgba(255,255,255,0.2)' : 'var(--border-subtle)'}`,
                    }}>
                    <div className="text-lg mb-1">{t.icon}</div>
                    <div className="text-[11px] font-bold text-white">{t.label}</div>
                    <div className="text-[9px] text-[var(--text-muted)] mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="text-[10px] uppercase tracking-widest font-medium mb-2 block text-[var(--text-muted)]">Rating</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} type="button"
                    onClick={() => setFeedbackRating(feedbackRating === star ? 0 : star)}
                    onMouseEnter={() => setFeedbackRating(star)}
                    onMouseLeave={() => setFeedbackRating(feedbackRating)}
                    className="p-1 transition-all duration-200 hover:scale-125"
                    aria-label={`${star} star${star > 1 ? 's' : ''}`}>
                    <Star className="w-7 h-7" style={{
                      color: star <= feedbackRating ? '#fff' : 'var(--border-subtle)',
                      fill: star <= feedbackRating ? '#fff' : 'none',
                      filter: star <= feedbackRating ? 'drop-shadow(0 0 4px rgba(255,255,255,0.3))' : 'none',
                    }} />
                  </button>
                ))}
                {feedbackRating > 0 && (
                  <span className="text-xs font-bold ml-2 text-white">{feedbackRating}/5</span>
                )}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="text-[10px] uppercase tracking-widest font-medium mb-2 block text-[var(--text-muted)]">Subject</label>
              <input type="text" placeholder="Brief summary" value={feedbackSubject}
                onChange={(e) => setFeedbackSubject(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-xs outline-none"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }} />
            </div>

            {/* Message */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] uppercase tracking-widest font-medium text-[var(--text-muted)]">Message</label>
                <span className="text-[9px] text-[var(--text-muted)]">{feedbackMessage.length}/2000</span>
              </div>
              <textarea placeholder="Describe your feedback in detail..." value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)} rows={6}
                className="w-full px-4 py-3 rounded-xl text-xs outline-none resize-none"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', lineHeight: '1.7' }} />
            </div>

            {/* Include logs */}
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
              <input type="checkbox" checked={feedbackIncludeLogs}
                onChange={(e) => setFeedbackIncludeLogs(e.target.checked)}
                className="w-4 h-4 accent-white cursor-pointer" />
              <div>
                <span className="text-[11px] text-[var(--text-secondary)] font-medium">Include system logs</span>
                <span className="text-[9px] text-[var(--text-muted)] ml-2">Helps with debugging</span>
              </div>
            </div>

            {/* Submit */}
            <button onClick={handleSendFeedback} disabled={feedbackLoading || !feedbackSubject.trim() || !feedbackMessage.trim()}
              className="w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2.5 btn-primary disabled:opacity-40 disabled:cursor-not-allowed hover-lift transition-all duration-300">
              {feedbackLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
              ) : (
                <><Send className="w-4 h-4" /> Send Feedback</>
              )}
            </button>

            {/* Status */}
            {feedbackStatus !== 'idle' && (
              <div className="flex items-center gap-3 p-4 rounded-xl"
                style={{ background: feedbackStatus === 'success' ? 'rgba(255,255,255,0.04)' : 'rgba(153,153,153,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {feedbackStatus === 'success' ? <CheckCircle className="w-4 h-4 text-white" /> : <XCircle className="w-4 h-4" style={{ color: '#999' }} />}
                <span className="text-[11px] font-medium" style={{ color: feedbackStatus === 'success' ? '#fff' : '#999' }}>{feedbackMsg}</span>
              </div>
            )}
          </div>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[10px] font-bold tracking-widest uppercase mb-2.5 text-[var(--text-muted)]">{title}</h2>
      {children}
    </div>
  )
}

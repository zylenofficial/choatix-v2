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
    const feedback: FeedbackData & { rating?: number } = {
      type: feedbackType,
      subject: feedbackSubject.trim(),
      message: feedbackMessage.trim(),
      email: feedbackEmail.trim() || undefined,
      includeLogs: feedbackIncludeLogs,
      rating: feedbackRating || undefined,
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
    <div className="p-5 lg:p-6 space-y-6 fade-in overflow-y-auto h-full max-w-2xl">
      <div>
        <h1 className="text-[18px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Application preferences and account</p>
      </div>

      <Section title="Account">
        <div className="card-widget p-4 card-glow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>Current Plan</div>
              <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Your license tier</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: license.tier === 'FREE' ? 'var(--text-muted)' : license.tier === 'PRO' ? 'var(--accent)' : '#cccccc' }} />
              <span className="text-[12px] font-bold tracking-wider" style={{ color: 'var(--text-primary)' }}>{license.tier}</span>
            </div>
          </div>
          {license.activated && (
            <div className="flex items-center justify-between p-2.5 rounded-lg mb-3" style={{ background: 'var(--bg-tertiary)' }}>
              <div className="flex items-center gap-2">
                <Key className="w-3 h-3" style={{ color: 'var(--accent)' }} />
                <span className="text-[10px] font-mono tracking-wider" style={{ color: 'var(--text-secondary)' }}>{license.key || 'Discord Verified'}</span>
              </div>
              <button onClick={handleDeactivate} className="text-[10px] px-2 py-1 rounded transition-colors" style={{ color: 'var(--danger)', background: 'var(--bg-secondary)' }}>Deactivate</button>
            </div>
          )}
          <div className="mb-3">
            <div className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Verify with Discord</div>
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
                className="flex-1 px-3 py-2.5 rounded-lg text-[11px] outline-none" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }} />
              <button onClick={handleVerifyDiscord} disabled={loading}
                className="px-4 py-2.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all hover:opacity-90 disabled:opacity-50 btn-primary">
                <User className="w-3 h-3" />{loading ? '...' : 'Lookup'}
              </button>
            </div>
            <p className="text-[9px] mt-1" style={{ color: 'var(--text-muted)' }}>Already redeemed in Discord? Enter your Discord ID above.</p>
          </div>
          {status !== 'idle' && (
            <div className="flex items-center gap-2 mt-3">
              {status === 'success' ? <CheckCircle className="w-3 h-3" style={{ color: 'var(--success)' }} /> : <XCircle className="w-3 h-3" style={{ color: 'var(--danger)' }} />}
              <span className="text-[10px]" style={{ color: status === 'success' ? 'var(--success)' : 'var(--danger)' }}>{statusMsg}</span>
            </div>
          )}
          <p className="text-[10px] mt-3" style={{ color: 'var(--text-muted)' }}>
            Join the <a href="https://discord.gg/Y92hMwVaUc" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }} className="font-bold">CHAOTIX Discord</a> to purchase a key.
          </p>
        </div>
      </Section>

      <Section title="Updates">
        <div className="card-widget p-4 card-glow">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
                <RefreshCw className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <div className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>Check for Updates</div>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Current: v{updateInfo?.currentVersion || '2.0.0'}</div>
              </div>
            </div>
            <button onClick={handleCheckUpdate} disabled={checkingUpdate}
              className="h-9 px-4 rounded-lg text-[11px] font-semibold disabled:opacity-50"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>
              {checkingUpdate ? 'Checking...' : 'Check'}
            </button>
          </div>
          {updateInfo && updateInfo.updateAvailable && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: 'var(--success-dim)' }}>
              <CheckCircle className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
              <span className="text-[11px]" style={{ color: 'var(--success)' }}>v{updateInfo.latestVersion} available</span>
              {updateInfo.downloadUrl && (
                <a href={updateInfo.downloadUrl} target="_blank" rel="noreferrer" className="text-[10px] font-bold ml-auto" style={{ color: 'var(--accent)' }}>Download</a>
              )}
            </div>
          )}
          {updateInfo && !updateInfo.updateAvailable && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
              <CheckCircle className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
              <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>You are up to date</span>
            </div>
          )}
        </div>
      </Section>

      <Section title="Data">
        <div className="card-widget p-4 space-y-3 card-glow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
                <Save className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <div className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>Export Settings</div>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Save settings to a JSON file</div>
              </div>
            </div>
            <button onClick={handleExport} className="h-9 px-4 rounded-lg text-[11px] font-semibold flex items-center gap-1.5"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>
              <Download className="w-3 h-3" />Export
            </button>
          </div>
          {exportStatus && <span className="text-[10px]" style={{ color: exportStatus.includes('success') ? 'var(--success)' : 'var(--danger)' }}>{exportStatus}</span>}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
                <Upload className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <div className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>Import Settings</div>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Load settings from a JSON file</div>
              </div>
            </div>
            <button onClick={handleImport} className="h-9 px-4 rounded-lg text-[11px] font-semibold flex items-center gap-1.5"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>
              <Upload className="w-3 h-3" />Import
            </button>
          </div>
          {importStatus && <span className="text-[10px]" style={{ color: importStatus.includes('success') ? 'var(--success)' : 'var(--danger)' }}>{importStatus}</span>}
        </div>
      </Section>

      <Section title="About">
        <div className="card-widget p-4 space-y-3 card-glow">
          <Row icon={Monitor} label="Version" value="2.0.0" />
          <Row icon={Info} label="Build" value="Production" />
          <Row icon={ExternalLink} label="Support" value="Discord" link="https://discord.gg/Y92hMwVaUc" />
          <Row icon={Shield} label="Crash Reporting" value="Discord Webhook" />
        </div>
      </Section>

      <Section title="Feedback">
        <div className="card-widget p-4 space-y-4 card-glow">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
              <MessageSquare className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            </div>
            <span className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>Send Feedback</span>
          </div>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Report bugs, suggest features, or share your thoughts</p>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Type</label>
              <div className="flex gap-2">
                {(['bug', 'feature', 'general'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setFeedbackType(t)}
                    className="relative px-4 py-2.5 rounded-xl text-[11px] font-medium transition-all flex-1 min-h-[44px] flex items-center justify-center"
                    style={{
                      background: feedbackType === t ? 'var(--accent)' : 'var(--bg-secondary)',
                      color: feedbackType === t ? '#fff' : 'var(--text-secondary)',
                      border: feedbackType === t ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
                      boxShadow: feedbackType === t ? '0 4px 12px rgba(255,255,255,0.25)' : 'none',
                    }}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Rating</label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFeedbackRating(feedbackRating === star ? 0 : star)}
                    onMouseEnter={() => setFeedbackRating(star)}
                    onMouseLeave={() => setFeedbackRating(feedbackRating)}
                    className="p-1 transition-transform hover:scale-110"
                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                  >
                    <Star 
                      className="w-7 h-7" 
                      style={{ 
                        color: star <= feedbackRating ? '#cccccc' : 'var(--border-subtle)',
                        fill: star <= feedbackRating ? '#cccccc' : 'none',
                      }} 
                    />
                  </button>
                ))}
                {feedbackRating > 0 && (
                  <span className="text-[11px] font-bold ml-2" style={{ color: '#cccccc' }}>
                    {feedbackRating}/5
                  </span>
                )}
              </div>
              <p className="text-[9px] mt-1" style={{ color: 'var(--text-muted)' }}>Optional — helps us prioritize</p>
            </div>

            <div>
              <label className="text-[10px] font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Subject</label>
              <input
                type="text"
                placeholder="Brief summary"
                value={feedbackSubject}
                onChange={(e) => setFeedbackSubject(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-[12px] outline-none transition-all"
                style={{ 
                  background: 'var(--bg-tertiary)', 
                  color: 'var(--text-primary)', 
                  border: '1px solid var(--border-default)',
                }}
              />
            </div>

            <div>
              <label className="text-[10px] font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Message</label>
              <textarea
                placeholder="Describe your feedback in detail..."
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 rounded-xl text-[12px] outline-none resize-none transition-all font-mono text-[11px]"
                style={{ 
                  background: 'var(--bg-tertiary)', 
                  color: 'var(--text-primary)', 
                  border: '1px solid var(--border-default)',
                  lineHeight: '1.6',
                }}
              />
            </div>

            <div>
              <label className="text-[10px] font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Discord Name</label>
              <input
                type="text"
                placeholder="YourName#1234"
                value={feedbackEmail}
                onChange={(e) => setFeedbackEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-[12px] outline-none transition-all"
                style={{ 
                  background: 'var(--bg-tertiary)', 
                  color: 'var(--text-primary)', 
                  border: '1px solid var(--border-default)',
                }}
              />
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)' }}>
              <input
                type="checkbox"
                checked={feedbackIncludeLogs}
                onChange={(e) => setFeedbackIncludeLogs(e.target.checked)}
                className="w-5 h-5 accent-accent cursor-pointer"
              />
              <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Include system logs (helps with bug reports)</span>
            </div>

            <button
              onClick={handleSendFeedback}
              disabled={feedbackLoading}
              className="w-full py-3 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-lg btn-primary"
            >
              {feedbackLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Send Feedback
                </>
              )}
            </button>

            {feedbackStatus !== 'idle' && (
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ 
                background: feedbackStatus === 'success' ? 'var(--success-dim)' : 'var(--danger-dim)',
                border: feedbackStatus === 'success' ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.15)'
              }}>
                {feedbackStatus === 'success' ? (
                  <CheckCircle className="w-4 h-4" style={{ color: 'var(--success)' }} />
                ) : (
                  <XCircle className="w-4 h-4" style={{ color: 'var(--danger)' }} />
                )}
                <span className="text-[11px] font-medium" style={{ color: feedbackStatus === 'success' ? 'var(--success)' : 'var(--danger)' }}>{feedbackMsg}</span>
              </div>
            )}
          </div>
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[10px] font-bold tracking-widest uppercase mb-2.5" style={{ color: 'var(--text-muted)' }}>{title}</h2>
      {children}
    </div>
  )
}

function Row({ icon: Icon, label, value, link }: { icon: any; label: string; value: string; link?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <Icon className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
        <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      </div>
      {link ? (
        <a href={link} target="_blank" rel="noreferrer" className="text-[11px] font-bold" style={{ color: 'var(--accent)' }}>{value}</a>
      ) : (
        <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>{value}</span>
      )}
    </div>
  )
}

function ToggleRow({ icon: Icon, label, checked, onChange }: { icon: any; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
        <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      </div>
      <button onClick={() => onChange(!checked)} className="w-9 h-5 rounded-full relative transition-colors"
        style={{ background: checked ? 'var(--accent)' : 'var(--bg-active)' }}>
        <div className="w-4 h-4 rounded-full absolute top-0.5 transition-all"
          style={{ background: checked ? '#fff' : 'var(--text-muted)', left: checked ? 18 : 2 }} />
      </button>
    </div>
  )
}

function SliderRow({ label, value, onChange, suffix }: { label: string; value: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span className="text-[11px] font-medium" style={{ color: 'var(--text-primary)' }}>{value}{suffix}</span>
      </div>
      <input type="range" min={50} max={100} value={value} onChange={e => onChange(parseInt(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ background: `linear-gradient(to right, var(--accent) ${value - 50}%, var(--bg-active) ${value - 50}%)` }} />
    </div>
  )
}

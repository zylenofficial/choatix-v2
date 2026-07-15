'use client'

import { useState, useCallback, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { verifyWithBackend, activateByKeyAndDiscord } from '@/lib/license'
import { Settings, Monitor, Info, ExternalLink, Key, CheckCircle, XCircle, User, Download, Upload, RefreshCw, Save, Shield, MessageSquare, Send, Loader2, Star, History, RotateCcw, Trash2, Zap } from 'lucide-react'
import type { UpdateInfo, FeedbackData } from '@/types'
import { LicenseTier } from '@/types'
import { availableTweaks } from '@/data/tweaks'
import { revertTweak } from '@/lib/tweaks'
import { useToast } from '@/components/Toast'

export function SettingsPage() {
  const { license, setLicense, discordId, setDiscordId, rollbackEntries, appliedTweaks, setAppliedTweaks, removeRollbackEntry, clearRollbackEntries } = useStore()
  const { addToast } = useToast()
  const [reverting, setReverting] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [statusMsg, setStatusMsg] = useState('')
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [exportStatus, setExportStatus] = useState<string | null>(null)
  const [importStatus, setImportStatus] = useState<string | null>(null)
  const [updateVersion, setUpdateVersion] = useState('')
  const [updateChanges, setUpdateChanges] = useState('')
  const [updateSending, setUpdateSending] = useState(false)
  const [updateSendStatus, setUpdateSendStatus] = useState<string | null>(null)
  const [feedbackType, setFeedbackType] = useState<FeedbackData['type']>('general')
  const [feedbackSubject, setFeedbackSubject] = useState('')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [feedbackEmail, setFeedbackEmail] = useState('')
  const [feedbackIncludeLogs, setFeedbackIncludeLogs] = useState(false)
  const [feedbackRating, setFeedbackRating] = useState(0)
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState('')
  const [licenseKey, setLicenseKey] = useState('')
  const [keyLoading, setKeyLoading] = useState(false)
  const [keyStatus, setKeyStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [keyStatusMsg, setKeyStatusMsg] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const ADMIN_IDS = ['1520176133461512324', '1322475983386837006']
    setIsAdmin(ADMIN_IDS.includes(discordId.trim()))
  }, [discordId])

  const handleRevertEntry = useCallback(async (entryId: string) => {
    const entry = rollbackEntries.find(e => e.id === entryId)
    if (!entry) return
    setReverting(entryId)
    const success = await revertTweak(entry)
    if (success) {
      setAppliedTweaks(appliedTweaks.filter(id => id !== entry.tweakId))
      removeRollbackEntry(entryId)
      addToast(`${availableTweaks.find(t => t.id === entry.tweakId)?.name || entry.tweakId} reverted`, 'success')
    } else {
      addToast('Failed to revert', 'error')
    }
    setReverting(null)
  }, [rollbackEntries, appliedTweaks, setAppliedTweaks, removeRollbackEntry, addToast])

  const handleClearAll = useCallback(async () => {
    if (window.electronAPI) await window.electronAPI.restoreAll()
    setAppliedTweaks([])
    clearRollbackEntries()
    addToast('All tweaks reverted', 'success')
  }, [setAppliedTweaks, clearRollbackEntries, addToast])

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
    setLicense({ tier: LicenseTier.FREE, key: null, activated: false, expiryDate: null })
    setStatus('idle'); setStatusMsg('')
  }, [setLicense])

  const handleActivateKey = useCallback(async () => {
    if (!licenseKey.trim()) { setKeyStatus('error'); setKeyStatusMsg('Enter a license key'); return }
    const did = discordId.trim() || 'in-app'
    setKeyLoading(true); setKeyStatus('idle')
    const result = await activateByKeyAndDiscord(licenseKey.trim(), did)
    setKeyLoading(false)
    if (!result.valid) { setKeyStatus('error'); setKeyStatusMsg(result.error!); return }
    setLicense({ tier: result.tier!, key: licenseKey.trim().toUpperCase(), activated: true, expiryDate: null })
    setKeyStatus('success'); setKeyStatusMsg(`Activated ${result.tier} plan!`)
    setLicenseKey('')
  }, [licenseKey, discordId, setLicense])

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

  const handleSendUpdate = useCallback(async () => {
    if (!window.electronAPI || !updateVersion.trim()) return
    setUpdateSending(true); setUpdateSendStatus(null)
    const changes = updateChanges.split('\n').filter(l => l.trim()).map(l => l.trim())
    const res = await window.electronAPI.sendUpdateNotification({ version: updateVersion.trim(), changes })
    setUpdateSending(false)
    if (res.success) {
      setUpdateSendStatus('Update posted to Discord!')
      setUpdateVersion(''); setUpdateChanges('')
    } else {
      setUpdateSendStatus(res.error || 'Failed to send')
    }
    setTimeout(() => setUpdateSendStatus(null), 4000)
  }, [updateVersion, updateChanges])

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
  }, [feedbackType, feedbackSubject, feedbackMessage, feedbackEmail, feedbackIncludeLogs, feedbackRating, discordId])

  const tierColor = license.tier === 'PREMIUM' ? 'var(--success)' : license.tier === 'PRO' ? 'var(--info)' : 'rgba(255,255,255,0.5)'

  return (
    <div className="h-full overflow-y-auto page-transition" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-3xl mx-auto p-6 space-y-8">

        {/* Header */}
        <div className="flex items-center gap-4 reveal-up reveal-up-1">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center gradient-border" style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}>
            <Settings className="w-5 h-5" style={{ color: '#fff' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Settings</h1>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Account, preferences, and feedback</p>
          </div>
        </div>

        {/* ─── ACCOUNT ─── */}
        <div className="reveal-up reveal-up-2">
          <SectionHeader title="Account" />
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(15,15,15,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>

            {/* Plan Banner */}
            <div className="p-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))' }}>
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none" style={{
                background: `radial-gradient(circle, ${tierColor}10 0%, transparent 70%)`,
              }} />
              <div className="flex items-center justify-between relative" style={{ zIndex: 1 }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{
                    background: `${tierColor}12`,
                    border: `1px solid ${tierColor}20`,
                    boxShadow: `0 0 20px ${tierColor}08`,
                  }}>
                    <Zap className="w-5 h-5" style={{ color: tierColor }} />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.15em] font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>Current Plan</div>
                    <div className="text-xl font-bold text-white mt-0.5">{license.tier}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: tierColor, boxShadow: `0 0 8px ${tierColor}` }} />
                  <span className="text-[11px] font-semibold" style={{ color: tierColor }}>{license.activated ? 'Active' : 'Free'}</span>
                </div>
              </div>
            </div>

            <div className="glow-divider" />

            {/* Active Key */}
            {license.activated && (
              <>
                <div className="p-4 mx-4 mt-4 rounded-xl flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-2.5">
                    <Key className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
                    <span className="text-[11px] font-mono tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>{license.key || 'Discord Verified'}</span>
                  </div>
                  <button onClick={handleDeactivate} className="text-[10px] font-semibold px-3 py-1.5 rounded-lg transition-all btn-press" style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    Deactivate
                  </button>
                </div>
                <div className="glow-divider mx-4 my-3" />
              </>
            )}

            {/* Discord Verify */}
            <div className="p-4">
              <div className="p-4 rounded-xl" style={{ background: 'rgba(88,101,242,0.05)', border: '1px solid rgba(88,101,242,0.1)' }}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(88,101,242,0.12)' }}>
                    <User className="w-3.5 h-3.5" style={{ color: '#7289da' }} />
                  </div>
                  <div className="text-[11px] uppercase tracking-[0.12em] font-bold" style={{ color: '#7289da' }}>Verify with Discord</div>
                </div>
                <div className="flex gap-2">
                  <input type="text" placeholder="Your Discord ID (numbers only)" value={discordId} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); setDiscordId(v); setStatus('idle') }}
                    className="flex-1 px-4 py-2.5 rounded-xl text-xs outline-none transition-all duration-150 focus:border-[rgba(114,137,218,0.4)]"
                    style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.06)' }} />
                  <button onClick={handleVerifyDiscord} disabled={loading || discordId.trim().length < 17}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 btn-primary btn-press disabled:opacity-50">
                    <User className="w-3 h-3" />{loading ? '...' : 'Lookup'}
                  </button>
                </div>
                {discordId.trim().length > 0 && discordId.trim().length < 17 && (
                  <p className="text-[10px] mt-1.5" style={{ color: '#ED4245' }}>ID must be 17-20 digits (e.g. 1520176133461512324)</p>
                )}
                {discordId.trim().length >= 17 && (
                  <p className="text-[10px] mt-1.5" style={{ color: 'rgba(87,242,135,0.7)' }}>Valid format — mention will work in feedback</p>
                )}
                {discordId.trim().length === 0 && (
                  <p className="text-[10px] mt-2" style={{ color: 'rgba(114,137,218,0.5)' }}>Already redeemed in Discord? Enter your Discord ID above.</p>
                )}
              </div>
            </div>

            <div className="glow-divider mx-4" />

            {/* Key Activation */}
            <div className="p-4">
              <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <Key className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.4)' }} />
                  </div>
                  <div className="text-[11px] uppercase tracking-[0.12em] font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>Activate with Key</div>
                </div>
                <div className="flex gap-2">
                  <input type="text" placeholder="CHTX-XXXX-XXXX-XXXX" value={licenseKey} onChange={(e) => { setLicenseKey(e.target.value.toUpperCase()); setKeyStatus('idle') }}
                    className="flex-1 px-4 py-2.5 rounded-xl text-xs font-mono tracking-wider outline-none transition-all duration-150 focus:border-[rgba(255,255,255,0.2)]"
                    style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.06)' }} />
                  <button onClick={handleActivateKey} disabled={keyLoading}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 btn-primary btn-press disabled:opacity-50">
                    <Key className="w-3 h-3" />{keyLoading ? '...' : 'Activate'}
                  </button>
                </div>
                <p className="text-[10px] mt-2" style={{ color: 'rgba(255,255,255,0.2)' }}>Got a license key? Enter it above to activate directly.</p>
              </div>
            </div>

            {/* Status Messages */}
            {(status !== 'idle' || keyStatus !== 'idle') && (
              <div className="px-4 pb-4 space-y-2">
                {keyStatus !== 'idle' && (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: keyStatus === 'success' ? 'rgba(74,222,128,0.06)' : 'rgba(248,113,113,0.06)', border: `1px solid ${keyStatus === 'success' ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)'}` }}>
                    {keyStatus === 'success' ? <CheckCircle className="w-3.5 h-3.5" style={{ color: '#4ade80' }} /> : <XCircle className="w-3.5 h-3.5" style={{ color: '#f87171' }} />}
                    <span className="text-[11px] font-medium" style={{ color: keyStatus === 'success' ? '#4ade80' : '#f87171' }}>{keyStatusMsg}</span>
                  </div>
                )}
                {status !== 'idle' && (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: status === 'success' ? 'rgba(74,222,128,0.06)' : 'rgba(248,113,113,0.06)', border: `1px solid ${status === 'success' ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)'}` }}>
                    {status === 'success' ? <CheckCircle className="w-3.5 h-3.5" style={{ color: '#4ade80' }} /> : <XCircle className="w-3.5 h-3.5" style={{ color: '#f87171' }} />}
                    <span className="text-[11px] font-medium" style={{ color: status === 'success' ? '#4ade80' : '#f87171' }}>{statusMsg}</span>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="px-4 pb-4">
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                Join the <a href="https://discord.gg/Y92hMwVaUc" target="_blank" rel="noreferrer" className="font-bold text-white hover:underline">CHOATIX Discord</a> to purchase a key.
              </p>
            </div>
          </div>
        </div>

        {/* ─── ROLLBACK ─── */}
        <div className="reveal-up reveal-up-3">
          <SectionHeader title="Rollback" count={rollbackEntries.length} />
          {rollbackEntries.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(15,15,15,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <History className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.15)' }} />
              </div>
              <p className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>No applied tweaks to revert</p>
              <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.12)' }}>Applied tweaks will appear here</p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(15,15,15,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>{rollbackEntries.length} applied</span>
                <button onClick={handleClearAll} className="text-[10px] font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all btn-press"
                  style={{ color: '#f87171', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.1)' }}>
                  <Trash2 className="w-3 h-3" /> Revert All
                </button>
              </div>
              <div className="p-2 space-y-1">
                {rollbackEntries.map(entry => {
                  const tweak = availableTweaks.find(t => t.id === entry.tweakId)
                  return (
                    <div key={entry.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 hover:bg-[rgba(255,255,255,0.02)]">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(74,222,128,0.08)' }}>
                        <CheckCircle className="w-3 h-3" style={{ color: '#4ade80' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold text-white truncate">{tweak?.name || entry.tweakId}</div>
                        <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>{entry.timestamp.toLocaleString()}</div>
                      </div>
                      <button onClick={() => handleRevertEntry(entry.id)} disabled={reverting === entry.id}
                        className="h-7 px-3 rounded-lg text-[10px] font-bold flex items-center gap-1.5 shrink-0 transition-all btn-press"
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {reverting === entry.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <RotateCcw className="w-2.5 h-2.5" />}
                        Revert
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* ─── UPDATES ─── */}
        <div className="reveal-up reveal-up-4">
          <SectionHeader title="Updates" />
          <div className="rounded-2xl p-5" style={{ background: 'rgba(15,15,15,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <RefreshCw className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
                </div>
                <div>
                  <div className="text-[12px] font-semibold text-white">Check for Updates</div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>Current: v{updateInfo?.currentVersion || '2.0.0'}</div>
                </div>
              </div>
              <button onClick={handleCheckUpdate} disabled={checkingUpdate}
                className="h-9 px-5 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 disabled:opacity-50 btn-press ripple"
                style={{ background: '#fff', color: '#000', boxShadow: '0 2px 8px rgba(255,255,255,0.1)' }}>
                {checkingUpdate ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                {checkingUpdate ? 'Checking...' : 'Check'}
              </button>
            </div>
            {updateInfo && updateInfo.updateAvailable && (
              <div className="flex items-center gap-3 p-3.5 rounded-xl mt-4" style={{ background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.1)' }}>
                <CheckCircle className="w-4 h-4" style={{ color: '#4ade80' }} />
                <span className="text-[11px] font-medium text-white flex-1">v{updateInfo.latestVersion} available</span>
                {updateInfo.downloadUrl && (
                  <a href={updateInfo.downloadUrl} target="_blank" rel="noreferrer" className="text-[10px] font-bold px-3 py-1.5 rounded-lg" style={{ color: '#4ade80', background: 'rgba(74,222,128,0.08)' }}>Download</a>
                )}
              </div>
            )}
            {updateInfo && !updateInfo.updateAvailable && (
              <div className="flex items-center gap-3 p-3.5 rounded-xl mt-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <CheckCircle className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>You are up to date</span>
              </div>
            )}

            {/* Send Update Notification - Admin Only */}
            {isAdmin && (
              <>
            <div className="glow-divider mt-4" />
            <div className="mt-4">
              <div className="flex items-center gap-2.5 mb-3">
                <Send className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
                <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>Post Update to Discord</span>
              </div>
              <div className="space-y-2.5">
                <input type="text" placeholder="Version (e.g. 2.1.0)" value={updateVersion}
                  onChange={(e) => setUpdateVersion(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-xs outline-none transition-all duration-150 focus:border-[rgba(255,255,255,0.2)]"
                  style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.06)' }} />
                <textarea placeholder={"One change per line:\nAdded Fan Control\nAdded Notification System\nImproved performance"} value={updateChanges}
                  onChange={(e) => setUpdateChanges(e.target.value)} rows={4}
                  className="w-full px-4 py-2.5 rounded-xl text-xs outline-none resize-none transition-all duration-150 focus:border-[rgba(255,255,255,0.2)]"
                  style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.06)', lineHeight: '1.6' }} />
                <button onClick={handleSendUpdate} disabled={!updateVersion.trim() || updateSending}
                  className="h-9 px-5 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 btn-press disabled:opacity-40"
                  style={{ background: '#5865F2', color: '#fff' }}>
                  {updateSending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  {updateSending ? 'Sending...' : 'Send to Discord'}
                </button>
                {updateSendStatus && (
                  <p className="text-[10px]" style={{ color: updateSendStatus.includes('success') ? '#4ade80' : '#f87171' }}>{updateSendStatus}</p>
                )}
              </div>
            </div>
            </>
            )}
          </div>
        </div>

        {/* ─── DATA ─── */}
        <div className="reveal-up reveal-up-4">
          <SectionHeader title="Data" />
          <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(15,15,15,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <Save className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
                </div>
                <div>
                  <div className="text-[12px] font-semibold text-white">Export Settings</div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>Save settings to a JSON file</div>
                </div>
              </div>
              <button onClick={handleExport} className="h-9 px-4 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 btn-press"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Download className="w-3 h-3" />Export
              </button>
            </div>
            {exportStatus && <span className="text-[10px]" style={{ color: exportStatus.includes('success') ? '#4ade80' : '#f87171' }}>{exportStatus}</span>}

            <div className="glow-divider" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <Upload className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
                </div>
                <div>
                  <div className="text-[12px] font-semibold text-white">Import Settings</div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>Load settings from a JSON file</div>
                </div>
              </div>
              <button onClick={handleImport} className="h-9 px-4 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 btn-press"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Upload className="w-3 h-3" />Import
              </button>
            </div>
            {importStatus && <span className="text-[10px]" style={{ color: importStatus.includes('success') ? '#4ade80' : '#f87171' }}>{importStatus}</span>}
          </div>
        </div>

        {/* ─── ABOUT ─── */}
        <div className="reveal-up reveal-up-4">
          <SectionHeader title="About" />
          <div className="rounded-2xl p-5" style={{ background: 'rgba(15,15,15,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="space-y-0">
              {[
                { icon: Monitor, label: 'Version', value: '2.0.0' },
                { icon: Info, label: 'Build', value: 'Production' },
                { icon: ExternalLink, label: 'Support', value: 'Discord', link: 'https://discord.gg/Y92hMwVaUc' },
                { icon: Shield, label: 'Crash Reporting', value: 'Discord Webhook' },
              ].map((row, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <row.icon className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.2)' }} />
                      <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{row.label}</span>
                    </div>
                    {row.link ? (
                      <a href={row.link} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-white hover:underline">{row.value}</a>
                    ) : (
                      <span className="text-[11px] font-medium text-white">{row.value}</span>
                    )}
                  </div>
                  {i < 3 && <div className="glow-divider" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── FEEDBACK ─── */}
        <div className="reveal-up reveal-up-5">
          <SectionHeader title="Feedback" />
          <div className="rounded-2xl p-5 space-y-5" style={{ background: 'rgba(15,15,15,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <MessageSquare className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
              </div>
              <div>
                <div className="text-[12px] font-semibold text-white">Send Feedback</div>
                <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>Report bugs, suggest features, or share thoughts</div>
              </div>
            </div>

            {/* Type selector */}
            <div>
              <label className="text-[10px] uppercase tracking-[0.15em] font-bold mb-2.5 block" style={{ color: 'rgba(255,255,255,0.25)' }}>Type</label>
              <div className="grid grid-cols-3 gap-2.5">
                {([
                  { id: 'bug' as const, icon: '🐛', label: 'Bug Report', desc: 'Something broke' },
                  { id: 'feature' as const, icon: '💡', label: 'Feature', desc: 'Suggest improvement' },
                  { id: 'general' as const, icon: '💬', label: 'General', desc: 'Questions, thoughts' },
                ]).map(t => (
                  <button key={t.id} onClick={() => setFeedbackType(t.id)}
                    className="p-3 rounded-xl text-left transition-all duration-150 btn-press"
                    style={{
                      background: feedbackType === t.id ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${feedbackType === t.id ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)'}`,
                    }}>
                    <div className="text-lg mb-1">{t.icon}</div>
                    <div className="text-[11px] font-bold text-white">{t.label}</div>
                    <div className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="text-[10px] uppercase tracking-[0.15em] font-bold mb-2.5 block" style={{ color: 'rgba(255,255,255,0.25)' }}>Rating</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} type="button"
                    onClick={() => setFeedbackRating(feedbackRating === star ? 0 : star)}
                    onMouseEnter={() => setFeedbackRating(star)}
                    onMouseLeave={() => setFeedbackRating(feedbackRating)}
                    className="p-1 transition-all duration-150 hover:scale-125 btn-press"
                    aria-label={`${star} star${star > 1 ? 's' : ''}`}>
                    <Star className="w-7 h-7" style={{
                      color: star <= feedbackRating ? '#fff' : 'rgba(255,255,255,0.1)',
                      fill: star <= feedbackRating ? '#fff' : 'none',
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
              <label className="text-[10px] uppercase tracking-[0.15em] font-bold mb-2.5 block" style={{ color: 'rgba(255,255,255,0.25)' }}>Subject</label>
              <input type="text" placeholder="Brief summary" value={feedbackSubject}
                onChange={(e) => setFeedbackSubject(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-xs outline-none transition-all duration-150 focus:border-[rgba(255,255,255,0.2)]"
                style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.06)' }} />
            </div>

            {/* Message */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-[10px] uppercase tracking-[0.15em] font-bold" style={{ color: 'rgba(255,255,255,0.25)' }}>Message</label>
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.15)' }}>{feedbackMessage.length}/2000</span>
              </div>
              <textarea placeholder="Describe your feedback in detail..." value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)} rows={5}
                className="w-full px-4 py-3 rounded-xl text-xs outline-none resize-none transition-all duration-150 focus:border-[rgba(255,255,255,0.2)]"
                style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.06)', lineHeight: '1.7' }} />
            </div>

            {/* Include logs */}
            <div className="flex items-center gap-3 p-3.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <input type="checkbox" checked={feedbackIncludeLogs}
                onChange={(e) => setFeedbackIncludeLogs(e.target.checked)}
                className="w-4 h-4 accent-white cursor-pointer" />
              <div>
                <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Include system logs</span>
                <span className="text-[10px] ml-2" style={{ color: 'rgba(255,255,255,0.2)' }}>Helps with debugging</span>
              </div>
            </div>

            {/* Submit */}
            <button onClick={handleSendFeedback} disabled={feedbackLoading || !feedbackSubject.trim() || !feedbackMessage.trim()}
              className="w-full py-3.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 btn-primary btn-press disabled:opacity-40 disabled:cursor-not-allowed">
              {feedbackLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
              ) : (
                <><Send className="w-4 h-4" /> Send Feedback</>
              )}
            </button>

            {/* Status */}
            {feedbackStatus !== 'idle' && (
              <div className="flex items-center gap-3 p-3.5 rounded-xl"
                style={{ background: feedbackStatus === 'success' ? 'rgba(74,222,128,0.05)' : 'rgba(248,113,113,0.05)', border: `1px solid ${feedbackStatus === 'success' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)'}` }}>
                {feedbackStatus === 'success' ? <CheckCircle className="w-4 h-4" style={{ color: '#4ade80' }} /> : <XCircle className="w-4 h-4" style={{ color: '#f87171' }} />}
                <span className="text-[11px] font-medium" style={{ color: feedbackStatus === 'success' ? '#4ade80' : '#f87171' }}>{feedbackMsg}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: 'rgba(255,255,255,0.2)' }}>{title}</h2>
      {count !== undefined && count > 0 && (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>{count}</span>
      )}
    </div>
  )
}

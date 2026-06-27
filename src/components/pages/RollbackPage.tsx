'use client'

import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { availableTweaks } from '@/data/tweaks'
import { revertTweak } from '@/lib/tweaks'
import { useToast } from '@/components/Toast'
import { History, RotateCcw, Clock, Trash2, CheckCircle2, Loader2 } from 'lucide-react'

export function RollbackPage() {
  const { rollbackEntries, appliedTweaks, setAppliedTweaks, removeRollbackEntry, clearRollbackEntries } = useStore()
  const { addToast } = useToast()

  const [reverting, setReverting] = useState<string | null>(null)

  const handleRevert = async (entryId: string) => {
    const entry = rollbackEntries.find(e => e.id === entryId)
    if (!entry) return
    setReverting(entryId)
    const success = await revertTweak(entry)
    if (success) {
      setAppliedTweaks(appliedTweaks.filter(id => id !== entry.tweakId))
      removeRollbackEntry(entryId)
      addToast(`${availableTweaks.find(t => t.id === entry.tweakId)?.name || entry.tweakId} reverted`, 'success')
    } else {
      addToast(`Failed to revert`, 'error')
    }
    setReverting(null)
  }

  const handleClearAll = async () => {
    if (window.electronAPI) {
      await window.electronAPI.restoreAll()
    }
    setAppliedTweaks([])
    clearRollbackEntries()
    addToast('All tweaks reverted', 'success')
  }

  return (
    <div className="p-5 lg:p-6 space-y-5 fade-in overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Rollback</h1>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Revert any applied optimizations</p>
        </div>
        {rollbackEntries.length > 0 && (
          <button
            onClick={handleClearAll}
            className="h-9 px-4 rounded-lg text-[11px] font-semibold flex items-center gap-1.5"
            style={{ background: 'var(--danger-dim)', color: 'var(--danger)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <Trash2 className="w-3.5 h-3.5" />Clear All
          </button>
        )}
      </div>

      {rollbackEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)' }}>
            <History className="w-7 h-7" style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="text-[13px] font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>No rollback entries</p>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Applied optimizations will appear here</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <div className="card-widget px-4 py-2 flex items-center gap-2">
              <div className="live-dot" />
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>{rollbackEntries.length} applied</span>
            </div>
          </div>
          <div className="space-y-2 stagger">
            {rollbackEntries.map(entry => {
              const tweak = availableTweaks.find(t => t.id === entry.tweakId)
              return (
                <div key={entry.id} className="card-widget px-4 py-3.5 flex items-center gap-4 card-glow">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--success-dim)', border: '1px solid rgba(255,255,255,0.10)' }}>
                    <CheckCircle2 className="w-4.5 h-4.5" style={{ color: 'var(--success)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{tweak?.name || entry.tweakId}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{entry.timestamp.toLocaleString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevert(entry.id)}
                    disabled={reverting === entry.id}
                    className="h-9 px-4 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
                    onMouseEnter={e => { if (reverting !== entry.id) { e.currentTarget.style.borderColor = 'var(--danger)'; e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'var(--danger-dim)' } }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-elevated)' }}
                  >
                    {reverting === entry.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                    {reverting === entry.id ? 'Reverting...' : 'Revert'}
                  </button>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

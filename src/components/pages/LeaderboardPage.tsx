'use client'

import { useState, useCallback, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import {
  Trophy, Zap, Shield, Crown, Loader2, TrendingUp, Medal,
  ChevronDown, Globe, Cpu, RefreshCw,
} from 'lucide-react'

interface LeaderboardEntry {
  id?: number
  rank: number
  nickname: string
  cpu_model: string
  gpu_model: string
  ram_gb: number
  overall_score: number
  cpu_score: number
  ram_score: number
  disk_score: number
  gpu_score: number
  created_at: string
}

function hashCode(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

export function LeaderboardPage() {
  const { license, discordId } = useStore()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [userEntries, setUserEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [benchmarking, setBenchmarking] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [benchmarkResult, setBenchmarkResult] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'global' | 'mine'>('global')

  const fetchLeaderboard = useCallback(async () => {
    if (!window.electronAPI) return
    setLoading(true)
    try {
      const result = await window.electronAPI.getLeaderboard()
      setEntries(result.entries || [])
    } catch {}
    setLoading(false)
  }, [])

  const fetchUserRank = useCallback(async () => {
    if (!window.electronAPI || !discordId) return
    try {
      const result = await window.electronAPI.getUserRank(discordId)
      setUserEntries(result.entries || [])
    } catch {}
  }, [discordId])

  useEffect(() => {
    fetchLeaderboard()
    fetchUserRank()
  }, [fetchLeaderboard, fetchUserRank])

  const handleRunBenchmark = useCallback(async () => {
    if (!window.electronAPI) return
    setBenchmarking(true)
    setBenchmarkResult(null)
    try {
      const result = await window.electronAPI.runBenchmark()
      setBenchmarkResult(result)
    } catch {}
    setBenchmarking(false)
  }, [])

  const handleSubmitScore = useCallback(async () => {
    if (!window.electronAPI || !benchmarkResult) return
    setSubmitting(true)
    try {
      const hwString = `${benchmarkResult.cpuModel || ''}-${benchmarkResult.gpuModel || ''}-${benchmarkResult.ramTotal || 0}`
      const hwHash = hashCode(hwString)
      await window.electronAPI.submitBenchmark({
        discord_id: discordId || 'anonymous',
        nickname: discordId || 'Anonymous',
        hardware_hash: hwHash,
        cpu_model: benchmarkResult.cpuModel || '',
        gpu_model: benchmarkResult.gpuModel || '',
        ram_gb: benchmarkResult.ramTotal || 0,
        cpu_score: benchmarkResult.cpuScore || 0,
        ram_score: benchmarkResult.ramScore || 0,
        disk_score: benchmarkResult.diskScore || 0,
        gpu_score: benchmarkResult.gpuScore || 0,
        overall_score: benchmarkResult.overallScore || 0,
      })
      fetchLeaderboard()
      fetchUserRank()
      setBenchmarkResult(null)
    } catch {}
    setSubmitting(false)
  }, [benchmarkResult, discordId, fetchLeaderboard, fetchUserRank])

  const getMedalColor = (rank: number) => {
    if (rank === 1) return '#fbbf24'
    if (rank === 2) return '#94a3b8'
    if (rank === 3) return '#cd7f32'
    return 'rgba(255,255,255,0.3)'
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4ade80'
    if (score >= 60) return '#60a5fa'
    if (score >= 40) return '#fbbf24'
    return '#f87171'
  }

  return (
    <div className="h-full overflow-y-auto page-transition" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-5xl mx-auto px-6 py-5 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between fade-in">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', boxShadow: '0 2px 12px rgba(251,191,36,0.2)' }}>
              <Trophy className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Leaderboard</h1>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Benchmark your PC and compete worldwide</p>
            </div>
          </div>
        </div>

        {/* Benchmark Section */}
        <div className="rounded-2xl p-5 fade-in" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <Zap className="w-4 h-4" style={{ color: '#fbbf24' }} />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Run Benchmark</div>
                <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Test CPU, RAM, Disk & GPU performance</div>
              </div>
            </div>
            <button onClick={handleRunBenchmark} disabled={benchmarking}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all duration-200 hover:scale-105 disabled:opacity-50"
              style={{ background: '#fbbf24', color: '#000', boxShadow: '0 2px 12px rgba(255,191,36,0.2)' }}>
              {benchmarking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              {benchmarking ? 'Running...' : 'Start Benchmark'}
            </button>
          </div>

          {/* Benchmark Result */}
          {benchmarkResult && (
            <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-white">Your Score</div>
                <div className="text-2xl font-black" style={{ color: getScoreColor(benchmarkResult.overallScore || 0) }}>
                  {benchmarkResult.overallScore || 0}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'CPU', score: benchmarkResult.cpuScore, icon: Cpu },
                  { label: 'RAM', score: benchmarkResult.ramScore, icon: Zap },
                  { label: 'Disk', score: benchmarkResult.diskScore, icon: TrendingUp },
                  { label: 'GPU', score: benchmarkResult.gpuScore, icon: Shield },
                ].map(s => (
                  <div key={s.label} className="text-center p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <s.icon className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: getScoreColor(s.score || 0) }} />
                    <div className="text-[10px] font-bold" style={{ color: getScoreColor(s.score || 0) }}>{s.score || 0}</div>
                    <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <button onClick={handleSubmitScore} disabled={submitting}
                className="w-full py-2.5 rounded-xl text-[11px] font-bold transition-all duration-200 hover:bg-white/10 disabled:opacity-50"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}>
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-2" /> : null}
                {submitting ? 'Submitting...' : 'Submit to Leaderboard'}
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl fade-in" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
          {([['global', 'Global', Globe], ['mine', 'My Scores', Medal]] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[11px] font-bold transition-all duration-200"
              style={{
                background: activeTab === id ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: activeTab === id ? '#fff' : 'rgba(255,255,255,0.35)',
              }}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Leaderboard Table */}
        {activeTab === 'global' && (
          <div className="fade-in">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'rgba(255,255,255,0.3)' }} />
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-12 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <Trophy className="w-8 h-8 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
                <div className="text-sm font-bold text-white mb-1">No scores yet</div>
                <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Be the first to run a benchmark!</div>
              </div>
            ) : (
              <div className="space-y-1.5">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  <div className="col-span-1">#</div>
                  <div className="col-span-3">Player</div>
                  <div className="col-span-3">Hardware</div>
                  <div className="col-span-1 text-center">CPU</div>
                  <div className="col-span-1 text-center">RAM</div>
                  <div className="col-span-1 text-center">GPU</div>
                  <div className="col-span-2 text-right">Score</div>
                </div>
                {/* Rows */}
                {entries.map((entry, i) => (
                  <div key={entry.id || i} className="grid grid-cols-12 gap-2 px-4 py-3 rounded-xl items-center transition-all duration-200 hover:bg-white/[0.02]"
                    style={{
                      background: i < 3 ? `rgba(255,255,255,0.02)` : 'transparent',
                      border: i < 3 ? '1px solid rgba(255,255,255,0.04)' : '1px solid transparent',
                    }}>
                    <div className="col-span-1">
                      <span className="text-xs font-black" style={{ color: getMedalColor(entry.rank || i + 1) }}>
                        {entry.rank || i + 1}
                      </span>
                    </div>
                    <div className="col-span-3">
                      <div className="text-[11px] font-bold text-white truncate">{entry.nickname || 'Anonymous'}</div>
                      <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        {entry.ram_gb}GB RAM
                      </div>
                    </div>
                    <div className="col-span-3">
                      <div className="text-[10px] text-white/60 truncate">{entry.cpu_model || 'Unknown CPU'}</div>
                      <div className="text-[9px] truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{entry.gpu_model || 'Unknown GPU'}</div>
                    </div>
                    <div className="col-span-1 text-center">
                      <span className="text-[11px] font-bold" style={{ color: getScoreColor(entry.cpu_score) }}>{Math.round(entry.cpu_score)}</span>
                    </div>
                    <div className="col-span-1 text-center">
                      <span className="text-[11px] font-bold" style={{ color: getScoreColor(entry.ram_score) }}>{Math.round(entry.ram_score)}</span>
                    </div>
                    <div className="col-span-1 text-center">
                      <span className="text-[11px] font-bold" style={{ color: getScoreColor(entry.gpu_score) }}>{Math.round(entry.gpu_score)}</span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-sm font-black" style={{ color: getScoreColor(entry.overall_score) }}>
                        {Math.round(entry.overall_score)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Scores */}
        {activeTab === 'mine' && (
          <div className="fade-in">
            {!discordId ? (
              <div className="text-center py-12 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <Medal className="w-8 h-8 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
                <div className="text-sm font-bold text-white mb-1">No Discord ID linked</div>
                <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Link your Discord in Settings to track your scores</div>
              </div>
            ) : userEntries.length === 0 ? (
              <div className="text-center py-12 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <Medal className="w-8 h-8 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
                <div className="text-sm font-bold text-white mb-1">No scores yet</div>
                <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Run a benchmark and submit your score</div>
              </div>
            ) : (
              <div className="space-y-2">
                {userEntries.map((entry, i) => (
                  <div key={entry.id || i} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-lg font-black" style={{ color: getMedalColor(entry.rank || i + 1) }}>
                      #{entry.rank || i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white">{entry.cpu_model}</div>
                      <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{entry.gpu_model} · {entry.ram_gb}GB</div>
                    </div>
                    <div className="text-xl font-black" style={{ color: getScoreColor(entry.overall_score) }}>
                      {Math.round(entry.overall_score)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

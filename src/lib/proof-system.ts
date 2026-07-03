import { execSync, spawn } from 'child_process'
import { ProofResult, ProofEntry } from '@/types'

export interface BenchmarkOptions {
  duration?: number
  game?: string
  includeFps?: boolean
  includeLatency?: boolean
  includeStorage?: boolean
}

export class ProofSystem {
  private results: ProofResult[] = []
  private currentBenchmark: { start: number; samples: any[] } | null = null

  async runBenchmark(options: BenchmarkOptions = {}): Promise<ProofResult> {
    const duration = options.duration || 30000
    const samples: any[] = []
    const startTime = Date.now()

    console.log(`[Proof] Starting ${duration/1000}s benchmark...`)

    return new Promise((resolve) => {
      const interval = setInterval(() => {
        this.captureSample().then(sample => {
          samples.push(sample)
        }).catch(() => {})
      }, 1000)

      setTimeout(() => {
        clearInterval(interval)
        const result = this.processResults(samples, options)
        this.results.push(result)
        resolve(result)
      }, duration)
    })
  }

  private async captureSample(): Promise<any> {
    const [cpu, gpu, ram, disk] = await Promise.all([
      this.getCpuUsage(),
      this.getGpuUsage(),
      this.getRamUsage(),
      this.getDiskActivity()
    ])

    return { timestamp: Date.now(), cpu, gpu, ram, disk }
  }

  private async getCpuUsage(): Promise<{ usage: number; clock: number }> {
    try {
      const out = execSync('powershell -NoProfile -Command "$c=Get-CimInstance Win32_Processor|Select-Object -First 1; $l=Get-Counter \\"Processor(_Total)\\% Processor Time\\" -SampleInterval 1 -MaxSamples 1; Write-Output ($c.LoadPercentage+\"|\"+[math]::Round($l.CounterSamples[0].CookedValue))"', { encoding: 'utf-8', timeout: 3000, windowsHide: true })
      const [usage, clock] = out.toString().trim().split('|').map(Number)
      return { usage: usage || 0, clock: clock || 0 }
    } catch { return { usage: 0, clock: 0 } }
  }

  private async getGpuUsage(): Promise<{ usage: number; vram: number; temp: number }> {
    try {
      const out = execSync('powershell -NoProfile -Command "nvidia-smi --query-gpu=utilization.gpu,memory.used,temperature.gpu --format=csv,noheader,nounits 2>$null"', { encoding: 'utf-8', timeout: 3000, windowsHide: true })
      const [usage, vram, temp] = out.toString().trim().split(',').map(Number)
      return { usage: usage || 0, vram: vram || 0, temp: temp || 0 }
    } catch { return { usage: 0, vram: 0, temp: 0 } }
  }

  private async getRamUsage(): Promise<{ used: number; total: number; percent: number }> {
    try {
      const out = execSync('powershell -NoProfile -Command "$os=Get-CimInstance Win32_OperatingSystem; [math]::Round($os.TotalVisibleMemorySize/1MB,2).ToString()+\"|\"+[math]::Round(($os.TotalVisibleMemorySize-$os.FreePhysicalMemory)/1MB,2).ToString()"', { encoding: 'utf-8', timeout: 3000, windowsHide: true })
      const [total, used] = out.toString().trim().split('|').map(Number)
      return { used: used || 0, total: total || 0, percent: total > 0 ? Math.round((used/total)*100) : 0 }
    } catch { return { used: 0, total: 0, percent: 0 } }
  }

  private async getDiskActivity(): Promise<{ read: number; write: number }> {
    try {
      const out = execSync('powershell -NoProfile -Command "Get-Counter \\"PhysicalDisk(_Total)\\Disk Read Bytes/sec\\",\\"PhysicalDisk(_Total)\\Disk Write Bytes/sec\\" -SampleInterval 1 -MaxSamples 1 | Select-Object -ExpandProperty CounterSamples | ForEach-Object { $_.CookedValue }"', { encoding: 'utf-8', timeout: 3000, windowsHide: true })
      const [read, write] = out.toString().trim().split('\r\n').map(Number)
      return { read: read || 0, write: write || 0 }
    } catch { return { read: 0, write: 0 } }
  }

  private processResults(samples: any[], options: BenchmarkOptions): ProofResult {
    if (samples.length === 0) throw new Error('No samples collected')

    const cpuVals = samples.map(s => s.cpu.usage)
    const gpuVals = samples.map(s => s.gpu.usage)
    const ramVals = samples.map(s => s.ram.percent)

    const getStats = (vals: number[]) => ({
      avg: Math.round(vals.reduce((a,b) => a+b, 0) / vals.length * 10) / 10,
      max: Math.max(...vals),
      min: Math.min(...vals)
    })

    const systemInfo = this.getSystemInfo()

    return {
      timestamp: Date.now(),
      tweaksApplied: this.getAppliedTweaks(),
      metrics: {
        cpu: getStats(cpuVals),
        gpu: getStats(gpuVals),
        ram: getStats(ramVals),
        storage: {
          read: Math.round(samples.reduce((a,s) => a + (s.disk?.read||0), 0) / samples.length / 1024 / 1024 * 10) / 10,
          write: Math.round(samples.reduce((a,s) => a + (s.disk?.write||0), 0) / samples.length / 1024 / 1024 * 10) / 10
        }
      },
      systemInfo,
      notes: `Benchmark duration: ${samples.length}s. Tweaks active: ${this.getAppliedTweaks().length}. No artificial FPS injection.`
    }
  }

  private getSystemInfo(): ProofResult['systemInfo'] {
    try {
      const [cpu, gpu, ram, os, driver] = [
        execSync('powershell -NoProfile -Command "(Get-CimInstance Win32_Processor|Select-Object -First 1).Name"', { encoding: 'utf-8', timeout: 3000, windowsHide: true }).toString().trim(),
        execSync('powershell -NoProfile -Command "(Get-CimInstance Win32_VideoController|Select-Object -First 1).Name"', { encoding: 'utf-8', timeout: 3000, windowsHide: true }).toString().trim(),
        execSync('powershell -NoProfile -Command "[math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory/1GB,1).ToString()+\"GB\""', { encoding: 'utf-8', timeout: 3000, windowsHide: true }).toString().trim(),
        execSync('powershell -NoProfile -Command "(Get-CimInstance Win32_OperatingSystem).Caption"', { encoding: 'utf-8', timeout: 3000, windowsHide: true }).toString().trim(),
        execSync('powershell -NoProfile -Command "nvidia-smi --query-gpu=driver_version --format=csv,noheader 2>$null"', { encoding: 'utf-8', timeout: 3000, windowsHide: true }).toString().trim()
      ]
      return { cpu, gpu, ram, os, driver: driver || 'N/A' }
    } catch { return { cpu: 'Unknown', gpu: 'Unknown', ram: 'Unknown', os: 'Unknown', driver: 'Unknown' } }
  }

  private getAppliedTweaks(): string[] {
    try {
      return JSON.parse(require('fs').readFileSync(require('path').join(process.env.APPDATA, 'choatix', 'state.json'), 'utf-8')).appliedTweaks || []
    } catch { return [] }
  }

  getResults(): ProofResult[] {
    return this.results
  }

  compare(before: ProofResult, after: ProofResult): { cpu: number; gpu: number; ram: number; notes: string } {
    return {
      cpu: Math.round(((after.metrics.cpu.avg - before.metrics.cpu.avg) / before.metrics.cpu.avg) * 1000) / 10,
      gpu: Math.round(((after.metrics.gpu.avg - before.metrics.gpu.avg) / before.metrics.gpu.avg) * 1000) / 10,
      ram: Math.round(((after.metrics.ram.avg - before.metrics.ram.avg) / before.metrics.ram.avg) * 1000) / 10,
      notes: 'Positive = improvement. Based on actual system metrics, not injected FPS.'
    }
  }
}

export const proofSystem = new ProofSystem()
import { Tweak, LicenseTier } from '@/types'

export const availableTweaks: Tweak[] = [
  // ── SYSTEM ──
  {
    id: 'sys-high-performance',
    name: 'High Performance Power Plan',
    description: 'Switches to High Performance power plan for maximum CPU/GPU performance',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'high',
    risk: 'none',
    gamingImpact: 'Maximum CPU performance, eliminates power throttling'
  },
  {
    id: 'sys-enable-game-mode',
    name: 'Enable Game Mode',
    description: 'Enables Windows Game Mode to prioritize gaming resources and reduce background interference',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Reduced background interference during gaming'
  },
  {
    id: 'sys-disable-fullscreen-opt',
    name: 'Disable Fullscreen Optimizations',
    description: 'Disables Windows fullscreen optimization overlay for lower input lag in exclusive fullscreen',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Lower fullscreen input lag'
  },
  {
    id: 'sys-disk-cleanup',
    name: 'Disk Cleanup',
    description: 'Removes temporary files and frees disk space using Windows built-in utility',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'More storage for game installations'
  },
  {
    id: 'sys-cpu-priority',
    name: 'CPU Priority Boost',
    description: 'Optimizes Win32PrioritySeparation to give foreground processes shorter, variable CPU intervals',
    category: 'system',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'More responsive foreground applications and games'
  },
  {
    id: 'cpu-core-parking-disable',
    name: 'Disable Core Parking',
    description: 'Sets minimum active cores to 100% to prevent Windows from parking CPU cores',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'All CPU cores available, no park/unpark latency'
  },
  {
    id: 'memory-working-set',
    name: 'Optimize Working Set',
    description: 'Disables LargeSystemCache to prioritize application memory over file system cache',
    category: 'system',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'More RAM available for game processes'
  },

  // ── NVIDIA ──
  {
    id: 'nv-disable-vsync',
    name: 'Disable V-Sync',
    description: 'Disables vertical sync to reduce input lag (enable in-game if you see screen tearing)',
    category: 'nvidia',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Input lag reduction'
  },
  {
    id: 'nv-low-latency',
    name: 'Ultra Low Latency Mode',
    description: 'Enables NVIDIA Ultra Low Latency mode for minimum render queue delay',
    category: 'nvidia',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Reduced input lag by 20-30%'
  },
  {
    id: 'nv-hardware-scheduling',
    name: 'Hardware GPU Scheduling',
    description: 'Enables hardware-accelerated GPU scheduling for better frame pacing (Windows 10 2004+)',
    category: 'nvidia',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'high',
    risk: 'medium',
    gamingImpact: 'Better frame pacing, reduced micro-stutter'
  },
  {
    id: 'nv-texture-filtering',
    name: 'Texture Filtering Performance',
    description: 'Sets NVIDIA texture filtering to high performance for higher FPS with minor visual trade-off',
    category: 'nvidia',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Higher FPS, minimal visual quality loss'
  },

  // ── NETWORK ──
  {
    id: 'net-optimize-dns',
    name: 'Optimize DNS Settings',
    description: 'Switches to Cloudflare DNS (1.1.1.1) for lower connection latency',
    category: 'network',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Faster game server connections'
  },
  {
    id: 'net-reduce-congestion',
    name: 'Optimize TCP Congestion',
    description: 'Switches to CTCP congestion control for better throughput on high-bandwidth connections',
    category: 'network',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Stable ping, better throughput'
  },

  // ── MOUSE ──
  {
    id: 'mouse-disable-acceleration',
    name: 'Disable Mouse Acceleration',
    description: 'Disables Enhance Pointer Precision for raw, consistent mouse input',
    category: 'mouse',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'high',
    risk: 'none',
    gamingImpact: 'Better aim stability, consistent aim'
  },

  // ── STORAGE ──
  {
    id: 'storage-ssd-optimization',
    name: 'Disable Last Access Time',
    description: 'Disables last access time tracking on NTFS volumes to reduce disk I/O',
    category: 'storage',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Lower disk overhead'
  },
  {
    id: 'storage-trim-optimization',
    name: 'Force TRIM',
    description: 'Runs manual TRIM on all SSD volumes to maintain peak write performance',
    category: 'storage',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Maintains SSD performance over time'
  },
  {
    id: 'storage-nvme-optimization',
    name: 'NVMe Write Buffer',
    description: 'Increases NVMe write buffer queues for higher write throughput on Samsung NVMe drives',
    category: 'storage',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Faster game installs and level loading'
  },
  {
    id: 'storage-prefetch-manager',
    name: 'Disable Superfetch',
    description: 'Disables Windows Superfetch prefetching service on SSD/NVMe systems where it adds overhead',
    category: 'storage',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Lower disk usage during gaming on SSD systems'
  },

  // ── WINDOWS ──
  {
    id: 'windows-explorer-optimization',
    name: 'Explorer Opens to This PC',
    description: 'Sets Windows Explorer to open to This PC instead of Quick Access',
    category: 'windows',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Faster file navigation'
  },

  // ── AUDIO ──
  {
    id: 'audio-disable-enhancements',
    name: 'Disable Audio Enhancements',
    description: 'Disables Windows audio processing enhancements for lower audio latency',
    category: 'audio',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Lower audio latency'
  },
  {
    id: 'audio-usb-optimization',
    name: 'USB Audio Optimization',
    description: 'Disables selective suspend on USB audio devices to prevent dropouts',
    category: 'audio',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Stable USB audio, no dropouts'
  },

  // ── USB ──
  {
    id: 'usb-selective-suspend-disable',
    name: 'Disable USB Selective Suspend',
    description: 'Prevents USB devices from entering sleep mode for instant response',
    category: 'usb',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'high',
    risk: 'none',
    gamingImpact: 'Faster USB device response, no wake delay'
  },

  // ── KEYBOARD ──
  {
    id: 'keyboard-disable-filter',
    name: 'Disable Keyboard Filter',
    description: 'Removes the kbdhid filter driver overhead between HID and keyboard, reducing micro-latency',
    category: 'keyboard',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Lower keyboard input latency'
  },
  {
    id: 'keyboard-usb-power-mgmt',
    name: 'Disable USB Power Management',
    description: 'Prevents USB root hubs from entering power-save states, eliminating keyboard wake-up lag',
    category: 'keyboard',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'No keyboard wake-up delay after idle'
  },
]

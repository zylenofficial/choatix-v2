import { Tweak, LicenseTier } from '@/types'

export const availableTweaks: Tweak[] = [
  // NETWORK
  {
    id: 'net-disable-background-updates',
    name: 'Disable Background Updates',
    description: 'Prevents Windows Update from consuming bandwidth during gaming',
    category: 'network',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Latency reduction, ping stability'
  },
  {
    id: 'net-optimize-dns',
    name: 'Optimize DNS Settings',
    description: 'Switches to faster DNS servers for lower connection latency',
    category: 'network',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Faster game server connections'
  },
  {
    id: 'net-reduce-congestion',
    name: 'Reduce Network Congestion',
    description: 'Prioritizes gaming traffic over background network usage',
    category: 'network',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Stable ping, less packet loss'
  },
  {
    id: 'net-disable-throttling',
    name: 'Disable Network Throttling',
    description: 'Removes Windows network throttling mechanism',
    category: 'network',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Reduced network jitter'
  },
  {
    id: 'net-reset-tcp',
    name: 'Reset TCP/IP Stack',
    description: 'Resets network stack to clean state',
    category: 'network',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'medium',
    gamingImpact: 'Fixes persistent network issues'
  },
  // NVIDIA
  {
    id: 'nv-max-power',
    name: 'NVIDIA Power Management Max',
    description: 'Sets NVIDIA power management to prefer maximum performance',
    category: 'nvidia',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'high',
    risk: 'none',
    gamingImpact: 'FPS stability, eliminates power throttling'
  },
  {
    id: 'nv-disable-vsync',
    name: 'Disable V-Sync',
    description: 'Disables vertical sync to reduce input lag',
    category: 'nvidia',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Input lag reduction'
  },
  {
    id: 'nv-optimize-shader-cache',
    name: 'Optimize Shader Cache',
    description: 'Clears and optimizes shader cache for faster loading',
    category: 'nvidia',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Faster game loading, less stutter'
  },
  {
    id: 'nv-low-latency',
    name: 'Ultra Low Latency Mode',
    description: 'Enables NVIDIA Ultra Low Latency mode',
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
    description: 'Enables hardware GPU scheduling for better frame pacing',
    category: 'nvidia',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'medium',
    gamingImpact: 'Better frame pacing, reduced micro-stutter'
  },
  {
    id: 'nv-texture-filtering',
    name: 'Texture Filtering Quality',
    description: 'Sets texture filtering to high performance for better FPS',
    category: 'nvidia',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Improved FPS with minimal visual impact'
  },
  // DEBLOAT
  {
    id: 'debloat-disable-startup',
    name: 'Disable Unnecessary Startup Apps',
    description: 'Prevents non-essential programs from launching at boot',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'high',
    risk: 'none',
    gamingImpact: 'Faster boot, more available RAM'
  },
  {
    id: 'debloat-remove-background',
    name: 'Stop Background Bloat Processes',
    description: 'Terminates unnecessary background processes',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'More CPU/RAM available for games'
  },
  {
    id: 'debloat-disable-telemetry',
    name: 'Disable Telemetry Services',
    description: 'Stops Windows telemetry data collection',
    category: 'debloat',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Reduced background CPU usage'
  },
  {
    id: 'debloat-disable-services',
    name: 'Disable Non-Critical Services',
    description: 'Disables Windows services not needed for gaming',
    category: 'debloat',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Lower RAM and CPU overhead'
  },
  {
    id: 'debloat-superfetch',
    name: 'Disable Superfetch/SysMain',
    description: 'Disables prefetching service that consumes disk and RAM',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Reduced disk usage during gaming'
  },
  // MOUSE
  {
    id: 'mouse-disable-acceleration',
    name: 'Disable Mouse Acceleration',
    description: 'Disables Enhance Pointer Precision for raw mouse input',
    category: 'mouse',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'high',
    risk: 'none',
    gamingImpact: 'Better aim stability, consistent aim'
  },
  {
    id: 'mouse-raw-input',
    name: 'Enable Raw Input Mode',
    description: 'Forces games to use raw mouse input bypassing Windows',
    category: 'mouse',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Direct mouse-to-game response'
  },
  {
    id: 'mouse-optimize-pointer',
    name: 'Optimize Pointer Settings',
    description: 'Sets pointer speed to optimal level',
    category: 'mouse',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Consistent sensitivity across games'
  },
  // KEYBOARD
  {
    id: 'kb-disable-filter-keys',
    name: 'Disable Filter Keys',
    description: 'Disables Windows Filter Keys that cause input delay',
    category: 'keyboard',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'high',
    risk: 'none',
    gamingImpact: 'Faster key response, no missed inputs'
  },
  {
    id: 'kb-disable-sticky-keys',
    name: 'Disable Sticky Keys',
    description: 'Prevents Sticky Keys popup during gaming',
    category: 'keyboard',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Uninterrupted gameplay'
  },
  {
    id: 'kb-disable-toggle-keys',
    name: 'Disable Toggle Keys',
    description: 'Prevents Toggle Keys popup during gaming',
    category: 'keyboard',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Uninterrupted gameplay'
  },
  // SYSTEM
  {
    id: 'sys-high-performance',
    name: 'High Performance Power Plan',
    description: 'Switches to High Performance power plan for maximum CPU',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'high',
    risk: 'none',
    gamingImpact: 'Maximum CPU performance'
  },
  {
    id: 'sys-enable-game-mode',
    name: 'Enable Game Mode',
    description: 'Enables Windows Game Mode to prioritize gaming resources',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Reduced background interference'
  },
  {
    id: 'sys-disable-fullscreen-opt',
    name: 'Disable Fullscreen Optimizations',
    description: 'Disables Windows fullscreen optimization overlay',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Lower fullscreen input lag'
  },
  {
    id: 'sys-visual-effects',
    name: 'Optimize Visual Effects',
    description: 'Disables unnecessary Windows animations to free GPU/CPU',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'More resources for games'
  },
  {
    id: 'sys-cpu-priority',
    name: 'CPU Priority Boost',
    description: 'Boosts CPU priority for foreground game processes',
    category: 'system',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Better CPU time allocation'
  },
  {
    id: 'sys-disk-cleanup',
    name: 'Disk Cleanup',
    description: 'Removes temporary files and frees disk space',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'More storage for game installations'
  },
  // AMD
  {
    id: 'amd-max-power',
    name: 'AMD Power Management Max',
    description: 'Sets AMD power management to prefer maximum performance',
    category: 'amd',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'high',
    risk: 'none',
    gamingImpact: 'FPS stability, eliminates power throttling'
  },
  // INTEL
  {
    id: 'intel-max-power',
    name: 'Intel Power Management Max',
    description: 'Sets Intel power management to prefer maximum performance',
    category: 'intel',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'high',
    risk: 'none',
    gamingImpact: 'Maximum GPU performance'
  },
  // CPU
  {
    id: 'cpu-core-parking-disable',
    name: 'Disable Core Parking',
    description: 'Disables Windows core parking for maximum performance',
    category: 'cpu',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'high',
    risk: 'none',
    gamingImpact: 'More available CPU cores'
  },
  {
    id: 'cpu-smt-enable',
    name: 'Enable Simultaneous Multi-Threading',
    description: 'Ensures SMT is enabled for optimal performance',
    category: 'cpu',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'high',
    risk: 'none',
    gamingImpact: 'Better parallel task handling'
  },
  {
    id: 'cpu-interrupt-affinity',
    name: 'Optimize Interrupt Affinity',
    description: 'Optimizes CPU interrupt affinity for gaming',
    category: 'cpu',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Reduced interrupt latency'
  },
  // MEMORY
  {
    id: 'memory-wake-cleaner',
    name: 'Wake Clean Standby Memory',
    description: 'Forces immediate cleanup of standby memory for gaming',
    category: 'memory',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'high',
    risk: 'none',
    gamingImpact: 'More available RAM for games'
  },
  {
    id: 'memory-page-prefetch',
    name: 'Optimize Page Prefetch',
    description: 'Optimizes page prefetch for better memory access',
    category: 'memory',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Faster memory access'
  },
  {
    id: 'memory-virtual-memory',
    name: 'Virtual Memory Optimizer',
    description: 'Optimizes virtual memory settings for gaming',
    category: 'memory',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Better memory handling'
  },
  {
    id: 'memory-pagefile-manager',
    name: 'Pagefile Manager',
    description: 'Optimizes pagefile for gaming performance',
    category: 'memory',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Stable memory management'
  },
  {
    id: 'memory-working-set',
    name: 'Working Set Optimizer',
    description: 'Optimizes working set sizes for gaming',
    category: 'memory',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Better memory allocation'
  },
  // STORAGE
  {
    id: 'storage-ssd-optimization',
    name: 'SSD Optimization',
    description: 'Optimizes SSD settings for gaming performance',
    category: 'storage',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'high',
    risk: 'none',
    gamingImpact: 'Faster game loading'
  },
  {
    id: 'storage-nvme-optimization',
    name: 'NVMe Optimization',
    description: 'Optimizes NVMe settings for maximum speed',
    category: 'storage',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Highest possible storage speed'
  },
  {
    id: 'storage-trim-optimization',
    name: 'TRIM Optimization',
    description: 'Optimizes TRIM operations for SSD health',
    category: 'storage',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Maintains SSD performance'
  },
  {
    id: 'storage-prefetch-manager',
    name: 'Prefetch Manager',
    description: 'Optimizes prefetch for better read performance',
    category: 'storage',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Faster file access'
  },
  {
    id: 'storage-write-cache',
    name: 'Write Cache Optimization',
    description: 'Optimizes write cache settings for gaming',
    category: 'storage',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Better write performance'
  },
  {
    id: 'storage-temp-file-cleaner',
    name: 'Temporary File Cleaner',
    description: 'Removes temporary files that slow down storage',
    category: 'storage',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Faster file operations'
  },
  // WINDOWS
  {
    id: 'windows-explorer-optimization',
    name: 'Explorer Optimization',
    description: 'Optimizes Windows Explorer for gaming performance',
    category: 'windows',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'high',
    risk: 'none',
    gamingImpact: 'Faster file operations'
  },
  {
    id: 'windows-animation-optimization',
    name: 'Animation Optimization',
    description: 'Disables unnecessary animations to reduce load',
    category: 'windows',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'More available resources'
  },
  {
    id: 'windows-context-menu-cleanup',
    name: 'Context Menu Cleanup',
    description: 'Removes unnecessary context menu items',
    category: 'windows',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Faster UI interaction'
  },
  {
    id: 'windows-scheduled-task-optimizer',
    name: 'Scheduled Task Optimizer',
    description: 'Disables unnecessary scheduled tasks',
    category: 'windows',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Reduced background activity'
  },
  {
    id: 'windows-search-index-optimizer',
    name: 'Search Index Optimizer',
    description: 'Optimizes search indexing for reduced disk usage',
    category: 'windows',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Lower disk I/O during search'
  },
  {
    id: 'windows-notification-optimization',
    name: 'Notification Optimization',
    description: 'Optimizes notification system for gaming',
    category: 'windows',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Fewer distractions during gaming'
  },
  // AUDIO
  {
    id: 'audio-disable-enhancements',
    name: 'Disable Audio Enhancements',
    description: 'Disables unnecessary audio enhancements for lower latency',
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
    description: 'Optimizes USB audio devices for gaming',
    category: 'audio',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Stable USB audio'
  },
  // USB
  {
    id: 'usb-selective-suspend-disable',
    name: 'Disable USB Selective Suspend',
    description: 'Disables USB selective suspend for better responsiveness',
    category: 'usb',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'high',
    risk: 'none',
    gamingImpact: 'Faster USB device response'
  },
  // SERVICES
  {
    id: 'services-gaming-preset',
    name: 'Gaming Service Preset',
    description: 'Applies optimized service configuration for gaming',
    category: 'services',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Optimized background services'
  },
  {
    id: 'services-streaming-preset',
    name: 'Streaming Service Preset',
    description: 'Optimized service settings for streaming',
    category: 'services',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Better streaming performance'
  },
  {
    id: 'services-editing-preset',
    name: 'Editing Service Preset',
    description: 'Optimized service settings for video editing',
    category: 'services',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Better editing performance'
  },
  {
    id: 'services-workstation-preset',
    name: 'Workstation Service Preset',
    description: 'Optimized service settings for workstation performance',
    category: 'services',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Maximum workstation performance'
  }
]

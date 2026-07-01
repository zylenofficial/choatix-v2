import { LicenseTier } from '@/types'

export interface TweakInfo {
  name: string
  description: string
  technicalDetails: string
  benefits: string
  risks: string
  plan: string
  reversible: boolean
}

const fallback: TweakInfo = {
  name: 'Unknown Tweak',
  description: 'No description available for this tweak.',
  technicalDetails: '',
  benefits: '',
  risks: '',
  plan: 'Free',
  reversible: true,
}

export const TWEAK_INFO: Record<string, TweakInfo> = {
  // ── SYSTEM ──
  'sys-high-performance': {
    name: 'High Performance Power Plan',
    description: 'Switches your PC to the High Performance power plan so your CPU and GPU always run at maximum speed instead of throttling to save energy.',
    technicalDetails: 'Activates the Windows "High Performance" power scheme (GUID 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c) which sets minimum processor state to 100% and disables parking and throttling.',
    benefits: 'Maximum CPU/GPU clocks at all times. Eliminates micro-stutters caused by power state transitions. Consistent frame times.',
    risks: 'Slightly higher power draw and heat output at idle. Fans may spin faster during light use.',
    plan: 'Free',
    reversible: true,
  },
  'sys-enable-game-mode': {
    name: 'Enable Game Mode',
    description: 'Tells Windows to prioritize your game by reducing background activity, deferring updates, and allocating more resources while you play.',
    technicalDetails: 'Sets AutoGameModeEnabled=1 under HKCU\\Software\\Microsoft\\GameBar. Windows uses this flag to enable Game Mode scheduling when a fullscreen game is detected.',
    benefits: 'Fewer background interruptions during gaming. Reduced frame drops from Windows processes. Defers Windows Update installs.',
    risks: 'None. Game Mode is a built-in Windows feature designed for gaming.',
    plan: 'Free',
    reversible: true,
  },
  'sys-disable-fullscreen-opt': {
    name: 'Disable Fullscreen Optimizations',
    description: 'Stops Windows from forcing games into a borderless fullscreen overlay, letting games use true exclusive fullscreen for lower input lag.',
    technicalDetails: 'Sets DisableFullscreenOptimization=1 under HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer. Prevents DWM (Desktop Window Manager) from intercepting fullscreen game rendering.',
    benefits: 'Lower input lag in fullscreen games. True exclusive fullscreen bypasses DWM composition. More consistent frame pacing.',
    risks: 'Some older games may behave unexpectedly with exclusive fullscreen. Alt-Tab may take slightly longer.',
    plan: 'Free',
    reversible: true,
  },
  'sys-disk-cleanup': {
    name: 'Disk Cleanup',
    description: 'Runs the Windows Disk Cleanup utility to remove temporary files, cache, and other junk taking up drive space.',
    technicalDetails: 'Executes cleanmgr /sagerun:1 which runs a previously configured Disk Cleanup session targeting temporary files, thumbnails, recycle bin, and Windows Update cleanup.',
    benefits: 'More free disk space for game installations. Reduced disk fragmentation. Faster file operations on nearly-full drives.',
    risks: 'None. Only removes files Windows considers safe to delete.',
    plan: 'Free',
    reversible: false,
  },
  'sys-cpu-priority': {
    name: 'CPU Priority Boost',
    description: 'Optimizes how Windows分配 CPU time between foreground and background processes, giving your games and active apps shorter, more responsive time slices.',
    technicalDetails: 'Sets Win32PrioritySeparation=38 (0x26) under HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl. This value uses short, variable intervals for foreground processes with separate foreground and background queues.',
    benefits: 'More responsive input in games. Faster UI interaction. Background tasks get less CPU time during gaming.',
    risks: 'Very minor. Background tasks may take slightly longer to complete. Reversible.',
    plan: 'Pro',
    reversible: true,
  },
  'cpu-core-parking-disable': {
    name: 'Disable Core Parking',
    description: 'Prevents Windows from putting CPU cores to sleep (parking) to save power, keeping all cores active and ready for instant use.',
    technicalDetails: 'Sets CPMINCORES=100 via powercfg /setacvalueindex scheme_current sub_processor CPMINCORES 100. Forces 100% minimum active cores, preventing any core from entering a parked state.',
    benefits: 'All CPU cores available instantly. Eliminates park/unpark latency spikes. Better multi-threaded game performance.',
    risks: 'Slightly higher idle power consumption. Minimal on modern CPUs with good power management.',
    plan: 'Free',
    reversible: true,
  },
  'memory-working-set': {
    name: 'Optimize Working Set',
    description: 'Tells Windows to prioritize keeping your applications in RAM instead of optimizing for file system caching.',
    technicalDetails: 'Sets LargeSystemCache=0 under HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management. When 0, Windows prioritizes application working sets over the file system cache.',
    benefits: 'More RAM available for game processes. Reduced page file usage during gaming. Faster app switching.',
    risks: 'File system caching is reduced, which may slightly slow down large file operations. Minimal impact on gaming.',
    plan: 'Premium',
    reversible: true,
  },

  // ── NVIDIA ──
  'nv-disable-vsync': {
    name: 'Disable V-Sync',
    description: 'Turns off vertical sync in the NVIDIA driver so your game renders frames as fast as possible instead of waiting for the monitor refresh.',
    technicalDetails: 'Sets VSyncMode=0 under HKCU\\Software\\NVIDIA Corporation\\Global\\NVTweak. Forces the driver to bypass V-Sync regardless of in-game settings. Enable in-game if you see screen tearing.',
    benefits: 'Significantly lower input lag. Uncapped frame rates. More responsive mouse movement.',
    risks: 'May cause screen tearing if the game does not have its own sync solution. Enable G-Sync or in-game V-Sync if tearing occurs.',
    plan: 'Free',
    reversible: true,
  },
  'nv-low-latency': {
    name: 'Ultra Low Latency Mode',
    description: 'Enables NVIDIA Ultra Low Latency mode which minimizes the render queue so frames are displayed as soon as they are ready.',
    technicalDetails: 'Sets DisableP4BC=1 under HKCU\\Software\\NVIDIA Corporation\\Global\\NVTweak. Disables pre-rendered frames buffer, reducing the queue to 1 frame.',
    benefits: '20-30% lower input latency in GPU-bound scenarios. Faster response to mouse input. Works best in competitive games.',
    risks: 'May cause minor frame time variance in some games. Not recommended if CPU is the bottleneck.',
    plan: 'Pro',
    reversible: true,
  },
  'nv-hardware-scheduling': {
    name: 'Hardware GPU Scheduling',
    description: 'Lets your GPU handle its own task scheduling instead of Windows, which can reduce latency and improve frame pacing.',
    technicalDetails: 'Sets HwSchMode=2 under HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers. Requires Windows 10 version 2004 or later and a supported GPU (Turing or newer).',
    benefits: 'Reduced micro-stutter. Better frame pacing. Lower CPU overhead for GPU scheduling. Particularly noticeable in CPU-bound games.',
    risks: 'Experimental on some systems. May cause visual glitches in rare cases. Reversible by setting HwSchMode=1.',
    plan: 'Pro',
    reversible: true,
  },
  'nv-texture-filtering': {
    name: 'Texture Filtering Performance',
    description: 'Switches NVIDIA texture filtering to high performance mode, trading a tiny amount of visual quality for higher FPS.',
    technicalDetails: 'Sets TextureFilteringQuality=1 (High Performance) under HKCU\\Software\\NVIDIA Corporation\\Global\\NVTweak. Reduces anisotropic filtering precision from 16x bilinear to trilinear.',
    benefits: 'Higher FPS, especially on lower-end GPUs. Measurable improvement in GPU-bound scenarios. Minimal visual quality loss at normal viewing distances.',
    risks: 'Slight reduction in texture sharpness at extreme viewing angles. May be noticeable on large monitors at close range.',
    plan: 'Pro',
    reversible: true,
  },

  // ── NETWORK ──
  'net-optimize-dns': {
    name: 'Optimize DNS Settings',
    description: 'Switches your DNS server to Cloudflare (1.1.1.1) which is one of the fastest public DNS servers available.',
    technicalDetails: 'Sets DNS to 1.1.1.1 (primary) on the Ethernet adapter via netsh. Cloudflare DNS typically responds in 5-15ms vs 20-50ms for default ISP DNS.',
    benefits: 'Faster game server name resolution. Lower connection latency to multiplayer servers. Faster website loading.',
    risks: 'None. Cloudflare DNS is free, privacy-focused, and widely used. Can be reverted to DHCP at any time.',
    plan: 'Free',
    reversible: true,
  },
  'net-reduce-congestion': {
    name: 'Optimize TCP Congestion',
    description: 'Switches Windows to CTCP (Composite TCP) congestion control which performs better on high-bandwidth, low-latency connections typical of gaming.',
    technicalDetails: 'Sets CongestionProvider=CTCP on the Internet TCP setting via Set-NetTCPSetting. CTCP uses delay-based congestion control instead of packet loss-based, which is better for gaming traffic.',
    benefits: 'More stable ping in online games. Better throughput on fast connections. Reduced packet loss under load.',
    risks: 'Very minor. CTCP is Microsoft\'s recommended congestion provider for modern networks. Reversible to CUBIC.',
    plan: 'Pro',
    reversible: true,
  },

  // ── MOUSE ──
  'mouse-disable-acceleration': {
    name: 'Disable Mouse Acceleration',
    description: 'Turns off Windows mouse acceleration (Enhance Pointer Precision) so your mouse moves 1:1 with physical movement — no speed-dependent curve.',
    technicalDetails: 'Sets MouseSpeed=0, MouseThreshold1=0, MouseThreshold2=0 under HKCU\\Control Panel\\Mouse. Disables the pointer precision enhancement that changes mouse speed based on movement velocity.',
    benefits: 'Consistent, predictable aiming in FPS games. Muscle memory develops faster. No acceleration curve messing with your aim.',
    risks: 'None. This is the standard setting recommended by all competitive FPS players.',
    plan: 'Free',
    reversible: true,
  },

  // ── STORAGE ──
  'storage-ssd-optimization': {
    name: 'Disable Last Access Time',
    description: 'Stops Windows from recording the last access time on every file, reducing unnecessary disk writes on SSDs.',
    technicalDetails: 'Sets disablelastaccess=1 via fsutil behavior set. Prevents NTFS from updating the last-access timestamp on every file read, which reduces write amplification on SSDs.',
    benefits: 'Reduced SSD write operations. Extended SSD lifespan. Slightly faster file operations.',
    risks: 'None. Last access time is rarely used and this is a recommended SSD optimization.',
    plan: 'Free',
    reversible: true,
  },
  'storage-trim-optimization': {
    name: 'Force TRIM',
    description: 'Runs an immediate TRIM command on your SSD to tell it which blocks are no longer in use, maintaining peak write performance.',
    technicalDetails: 'Executes Optimize-Volume -DriveLetter C -ReTrim via PowerShell. Sends TRIM commands to the SSD controller to mark unused blocks for garbage collection.',
    benefits: 'Maintains SSD write speed over time. Prevents performance degradation. Keeps free space available for new writes.',
    risks: 'None. TRIM is a standard SSD maintenance operation. Your OS runs it automatically, but this forces it now.',
    plan: 'Free',
    reversible: false,
  },
  'storage-nvme-optimization': {
    name: 'NVMe Write Buffer',
    description: 'Increases the number of write buffer queues for NVMe drives, allowing more concurrent write operations for higher throughput.',
    technicalDetails: 'Sets NumberOfWriteBufferQueues=4 under HKLM\\SYSTEM\\CurrentControlSet\\Services\\stornvme\\Parameters\\Device. This is a Samsung-optimized setting that increases parallel write operations.',
    benefits: 'Higher NVMe write throughput. Faster game installations and level loading. Better performance during large file transfers.',
    risks: 'Low. Only affects Samsung NVMe drives. Safe on other NVMe drives (setting is ignored if unsupported).',
    plan: 'Pro',
    reversible: true,
  },
  'storage-prefetch-manager': {
    name: 'Disable Superfetch',
    description: 'Disables Windows Superfetch (SysMain) which preloads apps into RAM. On SSD/NVMe systems, this adds overhead without benefit since the drive is already fast.',
    technicalDetails: 'Stops and disables the SysMain service via PowerShell. Superfetch is designed for HDDs; on SSDs the preloading creates unnecessary disk I/O and CPU usage.',
    benefits: 'Lower disk I/O during gaming on SSD systems. Reduced CPU overhead. More consistent frame times when background loading.',
    risks: 'HDD users should NOT disable this — it significantly helps on spinning drives. Only for SSD/NVMe systems.',
    plan: 'Pro',
    reversible: true,
  },

  // ── WINDOWS ──
  'windows-explorer-optimization': {
    name: 'Explorer Opens to This PC',
    description: 'Changes Windows Explorer to open directly to "This PC" instead of Quick Access, so you see your drives and folders immediately.',
    technicalDetails: 'Sets LaunchTo=1 under HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced. Controls the default navigation target for Explorer windows.',
    benefits: 'Faster access to your drives and game folders. No Quick Access loading delay. Cleaner startup.',
    risks: 'None. Purely a convenience setting.',
    plan: 'Free',
    reversible: true,
  },

  // ── AUDIO ──
  'audio-disable-enhancements': {
    name: 'Disable Audio Enhancements',
    description: 'Turns off Windows audio processing effects like bass boost, virtual surround, and loudness equalization that add latency.',
    technicalDetails: 'Sets Enabled=0 under HKCU\\Software\\Microsoft\\MMSys\\Default\\AudioEffects\\AudioEnhancementSceneGraph. Disables the audio processing graph that applies real-time effects to all audio output.',
    benefits: 'Lower audio latency. More accurate spatial audio in games. No processing artifacts or delay.',
    risks: 'None. Audio enhancements are optional processing that most gamers disable anyway.',
    plan: 'Free',
    reversible: true,
  },
  'audio-usb-optimization': {
    name: 'USB Audio Optimization',
    description: 'Prevents Windows from putting USB audio devices (headsets, DACs) into power-saving mode that causes dropouts and crackling.',
    technicalDetails: 'Sets DisableSelectiveSuspend=1 under HKLM\\SYSTEM\\CurrentControlSet\\Services\\usbaudio. Prevents the USB audio class driver from suspending the device during silence.',
    benefits: 'No audio dropouts or crackling during gaming. Stable USB headset connection. No wake-up delay after silence.',
    risks: 'None. USB audio devices use minimal power even when not suspended.',
    plan: 'Free',
    reversible: true,
  },

  // ── USB ──
  'usb-selective-suspend-disable': {
    name: 'Disable USB Selective Suspend',
    description: 'Stops Windows from putting USB devices to sleep when they are idle, preventing wake-up lag when you move your mouse or press a key.',
    technicalDetails: 'Sets DisableSelectiveSuspend=1 under HKLM\\SYSTEM\\CurrentControlSet\\Services\\USB. Prevents the USB hub driver from suspending any connected USB device.',
    benefits: 'Instant mouse/keyboard response after idle. No USB wake-up delay. Better compatibility with gaming peripherals.',
    risks: 'Slightly higher idle power draw for USB devices. Negligible impact on laptop battery.',
    plan: 'Free',
    reversible: true,
  },

  // ── KEYBOARD ──
  'keyboard-disable-filter': {
    name: 'Disable Keyboard Filter',
    description: 'Removes the kbdhid filter driver that sits between your keyboard and Windows, eliminating an extra software processing layer.',
    technicalDetails: 'Removes "kbdhid" from the UpperFilters multi-string on the keyboard device class (HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e96b-e325-11ce-bfc1-08002be10318}). The keyboard continues to work through the standard HID driver.',
    benefits: 'Lower keyboard input latency. Reduced software overhead per keystroke. Keyboard still works identically.',
    risks: 'None. The keyboard operates through the standard HID driver which is always present.',
    plan: 'Free',
    reversible: true,
  },
  'keyboard-usb-power-mgmt': {
    name: 'Disable USB Power Management',
    description: 'Prevents USB root hubs from entering power-save states, eliminating wake-up lag when your keyboard or mouse has not been used for a few seconds.',
    technicalDetails: 'Sets IdleTimeout=0 on WDF parameters for all USB and HID devices. Prevents the USB hub driver from entering any power-saving state that would require a wake-up cycle.',
    benefits: 'No keyboard/mouse wake-up delay after idle. Consistent input latency at all times. Better for gaming peripherals.',
    risks: 'Slightly higher idle power draw. Negligible on desktop systems.',
    plan: 'Free',
    reversible: true,
  },
}

export function getTweakInfo(tweakId: string): TweakInfo {
  return TWEAK_INFO[tweakId] || { ...fallback, name: tweakId }
}

export function getTierLabel(tier: LicenseTier): string {
  switch (tier) {
    case LicenseTier.FREE: return 'Free'
    case LicenseTier.PRO: return 'Pro'
    case LicenseTier.PREMIUM: return 'Premium'
    default: return 'Free'
  }
}

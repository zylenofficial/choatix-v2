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
  {
    id: 'sys-disable-gamebar',
    name: 'Disable Windows GameBar',
    description: 'Turns off the Windows Game Bar overlay. Disabling it frees up resources for your game.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Frees up overlay resources'
  },
  {
    id: 'sys-disable-vbs',
    name: 'Disable VBS & Hyper-V',
    description: 'Turns off virtualization-based security features. This can significantly improve performance in games.',
    category: 'system',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'medium',
    gamingImpact: 'Significant FPS improvement from disabling virtualization overhead'
  },
  {
    id: 'sys-disable-xbox',
    name: 'Disable Xbox',
    description: 'Turns off Xbox-related features and services. If you don\'t use Xbox, this frees up system resources.',
    category: 'system',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Frees up background resources'
  },
  {
    id: 'sys-disable-mitigations',
    name: 'Disable Mitigations',
    description: 'Turns off some of Windows\' built-in security mitigations. This can improve performance but comes at a security cost.',
    category: 'system',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'high',
    gamingImpact: 'Reduced security overhead, higher FPS'
  },
  {
    id: 'sys-optimize-fps',
    name: 'Optimize FPS & Input Lag',
    description: 'Applies gaming, input, scheduling, timer, and priority tweaks to reduce latency and improve responsiveness.',
    category: 'system',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Comprehensive latency and FPS optimization'
  },
  {
    id: 'sys-optimize-device-affinities',
    name: 'Optimize Device Affinities',
    description: 'Helps assign your devices to the best CPU cores for the job. This can make your system run more efficiently.',
    category: 'system',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'More efficient CPU core usage'
  },
  {
    id: 'sys-optimize-msi',
    name: 'Optimize Message Signal Interrupts',
    description: 'Improves how your devices communicate with your CPU. This can make your system more responsive.',
    category: 'system',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Lower device communication latency'
  },
  {
    id: 'sys-reduce-background',
    name: 'Reduce Windows Background Activity',
    description: 'Reduces Windows background services, scheduled tasks, and compatibility features to lower resource usage.',
    category: 'system',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Less background CPU and RAM usage during gaming'
  },
  {
    id: 'sys-disable-hibernation',
    name: 'Disable Hibernation',
    description: 'Turns off the hibernation feature. This can free up a good amount of disk space and may lead to faster startup.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Frees disk space, slightly faster boot'
  },
  {
    id: 'sys-enable-modern-memory',
    name: 'Enable Modern Windows Memory Management',
    description: 'Enables the modern Windows memory allocator (Segment Heap). It is designed to improve performance.',
    category: 'system',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'More efficient memory allocation'
  },
  {
    id: 'sys-disable-services',
    name: 'Disable Windows Services',
    description: 'Lets you turn off Windows services you don\'t need. This can reduce resource usage and improve performance.',
    category: 'system',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'high',
    risk: 'medium',
    gamingImpact: 'Reduced background resource usage'
  },
  {
    id: 'sys-optimize-storage',
    name: 'Optimize Storage & Memory',
    description: 'Improves storage and memory responsiveness by tuning drive, I/O, memory-management, and storage-related Windows settings.',
    category: 'system',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Faster load times, better memory handling'
  },
  {
    id: 'sys-reduce-boot-timeout',
    name: 'Reduce Boot Menu Timeout',
    description: 'Changes the operating system selection screen timeout from 30 seconds to 2 seconds.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Faster boot time'
  },
  {
    id: 'sys-optimize-explorer',
    name: 'Optimize Windows Explorer',
    description: 'Includes several tweaks to make File Explorer faster and easier to use.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Faster file navigation'
  },
  {
    id: 'sys-disable-boot-interface',
    name: 'Disable Windows Boot Interface',
    description: 'Hides the Windows startup screen with its logos and animations. Your PC will still take the same time to start.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Cleaner boot experience'
  },
  {
    id: 'sys-optimize-browser-bg',
    name: 'Optimize Browser Background',
    description: 'Reduces the background activity of Chrome and Edge. This helps free up resources when your browser isn\'t the main window.',
    category: 'system',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Less browser resource usage during gaming'
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
  {
    id: 'nv-disable-telemetry',
    name: 'Disable NVIDIA Telemetry Components',
    description: 'Disables NVIDIA telemetry components and driver helper files to reduce background activity.',
    category: 'nvidia',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Less NVIDIA background processes'
  },
  {
    id: 'nv-optimize-performance',
    name: 'Optimize NVIDIA Performance',
    description: 'Applies NVIDIA driver and control panel settings aimed at improving performance and reducing latency.',
    category: 'nvidia',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Better GPU performance and lower latency'
  },
  {
    id: 'nv-enhance-privacy',
    name: 'Enhance NVIDIA Privacy',
    description: 'Turns off NVIDIA\'s data collection and telemetry services. This improves your privacy and reduces background usage.',
    category: 'nvidia',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Less background NVIDIA processes'
  },
  {
    id: 'nv-enable-dlss-indicator',
    name: 'Enable DLSS Indicator',
    description: 'Shows an on-screen overlay to confirm if DLSS is running in your game. This is a useful tool for advanced users.',
    category: 'nvidia',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Visual DLSS confirmation overlay'
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
  {
    id: 'net-optimize-performance',
    name: 'Optimize Network Performance',
    description: 'Tunes Windows networking, adapter behavior, offloading, QoS, and TCP settings to reduce lag.',
    category: 'network',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Lower ping and more stable connections'
  },
  {
    id: 'net-disable-lso',
    name: 'Disable Large Send Offloads',
    description: 'Large Send Offload helps your network adapter process large amounts of data. Some older adapters don\'t handle it well.',
    category: 'network',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'More consistent network performance'
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
  {
    id: 'qol-clean-taskbar',
    name: 'Clean Taskbar, Start Menu and Search',
    description: 'Cleans the taskbar, Start Menu, Search, and suggestion features by reducing web results and promotional content.',
    category: 'windows',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Cleaner Windows interface'
  },
  {
    id: 'qol-classic-photo-viewer',
    name: 'Enable Classic Windows Photo Viewer',
    description: 'Restores the classic Windows Photo Viewer so you can open images with the old, lightweight viewer again.',
    category: 'windows',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Faster image viewing'
  },
  {
    id: 'qol-process-explorer',
    name: 'Install Process Explorer Task Manager',
    description: 'Replaces the default Task Manager with Process Explorer, a more advanced tool for detailed performance information.',
    category: 'windows',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Better process monitoring'
  },
  {
    id: 'qol-enhanced-registry',
    name: 'Install Enhanced Registry Editor',
    description: 'Replaces the default Windows Registry Editor with a more powerful tool for advanced users.',
    category: 'windows',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Better registry management'
  },
  {
    id: 'qol-bypass-win11',
    name: 'Bypass Windows 11 Checks',
    description: 'Allows Windows setup to bypass TPM, Secure Boot, CPU, RAM, and storage requirement checks.',
    category: 'windows',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'low',
    gamingImpact: 'Install Windows 11 on unsupported hardware'
  },
  {
    id: 'qol-disable-disk-quotas',
    name: 'Disable Disk Quotas',
    description: 'Disables Windows disk quota enforcement, quota limits, and quota warning events.',
    category: 'windows',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'No disk quota overhead'
  },
  {
    id: 'qol-optimize-browsing',
    name: 'Optimize Browser Background',
    description: 'Reduces background activity of Chrome and Edge when they aren\'t the main window.',
    category: 'windows',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Less browser resource usage during gaming'
  },
  {
    id: 'qol-disable-browser-hw-accel',
    name: 'Disable Browser Hardware Acceleration',
    description: 'Stops your browser from using your graphics card. This can free up GPU power for your games.',
    category: 'windows',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'More GPU power available for games'
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

  // ── PRIVACY ──
  {
    id: 'privacy-reduce-ads',
    name: 'Reduce Ads & Tracking',
    description: 'Reduces Windows, browser, Office, and app telemetry, ads, suggestions, and promotional content.',
    category: 'privacy',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Less background telemetry overhead'
  },
  {
    id: 'privacy-optimize-smb',
    name: 'Optimize SMB',
    description: 'Improves the speed and security of your local network file sharing. Disables the old SMBv1 and optimizes SMB settings.',
    category: 'privacy',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Faster LAN file transfers'
  },
  {
    id: 'privacy-disable-updates',
    name: 'Disable Windows Automatic Updates',
    description: 'Gives you full control over when Windows updates are installed. It stops automatic downloads and reduces background usage.',
    category: 'privacy',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'medium',
    gamingImpact: 'No surprise updates during gaming'
  },
  {
    id: 'privacy-disable-security-questions',
    name: 'Disable Windows Security Questions',
    description: 'Disables local account password reset questions to reduce account recovery exposure.',
    category: 'privacy',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'low',
    gamingImpact: 'Reduced account attack surface'
  },
  {
    id: 'privacy-harden-security',
    name: 'Harden Windows Security',
    description: 'Applies stricter Windows security policies for anonymous access, credentials, and legacy protocols.',
    category: 'privacy',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'low',
    gamingImpact: 'Better system security'
  },
  {
    id: 'privacy-disable-defender',
    name: 'Disable Windows Defender',
    description: 'Turns off Windows Defender antivirus. Not recommended because it\'s a major security risk.',
    category: 'privacy',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'high',
    gamingImpact: 'No antivirus scanning during gaming'
  },
  {
    id: 'privacy-disable-smartscreen',
    name: 'Disable Windows Smartscreen',
    description: 'Turns off Windows SmartScreen, which protects you from malicious websites and files.',
    category: 'privacy',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'high',
    gamingImpact: 'Less background security scanning'
  },
  {
    id: 'privacy-disable-vpn',
    name: 'Disable VPN Support',
    description: 'VPN services running in the background can impact performance. Turning them off might improve performance if you don\'t use a VPN.',
    category: 'privacy',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Less background VPN overhead'
  },
  {
    id: 'privacy-disable-uac',
    name: 'Disable User Account Control (UAC)',
    description: 'Turns off the pop-up that asks for administrator permission. This is faster but a security risk.',
    category: 'privacy',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'high',
    gamingImpact: 'No admin permission pop-ups'
  },
  {
    id: 'privacy-disable-ucpd',
    name: 'Disable User Choice Protection Driver (UCPD)',
    description: 'Allows scripts and other apps to change your default browser and other settings. For advanced users.',
    category: 'privacy',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'low',
    gamingImpact: 'Removes driver overhead'
  },
  {
    id: 'privacy-unlock-eu-privacy',
    name: 'Unlock EU Privacy Mode',
    description: 'Spoofs your PC\'s Device Setup Region to the European Union, unlocking hidden Windows privacy settings.',
    category: 'privacy',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Access to hidden privacy controls'
  },
  {
    id: 'privacy-redirect-web-searches',
    name: 'Redirect Web Searches to Default Browser',
    description: 'Stops Windows from forcing search results, Settings links, Widgets, and other system shortcuts to open in Edge.',
    category: 'privacy',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Searches open in your preferred browser'
  },
  {
    id: 'privacy-disable-driver-updates',
    name: 'Disable Windows Driver Updates',
    description: 'Stops Windows from automatically updating your device drivers. Gives you more control over which drivers are installed.',
    category: 'privacy',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'No surprise driver updates'
  },
  {
    id: 'privacy-disable-vm-support',
    name: 'Disable VM Support',
    description: 'Disables virtual machine-related services and components to free up background resources.',
    category: 'privacy',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Less background services'
  },
]

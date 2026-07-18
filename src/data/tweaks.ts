import { Tweak, LicenseTier } from '@/types'

export const availableTweaks: Tweak[] = [
  // ── SYSTEM ──
{
    id: 'sys-high-performance',
    name: 'High Performance Power Plan',
    description: 'Switches to High Performance power plan for maximum CPU/GPU performance',
    category: 'system',
    requiredTier: LicenseTier.PREMIUM,
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
    requiredTier: LicenseTier.PRO,
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
    requiredTier: LicenseTier.PRO,
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
    requiredTier: LicenseTier.PREMIUM,
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
    requiredTier: LicenseTier.PRO,
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
    requiredTier: LicenseTier.PRO,
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
    requiredTier: LicenseTier.PRO,
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
    requiredTier: LicenseTier.PRO,
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
    requiredTier: LicenseTier.PREMIUM,
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
    requiredTier: LicenseTier.PREMIUM,
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
    requiredTier: LicenseTier.PRO,
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
    requiredTier: LicenseTier.PREMIUM,
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
    requiredTier: LicenseTier.PREMIUM,
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
    requiredTier: LicenseTier.PREMIUM,
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
    requiredTier: LicenseTier.PRO,
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
    requiredTier: LicenseTier.PREMIUM,
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
    requiredTier: LicenseTier.PRO,
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
    requiredTier: LicenseTier.PRO,
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
    requiredTier: LicenseTier.PRO,
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
    requiredTier: LicenseTier.PREMIUM,
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
    requiredTier: LicenseTier.PREMIUM,
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
    requiredTier: LicenseTier.PRO,
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
    requiredTier: LicenseTier.PRO,
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
    requiredTier: LicenseTier.PRO,
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
    requiredTier: LicenseTier.PRO,
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
    requiredTier: LicenseTier.PRO,
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
    requiredTier: LicenseTier.PRO,
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
  {
    id: 'sys-disable-tips',
    name: 'Disable Windows Tips & Suggestions',
    description: 'Turns off Windows tip notifications, suggested apps, and promotional content in the Settings app.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Fewer distracting notifications'
  },
  {
    id: 'sys-disable-lockscreen-spotlight',
    name: 'Disable Lock Screen Spotlight',
    description: 'Turns off Windows Spotlight ads and tips on the lock screen.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Cleaner lock screen'
  },
  {
    id: 'sys-disable-start-suggestions',
    name: 'Disable Start Menu Suggestions',
    description: 'Removes suggested apps and promoted apps from the Start Menu.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Cleaner Start Menu'
  },
  {
    id: 'sys-disable-error-reporting',
    name: 'Disable Windows Error Reporting',
    description: 'Turns off the Windows Error Reporting service that sends crash data to Microsoft.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'No background error reporting during gaming'
  },
  {
    id: 'sys-disable-delivery-optimization',
    name: 'Disable Delivery Optimization',
    description: 'Stops Windows from using your bandwidth to upload updates to other PCs on the internet.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'No background upload bandwidth usage'
  },
  {
    id: 'sys-disable-location',
    name: 'Disable Location Tracking',
    description: 'Turns off Windows location services and location history.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'No background location services'
  },
  {
    id: 'sys-disable-find-my-device',
    name: 'Disable Find My Device',
    description: 'Turns off the Find My Device tracking feature. Reduces background activity.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Less background tracking'
  },
  {
    id: 'sys-disable-activity-history',
    name: 'Disable Activity History',
    description: 'Stops Windows from collecting your activity history (Timeline). Frees RAM and disk usage.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Less background data collection'
  },
  {
    id: 'sys-disable-widgets',
    name: 'Disable Widgets',
    description: 'Turns off the Windows Widgets board and its background data fetching.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'No widget background processes'
  },
  {
    id: 'sys-disable-taskbar-search',
    name: 'Disable Taskbar Search Box',
    description: 'Removes the search box/icon from the taskbar. Frees taskbar space and reduces background indexing.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Cleaner taskbar, less indexing'
  },
  {
    id: 'sys-disable-cortana',
    name: 'Disable Cortana',
    description: 'Turns off Cortana assistant and its background listening/data collection.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'No background voice processing'
  },
  {
    id: 'sys-disable-cloud-clipboard',
    name: 'Disable Cloud Clipboard',
    description: 'Turns off cross-device clipboard sync. Reduces background network activity.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'No background clipboard sync'
  },
  {
    id: 'sys-disable-meet-now',
    name: 'Disable Meet Now Icon',
    description: 'Removes the Meet Now video chat icon from the taskbar notification area.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Cleaner taskbar'
  },
  {
    id: 'sys-disable-people-bar',
    name: 'Disable People Bar',
    description: 'Removes the People bar icon from the taskbar.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Cleaner taskbar'
  },
  {
    id: 'sys-disable-search-highlights',
    name: 'Disable Search Highlights',
    description: 'Turns off the promotional highlights and trending searches in Windows Search.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Cleaner search experience'
  },
  {
    id: 'sys-disable-taskbar-feed',
    name: 'Disable Taskbar News Feed',
    description: 'Turns off News and Interests / Info that shows weather and news on the taskbar.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Cleaner taskbar, no background news fetching'
  },
  {
    id: 'sys-disable-lockscreen-notifications',
    name: 'Disable Lock Screen Notifications',
    description: 'Hides app notifications on the lock screen for more privacy and less clutter.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Cleaner lock screen'
  },
  {
    id: 'sys-disable-action-center',
    name: 'Disable Action Center',
    description: 'Turns off the Action Center notification panel. Removes background notification syncing.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'No notification pop-ups during gaming'
  },
  {
    id: 'sys-disable-scheduled-defrag',
    name: 'Disable Scheduled Disk Defragmentation',
    description: 'Turns off the automatic weekly disk defragmentation task that can cause disk I/O spikes.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'No surprise disk defrag during gaming'
  },

  // ── NEW TWEAKS ──

  // NETWORK
  {
    id: 'net-disable-nagle',
    name: 'Disable Nagle\'s Algorithm',
    description: 'Disables Nagle\'s Algorithm to send packets immediately instead of buffering small ones, reducing network latency.',
    category: 'network',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Lower network latency, faster packet delivery'
  },
  {
    id: 'net-disable-power-saving',
    name: 'Disable Network Adapter Power Saving',
    description: 'Prevents the network adapter from entering power-saving states that cause latency spikes.',
    category: 'network',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'No latency spikes from adapter power transitions'
  },

  // SYSTEM
  {
    id: 'sys-enable-ultimate-performance',
    name: 'Enable Ultimate Performance Power Plan',
    description: 'Activates the Ultimate Performance power plan for maximum CPU/GPU performance with zero throttling.',
    category: 'system',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'none',
    gamingImpact: 'Absolute maximum CPU/GPU performance'
  },
  {
    id: 'sys-disable-animations',
    name: 'Disable Windows Animations',
    description: 'Turns off window minimize/maximize animations and other UI transitions for a snappier feel.',
    category: 'system',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Snappier UI, less GPU usage on desktop'
  },
  {
    id: 'sys-disable-transparency',
    name: 'Disable Transparency Effects',
    description: 'Disables Windows transparency effects (acrylic, blur) to free GPU resources.',
    category: 'system',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'GPU savings from no transparency rendering'
  },
  {
    id: 'sys-disable-fast-startup',
    name: 'Disable Fast Startup',
    description: 'Disables Windows Fast Startup for cleaner boots. Prevents stale driver states from hibernation.',
    category: 'system',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Cleaner boot, no stale driver issues'
  },
  {
    id: 'sys-disable-sticky-keys',
    name: 'Disable Sticky Keys',
    description: 'Disables the Sticky Keys popup that appears when pressing Shift 5 times, which interrupts gaming.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'No Sticky Keys popup during gaming'
  },
  {
    id: 'sys-disable-filter-keys',
    name: 'Disable Filter Keys',
    description: 'Disables Filter Keys which can cause keyboard input lag by filtering repeated keystrokes.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'No keyboard input filtering lag'
  },
  {
    id: 'sys-disable-toggle-keys',
    name: 'Disable Toggle Keys',
    description: 'Disables the beeping sound when Caps Lock, Num Lock, or Scroll Lock is pressed.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'No toggle key beeps during gaming'
  },
  {
    id: 'sys-disable-mouse-trails',
    name: 'Disable Mouse Trails',
    description: 'Disables mouse pointer trails which can interfere with precise aiming.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Cleaner mouse pointer, no trail artifacts'
  },

  // STORAGE
  {
    id: 'storage-enable-write-cache',
    name: 'Enable Write Caching',
    description: 'Enables write caching on storage devices for faster write operations.',
    category: 'storage',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Faster game saves and level loading'
  },
  {
    id: 'storage-disable-ahci-link-power',
    name: 'Disable AHCI Link Power Management',
    description: 'Prevents SATA/AHCI link from entering power-saving states that cause latency spikes.',
    category: 'storage',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'No disk latency spikes from link power transitions'
  },

  // WINDOWS
  {
    id: 'sys-disable-task-view',
    name: 'Disable Task View Button',
    description: 'Removes the Task View button from the taskbar to free space.',
    category: 'windows',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Cleaner taskbar'
  },
  {
    id: 'sys-disable-clipboard-history',
    name: 'Disable Clipboard History',
    description: 'Turns off Windows clipboard history to reduce background memory usage.',
    category: 'windows',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Less background memory usage'
  },
  {
    id: 'sys-disable-feedback',
    name: 'Disable Windows Feedback',
    description: 'Turns off Windows feedback notifications and data collection.',
    category: 'windows',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'No feedback popups'
  },
  {
    id: 'sys-disable-suggested-content',
    name: 'Disable Suggested Content in Settings',
    description: 'Removes suggested tips and promotional content from the Windows Settings app.',
    category: 'windows',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Cleaner Settings experience'
  },
  {
    id: 'sys-disable-web-search',
    name: 'Disable Web Search in Start Menu',
    description: 'Stops Windows from showing web search results in the Start Menu for faster local search.',
    category: 'windows',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Faster Start Menu search'
  },

  // ── DEBLOAT ──
  {
    id: 'debloat-remove-store-bloatware',
    name: 'Remove Windows Store Bloatware',
    description: 'Removes pre-installed Windows Store apps like Candy Crush, Solitaire, Spotify, Disney+ and other bloatware that run in the background.',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Less background processes and disk usage from pre-installed apps'
  },
  {
    id: 'debloat-remove-onedrive',
    name: 'Disable OneDrive Integration',
    description: 'Unhooks OneDrive from Windows Explorer and stops it from auto-starting and syncing in the background.',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'No background OneDrive sync consuming bandwidth and CPU'
  },
  {
    id: 'debloat-clean-temp-files',
    name: 'Deep Clean Temp Files',
    description: 'Removes Windows temp files, browser caches, Windows Update leftovers, and other system junk files.',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Frees disk space and reduces I/O overhead'
  },
  {
    id: 'debloat-disable-telemetry',
    name: 'Disable Windows Telemetry',
    description: 'Stops the Connected User Experiences and Telemetry service that collects and sends usage data to Microsoft.',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'No background telemetry collection during gaming'
  },
  {
    id: 'debloat-remove-news-widget',
    name: 'Remove News and Weather Widget',
    description: 'Disables the News and Interests widget on the taskbar that fetches content in the background.',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'No background news/weather data fetching'
  },
  {
    id: 'debloat-disable-web-experience',
    name: 'Disable Web Experience Pack',
    description: 'Removes the Windows Web Experience Pack that powers web-based features in Start menu and Search.',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'low',
    gamingImpact: 'Less background web content loading'
  },
  {
    id: 'debloat-disable-background-access',
    name: 'Disable Background App Access',
    description: 'Prevents Store apps from running in the background, accessing camera, microphone, and location when not in use.',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'No background app activity consuming resources'
  },
  {
    id: 'debloat-disable-store-updates',
    name: 'Disable Store Auto-Updates',
    description: 'Stops Microsoft Store from automatically updating apps in the background, saving bandwidth and disk I/O.',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'low',
    gamingImpact: 'No surprise Store updates during gaming'
  },
  {
    id: 'debloat-remove-xbox-packages',
    name: 'Remove Xbox Packages',
    description: 'Removes Xbox Game Bar, Xbox Identity Provider, and other Xbox-related UWP packages at a deeper level.',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'No Xbox background services consuming resources'
  },

  // ── GPU ──
  {
    id: 'gpu-max-performance-mode',
    name: 'GPU Maximum Performance Mode',
    description: 'Sets your GPU power management to maximum performance, preventing clock speed drops during gaming.',
    category: 'gpu',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'high',
    risk: 'none',
    gamingImpact: 'Consistent GPU clock speeds, no frequency drops during gameplay'
  },
  {
    id: 'gpu-disable-power-gating',
    name: 'Disable GPU Power Gating',
    description: 'Prevents the GPU from entering power gating states that cause latency spikes when waking up.',
    category: 'gpu',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'No GPU wake-up latency spikes'
  },
  {
    id: 'gpu-optimize-shader-cache',
    name: 'Optimize Shader Cache',
    description: 'Configures GPU shader cache settings for faster loading and reduced stuttering in games.',
    category: 'gpu',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Faster game loading, fewer shader compilation stutters'
  },
  {
    id: 'gpu-disable-var-shading',
    name: 'Disable Variable Rate Shading',
    description: 'Disables Variable Rate Shading (VRS) which can introduce uneven visual quality in competitive games.',
    category: 'gpu',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Consistent visual quality across the entire frame'
  },
  {
    id: 'gpu-set-preferred-mode',
    name: 'Set GPU Preferred Mode',
    description: 'Configures the GPU to prefer performance over power saving in Windows display settings.',
    category: 'gpu',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'GPU always runs in high-performance mode for gaming'
  },
  {
    id: 'gpu-disable-frame-pacing',
    name: 'Disable Frame Pacing',
    description: 'Disables driver-level frame pacing for maximum FPS in competitive scenarios where smoothness is less important than raw frame rate.',
    category: 'gpu',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Uncapped frame output for competitive edge'
  },

  // ── GAMING ──
  {
    id: 'game-optimize-priority',
    name: 'Set Game Process Priority',
    description: 'Automatically sets game processes to high priority for more CPU time and fewer context switches.',
    category: 'gaming',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Games get more CPU time, fewer frame drops from CPU contention'
  },
  {
    id: 'game-disable-dvr',
    name: 'Disable Game DVR',
    description: 'Turns off Windows Game DVR recording which constantly buffers gameplay footage in the background.',
    category: 'gaming',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'high',
    risk: 'none',
    gamingImpact: 'Frees GPU and disk resources used by background recording'
  },
  {
    id: 'game-optimize-scheduler',
    name: 'Optimize Game Scheduler',
    description: 'Configures Windows thread scheduler for optimal gaming by prioritizing foreground threads and reducing latency.',
    category: 'gaming',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'More responsive game thread scheduling, fewer micro-stutters'
  },
  {
    id: 'game-disable-game-bar-tips',
    name: 'Disable Game Bar Tips',
    description: 'Disables Game Bar popup tips, achievement notifications, and game reminder popups that interrupt gaming.',
    category: 'gaming',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'No Game Bar popup interruptions during gaming'
  },
  {
    id: 'game-disable-background-recording',
    name: 'Disable Background Recording',
    description: 'Turns off the Windows background recording feature that constantly captures the last 30 seconds of gameplay.',
    category: 'gaming',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'high',
    risk: 'none',
    gamingImpact: 'Frees GPU encoding resources and disk I/O'
  },
  {
    id: 'game-optimize-fullscreen',
    name: 'Optimize Fullscreen Exclusive',
    description: 'Forces true exclusive fullscreen mode in games for the lowest possible input lag and maximum frame delivery.',
    category: 'gaming',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Lowest input lag, bypasses Desktop Window Manager'
  },
  {
    id: 'game-disable-hags',
    name: 'Disable Hardware GPU Scheduling',
    description: 'Disables Hardware-Accelerated GPU Scheduling which can introduce latency in some games.',
    category: 'gaming',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'More predictable frame timing in latency-sensitive games'
  },
  {
    id: 'game-optimize-shader-cache',
    name: 'Optimize Game Shader Cache',
    description: 'Optimizes Windows shader cache settings for faster game loading and reduced stuttering during first-time play.',
    category: 'gaming',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Faster game loading, fewer shader compilation stutters'
  },
  {
    id: 'game-io-priority',
    name: 'Set Game I/O Priority',
    description: 'Sets disk I/O priority to high for game processes, reducing load times and texture streaming hitches.',
    category: 'gaming',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Faster asset loading, fewer texture streaming stutters'
  },
  {
    id: 'game-memory-priority',
    name: 'Optimize Game Memory Priority',
    description: 'Sets Windows memory priority to foreground for games, reducing page file usage and memory pressure.',
    category: 'gaming',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'More RAM available for games, fewer memory-related stutters'
  },
  {
    id: 'game-disable-game-bar-complete',
    name: 'Disable Game Bar Completely',
    description: 'Fully disables the Xbox Game Bar overlay, recording, and all related features.',
    category: 'gaming',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'No Game Bar overlay or background processes at all'
  },
  {
    id: 'game-optimize-directx',
    name: 'Optimize DirectX Settings',
    description: 'Configures DirectX for lowest latency with forced hardware acceleration and disabled debug layers.',
    category: 'gaming',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Lower rendering latency, faster draw calls'
  },
  {
    id: 'game-optimize-foreground-timer',
    name: 'Optimize Foreground Timer',
    description: 'Sets timer resolution specifically for foreground game processes to 1ms for the smoothest frame pacing.',
    category: 'gaming',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Smoothest possible frame timing in games'
  },
  {
    id: 'game-disable-steam-overlay',
    name: 'Disable Steam Overlay',
    description: 'Disables the Steam overlay for all games to prevent FPS drops and stuttering from overlay rendering.',
    category: 'gaming',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'No overlay FPS drops, lower input latency in Steam games'
  },
  {
    id: 'game-optimize-cpu-affinity',
    name: 'Optimize Game CPU Affinity',
    description: 'Configures CPU affinity to prefer performance cores (P-cores) for game processes on hybrid CPUs.',
    category: 'gaming',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Games run on fastest CPU cores, fewer E-core scheduling issues'
  },
  {
    id: 'game-disable-nagles-algorithm',
    name: 'Disable Game Network Nagle',
    description: 'Disables Nagle\'s algorithm specifically for game network sockets for lowest packet latency.',
    category: 'gaming',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'high',
    risk: 'none',
    gamingImpact: 'Lowest network latency for online competitive gaming'
  },
  {
    id: 'game-optimize-udp-buffer',
    name: 'Optimize UDP Buffer Size',
    description: 'Increases UDP send/receive buffer sizes for better online gaming performance and less packet loss.',
    category: 'gaming',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Less packet loss in online games, better hit registration'
  },
  {
    id: 'game-disable-animations',
    name: 'Disable Game Animations',
    description: 'Disables Windows animations and transitions when games are in focus for maximum FPS.',
    category: 'gaming',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'No animation overhead during gameplay'
  },
  {
    id: 'game-optimize-pagefile',
    name: 'Optimize Game Pagefile',
    description: 'Configures the pagefile to be fixed-size to prevent fragmentation and dynamic resizing during gaming.',
    category: 'gaming',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'No page file resizing stutters during gaming'
  },
  {
    id: 'game-disable-powersaving-gpu',
    name: 'Disable GPU Power Saving in Games',
    description: 'Forces the GPU to maximum clock speed when any game process is detected running.',
    category: 'gaming',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'none',
    gamingImpact: 'GPU runs at maximum clocks during all gaming sessions'
  },

  // ── NETWORK ──
  {
    id: 'net-optimize-mtu',
    name: 'Optimize MTU Size',
    description: 'Configures the optimal MTU (Maximum Transmission Unit) size to prevent packet fragmentation and reduce latency.',
    category: 'network',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'No packet fragmentation, lower network latency'
  },
  {
    id: 'net-disable-network-throttling',
    name: 'Disable Network Throttling',
    description: 'Removes the Windows network throttling index that limits non-multimedia traffic to 10 packets/ms.',
    category: 'network',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'No artificial network speed limits during gaming'
  },
  {
    id: 'net-optimize-connection-limits',
    name: 'Optimize Connection Limits',
    description: 'Increases maximum concurrent connections for faster game server connections and CDN downloads.',
    category: 'network',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Faster game downloads and server connections'
  },
  {
    id: 'net-disable-netbios',
    name: 'Disable NetBIOS',
    description: 'Disables NetBIOS over TCP/IP which is a legacy protocol that adds network overhead and security risk.',
    category: 'network',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'low',
    gamingImpact: 'Less network overhead, improved security'
  },

  // ── AUDIO ──
  {
    id: 'audio-optimize-buffer-size',
    name: 'Optimize Audio Buffer Size',
    description: 'Reduces the audio buffer size for the lowest possible audio latency in gaming and streaming.',
    category: 'audio',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Lowest audio latency for competitive gaming'
  },
  {
    id: 'audio-disable-spatial-sound',
    name: 'Disable Spatial Sound',
    description: 'Disables Windows Sonic and Dolby Atmos spatial sound processing to reduce audio processing overhead.',
    category: 'audio',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Lower audio processing latency'
  },
  {
    id: 'audio-set-exclusive-mode',
    name: 'Set Audio Exclusive Mode',
    description: 'Allows applications to take exclusive control of the audio device for lowest possible latency.',
    category: 'audio',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Direct audio device access, minimum latency'
  },
  {
    id: 'audio-disable-midi-synth',
    name: 'Disable MIDI Synthesizer',
    description: 'Disables the UWP MIDI synthesizer service that runs in the background consuming resources.',
    category: 'audio',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Less background audio service overhead'
  },

  // ── SYSTEM ──
  {
    id: 'sys-set-timer-resolution',
    name: 'Force High-Resolution Timer',
    description: 'Forces the Windows system timer to 0.5ms resolution for the smoothest possible frame timing.',
    category: 'system',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Smoothest frame pacing, reduced input lag'
  },
  {
    id: 'sys-disable-power-throttling',
    name: 'Disable Power Throttling',
    description: 'Disables Windows Power Throttling that limits CPU performance of background processes and can affect foreground apps.',
    category: 'system',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'No CPU throttling during gaming, consistent performance'
  },
  {
    id: 'sys-optimize-interrupts',
    name: 'Optimize Interrupt Affinity',
    description: 'Distributes hardware interrupts across CPU cores to prevent single-core bottlenecks.',
    category: 'system',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'More balanced CPU usage, fewer interrupt-induced stutters'
  },
  {
    id: 'sys-disable-spectre-mitigations',
    name: 'Disable Spectre Mitigations',
    description: 'Disables CPU Spectre and Meltdown security mitigations for higher performance at the cost of security.',
    category: 'system',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'high',
    gamingImpact: 'Up to 15% CPU performance gain from removing mitigation overhead'
  },
  {
    id: 'sys-use-platform-clock',
    name: 'Force Platform Clock',
    description: 'Forces Windows to use the platform clock instead of the HPET for more accurate and consistent timing.',
    category: 'system',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'More consistent frame timing, reduced DPC latency'
  },
  {
    id: 'sys-disable-dynamic-tick',
    name: 'Disable Dynamic Tick',
    description: 'Disables the Windows dynamic tick feature that can cause inconsistent timer intervals.',
    category: 'system',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Consistent timer intervals for smoother gameplay'
  },

  // ── ADDITIONAL TWEAKS ──

  // STORAGE
  {
    id: 'storage-optimize-defrag',
    name: 'Schedule SSD Optimization',
    description: 'Configures automatic weekly TRIM optimization for all SSD volumes to maintain peak performance.',
    category: 'storage',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Consistent SSD performance over time'
  },
  {
    id: 'storage-set-io-priority',
    name: 'Optimize Disk I/O Priority',
    description: 'Sets higher I/O priority for system processes to reduce disk contention during gaming.',
    category: 'storage',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Faster asset loading, fewer disk-related stutters'
  },
  {
    id: 'storage-disable-indexing',
    name: 'Disable Windows Search Indexing',
    description: 'Turns off the Windows Search indexing service to reduce background disk I/O.',
    category: 'storage',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'No background disk indexing during gaming'
  },

  // NETWORK
  {
    id: 'net-optimize-dns-cache',
    name: 'Optimize DNS Cache',
    description: 'Increases DNS cache timeout and size to reduce DNS lookup latency during gaming.',
    category: 'network',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Faster DNS resolution for game servers'
  },
  {
    id: 'net-disable-ecns',
    name: 'Disable ECN Capability',
    description: 'Disables Explicit Congestion Notification which can cause packet drops on some networks.',
    category: 'network',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Fewer packet drops on congested networks'
  },
  {
    id: 'net-optimize-rss',
    name: 'Optimize Receive Side Scaling',
    description: 'Enables and configures RSS to distribute network processing across CPU cores.',
    category: 'network',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Better network throughput on multi-core CPUs'
  },

  // SYSTEM
  {
    id: 'sys-optimize-file-cache',
    name: 'Optimize File System Cache',
    description: 'Tunes the NTFS file system cache for lower latency and better gaming performance.',
    category: 'system',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Faster file access, lower disk latency'
  },
  {
    id: 'sys-disable-prefetch',
    name: 'Disable Prefetch',
    description: 'Disables Windows Prefetch which can cause disk I/O spikes during gaming.',
    category: 'system',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'No prefetch disk I/O spikes during gaming'
  },
  {
    id: 'sys-optimize-context-menu',
    name: 'Optimize Context Menu Speed',
    description: 'Reduces the context menu display delay for faster right-click menus.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Faster context menus'
  },
  {
    id: 'sys-clear-system-cache',
    name: 'Clear System File Cache',
    description: 'Clears the Windows file system cache to free up RAM and reduce disk I/O.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'More available RAM for games'
  },
  {
    id: 'sys-optimize-dpc-latency',
    name: 'Optimize DPC Latency',
    description: 'Reduces Deferred Procedure Call latency for smoother audio and input handling.',
    category: 'system',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'No audio crackling, smoother input processing'
  },

  // AUDIO
  {
    id: 'audio-disable-low-latency',
    name: 'Disable Low Latency Audio Policy',
    description: 'Disables Windows low-latency audio policy that can cause audio glitches in some games.',
    category: 'audio',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Fewer audio glitches in games'
  },
  {
    id: 'audio-optimize-sample-rate',
    name: 'Optimize Audio Sample Rate',
    description: 'Sets audio output to 48kHz for optimal gaming audio compatibility and lower latency.',
    category: 'audio',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Optimal audio format for games'
  },

  // PRIVACY
  {
    id: 'privacy-disable-ad-id',
    name: 'Disable Advertising ID',
    description: 'Turns off the Windows advertising identifier to prevent ad tracking.',
    category: 'privacy',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'No ad tracking overhead'
  },
  {
    id: 'privacy-disable-app-launch',
    name: 'Disable App Launch Tracking',
    description: 'Stops Windows from tracking which apps you launch for personalized recommendations.',
    category: 'privacy',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Less background tracking'
  },

  // GAMING
  {
    id: 'game-disable-fullscreen-boost',
    name: 'Disable Fullscreen Boost',
    description: 'Disables Windows fullscreen boost that can cause input lag in some games.',
    category: 'gaming',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Consistent input lag in all fullscreen games'
  },
  {
    id: 'game-optimize-network-priority',
    name: 'Optimize Game Network Priority',
    description: 'Sets QoS network priority for game traffic to reduce latency and packet loss.',
    category: 'gaming',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Lower ping, less packet loss in online games'
  },
  {
    id: 'game-disable-eco-mode',
    name: 'Disable GPU Eco Mode',
    description: 'Disables GPU energy-saving Eco Mode that reduces clock speeds during light gaming loads.',
    category: 'gaming',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'GPU maintains performance during light scenes'
  },

  // ── DEEP DEBLOAT ──
  {
    id: 'debloat-remove-edge',
    name: 'Remove Microsoft Edge',
    description: 'Completely uninstalls Microsoft Edge and prevents it from being reinstalled via Windows Update.',
    category: 'debloat',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'medium',
    gamingImpact: 'Removes background Edge processes and telemetry'
  },
  {
    id: 'debloat-remove-teams',
    name: 'Remove Microsoft Teams',
    description: 'Uninstalls the pre-installed Microsoft Teams consumer app and its background services.',
    category: 'debloat',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'No Teams background processes consuming resources'
  },
  {
    id: 'debloat-disable-copilot',
    name: 'Disable Windows Copilot',
    description: 'Turns off the Windows Copilot AI assistant and removes its taskbar button.',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'No Copilot background processes or taskbar distraction'
  },
  {
    id: 'debloat-remove-widgets-deep',
    name: 'Deep Remove Widgets',
    description: 'Completely removes the Widgets board, its background services, and web experience components.',
    category: 'debloat',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Eliminates all widget-related background processes'
  },

  // ── WINDOWS UPDATE ──
  {
    id: 'sys-pause-updates',
    name: 'Pause Windows Updates (35 Days)',
    description: 'Pauses Windows Update for the maximum 35 days to prevent unexpected restarts during gaming.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'No surprise update restarts during gaming sessions'
  },
  {
    id: 'sys-block-update-restart',
    name: 'Block Update Auto-Restart',
    description: 'Prevents Windows from automatically restarting to install updates while a game is running.',
    category: 'system',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Guarantees no forced restarts during active gaming'
  },
  {
    id: 'sys-defer-feature-updates',
    name: 'Defer Feature Updates (365 Days)',
    description: 'Defers major Windows feature updates for up to 1 year for maximum stability.',
    category: 'system',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'No breaking changes from feature updates mid-season'
  },

  // ── TELEMETRY FIREWALL ──
  {
    id: 'net-block-telemetry-firewall',
    name: 'Block Telemetry via Firewall',
    description: 'Creates outbound firewall rules to block known Microsoft telemetry endpoints.',
    category: 'network',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Zero telemetry traffic leaving your system'
  },
  {
    id: 'net-block-edge-firewall',
    name: 'Block Edge Telemetry via Firewall',
    description: 'Blocks Microsoft Edge telemetry and background connection attempts at the firewall level.',
    category: 'network',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'No Edge background connections during gaming'
  },

  // ── CPU POWER ──
  {
    id: 'cpu-disable-idle-states',
    name: 'Disable CPU Idle States (C-States)',
    description: 'Disables CPU C-states to eliminate core parking/wake latency for consistent performance.',
    category: 'system',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'medium',
    gamingImpact: 'Zero CPU wake latency, consistent frame times'
  },
  {
    id: 'cpu-max-performance-bios',
    name: 'Set CPU Max Performance (BIOS Hint)',
    description: 'Documents recommended BIOS settings: disable C-states, SpeedStep, Turbo Boost for gaming.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'high',
    risk: 'none',
    gamingImpact: 'BIOS-level CPU optimization guide for maximum performance'
  },

  // ── GPU POWER ──
  {
    id: 'gpu-disable-ulps',
    name: 'Disable GPU ULPS',
    description: 'Disables Ultra Low Power State for AMD/NVIDIA GPUs to prevent clock drops in light scenes.',
    category: 'gpu',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'GPU clocks stay high during all gaming scenes'
  },
  {
    id: 'gpu-set-power-limit-max',
    name: 'Set GPU Power Limit to Maximum',
    description: 'Sets GPU power target to maximum via NVIDIA/AMD driver for sustained boost clocks.',
    category: 'gpu',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Maximum sustained GPU boost clocks'
  },

  // ── PROCESS PRIORITY ──
  {
    id: 'sys-realtime-priority-games',
    name: 'Set Game Processes to Realtime Priority',
    description: 'Automatically sets detected game processes to Realtime priority to Realtime priority for absolute CPU preference.',
    category: 'gaming',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'high',
    gamingImpact: 'Games get absolute CPU priority over everything else'
  },
  {
    id: 'sys-foreground-boost',
    name: 'Maximize Foreground Boost',
    description: 'Sets Windows foreground priority boost to maximum for instant response to input.',
    category: 'system',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Instant foreground response, zero input delay'
  },

  // ── GAME CONFIG FILES ──
  {
    id: 'game-fortnite-ini-optimize',
    name: 'Optimize Fortnite GameUserSettings.ini',
    description: 'Applies competitive Fortnite settings: TSR Native, 1680x1080, max render quality, read-only config.',
    category: 'gaming',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Competitive Fortnite settings applied automatically'
  },
  {
    id: 'game-valorant-cfg-optimize',
    name: 'Optimize Valorant Config',
    description: 'Applies low-latency Valorant settings: disable VSync, max FPS, low graphics, raw input.',
    category: 'gaming',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Valorant optimized for minimum input lag'
  },
  {
    id: 'game-cs2-cfg-optimize',
    name: 'Optimize CS2 Config',
    description: 'Applies competitive CS2 settings: raw input, disable VSync, max FPS, low shader detail.',
    category: 'gaming',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'CS2 optimized for competitive play'
  },
  {
    id: 'game-apex-cfg-optimize',
    name: 'Optimize Apex Legends Config',
    description: 'Applies low-latency Apex settings: disable VSync, adaptive resolution off, max FPS.',
    category: 'gaming',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Apex optimized for minimum input lag'
  },

  // WINDOWS UPDATE
  {
    id: 'wu-disable-auto-update',
    name: 'Disable Windows Auto Update',
    description: 'Prevents Windows from automatically downloading and installing updates.',
    category: 'windows',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'medium',
    gamingImpact: 'Prevents unexpected updates during gaming sessions'
  },
  {
    id: 'wu-disable-restart-reminder',
    name: 'Disable Restart Reminders',
    description: 'Stops Windows from nagging you to restart after updates.',
    category: 'windows',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'No restart popups during gaming'
  },
  {
    id: 'wu-pause-updates-30days',
    name: 'Pause Updates 30 Days',
    description: 'Pauses Windows Update for 30 days via registry.',
    category: 'windows',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'medium',
    gamingImpact: 'No update downloads consuming bandwidth'
  },
  {
    id: 'wu-disable-drivers-update',
    name: 'Disable Driver Auto Updates',
    description: 'Prevents Windows Update from automatically updating drivers.',
    category: 'windows',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Prevents driver updates from breaking GPU settings'
  },
  {
    id: 'wu-disable-office-updates',
    name: 'Disable Office Auto Updates',
    description: 'Prevents Microsoft Office from auto-updating in background.',
    category: 'windows',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Office won\'t download updates during gaming'
  },

  // EDGE / BROWSER
  {
    id: 'edge-disable-startup-boost',
    name: 'Disable Edge Startup Boost',
    description: 'Prevents Edge from pre-launching at startup to save resources.',
    category: 'windows',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Less background RAM usage'
  },
  {
    id: 'edge-disable-background-tabs',
    name: 'Disable Edge Background Tabs',
    description: 'Prevents Edge from running background tabs when unfocused.',
    category: 'windows',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Browser tabs won\'t consume resources while gaming'
  },
  {
    id: 'edge-disable-preloading',
    name: 'Disable Edge Tab Preloading',
    description: 'Disables Edge tab preloading/pre-rendering to save CPU and RAM.',
    category: 'windows',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'No background CPU usage from browser'
  },
  {
    id: 'chrome-disable-background-apps',
    name: 'Disable Chrome Background Apps',
    description: 'Prevents Chrome from running background apps when closed.',
    category: 'windows',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Chrome fully stops when closed'
  },
  {
    id: 'chrome-disable-renderer-bg',
    name: 'Disable Chrome Renderer Background',
    description: 'Disables Chrome background renderer processes.',
    category: 'windows',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Frees CPU cycles for gaming'
  },
  {
    id: 'browser-disable-hw-accel',
    name: 'Disable Browser Hardware Acceleration',
    description: 'Disables GPU hardware acceleration in browsers to free GPU for games.',
    category: 'windows',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Browser won\'t compete with games for GPU'
  },

  // POWER PLANS
  {
    id: 'power-ultimate-performance',
    name: 'Enable Ultimate Performance Plan',
    description: 'Activates the hidden Ultimate Performance power plan for maximum performance.',
    category: 'system',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Maximum CPU and GPU power delivery'
  },
  {
    id: 'power-disable-power-saving',
    name: 'Disable Power Saving Mode',
    description: 'Ensures power saving features don\'t throttle performance.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'CPU won\'t downclock during gaming'
  },
  {
    id: 'power-disable-sleep',
    name: 'Disable Sleep Mode',
    description: 'Prevents the system from entering sleep mode.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'System won\'t sleep during long downloads'
  },
  {
    id: 'power-disable-hibernate',
    name: 'Disable Hibernate',
    description: 'Disables hibernation to free disk space and prevent slow resume.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Frees SSD space, faster shutdown'
  },
  {
    id: 'power-disable-link-state',
    name: 'Disable PCI Express Link State',
    description: 'Disables PCI Express power management link states for maximum GPU bandwidth.',
    category: 'system',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Maximum PCIe bandwidth for GPU'
  },
  {
    id: 'power-disable-processor-c-states',
    name: 'Disable CPU C-States',
    description: 'Disables CPU idle states for consistent low-latency performance.',
    category: 'system',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Zero CPU latency spikes from idle transitions'
  },

  // SERVICES
  {
    id: 'svc-disable-sysmain',
    name: 'Disable SysMain (Superfetch)',
    description: 'Disables Superfetch/SysMain service that preloads apps into RAM.',
    category: 'system',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Frees RAM for games instead of prefetching apps'
  },
  {
    id: 'svc-disable-diagtrack',
    name: 'Disable Diagnostic Tracking',
    description: 'Disables the Connected User Experiences and Telemetry service.',
    category: 'privacy',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'No telemetry data collection consuming CPU'
  },
  {
    id: 'svc-disable-wsearch',
    name: 'Disable Windows Search Indexer',
    description: 'Disables the Windows Search indexing service.',
    category: 'system',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'No background disk reads from indexing'
  },
  {
    id: 'svc-disable-tablet-input',
    name: 'Disable Tablet Input Service',
    description: 'Disables the Touch Keyboard and Handwriting Panel service.',
    category: 'input',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Frees resources on non-touch devices'
  },
  {
    id: 'svc-disable-bluetooth-av',
    name: 'Disable Bluetooth Audio',
    description: 'Disables Bluetooth Audio Gateway service to save resources.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'low',
    gamingImpact: 'No Bluetooth overhead if not using BT devices'
  },
  {
    id: 'svc-disable-windows-error',
    name: 'Disable Windows Error Reporting',
    description: 'Disables the Windows Error Reporting service.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'No crash report dialogs during gaming'
  },
  {
    id: 'svc-disable-print-spooler',
    name: 'Disable Print Spooler',
    description: 'Disables the print spooler service when no printer is needed.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'low',
    gamingImpact: 'Frees resources if no printer is used'
  },
  {
    id: 'svc-disable-remote-registry',
    name: 'Disable Remote Registry',
    description: 'Disables remote registry access for security and performance.',
    category: 'privacy',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Security hardening + minor CPU savings'
  },
  {
    id: 'svc-disable-xbox-live',
    name: 'Disable Xbox Live Services',
    description: 'Disables Xbox Live networking and auth services.',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'low',
    gamingImpact: 'Frees resources if not using Xbox features'
  },
  {
    id: 'svc-disable-phone-link',
    name: 'Disable Phone Link Service',
    description: 'Disables the Phone Link / Your Phone companion service.',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'No background sync overhead'
  },

  // GPU POWER
  {
    id: 'gpu-disable-ulps',
    name: 'Disable GPU Ultra Low Power State',
    description: 'Disables AMD/NVIDIA ULPS to prevent GPU from entering deep sleep states.',
    category: 'gpu',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Prevents GPU latency spikes from power state transitions'
  },
  {
    id: 'gpu-set-power-limit-max',
    name: 'Max GPU Power Limit',
    description: 'Sets GPU power limit to maximum for sustained boost clocks.',
    category: 'gpu',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'GPU maintains maximum boost clocks'
  },
  {
    id: 'gpu-disable-power-gating',
    name: 'Disable GPU Power Gating',
    description: 'Prevents GPU from power-gating shader cores during gameplay.',
    category: 'gpu',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'All GPU cores active during gaming'
  },
  {
    id: 'gpu-enable-hw-scheduler',
    name: 'GPU Hardware Scheduling',
    description: 'Enables GPU hardware-accelerated scheduling for lower latency.',
    category: 'gpu',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'GPU manages its own scheduling for lower latency'
  },
  {
    id: 'gpu-optimize-shader-cache',
    name: 'Optimize Shader Cache',
    description: 'Optimizes GPU shader cache settings for faster game loading.',
    category: 'gpu',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Faster shader compilation, less stuttering'
  },
  {
    id: 'gpu-disable-preemption',
    name: 'Disable GPU Preemption',
    description: 'Disables GPU preemption for uninterrupted frame rendering.',
    category: 'gpu',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'No GPU context switch interruptions during gaming'
  },
  {
    id: 'gpu-optimize-render-schedule',
    name: 'Optimize Render Scheduling',
    description: 'Enables GPU render scheduling for reduced frame latency.',
    category: 'gpu',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Smoother frame delivery'
  },
  {
    id: 'gpu-disable-mpo',
    name: 'Disable Multi-Plane Overlay',
    description: 'Disables MPO to fix stuttering and frame pacing issues on some GPUs.',
    category: 'gpu',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Fixes micro-stuttering on some configurations'
  },

  // REGISTRY DEEP
  {
    id: 'reg-mmcss-priority',
    name: 'Optimize MMCSS Priority',
    description: 'Sets Multimedia Class Scheduler Service to prioritize gaming threads.',
    category: 'system',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Games get higher scheduling priority'
  },
  {
    id: 'reg-timer-resolution',
    name: 'Enable High Resolution Timer',
    description: 'Enables 0.5ms timer resolution for ultra-low input latency.',
    category: 'system',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Lower input lag from finer timer granularity'
  },
  {
    id: 'reg-priority-separation',
    name: 'Optimize Priority Separation',
    description: 'Sets the system to 26 for optimal foreground app performance.',
    category: 'system',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Foreground games get more CPU time slices'
  },
  {
    id: 'reg-system-clock-res',
    name: 'System Clock Resolution',
    description: 'Forces system clock to maximum resolution for reduced latency.',
    category: 'system',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'More precise timing for game engines'
  },
  {
    id: 'reg-gaming-scheduler',
    name: 'Game Scheduling Optimization',
    description: 'Configures Windows scheduler for gaming-optimized thread scheduling.',
    category: 'system',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'CPU scheduler favors game threads'
  },
  {
    id: 'reg-interrupt-affinity',
    name: 'Optimize Interrupt Affinity',
    description: 'Moves device interrupts away from game-preferred CPU cores.',
    category: 'system',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Game threads get dedicated CPU cores'
  },
  {
    id: 'reg-dpc-priority',
    name: 'Optimize DPC Priority',
    description: 'Sets Deferred Procedure Call priority for lower latency.',
    category: 'system',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Reduced micro-stutters from DPC latency'
  },
  {
    id: 'reg-io-page-lockdown',
    name: 'IO Page Lockdown',
    description: 'Locks IO pages in memory for faster disk operations.',
    category: 'storage',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Faster asset loading from disk'
  },

  // BLUETOOTH
  {
    id: 'bt-disable-pairing-reminder',
    name: 'Disable BT Pairing Reminder',
    description: 'Disables Bluetooth device pairing reminders.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'No BT popups during gaming'
  },
  {
    id: 'bt-disable-auto-reconnect',
    name: 'Disable BT Auto Reconnect',
    description: 'Prevents Bluetooth from auto-reconnecting disconnected devices.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'low',
    gamingImpact: 'No BT reconnect overhead during gaming'
  },

  // WINDOWS VISUAL
  {
    id: 'vis-disable-transparency',
    name: 'Disable Transparency Effects',
    description: 'Disables Windows transparency (Aero) to reduce GPU usage.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Saves GPU resources for games'
  },
  {
    id: 'vis-dark-mode',
    name: 'Enable Dark Mode',
    description: 'Enables Windows dark mode for reduced eye strain.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Lower power consumption on OLED displays'
  },
  {
    id: 'vis-disable-acrylic',
    name: 'Disable Acrylic Blur',
    description: 'Disables Windows Acrylic blur effects on Start menu and Taskbar.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Less GPU usage for UI effects'
  },
  {
    id: 'vis-disable-animations',
    name: 'Disable Window Animations',
    description: 'Disables minimize/maximize animations for snappier UI.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Faster Alt+Tab between game and desktop'
  },
  {
    id: 'vis-minimize-maximize',
    name: 'Disable Minimize/Maximize Animations',
    description: 'Disables the slide animations when minimizing/maximizing windows.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Instant window switching'
  },
  {
    id: 'vis-disable-fade',
    name: 'Disable Fade Effects',
    description: 'Disables fade-in/fade-out effects for menus and tooltips.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Snappier UI response'
  },
  {
    id: 'vis-start-menu-clean',
    name: 'Clean Start Menu',
    description: 'Removes pinned apps and suggestions from Start menu.',
    category: 'windows',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Cleaner desktop experience'
  },
  {
    id: 'vis-context-menu-classic',
    name: 'Classic Context Menu',
    description: 'Restores the classic right-click context menu in Windows 11.',
    category: 'windows',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Faster right-click access'
  },

  // SECURITY (safe)
  {
    id: 'sec-disable-smartscreen',
    name: 'Disable SmartScreen for Apps',
    description: 'Disables SmartScreen filter for downloaded applications.',
    category: 'privacy',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'low',
    risk: 'medium',
    gamingImpact: 'No SmartScreen delays when launching games'
  },
  {
    id: 'sec-disable-realtime-protection',
    name: 'Temporarily Disable Real-time Protection',
    description: 'Disables Windows Defender real-time scanning. Re-enable after gaming.',
    category: 'privacy',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'medium',
    risk: 'high',
    gamingImpact: 'No antivirus scanning during gaming (temporary)'
  },
  {
    id: 'sec-disable-defender-scheduled',
    name: 'Disable Scheduled Defender Scans',
    description: 'Disables Windows Defender scheduled quick and full scans.',
    category: 'privacy',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'medium',
    gamingImpact: 'No AV scan during gaming sessions'
  },
  {
    id: 'sec-disable-sample-submission',
    name: 'Disable Malware Sample Submission',
    description: 'Prevents Windows Defender from sending sample files to Microsoft.',
    category: 'privacy',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'low',
    gamingImpact: 'No background upload during gaming'
  },
  {
    id: 'sec-disable-network-protection',
    name: 'Disable Network Protection',
    description: 'Disables Windows Defender network protection for reduced latency.',
    category: 'privacy',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'low',
    risk: 'medium',
    gamingImpact: 'No network filter overhead'
  },

  // NETWORK ADVANCED
  {
    id: 'net-disable-rsc',
    name: 'Disable Receive Segment Coalescing',
    description: 'Disables RSC to reduce network latency at cost of throughput.',
    category: 'network',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Lower network latency for gaming'
  },
  {
    id: 'net-optimize-rss',
    name: 'Optimize Receive Side Scaling',
    description: 'Configures RSS for optimal gaming network performance.',
    category: 'network',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Better network throughput distribution'
  },
  {
    id: 'net-disable-ecnc',
    name: 'Disable ECN Capability',
    description: 'Disables Explicit Congestion Notification for lower ping.',
    category: 'network',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'low',
    risk: 'low',
    gamingImpact: 'Slightly lower ping'
  },
  {
    id: 'net-disable-task-offload',
    name: 'Disable Task Offload',
    description: 'Disables network task offloading for reduced latency.',
    category: 'network',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'CPU handles networking directly for lower latency'
  },
  {
    id: 'net-optimize-tcp-window',
    name: 'Optimize TCP Window Size',
    description: 'Optimizes TCP receive window size for gaming traffic.',
    category: 'network',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Optimal TCP buffer for game packets'
  },
  {
    id: 'net-disable-netbios',
    name: 'Disable NetBIOS',
    description: 'Disables NetBIOS over TCP/IP for reduced network overhead.',
    category: 'network',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'low',
    risk: 'low',
    gamingImpact: 'Less network protocol overhead'
  },
  {
    id: 'net-disable-llmnr',
    name: 'Disable LLMNR',
    description: 'Disables Link-Local Multicast Name Resolution.',
    category: 'network',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Less background network traffic'
  },
  {
    id: 'net-disable-wsd',
    name: 'Disable WSD Discovery',
    description: 'Disables Web Services for Device discovery to reduce network noise.',
    category: 'network',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'No background device scanning'
  },
  {
    id: 'net-optimize-adapter',
    name: 'Optimize Network Adapter',
    description: 'Optimizes network adapter advanced settings for gaming.',
    category: 'network',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Network adapter tuned for gaming traffic'
  },
  {
    id: 'net-disable-flow-control',
    name: 'Disable Flow Control',
    description: 'Disables network flow control for uninterrupted packet delivery.',
    category: 'network',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'low',
    risk: 'low',
    gamingImpact: 'Continuous packet flow without pauses'
  },

  // GAMING SPECIFIC
  {
    id: 'game-dvr-disable',
    name: 'Disable Game DVR',
    description: 'Disables Game DVR recording that consumes GPU in background.',
    category: 'gaming',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Frees GPU resources used by DVR recording'
  },
  {
    id: 'game-bar-complete',
    name: 'Disable Xbox Game Bar',
    description: 'Completely disables the Xbox Game Bar overlay.',
    category: 'gaming',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'No overlay stealing focus or GPU resources'
  },
  {
    id: 'game-gameconfigstore',
    name: 'Optimize GameConfigStore',
    description: 'Configures GameConfigStore for optimal gaming performance.',
    category: 'gaming',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Windows recognizes games for better optimization'
  },
  {
    id: 'game-dwm-priority',
    name: 'Optimize DWM Priority',
    description: 'Optimizes Desktop Window Manager priority for smoother gaming.',
    category: 'gaming',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Smoother desktop compositing during gaming'
  },
  {
    id: 'game-scheduler-class',
    name: 'Game Scheduler Optimization',
    description: 'Optimizes the Windows thread scheduler for game workloads.',
    category: 'gaming',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Thread scheduler favors game performance'
  },
  {
    id: 'game-fullscreen-trick',
    name: 'Force True Fullscreen',
    description: 'Forces exclusive fullscreen mode for reduced latency and V-Sync input lag.',
    category: 'gaming',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Lower input lag with exclusive fullscreen'
  },
  {
    id: 'game-hrtimer',
    name: 'Enable High Resolution Game Timer',
    description: 'Enables high resolution timer specifically for game processes.',
    category: 'gaming',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'More precise game timing'
  },
  {
    id: 'game-foreground-priority',
    name: 'Foreground Game Priority',
    description: 'Sets foreground game process to high priority automatically.',
    category: 'gaming',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Game gets CPU priority over background apps'
  },

  // STARTUP
  {
    id: 'startup-disable-cortana',
    name: 'Disable Cortana at Startup',
    description: 'Prevents Cortana from launching at Windows startup.',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Less RAM usage at startup'
  },
  {
    id: 'startup-disable-onedrive',
    name: 'Disable OneDrive at Startup',
    description: 'Prevents OneDrive from auto-launching at Windows startup.',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Frees RAM and CPU at startup'
  },
  {
    id: 'startup-disable-teams',
    name: 'Disable Teams at Startup',
    description: 'Prevents Microsoft Teams from auto-launching at startup.',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Teams won\'t consume RAM in background'
  },
  {
    id: 'startup-disable-edge-updater',
    name: 'Disable Edge Update',
    description: 'Disables Microsoft Edge auto-update service.',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'No Edge update downloading during gaming'
  },
  {
    id: 'startup-disable-adobe-updater',
    name: 'Disable Adobe Updater',
    description: 'Disables Adobe Creative Cloud and Acrobat auto-updaters.',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'No Adobe processes in background'
  },
  {
    id: 'startup-disable-discord-startup',
    name: 'Disable Discord Auto Start',
    description: 'Prevents Discord from launching at startup.',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Launch Discord manually to save startup resources'
  },
  {
    id: 'startup-disable-epic-games',
    name: 'Disable Epic Games Startup',
    description: 'Prevents Epic Games Launcher from auto-starting.',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Less RAM usage at startup'
  },
  {
    id: 'startup-disable-steam',
    name: 'Disable Steam Startup',
    description: 'Prevents Steam from launching at startup.',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Launch Steam manually to save startup resources'
  },
  {
    id: 'startup-disable-spotify',
    name: 'Disable Spotify Startup',
    description: 'Prevents Spotify from launching at startup.',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Spotify won\'t use RAM at startup'
  },
  {
    id: 'startup-disable-widgets',
    name: 'Disable Widgets Service',
    description: 'Disables Windows Widgets service that runs in background.',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'No widget background processes'
  },

  // MEMORY
  {
    id: 'mem-optimize-pagefile',
    name: 'Optimize Page File',
    description: 'Sets optimal page file size for system stability during gaming.',
    category: 'system',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Better virtual memory management'
  },
  {
    id: 'mem-large-system-cache',
    name: 'Large System Cache',
    description: 'Enables large system cache for better disk read performance.',
    category: 'system',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Faster game asset loading from cache'
  },
  {
    id: 'mem-flush-timer',
    name: 'Optimize Memory Flush Timer',
    description: 'Increases memory flush interval to reduce disk I/O during gaming.',
    category: 'system',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Fewer disk writes interrupting gameplay'
  },
  {
    id: 'mem-deoptimize-standby',
    name: 'Optimize Standby Memory',
    description: 'Configures standby memory priority for game caching.',
    category: 'system',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Faster game load from standby cache'
  },
  {
    id: 'mem-disable-superfetch',
    name: 'Disable Memory Compression',
    description: 'Disables Windows memory compression to reduce CPU overhead.',
    category: 'system',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Less CPU used for memory management'
  },
  {
    id: 'mem-clean-standby',
    name: 'Clean Standby Memory',
    description: 'Clears standby memory list to free RAM for gaming.',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'More available RAM for games'
  },

  // DEBLOAT (more)
  {
    id: 'debloat-remove-copilot',
    name: 'Remove Windows Copilot',
    description: 'Disables and removes Windows Copilot AI assistant.',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'No AI assistant consuming resources'
  },
  {
    id: 'debloat-remove-clipchamp',
    name: 'Remove Clipchamp',
    description: 'Uninstalls the pre-installed Clipchamp video editor.',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Frees disk space and removes bloat'
  },
  {
    id: 'debloat-remove-solitaire',
    name: 'Remove Solitaire Collection',
    description: 'Uninstalls Microsoft Solitaire Collection.',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Removes pre-installed bloatware'
  },
  {
    id: 'debloat-remove-news',
    name: 'Remove News and Interests',
    description: 'Disables the News and Interests widget from taskbar.',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Less taskbar overhead'
  },
  {
    id: 'debloat-remove-maps',
    name: 'Remove Windows Maps',
    description: 'Uninstalls the pre-installed Windows Maps app.',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Frees disk space'
  },
  {
    id: 'debloat-remove-gethelp',
    name: 'Remove Get Help',
    description: 'Uninstalls the Get Help app.',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Removes bloatware'
  },
  {
    id: 'debloat-remove-3dviewer',
    name: 'Remove 3D Viewer',
    description: 'Uninstalls the 3D Viewer app.',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Removes unused app'
  },
  {
    id: 'debloat-remove-alarms',
    name: 'Remove Alarms & Clock',
    description: 'Uninstalls the Alarms & Clock app.',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Removes unused app'
  },
  {
    id: 'debloat-remove-camera',
    name: 'Remove Camera App',
    description: 'Uninstalls the Camera app (not needed on desktops).',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'low',
    gamingImpact: 'Removes unused app on desktops'
  },
  {
    id: 'debloat-remove-feedback',
    name: 'Disable Feedback Hub',
    description: 'Uninstalls the Feedback Hub app.',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'No feedback prompts during gaming'
  },
  {
    id: 'debloat-remove-yourphone',
    name: 'Remove Your Phone',
    description: 'Uninstalls the Your Phone companion app.',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Removes unused app'
  },
  {
    id: 'debloat-remove-tips',
    name: 'Remove Windows Tips',
    description: 'Disables Windows tips and suggestions notifications.',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'No tip popups during gaming'
  },
  {
    id: 'debloat-remove-people',
    name: 'Remove People Bar',
    description: 'Removes the People bar from the taskbar.',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Cleaner taskbar'
  },
  {
    id: 'debloat-remove-meetnow',
    name: 'Remove Meet Now',
    description: 'Removes the Meet Now icon from the system tray.',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Cleaner system tray'
  },
  {
    id: 'debloat-remove-taskbar-feed',
    name: 'Disable Taskbar Feed',
    description: 'Disables the news feed on the taskbar.',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Cleaner taskbar'
  },

  // ── SOUND OPTIMIZATION (sound-extended) ──
  {
    id: 'snd-exclusive-mode',
    name: 'Enable Exclusive Mode',
    description: 'Enables exclusive mode on audio devices so applications can bypass Windows audio mixer for lowest latency',
    category: 'audio',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Bypasses audio mixer, reduces audio latency in games'
  },
  {
    id: 'snd-reduce-buffer',
    name: 'Reduce Audio Buffer Size',
    description: 'Reduces audio buffer size to minimize sound delay in real-time applications',
    category: 'audio',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Lower audio latency, more responsive in-game sounds'
  },
  {
    id: 'snd-mmcss-audio',
    name: 'Optimize MMCSS for Audio',
    description: 'Configures Multimedia Class Scheduler Service to prioritize audio threads',
    category: 'audio',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Audio threads get higher CPU priority, eliminates audio crackling'
  },
  {
    id: 'snd-disable-spatial',
    name: 'Disable Windows Spatial Sound',
    description: 'Disables Windows Sonic and Dolby Atmos spatial sound processing to reduce audio overhead',
    category: 'audio',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Reduces audio processing overhead'
  },
  {
    id: 'snd-optimize-sample-rate',
    name: 'Optimize Sample Rate',
    description: 'Sets audio device to optimal sample rate (48kHz) for gaming compatibility',
    category: 'audio',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Consistent audio timing with game engines'
  },
  {
    id: 'snd-disable-midi',
    name: 'Disable MIDI Synthesizer',
    description: 'Disables the built-in MIDI synthesizer to free audio resources',
    category: 'audio',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Frees minor audio resources'
  },
  {
    id: 'snd-optimize-audio-thread',
    name: 'Optimize Audio Thread Priority',
    description: 'Sets audio service threads to high priority for consistent audio delivery',
    category: 'audio',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Eliminates audio stutter and crackling during heavy CPU load'
  },
  {
    id: 'snd-disable-audio-gpu-sync',
    name: 'Disable Audio-GPU Sync',
    description: 'Disables audio endpoint GPU synchronization to reduce timing dependencies',
    category: 'audio',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Removes potential audio timing bottleneck from GPU rendering'
  },

  // ── BCDEdit Tweaks ──
  {
    id: 'bcd-timer-resolution',
    name: 'Force High-Res Timer',
    description: 'Uses BCDEdit to set the platform clock for highest possible timer resolution',
    category: 'system',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Sub-millisecond timing accuracy for reduced input lag'
  },
  {
    id: 'bcd-disable-dynamic-tick',
    name: 'Disable Dynamic Tick via BCDEdit',
    description: 'Forces Windows to use a fixed timer tick instead of dynamic tick for consistent frame pacing',
    category: 'system',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Eliminates frame timing variations from dynamic tick'
  },
  {
    id: 'bcd-use-platform-clock',
    name: 'Force Platform Clock',
    description: 'BCDEdit forces use of platform clock (HPET) for timer source',
    category: 'system',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'medium',
    gamingImpact: 'Consistent timer source, reduced DPC latency'
  },
  {
    id: 'bcd-increase-usnjrnl',
    name: 'Increase USN Journal',
    description: 'Increases USN journal allocation for better NTFS performance during game loading',
    category: 'system',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Faster file system operations during game asset loading'
  },
  {
    id: 'bcd-optimize-boot',
    name: 'Optimize Boot Configuration',
    description: 'Sets boot menu policy to Standard and reduces boot timeout for faster startup',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Faster boot times, less waiting'
  },
  {
    id: 'bcd-disable-quiet-boot',
    name: 'Disable Quiet Boot',
    description: 'Disables quiet boot to show boot progress and potentially speed up boot sequence',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'May reduce boot time'
  },
  {
    id: 'bcd-increase-stack',
    name: 'Increase Boot Stack Size',
    description: 'Increases the boot stack size for better boot performance with large driver sets',
    category: 'system',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Faster driver initialization at boot'
  },
  {
    id: 'bcd-optimize-test-signing',
    name: 'Disable Test Signing Mode',
    description: 'Ensures test signing mode is off for optimal driver loading and system stability',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Ensures production drivers load correctly'
  },

  // ── NVIDIA GPU Tweaks ──
  {
    id: 'nv-max-power-management',
    name: 'Maximum Power Management',
    description: 'Sets NVIDIA GPU power management to maximum performance mode',
    category: 'nvidia',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'GPU runs at max clocks consistently'
  },
  {
    id: 'nv-disable-thermal-throttle',
    name: 'Raise Thermal Throttle Limit',
    description: 'Raises the thermal throttle threshold to prevent premature GPU throttling',
    category: 'nvidia',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'medium',
    gamingImpact: 'GPU maintains boost clocks longer under sustained load'
  },
  {
    id: 'nv-optimize-pcie',
    name: 'Optimize PCIe Link Speed',
    description: 'Ensures GPU PCIe link is running at maximum available speed and width',
    category: 'nvidia',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Maximum GPU bandwidth, reduced stuttering'
  },
  {
    id: 'nv-disable-gpu-preemption',
    name: 'Disable GPU Preemption',
    description: 'Disables GPU preemption to reduce context switching overhead in games',
    category: 'nvidia',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Smoother frame delivery, less micro-stuttering'
  },
  {
    id: 'nv-max-frames-ahead',
    name: 'Optimize Pre-rendered Frames',
    description: 'Sets maximum pre-rendered frames to 1 for minimum input lag',
    category: 'nvidia',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Lower input lag, more responsive controls'
  },
  {
    id: 'nv-disable-mpo',
    name: 'Disable NVIDIA MPO',
    description: 'Disables Multiplane Overlay to fix frame pacing issues on NVIDIA GPUs',
    category: 'nvidia',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Fixes stuttering from MPO compositing'
  },
  {
    id: 'nv-shader-cache-size',
    name: 'Increase Shader Cache Size',
    description: 'Increases NVIDIA shader cache to prevent compilation stuttering',
    category: 'nvidia',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Eliminates shader compilation stutter'
  },
  {
    id: 'nv-optimization-level',
    name: 'Set Max Optimization Level',
    description: 'Sets NVIDIA driver optimization to maximum performance level',
    category: 'nvidia',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Driver-level performance optimization'
  },
  {
    id: 'nv-disable-spread-spectrum',
    name: 'Disable Spread Spectrum',
    description: 'Disables spread spectrum clocking for more consistent GPU timing',
    category: 'nvidia',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'More consistent GPU clock timing, reduced micro-stutter'
  },
  {
    id: 'nv-rm-gpu-accl',
    name: 'GPU Acceleration Scheduling',
    description: 'Enables GPU hardware-accelerated scheduling for reduced latency',
    category: 'nvidia',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'GPU manages its own scheduling for lower latency'
  },

  // ── AMD/Radeon GPU Tweaks ──
  {
    id: 'amd-disable-chill',
    name: 'Disable Radeon Chill',
    description: 'Disables AMD Radeon Chill frame limiting feature for maximum FPS',
    category: 'radeon',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Uncaps FPS, removes frame rate limiter'
  },
  {
    id: 'amd-disable-vsr',
    name: 'Disable Virtual Super Resolution',
    description: 'Disables VSR to use native resolution for maximum performance',
    category: 'radeon',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Renders at native resolution, better performance'
  },
  {
    id: 'amd-enable-antilag',
    name: 'Enable Anti-Lag',
    description: 'Enables AMD Radeon Anti-Lag to reduce input latency',
    category: 'radeon',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Reduces input lag by up to 31%'
  },
  {
    id: 'amd-disable-rtss-sync',
    name: 'Disable RTSS Sync',
    description: 'Disables Radeon RTSS frame sync for maximum frame rate',
    category: 'radeon',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Uncapped frame delivery'
  },
  {
    id: 'amd-max-power-limit',
    name: 'Max Power Limit',
    description: 'Increases AMD GPU power limit to maximum for sustained boost clocks',
    category: 'radeon',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'medium',
    gamingImpact: 'GPU maintains higher clocks under load'
  },
  {
    id: 'amd-disable-smart-access',
    name: 'Optimize Smart Access Memory',
    description: 'Ensures Smart Access Memory / Resizable BAR is enabled for maximum GPU bandwidth',
    category: 'radeon',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'CPU has direct access to GPU VRAM, reduced latency'
  },
  {
    id: 'amd-disable-hdcp',
    name: 'Disable HDCP',
    description: 'Disables HDCP content protection to reduce GPU overhead',
    category: 'radeon',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Removes content protection overhead from GPU pipeline'
  },
  {
    id: 'amd-set-gpu-mode',
    name: 'Set High Performance GPU Mode',
    description: 'Forces AMD GPU into high performance mode via registry',
    category: 'radeon',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'GPU stays in performance state, no ramp-up delay'
  },
  {
    id: 'amd-disable-overlay',
    name: 'Disable Radeon Overlay',
    description: 'Disables AMD Radeon Software overlay to free GPU resources',
    category: 'radeon',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Frees minor GPU resources from overlay rendering'
  },
  {
    id: 'amd-optimize-memory',
    name: 'Optimize VRAM Management',
    description: 'Configures AMD VRAM paging strategy for gaming workloads',
    category: 'radeon',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Better VRAM utilization, less texture streaming stutter'
  },

  // ── DIRECTX Optimization ──
  {
    id: 'dx-shader-cache-enable',
    name: 'Enable DirectX Shader Cache',
    description: 'Ensures DirectX shader cache is enabled and optimized for faster game loading',
    category: 'directx',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Faster shader compilation, less stuttering'
  },
  {
    id: 'dx-disable-debug-layer',
    name: 'Disable DirectX Debug Layer',
    description: 'Disables DirectX debug layer to remove validation overhead',
    category: 'directx',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Removes debug overhead from DirectX calls'
  },
  {
    id: 'dx-optimize-agility-sdk',
    name: 'Optimize DirectX Agility SDK',
    description: 'Enables DirectX 12 Agility SDK for latest performance improvements',
    category: 'directx',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Access to latest DirectX 12 optimizations'
  },
  {
    id: 'dx-force-hw-d3d',
    name: 'Force Hardware D3D',
    description: 'Forces Direct3D to use hardware rendering exclusively, no software fallback',
    category: 'directx',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Pure hardware rendering path, reduced CPU overhead'
  },
  {
    id: 'dx-disable-d3d-debug',
    name: 'Disable D3D12 Debug Tools',
    description: 'Disables D3D12 GPU-based validation and debug tools',
    category: 'directx',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Removes validation overhead from D3D12'
  },
  {
    id: 'dx-optimize-texture-format',
    name: 'Optimize Texture Format',
    description: 'Configures DirectX texture format preferences for optimal GPU decompression',
    category: 'directx',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Faster texture loading, less VRAM overhead'
  },
  {
    id: 'dx-enable-variable-shading',
    name: 'Configure Variable Rate Shading',
    description: 'Configures VRS tier and rate for optimal quality-performance balance',
    category: 'directx',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'GPU allocates shading resources where it matters most'
  },
  {
    id: 'dx-optimize-present-params',
    name: 'Optimize Present Parameters',
    description: 'Configures DirectX present parameters for low-latency frame presentation',
    category: 'directx',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Faster frame presentation to display, reduced input lag'
  },

  // ── LATENCY Timing ──
  {
    id: 'lat-hpet-enable',
    name: 'Enable HPET Timer',
    description: 'Enables High Precision Event Timer for accurate system timing',
    category: 'latency',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'More accurate system timing, reduced DPC latency'
  },
  {
    id: 'lat-timer-resolution',
    name: 'Set 0.5ms Timer Resolution',
    description: 'Sets Windows timer resolution to 0.5ms for maximum input responsiveness',
    category: 'latency',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Input polled at 2000Hz instead of default 15.6Hz'
  },
  {
    id: 'lat-tsc-invariant',
    name: 'Enable TSC Invariant',
    description: 'Enforces TSC (Time Stamp Counter) invariant for consistent timing across cores',
    category: 'latency',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Consistent timing across all CPU cores'
  },
  {
    id: 'lat-disable-synthetic',
    name: 'Disable Synthetic Timers',
    description: 'Disables synthetic timer interrupts to reduce system overhead',
    category: 'latency',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Fewer timer interrupts, reduced system jitter'
  },
  {
    id: 'lat-optimize-interrupts',
    name: 'Optimize Timer Interrupts',
    description: 'Reduces timer interrupt frequency to minimize CPU context switches',
    category: 'latency',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Less CPU time wasted on timer processing'
  },
  {
    id: 'lat-force-tsc',
    name: 'Force TSC as Timer Source',
    description: 'Forces Windows to use TSC instead of ACPI timer for lower overhead',
    category: 'latency',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Direct CPU timer access, minimal latency'
  },
  {
    id: 'lat-disable-acpi-pm',
    name: 'Disable ACPI Power Management Timer',
    description: 'Disables ACPI PM timer to force use of higher-precision timers',
    category: 'latency',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Removes low-precision timer bottleneck'
  },
  {
    id: 'lat-optimize-dpc',
    name: 'Optimize DPC Latency',
    description: 'Reduces Deferred Procedure Call latency by optimizing interrupt handling',
    category: 'latency',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Smoother audio and frame timing'
  },

  // ── ALT-TAB Optimization ──
  {
    id: 'atd-disable-fade',
    name: 'Disable Alt-Tab Fade Animation',
    description: 'Removes the fade animation when switching windows for instant Alt-Tab',
    category: 'alttab',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Instant window switching without animation delay'
  },
  {
    id: 'atd-disable-switch-delay',
    name: 'Disable Switching Delay',
    description: 'Removes the delay before window switch animation plays',
    category: 'alttab',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'No delay when Alt-Tabbing'
  },
  {
    id: 'atd-optimize-dwm',
    name: 'Optimize DWM for Alt-Tab',
    description: 'Configures Desktop Window Manager to minimize overhead during window switches',
    category: 'alttab',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Faster window compositing during Alt-Tab'
  },
  {
    id: 'atd-disable-thumbnail',
    name: 'Disable Alt-Tab Thumbnails',
    description: 'Disables thumbnail preview generation during Alt-Tab for faster switching',
    category: 'alttab',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Faster Alt-Tab without thumbnail rendering'
  },
  {
    id: 'atd-force-classic',
    name: 'Force Classic Alt-Tab',
    description: 'Forces classic Alt-Tab view which is lighter than the modern overlay',
    category: 'alttab',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Lighter window switcher, less GPU usage'
  },
  {
    id: 'atd-prioritize-game',
    name: 'Prioritize Game Window',
    description: 'Configures window manager to prioritize game window during task switching',
    category: 'alttab',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Game window switches back faster'
  },
  {
    id: 'atd-disable-snap',
    name: 'Disable Snap Assist',
    description: 'Disables Snap Assist overlay that appears during window switching',
    category: 'alttab',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Cleaner window switching'
  },
  {
    id: 'atd-optimize-peek',
    name: 'Disable Aero Peek',
    description: 'Disables Aero Peek feature that shows desktop behind windows',
    category: 'alttab',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Removes DWM overhead from Peek previews'
  },

  // ── APP DEBLOAT ──
  {
    id: 'appdb-chrome-disable-hw',
    name: 'Chrome: Disable Hardware Overlays',
    description: 'Disables hardware overlays in Chrome to reduce GPU compositing overhead',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Chrome uses less GPU when running in background'
  },
  {
    id: 'appdb-chrome-disable-extensions',
    name: 'Chrome: Disable Background Extensions',
    description: 'Disables Chrome extensions from running in background when browser is closed',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Chrome extensions stop consuming resources'
  },
  {
    id: 'appdb-chrome-priority',
    name: 'Chrome: Lower Process Priority',
    description: 'Lowers Chrome process priority to background level when not in foreground',
    category: 'debloat',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Chrome uses less CPU during gaming'
  },
  {
    id: 'appdb-discord-disable-hw',
    name: 'Discord: Disable Hardware Acceleration',
    description: 'Disables hardware acceleration in Discord to free GPU resources for games',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Discord stops using GPU, more available for games'
  },
  {
    id: 'appdb-discord-disable-autostart',
    name: 'Discord: Disable Auto-Start',
    description: 'Prevents Discord from starting automatically with Windows',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Less background resource usage at boot'
  },
  {
    id: 'appdb-discord-optimize',
    name: 'Discord: Optimize Settings',
    description: 'Disables Discord overlay, noise suppression, and reduces animation overhead',
    category: 'debloat',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Discord uses minimal resources during gaming'
  },
  {
    id: 'appdb-epic-disable-telemetry',
    name: 'Epic Games: Disable Telemetry',
    description: 'Disables Epic Games Launcher telemetry and crash reporting',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Epic Games uses less background resources'
  },
  {
    id: 'appdb-epic-disable-hw',
    name: 'Epic Games: Disable Hardware Acceleration',
    description: 'Disables hardware acceleration in Epic Games Launcher',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Epic Games stops competing for GPU resources'
  },
  {
    id: 'appdb-epic-preload',
    name: 'Epic Games: Disable Pre-load',
    description: 'Disables game pre-loading in Epic Games Launcher to save bandwidth and disk I/O',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'No background downloads competing for network'
  },
  {
    id: 'appdb-steam-disable-hw',
    name: 'Steam: Disable Hardware Acceleration',
    description: 'Disables hardware acceleration in Steam client to free GPU resources',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Steam stops using GPU when in background'
  },
  {
    id: 'appdb-steam-disable-popup',
    name: 'Steam: Disable News Popups',
    description: 'Disables Steam news and notification popups during gaming',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'No popup interruptions during gaming'
  },
  {
    id: 'appdb-teams-disable-background',
    name: 'Teams: Disable Background Activity',
    description: 'Prevents Microsoft Teams from running in background and consuming resources',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Teams stops using CPU and RAM in background'
  },
  {
    id: 'appdb-edge-disable-service',
    name: 'Edge: Disable Edge Update Service',
    description: 'Disables Microsoft Edge Update service that runs in background',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'No background Edge update processes'
  },
  {
    id: 'appdb-spotify-disable-startup',
    name: 'Spotify: Disable Auto-Start',
    description: 'Prevents Spotify from starting automatically with Windows',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Spotify not consuming resources at boot'
  },
  {
    id: 'appdb-onecloud-disable',
    name: 'OneDrive: Disable Auto-Start',
    description: 'Prevents OneDrive from starting automatically with Windows',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'OneDrive not consuming resources at boot'
  },
  {
    id: 'appdb-cortana-disable',
    name: 'Cortana: Complete Disable',
    description: 'Fully disables Cortana including background indexing and voice activation',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'No Cortana background processes'
  },
  {
    id: 'appdb-xbox-disable-overlay',
    name: 'Xbox: Disable Game Bar Overlay',
    description: 'Disables Xbox Game Bar overlay completely including recording features',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Xbox overlay not intercepting game rendering'
  },
  {
    id: 'appdb-web-search-disable',
    name: 'Disable Windows Web Search',
    description: 'Disables Windows web search in Start menu to reduce background network usage',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Start menu searches are local only'
  },
  {
    id: 'appdb-copilot-disable',
    name: 'Disable Windows Copilot',
    description: 'Fully disables Windows Copilot and its background processes',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'No Copilot processes consuming resources'
  },
  {
    id: 'appdb-weather-disable',
    name: 'Disable Weather Widget',
    description: 'Disables the Weather widget from taskbar and background updates',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'No weather widget background activity'
  },

  // ── EXPLORER Tweaks ──
  {
    id: 'explorer-disable-search',
    name: 'Disable Explorer Search Indexing',
    description: 'Disables Windows Explorer search indexing to reduce disk I/O',
    category: 'explorer',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Less disk I/O from search indexer'
  },
  {
    id: 'explorer-disable-thumbnails',
    name: 'Disable Thumbnail Caching',
    description: 'Disables Explorer thumbnail generation and caching to save disk I/O',
    category: 'explorer',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Less disk writes from thumbnail cache'
  },
  {
    id: 'explorer-classic-menu',
    name: 'Classic Context Menu',
    description: 'Restores classic right-click context menu in Explorer',
    category: 'explorer',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Faster context menu, no modern menu overhead'
  },
  {
    id: 'explorer-disable-details-pane',
    name: 'Disable Details Pane',
    description: 'Disables the details pane in Explorer to reduce UI overhead',
    category: 'explorer',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Lighter Explorer UI'
  },
  {
    id: 'explorer-optimize-views',
    name: 'Optimize Folder Views',
    description: 'Sets Explorer to use list view by default for faster folder browsing',
    category: 'explorer',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Faster folder navigation'
  },
  {
    id: 'explorer-disable-network-discovery',
    name: 'Disable Network Discovery',
    description: 'Disables network discovery in Explorer to reduce network overhead',
    category: 'explorer',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Less network overhead from Explorer'
  },
  {
    id: 'explorer-hide-extensions',
    name: 'Hide File Extensions',
    description: 'Hides file extensions in Explorer for cleaner view',
    category: 'explorer',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Cleaner Explorer interface'
  },
  {
    id: 'explorer-disable-quick-access',
    name: 'Disable Quick Access',
    description: 'Replaces Quick Access with This PC in Explorer navigation pane',
    category: 'explorer',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Less background indexing from Quick Access'
  },
  {
    id: 'explorer-optimize-preview',
    name: 'Disable Preview Pane',
    description: 'Disables the preview pane in Explorer to reduce resource usage',
    category: 'explorer',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Lighter Explorer resource usage'
  },
  {
    id: 'explorer-disable-gadgets',
    name: 'Disable Desktop Gadgets',
    description: 'Disables desktop gadgets and widgets for cleaner desktop',
    category: 'explorer',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Less desktop overhead'
  },

  // ── INTEL GPU ──
  {
    id: 'intel-disable-c-states-gpu',
    name: 'Disable Intel GPU C-States',
    description: 'Prevents Intel integrated GPU from entering low-power C-states for consistent frame delivery',
    category: 'gpu',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'More consistent frame times on Intel iGPU'
  },
  {
    id: 'intel-max-gpu-frequency',
    name: 'Max Intel GPU Frequency',
    description: 'Locks Intel GPU to maximum boost frequency for sustained performance',
    category: 'gpu',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Higher sustained GPU clocks on Intel'
  },
  {
    id: 'intel-disable-frame-scheduling',
    name: 'Disable Intel Frame Scheduling',
    description: 'Disables Intel Thread Director interference for manual thread control',
    category: 'gpu',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Reduced scheduling overhead on Intel'
  },
  {
    id: 'intel-disable-panel-self-refresh',
    name: 'Disable Panel Self Refresh',
    description: 'Disables PSR to prevent display latency spikes on Intel graphics',
    category: 'gpu',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Lower display latency on Intel GPUs'
  },

  // ── MONITOR / DISPLAY ──
  {
    id: 'monitor-max-refresh-rate',
    name: 'Force Maximum Refresh Rate',
    description: 'Ensures your display runs at its highest supported refresh rate',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'high',
    risk: 'none',
    gamingImpact: 'Smoother visuals with max refresh rate'
  },
  {
    id: 'monitor-disable-vrr-flicker',
    name: 'Disable VRR Flicker Mitigation',
    description: 'Reduces VRR flickering by optimizing display timing parameters',
    category: 'system',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'low',
    risk: 'low',
    gamingImpact: 'Less flicker with variable refresh rate'
  },
  {
    id: 'monitor-optimize-color-accuracy',
    name: 'Optimize Display Color Pipeline',
    description: 'Reduces display processing latency by optimizing color pipeline',
    category: 'system',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Lower display processing latency'
  },

  // ── STREAMING / OBS ──
  {
    id: 'obs-optimize-process-priority',
    name: 'OBS Process Priority Boost',
    description: 'Sets OBS process priority to High for smoother streaming and recording',
    category: 'system',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Smoother OBS recording while gaming'
  },
  {
    id: 'obs-optimize-encoder',
    name: 'OBS Encoder Optimization',
    description: 'Optimizes Windows encoder settings for lower OBS CPU usage',
    category: 'system',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Lower encoding overhead during streaming'
  },
  {
    id: 'obs-disable-preview',
    name: 'OBS Disable Preview Rendering',
    description: 'Disables OBS preview rendering to save GPU resources during streaming',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'More GPU headroom for games during streaming'
  },

  // ── VR ──
  {
    id: 'vr-optimize-timing',
    name: 'VR Motion-to-Photon Optimization',
    description: 'Optimizes timer resolution and frame pacing for lower VR motion-to-photon latency',
    category: 'system',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Lower VR motion sickness, smoother head tracking'
  },
  {
    id: 'vr-optimize-render-pipeline',
    name: 'VR Render Pipeline Optimization',
    description: 'Optimizes GPU scheduling and frame submission for VR applications',
    category: 'system',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Smoother VR gameplay with less dropped frames'
  },
  {
    id: 'vr-disable-async-reprojection',
    name: 'Disable VR Async Reprojection',
    description: 'Disables async reprojection for lower latency in competitive VR games',
    category: 'system',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'medium',
    gamingImpact: 'Lower latency at cost of smoothness'
  },

  // ── MOUSE (more tweaks) ──
  {
    id: 'mouse-disable-angle-snapping',
    name: 'Disable Angle Snapping',
    description: 'Disables Windows angle prediction for true raw mouse movement',
    category: 'mouse',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'True raw mouse input, no artificial correction'
  },
  {
    id: 'mouse-optimize-polling-rate',
    name: 'Optimize Mouse Polling Rate',
    description: 'Ensures mouse polling rate is not throttled by Windows USB power management',
    category: 'mouse',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Consistent high polling rate, lower input lag'
  },
  {
    id: 'mouse-disable-smoothing',
    name: 'Disable Mouse Smoothing',
    description: 'Turns off Windows mouse smoothing for precise cursor tracking',
    category: 'mouse',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Raw unsmoothed mouse movement'
  },
  {
    id: 'mouse-optimize-sensitivity-curve',
    name: 'Optimize Mouse Sensitivity Curve',
    description: 'Sets linear mouse sensitivity curve for consistent aiming across all speeds',
    category: 'mouse',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'More consistent aim at different speeds'
  },

  // ── KEYBOARD (more tweaks) ──
  {
    id: 'keyboard-optimize-repeat-rate',
    name: 'Optimize Key Repeat Rate',
    description: 'Sets keyboard repeat rate to maximum for faster key registration',
    category: 'keyboard',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Faster key repeat in text and movement'
  },
  {
    id: 'keyboard-optimize-repeat-delay',
    name: 'Minimize Key Repeat Delay',
    description: 'Sets keyboard repeat delay to minimum for instant key response',
    category: 'keyboard',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Instant keyboard response'
  },
  {
    id: 'keyboard-disable-ghosting',
    name: 'Disable Keyboard Ghosting',
    description: 'Optimizes keyboard interrupt handling to reduce ghosting on membrane keyboards',
    category: 'keyboard',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'More reliable multi-key presses in games'
  },
  {
    id: 'keyboard-optimize-battery',
    name: 'Disable Keyboard Power Saving',
    description: 'Disables keyboard power saving mode for consistent input latency',
    category: 'keyboard',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Consistent keyboard polling latency'
  },

  // ── USB (more tweaks) ──
  {
    id: 'usb-disable-hub-power',
    name: 'Disable USB Hub Power Saving',
    description: 'Prevents USB hubs from entering power-saving mode for consistent device performance',
    category: 'usb',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'No USB device lag from hub power management'
  },
  {
    id: 'usb-optimize-transfer-rate',
    name: 'Optimize USB Transfer Rate',
    description: 'Sets USB transfer mode to maximum performance for faster device communication',
    category: 'usb',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Lower USB device latency'
  },
  {
    id: 'usb-disable-compliance',
    name: 'Disable USB Compliance Testing',
    description: 'Disables USB compliance testing mode for lower device initialization latency',
    category: 'usb',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'low',
    risk: 'low',
    gamingImpact: 'Faster USB device initialization'
  },

  // ── INPUT (gamepad, touchscreen) ──
  {
    id: 'input-optimize-gamepad-latency',
    name: 'Optimize Gamepad Input Latency',
    description: 'Reduces XInput/DirectInput polling latency for controllers',
    category: 'input',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Lower controller input lag'
  },
  {
    id: 'input-disable-touchscreen',
    name: 'Disable Touchscreen Input',
    description: 'Disables touchscreen digitizer to reduce input processing overhead',
    category: 'input',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Less input processing overhead'
  },
  {
    id: 'input-optimize-tablet-pen',
    name: 'Optimize Tablet Pen Latency',
    description: 'Reduces pen tablet input processing latency for creative applications',
    category: 'input',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'low',
    risk: 'low',
    gamingImpact: 'Lower pen input latency'
  },

  // ── STORAGE (more tweaks) ──
  {
    id: 'storage-disable-write-caching',
    name: 'Disable Write Caching Buffer Flushing',
    description: 'Disables write cache buffer flushing for faster disk writes (risks data loss on power failure)',
    category: 'storage',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'medium',
    risk: 'medium',
    gamingImpact: 'Faster save operations in games'
  },
  {
    id: 'storage-optimize-io-priority',
    name: 'Optimize Disk I/O Priority',
    description: 'Sets game-related disk operations to high priority for faster load times',
    category: 'storage',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Faster game loading from disk'
  },
  {
    id: 'storage-disable-indexing-service',
    name: 'Disable Search Indexing Service',
    description: 'Fully disables Windows Search Indexing to free CPU and disk resources',
    category: 'storage',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Less background disk I/O during gaming'
  },
  {
    id: 'storage-nvme-latency-optimization',
    name: 'NVMe Latency Optimization',
    description: 'Optimizes NVMe queue depth and interrupt coalescing for lower storage latency',
    category: 'storage',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Faster game load times and asset streaming'
  },

  // ── GPU (more tweaks) ──
  {
    id: 'gpu-disable-render-completion-sync',
    name: 'Disable Render Completion Sync',
    description: 'Disables GPU render completion synchronization for lower frame submission latency',
    category: 'gpu',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Lower GPU frame submission latency'
  },
  {
    id: 'gpu-optimize-surface-prefetch',
    name: 'Optimize Surface Prefetch',
    description: 'Enables GPU surface prefetching for faster texture loading in games',
    category: 'gpu',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Faster texture loading, less stutter'
  },
  {
    id: 'gpu-disable-frame-rate-limiter',
    name: 'Disable GPU Frame Rate Limiter',
    description: 'Disables driver-level frame rate limiting for maximum FPS',
    category: 'gpu',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Uncapped frame rate in all games'
  },
  {
    id: 'gpu-optimize-vram-allocation',
    name: 'Optimize VRAM Allocation',
    description: 'Optimizes GPU virtual memory allocation for better VRAM utilization in games',
    category: 'gpu',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Better VRAM usage, less texture swapping'
  },

  // ── NVIDIA (more tweaks) ──
  {
    id: 'nv-disable-ansel',
    name: 'Disable NVIDIA Ansel',
    description: 'Disables NVIDIA Ansel to free GPU overlay resources during gaming',
    category: 'nvidia',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Frees GPU resources from Ansel overlay'
  },
  {
    id: 'nv-disable-shadowplay',
    name: 'Disable NVIDIA ShadowPlay',
    description: 'Disables NVIDIA ShadowPlay recording service to reduce GPU overhead',
    category: 'nvidia',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Lower GPU overhead from ShadowPlay'
  },
  {
    id: 'nv-optimize-driver-scheduler',
    name: 'Optimize NVIDIA Driver Scheduler',
    description: 'Optimizes NVIDIA driver thread scheduling for lower driver overhead',
    category: 'nvidia',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Lower driver CPU overhead, higher FPS'
  },

  // ── DEEP CLEAN ──
  {
    id: 'clean-dns-cache',
    name: 'Flush DNS Cache',
    description: 'Clears the DNS resolver cache to remove stale entries and free memory',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Fresh DNS lookups, slight network improvement'
  },
  {
    id: 'clean-font-cache',
    name: 'Rebuild Font Cache',
    description: 'Rebuilds the Windows font cache to remove corrupted entries and free disk space',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Clean font rendering, freed disk cache'
  },
  {
    id: 'clean-icon-cache',
    name: 'Rebuild Icon Cache',
    description: 'Rebuilds the Windows icon cache database to fix broken or missing icons',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Fixed icon rendering issues'
  },
  {
    id: 'clean-wu-cache',
    name: 'Clean Windows Update Cache',
    description: 'Removes cached Windows Update download files to free disk space',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Freed disk space, faster update cycle'
  },
  {
    id: 'clean-crash-dumps',
    name: 'Clean Crash Dumps',
    description: 'Removes Windows crash dump files and memory dump files',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Freed disk space from old crash dumps'
  },
  {
    id: 'clean-browser-cache',
    name: 'Clean Browser Caches',
    description: 'Clears Chrome, Edge, Firefox, and Opera browser caches',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Freed disk space from browser data'
  },
  {
    id: 'clean-windows-search',
    name: 'Clean Windows Search Index',
    description: 'Resets and rebuilds the Windows Search index from scratch',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Faster file search after rebuild'
  },
  {
    id: 'clean-defender-cache',
    name: 'Clean Windows Defender Cache',
    description: 'Clears Windows Defender scan cache and quarantine files older than 30 days',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Freed disk space from AV cache'
  },
  {
    id: 'clean-steam-cache',
    name: 'Clean Steam Download Cache',
    description: 'Clears Steam download cache and shader cache for fresh downloads',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Freed disk space, fixed Steam download issues'
  },
  {
    id: 'clean-nvidia-shader-cache',
    name: 'Clean NVIDIA Shader Cache',
    description: 'Removes NVIDIA driver shader cache to force fresh compilation',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Fixed shader compilation stuttering'
  },
  {
    id: 'clean-amd-shader-cache',
    name: 'Clean AMD Shader Cache',
    description: 'Removes AMD driver shader cache to force fresh compilation',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Fixed shader compilation stuttering'
  },
  {
    id: 'clean-windows-prefetch',
    name: 'Clean Prefetch Files',
    description: 'Removes Windows prefetch data to free disk space and reduce disk I/O',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Freed disk space'
  },
  {
    id: 'clean-recycle-bin',
    name: 'Empty Recycle Bin',
    description: 'Empties the Recycle Bin to immediately free disk space',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'medium',
    gamingImpact: 'Immediate disk space recovery'
  },
  {
    id: 'clean-event-logs',
    name: 'Clear Event Logs',
    description: 'Clears Windows Event Logs to free disk space and reduce system overhead',
    category: 'system',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Freed disk space, cleaner event viewer'
  },

  // ── NETWORK ADVANCED ──
  {
    id: 'net-disable-interrupt-moderation',
    name: 'Disable Network Interrupt Moderation',
    description: 'Disables network adapter interrupt coalescing for lowest possible latency',
    category: 'network',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Lower network latency from immediate interrupt handling'
  },
  {
    id: 'net-increase-receive-buffers',
    name: 'Increase Network Receive Buffers',
    description: 'Increases network adapter receive buffer count to prevent packet drops',
    category: 'network',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Fewer dropped packets during intense gaming'
  },
  {
    id: 'net-increase-transmit-buffers',
    name: 'Increase Network Transmit Buffers',
    description: 'Increases network adapter transmit buffer count for smoother outgoing traffic',
    category: 'network',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Smoother voice chat and game data transmission'
  },
  {
    id: 'net-disable-gro-segmentation',
    name: 'Disable GRO Segmentation',
    description: 'Disables Generic Receive Offload segmentation for lower latency packet processing',
    category: 'network',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Lower packet processing latency'
  },
  {
    id: 'net-optimize-tcp-nodelay',
    name: 'Enable TCP No Delay',
    description: 'Enables TCP_NODELAY globally to send packets immediately without buffering',
    category: 'network',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Immediate packet delivery, lower latency'
  },
  {
    id: 'net-disable-arbitration',
    name: 'Disable Network Arbitration',
    description: 'Disables NDIS network arbitration for direct adapter communication',
    category: 'network',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Direct network adapter access, minimal overhead'
  },

  // ── POWER ADVANCED ──
  {
    id: 'power-disable-dynamic-boost',
    name: 'Disable CPU Dynamic Boost',
    description: 'Disables Intel Turbo Boost / AMD Boost for consistent clock speeds',
    category: 'system',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'medium',
    gamingImpact: 'Consistent CPU frequency, no boost/unboost latency'
  },
  {
    id: 'power-max-pcie-power',
    name: 'Maximum PCIe Power State',
    description: 'Sets PCIe link power management to maximum performance',
    category: 'system',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Maximum GPU bandwidth, no PCIe throttling'
  },
  {
    id: 'power-disable-usb-suspend',
    name: 'Disable All USB Suspend',
    description: 'Disables USB selective suspend globally for all devices',
    category: 'system',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'No USB device wake-up delays during gaming'
  },
  {
    id: 'power-processor-performance',
    name: 'Max Processor Performance',
    description: 'Sets minimum processor state to 100% to prevent CPU throttling',
    category: 'system',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'CPU always at maximum performance'
  },

  // ── BROWSER DEEP DEBLOAT ──
  {
    id: 'chrome-deep-debloat',
    name: 'Chrome Deep Debloat',
    description: 'Disables Chrome safe browsing, spell check, translate, and background sync',
    category: 'debloat',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Chrome uses minimal resources during gaming'
  },
  {
    id: 'edge-deep-debloat',
    name: 'Edge Deep Debloat',
    description: 'Disables Edge sidebar, collections, smart copy, and tab sleeping features',
    category: 'debloat',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Edge uses minimal resources during gaming'
  },
  {
    id: 'discord-deep-debloat',
    name: 'Discord Deep Debloat',
    description: 'Disables Discord games detection, rich presence, and reduces animation overhead',
    category: 'debloat',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Discord uses less GPU and CPU during gaming'
  },
  {
    id: 'firefox-deep-debloat',
    name: 'Firefox Debloat',
    description: 'Disables Firefox telemetry, pocket, and background updates',
    category: 'debloat',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Firefox background processes reduced'
  },

  // ── GPU ADVANCED ──
  {
    id: 'gpu-force-max-clocks',
    name: 'Force GPU Maximum Clocks',
    description: 'Forces GPU to run at maximum boost clocks at all times via registry',
    category: 'gpu',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'medium',
    gamingImpact: 'GPU never drops below maximum clock speed'
  },
  {
    id: 'gpu-disable-gpu-preemption-deep',
    name: 'Disable GPU Context Preemption',
    description: 'Disables GPU context preemption for uninterrupted frame rendering',
    category: 'gpu',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'No GPU context switches during gameplay'
  },
  {
    id: 'gpu-disable-tdr',
    name: 'Disable TDR (Timeout Detection)',
    description: 'Disables GPU timeout detection for uninterrupted rendering (risky)',
    category: 'gpu',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'high',
    gamingImpact: 'No GPU timeout resets, uninterrupted rendering'
  },

  // ── TIMER & LATENCY DEEP ──
  {
    id: 'timer-force-1ms',
    name: 'Force 1ms Timer Resolution',
    description: 'Forces the system timer to 1ms resolution for maximum input responsiveness',
    category: 'latency',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Input polled at 1000Hz for maximum responsiveness'
  },
  {
    id: 'timer-disable-power-saving-timer',
    name: 'Disable Power Saving Timer',
    description: 'Disables the power management timer that causes latency spikes',
    category: 'latency',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'No timer latency spikes from power transitions'
  },

  // ── STORAGE ADVANCED ──
  {
    id: 'storage-disable-ahci-power',
    name: 'Disable AHCI Power Management',
    description: 'Disables SATA AHCI power management for consistent disk performance',
    category: 'storage',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'No disk latency spikes from AHCI power states'
  },
  {
    id: 'storage-optimize-nvme-queues',
    name: 'Optimize NVMe Queue Depth',
    description: 'Optimizes NVMe queue depth and interrupt coalescing for maximum throughput',
    category: 'storage',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Maximum disk throughput during game loading'
  },
  {
    id: 'storage-disable-disk-compression',
    name: 'Disable Disk Compression',
    description: 'Disables NTFS disk compression for maximum disk performance',
    category: 'storage',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Faster file access without compression overhead'
  },
  {
    id: 'storage-optimize-defrag-schedule',
    name: 'Disable Automatic Defrag',
    description: 'Disables scheduled disk defragmentation to prevent background disk usage',
    category: 'storage',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'No surprise defrag during gaming'
  },

  // ── PRIVACY DEEP ──
  {
    id: 'privacy-disable-cortana-deep',
    name: 'Disable Cortana Deep',
    description: 'Completely removes Cortana from the system and disables all background processes',
    category: 'privacy',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'No Cortana processes consuming resources'
  },
  {
    id: 'privacy-disable-telemetry-deep',
    name: 'Disable Telemetry Deep',
    description: 'Blocks all known Microsoft telemetry endpoints via hosts file and firewall',
    category: 'privacy',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'medium',
    gamingImpact: 'Zero telemetry traffic leaving your system'
  },
  {
    id: 'privacy-disable-tracking',
    name: 'Disable Activity Tracking',
    description: 'Disables all Windows activity tracking, timeline, and cloud sync',
    category: 'privacy',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'No background activity tracking overhead'
  },

  // ── AUDIO DEEP ──
  {
    id: 'audio-optimize-latency',
    name: 'Optimize Audio Latency',
    description: 'Sets audio buffer to minimum size and disables all audio processing for lowest latency',
    category: 'audio',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Minimum possible audio latency in games'
  },
  {
    id: 'audio-disable-all-enhancements',
    name: 'Disable All Audio Enhancements',
    description: 'Disables all Windows audio enhancements, equalizers, and spatial sound processing',
    category: 'audio',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'No audio processing overhead'
  },

  // ── WINDOWS ADVANCED ──
  {
    id: 'windows-disable-all-animations',
    name: 'Disable All Windows Animations',
    description: 'Disables all Windows UI animations, transitions, and visual effects for maximum performance',
    category: 'windows',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Zero animation overhead, instant UI response'
  },
  {
    id: 'windows-optimize-explorer-deep',
    name: 'Deep Optimize Explorer',
    description: 'Disables Explorer preview pane, details pane, thumbnails, and search indexing',
    category: 'windows',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Lighter Explorer, less disk I/O'
  },
  {
    id: 'windows-disable-all-services',
    name: 'Disable Unnecessary Services',
    description: 'Disables 20+ unnecessary Windows services to maximize available resources',
    category: 'windows',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'medium',
    gamingImpact: 'Maximum available CPU and RAM for gaming'
  },

  // ── GAMING DEEP ──
  {
    id: 'game-optimize-all',
    name: 'Ultimate Game Optimization',
    description: 'Applies all gaming tweaks at once: priority, scheduler, timer, network, GPU settings',
    category: 'gaming',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Complete gaming optimization in one click'
  },
  {
    id: 'game-disable-all-overlays',
    name: 'Disable All Overlays',
    description: 'Disables Steam, Discord, NVIDIA, AMD, and Xbox overlays simultaneously',
    category: 'gaming',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'high',
    risk: 'none',
    gamingImpact: 'No overlay stealing GPU or CPU resources'
  },
  {
    id: 'game-optimize-memory-deep',
    name: 'Deep Memory Optimization',
    description: 'Optimizes memory management: disables paging, clears standby, optimizes pagefile',
    category: 'gaming',
    requiredTier: LicenseTier.PREMIUM,
    applied: false,
    impact: 'high',
    risk: 'low',
    gamingImpact: 'Maximum available RAM for games, no memory stutters'
  },
]

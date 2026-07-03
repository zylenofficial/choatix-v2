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

  // INPUT
  {
    id: 'input-optimize-mouse',
    name: 'Optimize Mouse Settings',
    description: 'Sets mouse speed to 6/11 (1:1 raw input) and disables acceleration for optimal gaming aim.',
    category: 'mouse',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Perfect 1:1 mouse input for gaming'
  },
  {
    id: 'input-optimize-keyboard',
    name: 'Optimize Keyboard Settings',
    description: 'Sets optimal keyboard repeat rate (31) and repeat delay (1) for faster key响应.',
    category: 'keyboard',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Faster keyboard response time'
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

  // INPUT
  {
    id: 'mouse-optimize-polling',
    name: 'Optimize Mouse Polling Rate',
    description: 'Configures Windows to use the highest supported mouse polling rate for the smoothest cursor movement.',
    category: 'mouse',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'none',
    gamingImpact: 'Smoother mouse movement, lower input latency'
  },
  {
    id: 'keyboard-optimize-repeat',
    name: 'Optimize Keyboard Repeat Rate',
    description: 'Sets the fastest keyboard repeat rate and shortest delay for responsive key holding.',
    category: 'keyboard',
    requiredTier: LicenseTier.FREE,
    applied: false,
    impact: 'low',
    risk: 'none',
    gamingImpact: 'Faster key repeat for games that use held keys'
  },
  {
    id: 'input-gaming-mode',
    name: 'Gaming Input Mode',
    description: 'Zero keyboard delay, max repeat speed, no mouse acceleration, no mouse trails, 6/11 sensitivity, and disables StickyKeys/FilterKeys/ToggleKeys for the least input lag possible.',
    category: 'input',
    requiredTier: LicenseTier.PRO,
    applied: false,
    impact: 'medium',
    risk: 'low',
    gamingImpact: 'Zero-delay keyboard + raw mouse input for competitive gaming'
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
]

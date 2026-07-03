import { GameProfile } from '@/types'

export const gameProfiles: GameProfile[] = [
  {
    id: 'fortnite',
    name: 'Fortnite',
    executable: 'FortniteClient-Win64-Shipping.exe',
    imagePath: '/Assets/Games/fortnite.png',
    tweaks: [
      'sys-high-performance', 'sys-enable-game-mode', 'sys-disable-fullscreen-opt',
      'sys-disable-gamebar', 'sys-reduce-background', 'sys-disable-vbs',
      'sys-disable-mitigations', 'sys-optimize-fps', 'sys-realtime-priority-games',
      'sys-foreground-boost', 'nv-hardware-scheduling', 'nv-texture-filtering',
      'gpu-disable-ulps', 'mouse-disable-acceleration', 'net-optimize-dns',
      'game-disable-dvr', 'game-disable-game-bar-complete', 'game-optimize-priority',
      'game-optimize-fullscreen', 'net-disable-nagle', 'sys-disable-animations',
      'input-gaming-mode',
    ],
    tweakTiers: {
      free: [
        'sys-high-performance', 'sys-enable-game-mode', 'sys-disable-gamebar',
        'game-disable-dvr', 'game-disable-game-bar-complete', 'sys-disable-animations',
      ],
      pro: [
        'sys-disable-fullscreen-opt', 'sys-reduce-background', 'sys-disable-vbs',
        'nv-hardware-scheduling', 'nv-texture-filtering', 'mouse-disable-acceleration',
        'net-optimize-dns', 'game-optimize-priority', 'game-optimize-fullscreen', 'net-disable-nagle',
        'input-gaming-mode',
      ],
      premium: [
        'sys-disable-mitigations', 'sys-optimize-fps', 'sys-realtime-priority-games',
        'sys-foreground-boost', 'gpu-disable-ulps',
      ],
    },
    priority: 1
  },
  {
    id: 'valorant',
    name: 'Valorant',
    executable: 'VALORANT-Win64-Shipping.exe',
    imagePath: '/Assets/Games/valorant.jpg',
    tweaks: [
      'sys-high-performance', 'sys-enable-game-mode', 'sys-disable-fullscreen-opt',
      'sys-disable-gamebar', 'sys-reduce-background', 'sys-disable-vbs',
      'sys-disable-mitigations', 'sys-optimize-fps', 'sys-realtime-priority-games',
      'sys-foreground-boost', 'nv-hardware-scheduling', 'nv-texture-filtering',
      'gpu-disable-ulps', 'mouse-disable-acceleration', 'net-optimize-dns',
      'net-optimize-performance', 'game-disable-dvr', 'game-disable-game-bar-complete',
      'game-optimize-fullscreen', 'sys-cpu-priority', 'input-gaming-mode',
    ],
    tweakTiers: {
      free: [
        'sys-high-performance', 'sys-enable-game-mode', 'sys-disable-gamebar',
        'game-disable-dvr', 'game-disable-game-bar-complete', 'sys-disable-animations',
      ],
      pro: [
        'sys-disable-fullscreen-opt', 'sys-reduce-background', 'sys-disable-vbs',
        'nv-hardware-scheduling', 'nv-texture-filtering', 'mouse-disable-acceleration',
        'net-optimize-dns', 'net-optimize-performance', 'game-optimize-fullscreen', 'sys-cpu-priority',
        'input-gaming-mode',
      ],
      premium: [
        'sys-disable-mitigations', 'sys-optimize-fps', 'sys-realtime-priority-games',
        'sys-foreground-boost', 'gpu-disable-ulps',
      ],
    },
    priority: 1
  },
  {
    id: 'league-of-legends',
    name: 'League of Legends',
    executable: 'League of Legends.exe',
    imagePath: '/Assets/Games/league-of-legends.png',
    tweaks: [
      'sys-high-performance', 'sys-enable-game-mode', 'sys-disable-fullscreen-opt',
      'sys-disable-gamebar', 'sys-reduce-background', 'sys-disable-vbs',
      'sys-optimize-fps', 'sys-realtime-priority-games', 'sys-foreground-boost',
      'nv-hardware-scheduling', 'nv-texture-filtering', 'mouse-disable-acceleration',
      'net-optimize-dns', 'game-disable-dvr', 'game-disable-game-bar-complete',
      'game-optimize-priority', 'sys-disable-animations', 'input-gaming-mode',
    ],
    tweakTiers: {
      free: [
        'sys-high-performance', 'sys-enable-game-mode', 'sys-disable-gamebar',
        'game-disable-dvr', 'game-disable-game-bar-complete', 'sys-disable-animations',
      ],
      pro: [
        'sys-disable-fullscreen-opt', 'sys-reduce-background', 'sys-disable-vbs',
        'nv-hardware-scheduling', 'nv-texture-filtering', 'mouse-disable-acceleration',
        'net-optimize-dns', 'game-optimize-priority', 'input-gaming-mode',
      ],
      premium: [
        'sys-optimize-fps', 'sys-realtime-priority-games', 'sys-foreground-boost',
      ],
    },
    priority: 1
  },
  {
    id: 'cs2',
    name: 'Counter-Strike 2',
    executable: 'cs2.exe',
    imagePath: '/Assets/Games/cs2.png',
    tweaks: [
      'sys-high-performance', 'sys-enable-game-mode', 'sys-disable-fullscreen-opt',
      'sys-disable-gamebar', 'sys-reduce-background', 'sys-disable-vbs',
      'sys-disable-mitigations', 'sys-optimize-fps', 'sys-realtime-priority-games',
      'sys-foreground-boost', 'nv-hardware-scheduling', 'nv-texture-filtering',
      'gpu-disable-ulps', 'mouse-disable-acceleration', 'net-optimize-dns',
      'net-optimize-performance', 'sys-cpu-priority', 'game-disable-dvr',
      'game-disable-game-bar-complete', 'game-optimize-priority', 'game-optimize-fullscreen',
      'net-disable-nagle', 'sys-disable-animations', 'input-gaming-mode',
    ],
    tweakTiers: {
      free: [
        'sys-high-performance', 'sys-enable-game-mode', 'sys-disable-gamebar',
        'game-disable-dvr', 'game-disable-game-bar-complete', 'sys-disable-animations',
      ],
      pro: [
        'sys-disable-fullscreen-opt', 'sys-reduce-background', 'sys-disable-vbs',
        'nv-hardware-scheduling', 'nv-texture-filtering', 'mouse-disable-acceleration',
        'net-optimize-dns', 'net-optimize-performance', 'sys-cpu-priority',
        'game-optimize-priority', 'game-optimize-fullscreen', 'net-disable-nagle',
        'input-gaming-mode',
      ],
      premium: [
        'sys-disable-mitigations', 'sys-optimize-fps', 'sys-realtime-priority-games',
        'sys-foreground-boost', 'gpu-disable-ulps',
      ],
    },
    priority: 1
  },
  {
    id: 'apex-legends',
    name: 'Apex Legends',
    executable: 'r5apex.exe',
    imagePath: '/Assets/Games/apex-legends.jpg',
    tweaks: [
      'sys-high-performance', 'sys-enable-game-mode', 'sys-disable-fullscreen-opt',
      'sys-disable-gamebar', 'sys-reduce-background', 'sys-disable-vbs',
      'sys-disable-mitigations', 'sys-optimize-fps', 'sys-realtime-priority-games',
      'sys-foreground-boost', 'nv-hardware-scheduling', 'nv-texture-filtering',
      'gpu-disable-ulps', 'mouse-disable-acceleration', 'net-optimize-dns',
      'game-disable-dvr', 'game-disable-game-bar-complete', 'game-optimize-priority',
      'net-disable-nagle', 'input-gaming-mode',
    ],
    tweakTiers: {
      free: [
        'sys-high-performance', 'sys-enable-game-mode', 'sys-disable-gamebar',
        'game-disable-dvr', 'game-disable-game-bar-complete', 'sys-disable-animations',
      ],
      pro: [
        'sys-disable-fullscreen-opt', 'sys-reduce-background', 'sys-disable-vbs',
        'nv-hardware-scheduling', 'nv-texture-filtering', 'mouse-disable-acceleration',
        'net-optimize-dns', 'game-optimize-priority', 'net-disable-nagle',
        'input-gaming-mode',
      ],
      premium: [
        'sys-disable-mitigations', 'sys-optimize-fps', 'sys-realtime-priority-games',
        'sys-foreground-boost', 'gpu-disable-ulps',
      ],
    },
    priority: 1
  },
  {
    id: 'warzone',
    name: 'Call of Duty: Warzone',
    executable: 'ModernWarfare.exe',
    imagePath: '/Assets/Games/warzone.jpg',
    tweaks: [
      'sys-high-performance', 'sys-enable-game-mode', 'sys-disable-fullscreen-opt',
      'sys-disable-gamebar', 'sys-reduce-background', 'sys-disable-vbs',
      'sys-disable-mitigations', 'sys-optimize-fps', 'sys-realtime-priority-games',
      'sys-foreground-boost', 'nv-hardware-scheduling', 'nv-texture-filtering',
      'gpu-disable-ulps', 'mouse-disable-acceleration', 'net-optimize-dns',
      'sys-cpu-priority', 'game-disable-dvr', 'game-disable-game-bar-complete',
      'game-optimize-priority', 'game-optimize-fullscreen', 'net-disable-nagle',
      'sys-disable-animations', 'input-gaming-mode',
    ],
    tweakTiers: {
      free: [
        'sys-high-performance', 'sys-enable-game-mode', 'sys-disable-gamebar',
        'game-disable-dvr', 'game-disable-game-bar-complete', 'sys-disable-animations',
      ],
      pro: [
        'sys-disable-fullscreen-opt', 'sys-reduce-background', 'sys-disable-vbs',
        'nv-hardware-scheduling', 'nv-texture-filtering', 'mouse-disable-acceleration',
        'net-optimize-dns', 'sys-cpu-priority', 'game-optimize-priority',
        'game-optimize-fullscreen', 'net-disable-nagle', 'input-gaming-mode',
      ],
      premium: [
        'sys-disable-mitigations', 'sys-optimize-fps', 'sys-realtime-priority-games',
        'sys-foreground-boost', 'gpu-disable-ulps',
      ],
    },
    priority: 1
  },
  {
    id: 'minecraft',
    name: 'Minecraft',
    executable: 'minecraft.exe',
    imagePath: '',
    tweaks: [
      'sys-high-performance', 'sys-enable-game-mode', 'sys-disable-gamebar',
      'sys-reduce-background', 'sys-disable-vbs', 'sys-optimize-fps',
      'nv-hardware-scheduling', 'game-disable-dvr', 'game-disable-game-bar-complete',
      'game-optimize-priority', 'sys-disable-animations', 'input-gaming-mode',
    ],
    tweakTiers: {
      free: [
        'sys-high-performance', 'sys-enable-game-mode', 'sys-disable-gamebar',
        'game-disable-dvr', 'game-disable-game-bar-complete', 'sys-disable-animations',
      ],
      pro: [
        'sys-reduce-background', 'sys-disable-vbs', 'nv-hardware-scheduling', 'game-optimize-priority',
        'input-gaming-mode',
      ],
      premium: [
        'sys-optimize-fps',
      ],
    },
    priority: 2
  },
  {
    id: 'fivem',
    name: 'FiveM',
    executable: 'FiveM.exe',
    imagePath: '/Assets/Games/fivem.jpg',
    tweaks: [
      'sys-high-performance', 'sys-enable-game-mode', 'sys-disable-fullscreen-opt',
      'sys-disable-gamebar', 'sys-reduce-background', 'sys-disable-vbs',
      'sys-disable-mitigations', 'sys-optimize-fps', 'sys-realtime-priority-games',
      'sys-foreground-boost', 'nv-hardware-scheduling', 'gpu-disable-ulps',
      'mouse-disable-acceleration', 'net-optimize-dns', 'game-disable-dvr',
      'game-disable-game-bar-complete', 'game-optimize-priority', 'sys-cpu-priority',
      'sys-disable-animations', 'input-gaming-mode',
    ],
    tweakTiers: {
      free: [
        'sys-high-performance', 'sys-enable-game-mode', 'sys-disable-gamebar',
        'game-disable-dvr', 'game-disable-game-bar-complete', 'sys-disable-animations',
      ],
      pro: [
        'sys-disable-fullscreen-opt', 'sys-reduce-background', 'sys-disable-vbs',
        'nv-hardware-scheduling', 'mouse-disable-acceleration', 'net-optimize-dns',
        'game-optimize-priority', 'sys-cpu-priority', 'input-gaming-mode',
      ],
      premium: [
        'sys-disable-mitigations', 'sys-optimize-fps', 'sys-realtime-priority-games',
        'sys-foreground-boost', 'gpu-disable-ulps',
      ],
    },
    priority: 1
  },
  {
    id: 'gta-v',
    name: 'Grand Theft Auto V',
    executable: 'GTA5.exe',
    imagePath: '/Assets/Games/gta-v.jfif',
    tweaks: [
      'sys-high-performance', 'sys-enable-game-mode', 'sys-disable-fullscreen-opt',
      'sys-disable-gamebar', 'sys-reduce-background', 'sys-disable-vbs',
      'sys-disable-mitigations', 'sys-optimize-fps', 'sys-realtime-priority-games',
      'sys-foreground-boost', 'nv-hardware-scheduling', 'gpu-disable-ulps',
      'mouse-disable-acceleration', 'game-disable-dvr', 'game-disable-game-bar-complete',
      'game-optimize-priority', 'sys-disable-animations', 'input-gaming-mode',
    ],
    tweakTiers: {
      free: [
        'sys-high-performance', 'sys-enable-game-mode', 'sys-disable-gamebar',
        'game-disable-dvr', 'game-disable-game-bar-complete', 'sys-disable-animations',
      ],
      pro: [
        'sys-disable-fullscreen-opt', 'sys-reduce-background', 'sys-disable-vbs',
        'nv-hardware-scheduling', 'mouse-disable-acceleration', 'game-optimize-priority',
        'input-gaming-mode',
      ],
      premium: [
        'sys-disable-mitigations', 'sys-optimize-fps', 'sys-realtime-priority-games',
        'sys-foreground-boost', 'gpu-disable-ulps',
      ],
    },
    priority: 1
  },
  {
    id: 'rainbow-six-siege',
    name: 'Rainbow Six Siege',
    executable: 'RainbowSix.exe',
    imagePath: '',
    tweaks: [
      'sys-high-performance', 'sys-enable-game-mode', 'sys-disable-fullscreen-opt',
      'sys-disable-gamebar', 'sys-reduce-background', 'sys-disable-vbs',
      'sys-disable-mitigations', 'sys-optimize-fps', 'sys-realtime-priority-games',
      'sys-foreground-boost', 'nv-hardware-scheduling', 'nv-texture-filtering',
      'gpu-disable-ulps', 'mouse-disable-acceleration', 'net-optimize-dns',
      'net-optimize-performance', 'game-disable-dvr', 'game-disable-game-bar-complete',
      'game-optimize-priority', 'game-optimize-fullscreen', 'sys-cpu-priority',
      'input-gaming-mode',
    ],
    tweakTiers: {
      free: [
        'sys-high-performance', 'sys-enable-game-mode', 'sys-disable-gamebar',
        'game-disable-dvr', 'game-disable-game-bar-complete', 'sys-disable-animations',
      ],
      pro: [
        'sys-disable-fullscreen-opt', 'sys-reduce-background', 'sys-disable-vbs',
        'nv-hardware-scheduling', 'nv-texture-filtering', 'mouse-disable-acceleration',
        'net-optimize-dns', 'net-optimize-performance', 'game-optimize-priority',
        'game-optimize-fullscreen', 'sys-cpu-priority', 'input-gaming-mode',
      ],
      premium: [
        'sys-disable-mitigations', 'sys-optimize-fps', 'sys-realtime-priority-games',
        'sys-foreground-boost', 'gpu-disable-ulps',
      ],
    },
    priority: 1
  },
  {
    id: 'pubg',
    name: 'PUBG',
    executable: 'TslGame.exe',
    imagePath: '/Assets/Games/pubg.png',
    tweaks: [
      'sys-high-performance', 'sys-enable-game-mode', 'sys-disable-fullscreen-opt',
      'sys-disable-gamebar', 'sys-reduce-background', 'sys-disable-vbs',
      'sys-disable-mitigations', 'sys-optimize-fps', 'sys-realtime-priority-games',
      'sys-foreground-boost', 'nv-hardware-scheduling', 'nv-texture-filtering',
      'gpu-disable-ulps', 'mouse-disable-acceleration', 'net-optimize-dns',
      'game-disable-dvr', 'game-disable-game-bar-complete', 'game-optimize-priority',
      'net-disable-nagle', 'sys-disable-animations', 'input-gaming-mode',
    ],
    tweakTiers: {
      free: [
        'sys-high-performance', 'sys-enable-game-mode', 'sys-disable-gamebar',
        'game-disable-dvr', 'game-disable-game-bar-complete', 'sys-disable-animations',
      ],
      pro: [
        'sys-disable-fullscreen-opt', 'sys-reduce-background', 'sys-disable-vbs',
        'nv-hardware-scheduling', 'nv-texture-filtering', 'mouse-disable-acceleration',
        'net-optimize-dns', 'game-optimize-priority', 'net-disable-nagle',
        'input-gaming-mode',
      ],
      premium: [
        'sys-disable-mitigations', 'sys-optimize-fps', 'sys-realtime-priority-games',
        'sys-foreground-boost', 'gpu-disable-ulps',
      ],
    },
    priority: 1
  },
]

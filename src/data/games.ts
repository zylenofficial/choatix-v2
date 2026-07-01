import { GameProfile } from '@/types'

export const gameProfiles: GameProfile[] = [
  {
    id: 'fortnite',
    name: 'Fortnite',
    executable: 'FortniteClient-Win64-Shipping.exe',
    imagePath: '/Assets/Games/fortnite.jpg',
    tweaks: [
      'power-high-performance',
      'game-mode',
      'disable-fullscreen-optimizations',
      'visual-effects-performance',
      'network-latency-tuning',
      'disable-background-apps',
      'gpu-hardware-scheduling',
      'disable-game-dvr'
    ],
    priority: 1
  },
  {
    id: 'valorant',
    name: 'Valorant',
    executable: 'VALORANT-Win64-Shipping.exe',
    imagePath: '/Assets/Games/valorant.jpg',
    tweaks: [
      'power-high-performance',
      'game-mode',
      'disable-fullscreen-optimizations',
      'visual-effects-performance',
      'network-latency-tuning',
      'disable-background-apps',
      'gpu-hardware-scheduling',
      'disable-game-dvr',
      'network-throttling-disable'
    ],
    priority: 1
  },
  {
    id: 'league-of-legends',
    name: 'League of Legends',
    executable: 'League of Legends.exe',
    imagePath: '/Assets/Games/league-of-legends.jpg',
    tweaks: [
      'power-high-performance',
      'game-mode',
      'disable-fullscreen-optimizations',
      'visual-effects-performance',
      'network-latency-tuning',
      'disable-background-apps'
    ],
    priority: 1
  },
  {
    id: 'cs2',
    name: 'Counter-Strike 2',
    executable: 'cs2.exe',
    imagePath: '/Assets/Games/cs2.jpg',
    tweaks: [
      'power-high-performance',
      'game-mode',
      'disable-fullscreen-optimizations',
      'visual-effects-performance',
      'network-latency-tuning',
      'disable-background-apps',
      'gpu-hardware-scheduling',
      'disable-game-dvr',
      'network-throttling-disable',
      'cpu-priority-boost'
    ],
    priority: 1
  },
  {
    id: 'apex-legends',
    name: 'Apex Legends',
    executable: 'r5apex.exe',
    imagePath: '/Assets/Games/apex-legends.jpg',
    tweaks: [
      'power-high-performance',
      'game-mode',
      'disable-fullscreen-optimizations',
      'visual-effects-performance',
      'network-latency-tuning',
      'disable-background-apps',
      'gpu-hardware-scheduling',
      'disable-game-dvr'
    ],
    priority: 1
  },
  {
    id: 'warzone',
    name: 'Call of Duty: Warzone',
    executable: 'ModernWarfare.exe',
    imagePath: '/Assets/Games/warzone.jpg',
    tweaks: [
      'power-high-performance',
      'game-mode',
      'disable-fullscreen-optimizations',
      'visual-effects-performance',
      'network-latency-tuning',
      'disable-background-apps',
      'gpu-hardware-scheduling',
      'disable-game-dvr',
      'cpu-priority-boost'
    ],
    priority: 1
  },

  {
    id: 'minecraft',
    name: 'Minecraft',
    executable: 'minecraft.exe',
    imagePath: '/Assets/Games/minecraft.jpg',
    tweaks: [
      'power-high-performance',
      'game-mode',
      'visual-effects-performance',
      'disable-background-apps',
      'gpu-hardware-scheduling'
    ],
    priority: 2
  },

  {
    id: 'fivem',
    name: 'FiveM',
    executable: 'FiveM.exe',
    imagePath: '/Assets/Games/fivem.jpg',
    tweaks: [
      'power-high-performance',
      'game-mode',
      'disable-fullscreen-optimizations',
      'visual-effects-performance',
      'network-latency-tuning',
      'disable-background-apps',
      'gpu-hardware-scheduling',
      'disable-game-dvr'
    ],
    priority: 1
  },
  {
    id: 'gta-v',
    name: 'Grand Theft Auto V',
    executable: 'GTA5.exe',
    imagePath: '/Assets/Games/gta-v.jpg',
    tweaks: [
      'power-high-performance',
      'game-mode',
      'disable-fullscreen-optimizations',
      'visual-effects-performance',
      'disable-background-apps',
      'gpu-hardware-scheduling',
      'disable-game-dvr'
    ],
    priority: 1
  },

  {
    id: 'rainbow-six-siege',
    name: 'Rainbow Six Siege',
    executable: 'RainbowSix.exe',
    imagePath: '/Assets/Games/rainbow-six-siege.jpg',
    tweaks: [
      'power-high-performance',
      'game-mode',
      'disable-fullscreen-optimizations',
      'visual-effects-performance',
      'network-latency-tuning',
      'disable-background-apps',
      'gpu-hardware-scheduling',
      'disable-game-dvr',
      'network-throttling-disable'
    ],
    priority: 1
  },
  {
    id: 'pubg',
    name: 'PUBG',
    executable: 'TslGame.exe',
    imagePath: '/Assets/Games/pubg.jpg',
    tweaks: [
      'power-high-performance',
      'game-mode',
      'disable-fullscreen-optimizations',
      'visual-effects-performance',
      'network-latency-tuning',
      'disable-background-apps',
      'gpu-hardware-scheduling',
      'disable-game-dvr'
    ],
    priority: 1
  },
]

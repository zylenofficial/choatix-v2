import { GameProfile } from '@/types'

export const gameProfiles: GameProfile[] = [
  {
    id: 'fortnite',
    name: 'Fortnite',
    executable: 'FortniteClient-Win64-Shipping.exe',
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
    id: 'overwatch-2',
    name: 'Overwatch 2',
    executable: 'Overwatch.exe',
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
    id: 'minecraft',
    name: 'Minecraft',
    executable: 'minecraft.exe',
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
    id: 'roblox',
    name: 'Roblox',
    executable: 'RobloxPlayerBeta.exe',
    tweaks: [
      'power-high-performance',
      'game-mode',
      'visual-effects-performance',
      'disable-background-apps'
    ],
    priority: 2
  },
  {
    id: 'fivem',
    name: 'FiveM',
    executable: 'FiveM.exe',
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
    id: 'rocket-league',
    name: 'Rocket League',
    executable: 'RocketLeague.exe',
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
    id: 'rainbow-six-siege',
    name: 'Rainbow Six Siege',
    executable: 'RainbowSix.exe',
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
    id: 'destiny-2',
    name: 'Destiny 2',
    executable: 'destiny2.exe',
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
  }
]

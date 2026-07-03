import { LicenseTier } from '@/types'

export interface ProofResult {
  timestamp: number
  tweaksApplied: string[]
  metrics: {
    cpu: { avg: number; max: number; min: number }
    gpu: { avg: number; max: number; min: number }
    ram: { avg: number; max: number; min: number }
    fps?: { avg: number; min: number; '1% low': number; '0.1% low': number }
    latency?: { input: number; network: number; dpc: number }
    storage?: { read: number; write: number }
  }
  systemInfo: {
    cpu: string
    gpu: string
    ram: string
    os: string
    driver: string
  }
  notes: string
}

export interface GameConfig {
  gameId: string
  gameName: string
  executable: string
  configPath: string
  optimizations: ConfigOptimization[]
  backupPath?: string
  applied: boolean
}

export interface ConfigOptimization {
  setting: string
  description: string
  value: string | number | boolean
  reason: string
  risk: 'none' | 'low' | 'medium' | 'high'
  measurable: boolean
}

export const GAME_CONFIGS: GameConfig[] = [
  {
    gameId: 'fortnite',
    gameName: 'Fortnite',
    executable: 'FortniteClient-Win64-Shipping.exe',
    configPath: '%LOCALAPPDATA%\\FortniteGame\\Saved\\Config\\WindowsClient\\GameUserSettings.ini',
    optimizations: [
      { setting: 'FrameRateLimit', value: 0, description: 'Uncap FPS', reason: 'Removes artificial frame cap', risk: 'none', measurable: true },
      { setting: 'bUseVSync', value: false, description: 'Disable V-Sync', reason: 'Reduces input latency', risk: 'low', measurable: true },
      { setting: 'RenderQuality', value: 100, description: 'Maximum render quality', reason: 'Best visual quality at native resolution', risk: 'none', measurable: false },
      { setting: 'r.ScreenPercentage', value: 100, description: '100% resolution scale', reason: 'Native resolution, no upscaling blur', risk: 'none', measurable: false },
      { setting: 'bUseNanite', value: true, description: 'Enable Nanite virtualized geometry', reason: 'Better performance with high detail', risk: 'low', measurable: true },
      { setting: 'bUseLumen', value: true, description: 'Enable Lumen global illumination', reason: 'Dynamic GI without baked lighting cost', risk: 'low', measurable: true },
      { setting: 'r.TSR.History.ScreenPercentage', value: 100, description: 'TSR at native resolution', reason: 'No TSR upscaling artifacts', risk: 'none', measurable: false },
    ],
    applied: false
  },
  {
    gameId: 'valorant',
    gameName: 'VALORANT',
    executable: 'VALORANT-Win64-Shipping.exe',
    configPath: '%LOCALAPPDATA%\\VALORANT\\Saved\\Config\\WindowsClient\\GameUserSettings.ini',
    optimizations: [
      { setting: 'bUseVSync', value: false, description: 'Disable V-Sync', reason: 'Minimum input latency for competitive play', risk: 'low', measurable: true },
      { setting: 'FrameRateCap', value: 0, description: 'Uncap FPS', reason: 'Maximum frame rate for lowest latency', risk: 'none', measurable: true },
      { setting: 'bRawInput', value: true, description: 'Raw mouse input', reason: 'Bypasses OS mouse processing', risk: 'none', measurable: true },
      { setting: 'bUseDynamicResolution', value: false, description: 'Disable dynamic resolution', reason: 'Consistent visual clarity', risk: 'none', measurable: false },
      { setting: 'r.ScreenPercentage', value: 100, description: 'Native resolution', reason: 'No scaling artifacts', risk: 'none', measurable: false },
    ],
    applied: false
  },
  {
    gameId: 'cs2',
    gameName: 'Counter-Strike 2',
    executable: 'cs2.exe',
    configPath: '%PROGRAMFILES(X86)%\\Steam\\steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\cfg\\autoexec.cfg',
    optimizations: [
      { setting: 'fps_max', value: 0, description: 'Uncap FPS', reason: 'No frame limit for lowest latency', risk: 'none', measurable: true },
      { setting: 'mat_vsync', value: 0, description: 'Disable V-Sync', reason: 'Eliminate input lag', risk: 'low', measurable: true },
      { setting: 'm_rawinput', value: 1, description: 'Raw mouse input', reason: 'Direct mouse-to-game connection', risk: 'none', measurable: true },
      { setting: 'm_mouseaccel1', value: 0, description: 'No mouse acceleration', reason: 'Consistent aim', risk: 'none', measurable: true },
      { setting: 'm_mouseaccel2', value: 0, description: 'No mouse acceleration', reason: 'Consistent aim', risk: 'none', measurable: true },
      { setting: 'cl_mouseenable', value: 1, description: 'Enable mouse', reason: 'Ensure mouse input works', risk: 'none', measurable: false },
      { setting: 'r_shadows', value: 0, description: 'Disable shadows', reason: 'Higher FPS, less visual noise', risk: 'none', measurable: true },
      { setting: 'mat_queue_mode', value: 2, description: 'Multicore rendering', reason: 'Better CPU utilization', risk: 'low', measurable: true },
      { setting: 'r_csgo_render_decals', value: 0, description: 'Disable decals', reason: 'Less GPU work', risk: 'none', measurable: true },
      { setting: 'cl_forcepreload', value: 1, description: 'Preload models/textures', reason: 'Reduces stutter during gameplay', risk: 'low', measurable: true },
    ],
    applied: false
  },
  {
    gameId: 'apex',
    gameName: 'Apex Legends',
    executable: 'r5apex.exe',
    configPath: '%LOCALAPPDATA%\\Respawn\\Apex\\cfg\\autoexec.cfg',
    optimizations: [
      { setting: 'cl_mouse_rawinput', value: 1, description: 'Raw mouse input', reason: 'Direct mouse input, no OS filtering', risk: 'none', measurable: true },
      { setting: 'cl_mouse_accel', value: 0, description: 'No mouse acceleration', reason: 'Consistent aim', risk: 'none', measurable: true },
      { setting: 'fps_max', value: 0, description: 'Uncap FPS', reason: 'Maximum frame rate', risk: 'none', measurable: true },
      { setting: 'r_vsync', value: 0, description: 'Disable V-Sync', reason: 'Lowest input latency', risk: 'low', measurable: true },
      { setting: 'mat_queue_mode', value: 2, description: 'Multicore rendering', reason: 'Better CPU utilization', risk: 'low', measurable: true },
      { setting: 'r_adaptiveresolution', value: 0, description: 'Disable adaptive resolution', reason: 'Consistent visual quality', risk: 'none', measurable: false },
      { setting: 'r_dynamic', value: 0, description: 'Disable dynamic lighting', reason: 'Consistent performance', risk: 'none', measurable: true },
    ],
    applied: false
  },
  {
    gameId: 'warzone',
    gameName: 'Call of Duty: Warzone',
    executable: 'ModernWarfare.exe',
    configPath: '%USERPROFILE%\\Documents\\Call of Duty Modern Warfare\\players\\options.ini',
    optimizations: [
      { setting: 'RenderResolution', value: 1.0, description: 'Native resolution', reason: 'No upscaling blur', risk: 'none', measurable: false },
      { setting: 'VSyncEnabled', value: 0, description: 'Disable V-Sync', reason: 'Minimum input latency', risk: 'low', measurable: true },
      { setting: 'MouseRawInput', value: 1, description: 'Raw mouse input', reason: 'Direct mouse-to-game', risk: 'none', measurable: true },
      { setting: 'MouseAcceleration', value: 0, description: 'No mouse acceleration', reason: 'Consistent aim', risk: 'none', measurable: true },
      { setting: 'FrameRateLimit', value: 0, description: 'Uncap FPS', reason: 'Maximum frame rate', risk: 'none', measurable: true },
      { setting: 'TextureResolution', value: 1, description: 'High textures', reason: 'Better visual clarity at distance', risk: 'low', measurable: false },
      { setting: 'ShadowMapResolution', value: 0, description: 'Disable shadows', reason: 'Higher FPS, less GPU load', risk: 'none', measurable: true },
    ],
    applied: false
  },
  {
    gameId: 'overwatch2',
    gameName: 'Overwatch 2',
    executable: 'Overwatch.exe',
    configPath: '%USERPROFILE%\\Documents\\Overwatch\\Settings\\Variables.txt',
    optimizations: [
      { setting: 'FrameRateCap', value: 0, description: 'Uncap FPS', reason: 'No artificial limit', risk: 'none', measurable: true },
      { setting: 'VSyncEnabled', value: 0, description: 'Disable V-Sync', reason: 'Lowest input latency', risk: 'low', measurable: true },
      { setting: 'MouseRawInput', value: 1, description: 'Raw mouse input', reason: 'Direct mouse connection', risk: 'none', measurable: true },
      { setting: 'ReduceBuffering', value: 1, description: 'Reduce buffering', reason: 'Lower latency', risk: 'low', measurable: true },
      { setting: 'GraphicsQuality', value: 0, description: 'Low graphics', reason: 'Maximum FPS', risk: 'none', measurable: true },
    ],
    applied: false
  },
  {
    gameId: 'rocket-league',
    gameName: 'Rocket League',
    executable: 'RocketLeague.exe',
    configPath: '%USERPROFILE%\\Documents\\My Games\\Rocket League\\TAGame\\Config\\TASystemSettings.ini',
    optimizations: [
      { setting: 'MaxFPS', value: 0, description: 'Uncap FPS', reason: 'No frame limit', risk: 'none', measurable: true },
      { setting: 'bUseVSync', value: false, description: 'Disable V-Sync', reason: 'Lowest latency', risk: 'low', measurable: true },
      { setting: 'OneFrameThreadLag', value: false, description: 'Disable frame lag', reason: 'Reduce input latency', risk: 'low', measurable: true },
      { setting: 'TextureDetail', value: 0, description: 'Low textures', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'WorldDetail', value: 0, description: 'Low world detail', reason: 'Higher FPS', risk: 'none', measurable: true },
    ],
    applied: false
  },
  {
    gameId: 'pubg',
    gameName: 'PUBG: BATTLEGROUNDS',
    executable: 'TslGame.exe',
    configPath: '%LOCALAPPDATA%\\TslGame\\Saved\\Config\\WindowsNoEditor\\GameUserSettings.ini',
    optimizations: [
      { setting: 'FrameRateCap', value: 0, description: 'Uncap FPS', reason: 'No frame limit', risk: 'none', measurable: true },
      { setting: 'bUseVSync', value: false, description: 'Disable V-Sync', reason: 'Lowest latency', risk: 'low', measurable: true },
      { setting: 'MouseSensitivity', value: 1.0, description: 'Standard sensitivity', reason: 'Consistent baseline', risk: 'none', measurable: false },
      { setting: 'ScreenScale', value: 100, description: 'Native resolution', reason: 'No scaling artifacts', risk: 'none', measurable: false },
      { setting: 'PostProcessQuality', value: 0, description: 'Low post-process', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'ShadowQuality', value: 0, description: 'Disable shadows', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'TextureQuality', value: 0, description: 'Low textures', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'EffectsQuality', value: 0, description: 'Low effects', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'FoliageQuality', value: 0, description: 'Low foliage', reason: 'Better visibility, higher FPS', risk: 'none', measurable: true },
    ],
    applied: false
  },
  {
    gameId: 'r6',
    gameName: 'Rainbow Six Siege',
    executable: 'RainbowSix.exe',
    configPath: '%USERPROFILE%\\Documents\\My Games\\Rainbow Six Siege\\%UUID%\\GameSettings.ini',
    optimizations: [
      { setting: 'FramerateCap', value: 0, description: 'Uncap FPS', reason: 'No frame limit', risk: 'none', measurable: true },
      { setting: 'VSync', value: 0, description: 'Disable V-Sync', reason: 'Lowest latency', risk: 'low', measurable: true },
      { setting: 'MouseRawInput', value: 1, description: 'Raw mouse input', reason: 'Direct mouse connection', risk: 'none', measurable: true },
      { setting: 'TextureQuality', value: 0, description: 'Low textures', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'ShadowQuality', value: 0, description: 'Disable shadows', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'ReflectionQuality', value: 0, description: 'Low reflections', reason: 'Higher FPS', risk: 'none', measurable: true },
    ],
    applied: false
  },
  {
    gameId: 'minecraft',
    gameName: 'Minecraft (Java)',
    executable: 'javaw.exe',
    configPath: '%APPDATA%\\.minecraft\\options.txt',
    optimizations: [
      { setting: 'fpsLimit', value: 0, description: 'Uncap FPS', reason: 'No frame limit', risk: 'none', measurable: true },
      { setting: 'useVSync', value: false, description: 'Disable V-Sync', reason: 'Lowest latency', risk: 'low', measurable: true },
      { setting: 'fovSetting', value: 110, description: 'Max FOV', reason: 'Better peripheral vision', risk: 'none', measurable: false },
      { setting: 'gamma', value: 100, description: 'Brightness', reason: 'Better visibility in dark', risk: 'none', measurable: false },
      { setting: 'renderDistance', value: 12, description: 'Moderate render distance', reason: 'Balance FPS/visibility', risk: 'none', measurable: true },
      { setting: 'particles', value: 'minimal', description: 'Minimal particles', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'clouds', value: false, description: 'Disable clouds', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'entityShadows', value: false, description: 'Disable entity shadows', reason: 'Higher FPS', risk: 'none', measurable: true },
    ],
    applied: false
  },
  {
    gameId: 'league-of-legends',
    gameName: 'League of Legends',
    executable: 'League of Legends.exe',
    configPath: '%LOCALAPPDATA%\\Riot Games\\League of Legends\\Config\\PersistedSettings.json',
    optimizations: [
      { setting: 'FrameRateCap', value: 0, description: 'Uncap FPS', reason: 'No frame limit', risk: 'none', measurable: true },
      { setting: 'VSyncEnabled', value: 0, description: 'Disable V-Sync', reason: 'Lowest latency', risk: 'low', measurable: true },
      { setting: 'AntiAliasing', value: 0, description: 'Disable AA', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'ShadowsEnabled', value: 0, description: 'Disable shadows', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'CharacterQuality', value: 1, description: 'Low character quality', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'EnvironmentQuality', value: 1, description: 'Low environment quality', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'EffectsQuality', value: 1, description: 'Low effects quality', reason: 'Higher FPS', risk: 'none', measurable: true },
    ],
    applied: false
  },
  {
    gameId: 'dota2',
    gameName: 'Dota 2',
    executable: 'dota2.exe',
    configPath: '%PROGRAMFILES(X86)%\\Steam\\steamapps\\common\\dota 2 beta\\game\\dota\\cfg\\autoexec.cfg',
    optimizations: [
      { setting: 'fps_max', value: 0, description: 'Uncap FPS', reason: 'No frame limit', risk: 'none', measurable: true },
      { setting: 'mat_vsync', value: 0, description: 'Disable V-Sync', reason: 'Lowest latency', risk: 'low', measurable: true },
      { setting: 'cl_mouseenable', value: 1, description: 'Enable mouse', reason: 'Ensure mouse works', risk: 'none', measurable: false },
      { setting: 'm_rawinput', value: 1, description: 'Raw mouse input', reason: 'Direct mouse connection', risk: 'none', measurable: true },
      { setting: 'r_shadows', value: 0, description: 'Disable shadows', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'mat_queue_mode', value: 2, description: 'Multicore rendering', reason: 'Better CPU utilization', risk: 'low', measurable: true },
      { setting: 'r_drawparticles', value: 0, description: 'Disable particles', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'cl_particle_sim_fallback_base_multiplier', value: 0, description: 'Disable particle fallback', reason: 'Higher FPS', risk: 'none', measurable: true },
    ],
    applied: false
  },
  {
    gameId: 'destiny2',
    gameName: 'Destiny 2',
    executable: 'destiny2.exe',
    configPath: '%APPDATA%\\Bungie\\DestinyPC\\prefs.xml',
    optimizations: [
      { setting: 'FrameLimit', value: 0, description: 'Uncap FPS', reason: 'No frame limit', risk: 'none', measurable: true },
      { setting: 'VSyncMode', value: 0, description: 'Disable V-Sync', reason: 'Lowest latency', risk: 'low', measurable: true },
      { setting: 'MouseAcceleration', value: 0, description: 'No mouse acceleration', reason: 'Consistent aim', risk: 'none', measurable: true },
      { setting: 'RenderDetail', value: 0, description: 'Low render detail', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'ShadowQuality', value: 0, description: 'Low shadows', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'TextureQuality', value: 0, description: 'Low textures', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'EffectQuality', value: 0, description: 'Low effects', reason: 'Higher FPS', risk: 'none', measurable: true },
    ],
    applied: false
  },
  {
    gameId: 'tarkov',
    gameName: 'Escape from Tarkov',
    executable: 'EscapeFromTarkov.exe',
    configPath: '%LOCALAPPDATA%\\Battlestate Games\\Escape from Tarkov\\local.ini',
    optimizations: [
      { setting: 'fps_limit', value: 0, description: 'Uncap FPS', reason: 'No frame limit', risk: 'none', measurable: true },
      { setting: 'vsync', value: 0, description: 'Disable V-Sync', reason: 'Lowest latency', risk: 'low', measurable: true },
      { setting: 'mouse_acceleration', value: 0, description: 'No mouse acceleration', reason: 'Consistent aim', risk: 'none', measurable: true },
      { setting: 'overall_visibility', value: 1000, description: '1000m visibility', reason: 'Balance FPS/visibility', risk: 'none', measurable: true },
      { setting: 'shadow_visibility', value: 50, description: '50m shadows', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'texture_quality', value: 0, description: 'Low textures', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'antialiasing', value: 0, description: 'No AA', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'ssao', value: 0, description: 'Disable SSAO', reason: 'Higher FPS', risk: 'none', measurable: true },
    ],
    applied: false
  },
  {
    gameId: 'rust',
    gameName: 'Rust',
    executable: 'RustClient.exe',
    configPath: '%LOCALAPPDATA%\\rust\\client.cfg',
    optimizations: [
      { setting: 'fps_limit', value: 0, description: 'Uncap FPS', reason: 'No frame limit', risk: 'none', measurable: true },
      { setting: 'vsync', value: 0, description: 'Disable V-Sync', reason: 'Lowest latency', risk: 'low', measurable: true },
      { setting: 'groundtextures', value: 0, description: 'Low ground textures', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'graphics quality', value: 0, description: 'Low graphics', reason: 'Maximum FPS', risk: 'none', measurable: true },
      { setting: 'shadows', value: 0, description: 'Disable shadows', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'water quality', value: 0, description: 'Low water quality', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'grass quality', value: 0, description: 'Disable grass', reason: 'Better visibility, higher FPS', risk: 'none', measurable: true },
    ],
    applied: false
  },
  {
    gameId: 'dayz',
    gameName: 'DayZ',
    executable: 'DayZ_x64.exe',
    configPath: '%LOCALAPPDATA%\\DayZ\\DayZ.cfg',
    optimizations: [
      { setting: 'GPU_MaxFramesAhead', value: 1, description: '1 frame ahead', reason: 'Lowest latency', risk: 'low', measurable: true },
      { setting: 'GPU_DetectedFramesAhead', value: 1, description: '1 frame ahead detected', reason: 'Lowest latency', risk: 'low', measurable: true },
      { setting: 'VSync', value: 0, description: 'Disable V-Sync', reason: 'Lowest latency', risk: 'low', measurable: true },
      { setting: 'Visibility', value: 1200, description: '1200m visibility', reason: 'Balance FPS/visibility', risk: 'none', measurable: true },
      { setting: 'ShadowsQuality', value: 0, description: 'Low shadows', reason: 'Higher FPS', risk: 'none', measurable: true },
    ],
    applied: false
  },
  {
    gameId: 'haloinfinite',
    gameName: 'Halo Infinite',
    executable: 'HaloInfinite.exe',
    configPath: '%LOCALAPPDATA%\\HaloInfinite\\Settings\\Options.txt',
    optimizations: [
      { setting: 'FrameRateLimit', value: 0, description: 'Uncap FPS', reason: 'No frame limit', risk: 'none', measurable: true },
      { setting: 'VSync', value: 0, description: 'Disable V-Sync', reason: 'Lowest latency', risk: 'low', measurable: true },
      { setting: 'MouseAcceleration', value: 0, description: 'No mouse acceleration', reason: 'Consistent aim', risk: 'none', measurable: true },
      { setting: 'GraphicsQuality', value: 0, description: 'Low graphics', reason: 'Maximum FPS', risk: 'none', measurable: true },
      { setting: 'ShadowQuality', value: 0, description: 'Low shadows', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'TextureQuality', value: 0, description: 'Low textures', reason: 'Higher FPS', risk: 'none', measurable: true },
    ],
    applied: false
  },
  {
    gameId: 'cyberpunk2077',
    gameName: 'Cyberpunk 2077',
    executable: 'Cypunk2077.exe',
    configPath: '%USERPROFILE%\\Documents\\CD Projekt Red\\Cyberpunk 2077\\UserSettings.json',
    optimizations: [
      { setting: 'FPSLimit', value: 0, description: 'Uncap FPS', reason: 'No frame limit', risk: 'none', measurable: true },
      { setting: 'VSync', value: 0, description: 'Disable V-Sync', reason: 'Lowest latency', risk: 'low', measurable: true },
      { setting: 'ShadowQuality', value: 'Low', description: 'Low shadows', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'ReflectionsQuality', value: 'Off', description: 'Disable reflections', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'AmbientOcclusion', value: 'Off', description: 'Disable AO', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'RayTracing', value: 'Off', description: 'Disable ray tracing', reason: 'Major FPS gain', risk: 'none', measurable: true },
      { setting: 'MotionBlur', value: 'Off', description: 'Disable motion blur', reason: 'Cleaner visuals', risk: 'none', measurable: false },
    ],
    applied: false
  },
  {
    gameId: 'eldenring',
    gameName: 'Elden Ring',
    executable: 'eldenring.exe',
    configPath: '%APPDATA%\\EldenRing\\GraphicsConfig.xml',
    optimizations: [
      { setting: 'EnableBackgroundFPSLimit', value: 0, description: 'No background FPS limit', reason: 'Full GPU power in-game', risk: 'none', measurable: true },
      { setting: 'WindowMode', value: 'ExclusiveFullscreen', description: 'Exclusive fullscreen', reason: 'Lowest latency', risk: 'low', measurable: true },
      { setting: 'ShadowQuality', value: 'Low', description: 'Low shadows', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'EffectsQuality', value: 'Low', description: 'Low effects', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'GrassQuality', value: 'Low', description: 'Low grass', reason: 'Higher FPS', risk: 'none', measurable: true },
    ],
    applied: false
  },
  {
    gameId: 'palworld',
    gameName: 'Palworld',
    executable: 'Palworld-Win64-Shipping.exe',
    configPath: '%LOCALAPPDATA%\\Palworld\\Saved\\Config\\Windows\\GameUserSettings.ini',
    optimizations: [
      { setting: 'FrameRateLimit', value: 0, description: 'Uncap FPS', reason: 'No frame limit', risk: 'none', measurable: true },
      { setting: 'bUseVSync', value: false, description: 'Disable V-Sync', reason: 'Lowest latency', risk: 'low', measurable: true },
      { setting: 'ShadowQuality', value: 0, description: 'Low shadows', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'TextureQuality', value: 0, description: 'Low textures', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'EffectsQuality', value: 0, description: 'Low effects', reason: 'Higher FPS', risk: 'none', measurable: true },
    ],
    applied: false
  },
  {
    gameId: 'starfield',
    gameName: 'Starfield',
    executable: 'Starfield.exe',
    configPath: '%MYDOCUMENTS%\\My Games\\Starfield\\StarfieldPrefs.ini',
    optimizations: [
      { setting: 'iPresentInterval', value: 0, description: 'Disable V-Sync', reason: 'Lowest latency', risk: 'low', measurable: true },
      { setting: 'bFullScreen', value: 1, description: 'Exclusive fullscreen', reason: 'Lowest latency', risk: 'low', measurable: true },
      { setting: 'fShadowQuality', value: 0, description: 'Low shadows', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'fContactShadowQuality', value: 0, description: 'Disable contact shadows', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'bEnableGrass', value: 0, description: 'Disable grass', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'bEnableDepthOfField', value: 0, description: 'Disable DOF', reason: 'Higher FPS', risk: 'none', measurable: false },
    ],
    applied: false
  },
  {
    gameId: 'cod-mw3',
    gameName: 'Call of Duty: MW3',
    executable: 'Modern Warfare III.exe',
    configPath: '%USERPROFILE%\\Documents\\Call of Duty\\players\\options.3.cod23.cst',
    optimizations: [
      { setting: 'RenderResolution', value: 100, description: '100% render resolution', reason: 'Native resolution', risk: 'none', measurable: false },
      { setting: 'VSyncEnabled', value: 0, description: 'Disable V-Sync', reason: 'Lowest latency', risk: 'low', measurable: true },
      { setting: 'MouseRawInput', value: 1, description: 'Raw mouse input', reason: 'Direct mouse-to-game', risk: 'none', measurable: true },
      { setting: 'FrameRateLimit', value: 0, description: 'Uncap FPS', reason: 'Maximum frame rate', risk: 'none', measurable: true },
      { setting: 'ShadowMapResolution', value: 0, description: 'Disable shadows', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'TextureResolution', value: 1, description: 'Normal textures', reason: 'Balance FPS/quality', risk: 'low', measurable: false },
    ],
    applied: false
  },
  {
    gameId: 'gta5',
    gameName: 'Grand Theft Auto V',
    executable: 'GTA5.exe',
    configPath: '%USERPROFILE%\\Documents\\Rockstar Games\\GTA V\\settings.xml',
    optimizations: [
      { setting: 'FullScreen', value: 1, description: 'Exclusive fullscreen', reason: 'Lowest latency', risk: 'low', measurable: true },
      { setting: 'VSync', value: 0, description: 'Disable V-Sync', reason: 'Lowest latency', risk: 'low', measurable: true },
      { setting: 'ExtendedTextureBudget', value: 0, description: 'Low texture budget', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'ShadowQuality', value: 0, description: 'Low shadows', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'ReflectionQuality', value: 0, description: 'Low reflections', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'WaterQuality', value: 0, description: 'Low water quality', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'GrassQuality', value: 0, description: 'Low grass', reason: 'Higher FPS', risk: 'none', measurable: true },
    ],
    applied: false
  },
  {
    gameId: 'fivem',
    gameName: 'FiveM (GTA V)',
    executable: 'FiveM.exe',
    configPath: '%APPDATA%\\CitizenFX\\gta5_settings.xml',
    optimizations: [
      { setting: 'VSync', value: 0, description: 'Disable V-Sync', reason: 'Lowest latency', risk: 'low', measurable: true },
      { setting: 'FrameRateCap', value: 0, description: 'Uncap FPS', reason: 'Maximum frame rate', risk: 'none', measurable: true },
      { setting: 'ShadowQuality', value: 0, description: 'Low shadows', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'ReflectionQuality', value: 0, description: 'Low reflections', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'TextureQuality', value: 0, description: 'Low textures', reason: 'Higher FPS', risk: 'none', measurable: true },
    ],
    applied: false
  },
  {
    gameId: 'apex-legends',
    gameName: 'Apex Legends',
    executable: 'r5apex.exe',
    configPath: '%LOCALAPPDATA%\\Respawn\\Apex\\cfg\\autoexec.cfg',
    optimizations: [
      { setting: 'cl_mouse_rawinput', value: 1, description: 'Raw mouse input', reason: 'Direct mouse input, no OS filtering', risk: 'none', measurable: true },
      { setting: 'cl_mouse_accel', value: 0, description: 'No mouse acceleration', reason: 'Consistent aim', risk: 'none', measurable: true },
      { setting: 'fps_max', value: 0, description: 'Uncap FPS', reason: 'Maximum frame rate', risk: 'none', measurable: true },
      { setting: 'r_vsync', value: 0, description: 'Disable V-Sync', reason: 'Lowest input latency', risk: 'low', measurable: true },
      { setting: 'mat_queue_mode', value: 2, description: 'Multicore rendering', reason: 'Better CPU utilization', risk: 'low', measurable: true },
      { setting: 'r_adaptiveresolution', value: 0, description: 'Disable adaptive resolution', reason: 'Consistent visual quality', risk: 'none', measurable: false },
      { setting: 'r_dynamic', value: 0, description: 'Disable dynamic lighting', reason: 'Consistent performance', risk: 'none', measurable: true },
    ],
    applied: false
  },
  {
    gameId: 'genshin',
    gameName: 'Genshin Impact',
    executable: 'GenshinImpact.exe',
    configPath: '%USERPROFILE%\\AppData\\LocalLow\\miHoYo\\Genshin Impact\\GraphicsSettings.json',
    optimizations: [
      { setting: 'FPS', value: 60, description: '60 FPS cap', reason: 'Game engine limit, but V-Sync off is key', risk: 'none', measurable: true },
      { setting: 'VSync', value: 0, description: 'Disable V-Sync', reason: 'Lowest latency within 60fps cap', risk: 'low', measurable: true },
      { setting: 'RenderScale', value: 0.6, description: '60% render scale', reason: 'Higher FPS with minor blur', risk: 'low', measurable: true },
      { setting: 'ShadowQuality', value: 'Low', description: 'Low shadows', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'EffectsQuality', value: 'Low', description: 'Low effects', reason: 'Higher FPS', risk: 'none', measurable: true },
    ],
    applied: false
  },
  {
    gameId: 'valheim',
    gameName: 'Valheim',
    executable: 'valheim.exe',
    configPath: '%USERPROFILE%\\AppData\\LocalLow\\IronGate\\Valheim\\settings.json',
    optimizations: [
      { setting: 'GuaranteedFrameRate', value: 0, description: 'Uncap FPS', reason: 'No frame limit', risk: 'none', measurable: true },
      { setting: 'VSync', value: false, description: 'Disable V-Sync', reason: 'Lowest latency', risk: 'low', measurable: true },
      { setting: 'TerrainQuality', value: 0, description: 'Low terrain', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'VegetationQuality', value: 0, description: 'Low vegetation', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'ParticleQuality', value: 0, description: 'Low particles', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'ShadowQuality', value: 0, description: 'Low shadows', reason: 'Higher FPS', risk: 'none', measurable: true },
    ],
    applied: false
  },
  {
    gameId: 'ark',
    gameName: 'ARK: Survival Evolved',
    executable: 'ShooterGame.exe',
    configPath: '%LOCALAPPDATA%\\ShooterGame\\Saved\\Config\\WindowsNoEditor\\GameUserSettings.ini',
    optimizations: [
      { setting: 'FrameRateLimit', value: 0, description: 'Uncap FPS', reason: 'No frame limit', risk: 'none', measurable: true },
      { setting: 'bUseVSync', value: false, description: 'Disable V-Sync', reason: 'Lowest latency', risk: 'low', measurable: true },
      { setting: 'bForceGSColor', value: true, description: 'Force GS color', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'ShadowQuality', value: 0, description: 'Low shadows', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'TexturesQuality', value: 0, description: 'Low textures', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'EffectsQuality', value: 0, description: 'Low effects', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'ViewDistanceQuality', value: 0, description: 'Low view distance', reason: 'Higher FPS', risk: 'none', measurable: true },
    ],
    applied: false
  },
  {
    gameId: 'the-finals',
    gameName: 'THE FINALS',
    executable: 'DiscoveryClient.exe',
    configPath: '%LOCALAPPDATA%\\Discovery\\Saved\\Config\\Windows\\GameUserSettings.ini',
    optimizations: [
      { setting: 'FrameRateLimit', value: 0, description: 'Uncap FPS', reason: 'No frame limit', risk: 'none', measurable: true },
      { setting: 'bUseVSync', value: false, description: 'Disable V-Sync', reason: 'Lowest latency', risk: 'low', measurable: true },
      { setting: 'ShadowQuality', value: 0, description: 'Low shadows', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'GlobalIlluminationQuality', value: 0, description: 'Low GI', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'ReflectionQuality', value: 0, description: 'Low reflections', reason: 'Higher FPS', risk: 'none', measurable: true },
    ],
    applied: false
  },
  {
    gameId: 'xdefiant',
    gameName: 'XDefiant',
    executable: 'XDefiant.exe',
    configPath: '%LOCALAPPDATA%\\Ubisoft\\XDefiant\\settings.toml',
    optimizations: [
      { setting: 'FrameRateLimit', value: 0, description: 'Uncap FPS', reason: 'No frame limit', risk: 'none', measurable: true },
      { setting: 'VSync', value: 0, description: 'Disable V-Sync', reason: 'Lowest latency', risk: 'low', measurable: true },
      { setting: 'MouseRawInput', value: 1, description: 'Raw mouse input', reason: 'Direct mouse connection', risk: 'none', measurable: true },
      { setting: 'ShadowQuality', value: 0, description: 'Low shadows', reason: 'Higher FPS', risk: 'none', measurable: true },
      { setting: 'EffectsQuality', value: 0, description: 'Low effects', reason: 'Higher FPS', risk: 'none', measurable: true },
    ],
    applied: false
  },
]

export function getGameConfig(gameId: string): GameConfig | undefined {
  return GAME_CONFIGS.find(c => c.gameId === gameId)
}

export function getAllGameConfigs(): GameConfig[] {
  return GAME_CONFIGS
}
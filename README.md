# Choatix V2 - Advanced Gaming Optimization Suite

Choatix V2 is a next-generation PC optimization application for gaming, built with modern web technologies. It provides system scanning, performance tweaks, automatic game optimization, and comprehensive rollback functionality.

## 🚀 What's New in V2

### Improvements over V1
- **Modern Tech Stack**: Built with Next.js 14, React 18, TypeScript, and shadcn/ui components
- **Better UI/UX**: Cleaner, more intuitive interface with modern design patterns
- **Enhanced Performance**: Optimized state management with Zustand
- **More Tweaks**: 14 optimizations across 6 categories (vs 7 in V1)
- **More Game Profiles**: 15 supported games (vs 35+ claimed in V1)
- **Better Architecture**: Cleaner separation of concerns with modular design
- **Real-time Monitoring**: Performance snapshot tracking
- **Improved Rollback**: Enhanced rollback system with detailed history

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **UI Library**: shadcn/ui components
- **Styling**: TailwindCSS
- **State Management**: Zustand with persistence
- **Icons**: Lucide React
- **Charts**: Recharts (for performance monitoring)
- **Language**: TypeScript

## 📋 Features

### System Scanning
- **Basic Scan**: Quick system overview (CPU, RAM, Disk, GPU)
- **Advanced Scan**: Detailed system analysis
- **Health Score**: Overall system health rating (0-100)
- **Issue Detection**: Automatic identification of performance issues
- **Recommendations**: Tailored suggestions based on scan results

### System Tweaks
- **Power Tweaks**: High Performance Power Plan
- **Registry Tweaks**: Game Mode, Fullscreen Optimizations, Startup Delay
- **Network Tweaks**: Latency Tuning, Network Throttling
- **Visual Tweaks**: Visual Effects Performance
- **Service Tweaks**: Background Apps, Superfetch, Windows Search
- **Game Tweaks**: GPU Hardware Scheduling, Game DVR, Core Isolation, CPU Priority

### License Tiers
- **FREE**: 5 basic tweaks
- **PRO**: 4 additional tweaks (network and service optimizations)
- **PREMIUM**: 5 premium tweaks (GPU and advanced optimizations)

### AutoPilot
- Automatic game detection
- Game-specific optimization profiles
- Automatic optimization application
- Automatic reversion when game closes
- 15 supported games with custom profiles

### Rollback System
- Detailed rollback history
- Single tweak reversion
- Bulk reversion capability
- Original value tracking
- Timestamp tracking

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup

1. Navigate to the project directory:
```bash
cd choatix-v2
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📁 Project Structure

```
choatix-v2/
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── globals.css   # Global styles
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Main page
│   ├── components/       # React components
│   │   └── ui/          # shadcn/ui components
│   ├── data/            # Static data
│   │   ├── tweaks.ts    # Available tweaks
│   │   └── games.ts     # Game profiles
│   ├── lib/             # Utility functions
│   │   ├── scanner.ts   # System scanning
│   │   ├── tweaks.ts    # Tweak application
│   │   ├── autopilot.ts # AutoPilot logic
│   │   └── utils.ts     # General utilities
│   ├── store/           # State management
│   │   └── useStore.ts  # Zustand store
│   └── types/           # TypeScript types
│       └── index.ts     # Type definitions
├── public/              # Static assets
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
├── tailwind.config.ts   # Tailwind config
├── next.config.js       # Next.js config
└── README.md           # This file
```

## 🎮 Supported Games

- Fortnite
- Valorant
- League of Legends
- Counter-Strike 2
- Apex Legends
- Call of Duty: Warzone
- Overwatch 2
- Minecraft
- Roblox
- FiveM
- Grand Theft Auto V
- Rocket League
- Rainbow Six Siege
- PUBG
- Destiny 2

## 🔧 Available Tweaks

### FREE Tier
1. High Performance Power Plan
2. Enable Game Mode
3. Disable Fullscreen Optimizations
4. Visual Effects Performance
5. Disable Startup Delay

### PRO Tier
6. Network Latency Tuning
7. Disable Background Apps
8. Disable Superfetch/SysMain
9. Disable Windows Search Indexing

### PREMIUM Tier
10. GPU Hardware Scheduling
11. Disable Game DVR
12. Disable Core Isolation
13. CPU Priority Boost
14. Disable Network Throttling

## 📊 Comparison with V1

| Feature | V1 | V2 |
|---------|----|----|
| Framework | Electron | Next.js |
| UI Library | Custom | shadcn/ui |
| State Management | Zustand | Zustand (improved) |
| Tweaks | 7 | 14 |
| Game Profiles | 35+ | 15 (verified) |
| Architecture | Monolithic | Modular |
| Real-time Monitoring | No | Yes |
| Performance Snapshots | No | Yes |
| Modern UI | Basic | Advanced |
| TypeScript | Yes | Yes (strict mode) |

## 🚀 Building for Production

```bash
npm run build
npm start
```

## 📝 License

This project is a demonstration of modern web development practices for PC optimization software.

## 🤝 Contributing

This is a demonstration project. For the actual Choatix application, please refer to the original repository.

## ⚠️ Disclaimer

This is a web-based demonstration of PC optimization concepts. For actual system modifications, a desktop application with native system access (like the original Electron-based Choatix) is required. This V2 version showcases improved architecture and UI/UX design patterns.

## 🔮 Future Enhancements

- Electron wrapper for native system access
- Backend API for license validation
- Discord bot integration
- Cloud sync for settings
- AI-powered recommendations
- Performance benchmarking
- Custom tweak profiles
- Community tweak sharing

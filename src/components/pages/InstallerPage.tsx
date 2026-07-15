'use client'

import { useState } from 'react'
import { Zap, Monitor, CheckCircle2, Loader2, FolderOpen, ArrowRight, ArrowLeft } from 'lucide-react'

type Step = 'welcome' | 'installing' | 'done'

export default function InstallerPage() {
  const [step, setStep] = useState<Step>('welcome')
  const [progress, setProgress] = useState(0)
  const [installPath, setInstallPath] = useState('C:\\Program Files\\Choatix V2')

  const handleInstall = async () => {
    setStep('installing')
    setProgress(0)
    
    // Simulate installation progress
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(r => setTimeout(r, 100))
      setProgress(i)
    }
    
    setStep('done')
  }

  return (
    <div className="h-screen flex flex-col" style={{ background: '#0D0D14', color: '#fff' }}>
      {/* Title Bar */}
      <div className="h-10 flex items-center justify-between px-4 shrink-0" 
        style={{ background: '#0D0D14', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: '#FF6B35' }}>
            <Zap className="w-3 h-3 text-white" />
          </div>
          <span className="text-xs font-semibold">Choatix Installer</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="w-7 h-7 rounded flex items-center justify-center hover:bg-white/5">
            <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor"><rect width="10" height="1"/></svg>
          </button>
          <button className="w-7 h-7 rounded flex items-center justify-center hover:bg-white/5">
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1"><rect x="0.5" y="0.5" width="8" height="8"/></svg>
          </button>
          <button className="w-7 h-7 rounded flex items-center justify-center hover:bg-white/10">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2"><line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/></svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {step === 'welcome' && (
          <div className="text-center fade-in">
            <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>Welcome to</p>
            
            {/* Logo */}
            <div className="mb-10">
              <div className="flex items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: '#FF6B35' }}>
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <div className="text-left">
                  <h1 className="text-4xl font-black tracking-tight" style={{ color: '#FF6B35' }}>CHOATIX</h1>
                  <p className="text-xs font-semibold tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>GAMING OPTIMIZER</p>
                </div>
              </div>
            </div>

            <p className="text-xs mb-12 max-w-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Advanced gaming optimization suite for Windows. Boost FPS, reduce latency, and optimize your system.
            </p>

            {/* Install Path */}
            <div className="flex items-center gap-3 mb-8 max-w-md mx-auto">
              <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl" 
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <FolderOpen className="w-4 h-4 shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
                <span className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{installPath}</span>
              </div>
            </div>
          </div>
        )}

        {step === 'installing' && (
          <div className="text-center fade-in w-full max-w-md">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-6" style={{ color: '#FF6B35' }} />
            <h2 className="text-lg font-bold mb-2">Installing...</h2>
            <p className="text-xs mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Please wait while we install Choatix V2
            </p>
            
            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full transition-all duration-300" 
                style={{ width: `${progress}%`, background: '#FF6B35' }} />
            </div>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{progress}% complete</p>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center fade-in">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" 
              style={{ background: 'rgba(74,222,128,0.1)' }}>
              <CheckCircle2 className="w-8 h-8" style={{ color: '#4ade80' }} />
            </div>
            <h2 className="text-lg font-bold mb-2">Installation Complete</h2>
            <p className="text-xs mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Choatix V2 has been installed successfully
            </p>
            <button onClick={() => window.close()}
              className="h-12 px-8 rounded-xl text-sm font-bold flex items-center gap-2 mx-auto"
              style={{ background: '#FF6B35', color: '#fff' }}>
              Launch Choatix V2
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="h-16 flex items-center justify-between px-8 shrink-0"
        style={{ background: '#0D0D14', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {step === 'welcome' ? (
          <>
            <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
              v2.0.0 · © zylenofficial
            </div>
            <button onClick={handleInstall}
              className="h-10 px-6 rounded-lg text-xs font-bold flex items-center gap-2"
              style={{ background: '#FF6B35', color: '#fff' }}>
              Install
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </>
        ) : step === 'done' ? (
          <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Thank you for installing Choatix V2
          </div>
        ) : (
          <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Please do not close the installer
          </div>
        )}
      </div>
    </div>
  )
}

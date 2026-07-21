'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'

interface TooltipProps {
  content: string
  children: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

export function Tooltip({ content, children, side = 'top', delay = 400 }: TooltipProps) {
  const [show, setShow] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const updatePos = () => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const gap = 8
    switch (side) {
      case 'top':
        setPos({ x: rect.left + rect.width / 2, y: rect.top - gap })
        break
      case 'bottom':
        setPos({ x: rect.left + rect.width / 2, y: rect.bottom + gap })
        break
      case 'left':
        setPos({ x: rect.left - gap, y: rect.top + rect.height / 2 })
        break
      case 'right':
        setPos({ x: rect.right + gap, y: rect.top + rect.height / 2 })
        break
    }
  }

  const handleEnter = () => {
    timeoutRef.current = setTimeout(() => {
      updatePos()
      setShow(true)
    }, delay)
  }

  const handleLeave = () => {
    clearTimeout(timeoutRef.current)
    setShow(false)
  }

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current)
  }, [])

  const transform = {
    top: 'translate(-50%, -100%)',
    bottom: 'translate(-50%, 0)',
    left: 'translate(-100%, -50%)',
    right: 'translate(0, -50%)',
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onFocus={handleEnter}
        onBlur={handleLeave}
        style={{ display: 'contents' }}
      >
        {children}
      </div>
      {show && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: pos.x,
            top: pos.y,
            transform: transform[side],
          }}
        >
          <div
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap"
            style={{
              background: 'rgba(20,20,20,0.95)',
              color: 'rgba(255,255,255,0.85)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)',
              animation: 'tooltipIn 0.15s ease',
            }}
          >
            {content}
          </div>
        </div>
      )}
      <style jsx global>{`
        @keyframes tooltipIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}

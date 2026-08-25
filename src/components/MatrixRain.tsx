'use client'

import { useEffect, useRef } from 'react'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ΣΩλπφψ'.split('')
const FONT_SIZE = 14
const CHAR_SPACING = 18

interface Column {
  x: number
  y: number
  speed: number
  chars: string[]
  flickerTimer: number
  flickerRate: number
}

export default function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cvs = canvasRef.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')
    if (!ctx) return

    let W = 0
    let H = 0
    let cols: Column[] = []
    let raf = 0
    const c = cvs
    const x = ctx

    function init() {
      const dpr = window.devicePixelRatio || 1
      W = window.innerWidth
      H = window.innerHeight
      c.width = W * dpr
      c.height = H * dpr
      c.style.width = W + 'px'
      c.style.height = H + 'px'
      x.setTransform(dpr, 0, 0, dpr, 0, 0)

      cols = []
      const numCols = Math.floor(W / CHAR_SPACING)
      for (let i = 0; i < numCols; i++) {
        const centerX = W / 2
        const dist = Math.abs(i * CHAR_SPACING - centerX) / (W / 2)
        const chance = dist < 0.3 ? 0.9 : dist < 0.6 ? 0.5 : 0.15
        if (Math.random() > chance) continue

        const speed = 1.2 + Math.random() * 2.5
        const trailLen = 8 + Math.floor(Math.random() * 14)
        const chars: string[] = []
        for (let j = 0; j < trailLen; j++) {
          chars.push(CHARS[Math.floor(Math.random() * CHARS.length)])
        }
        cols.push({
          x: i * CHAR_SPACING + CHAR_SPACING / 2,
          y: Math.random() * H * 1.5 - H * 0.5,
          speed,
          chars,
          flickerTimer: 0,
          flickerRate: 3 + Math.floor(Math.random() * 5),
        })
      }
    }

    init()
    window.addEventListener('resize', init)

    function draw() {
      x.fillStyle = 'rgba(0,0,0,0.35)'
      x.fillRect(0, 0, W, H)
      x.font = FONT_SIZE + 'px Consolas, "SF Mono", monospace'
      x.textAlign = 'center'
      x.textBaseline = 'top'

      for (const col of cols) {
        col.y += col.speed
        col.flickerTimer++

        if (col.flickerTimer >= col.flickerRate) {
          col.flickerTimer = 0
          const idx = Math.floor(Math.random() * col.chars.length)
          col.chars[idx] = CHARS[Math.floor(Math.random() * CHARS.length)]
        }

        for (let j = 0; j < col.chars.length; j++) {
          const cy = col.y - j * CHAR_SPACING
          if (cy < -FONT_SIZE || cy > H + FONT_SIZE) continue

          let alpha: number
          if (j === 0) {
            alpha = 0.95
          } else if (j < 3) {
            alpha = 0.6 - j * 0.1
          } else {
            alpha = Math.max(0.02, 0.45 * Math.pow(0.82, j - 2))
          }

          if (cy < 80) alpha *= cy / 80
          if (cy > H - 60) alpha *= (H - cy) / 60
          alpha = Math.max(0, Math.min(1, alpha))

          if (j === 0) {
            x.shadowColor = 'rgba(255,255,255,0.4)'
            x.shadowBlur = 6
          } else {
            x.shadowBlur = 0
          }

          x.fillStyle = `rgba(255,255,255,${alpha})`
          x.fillText(col.chars[j], col.x, cy)
        }
        x.shadowBlur = 0

        if (col.y - col.chars.length * CHAR_SPACING > H) {
          col.y = -CHAR_SPACING * 2
          col.speed = 1.2 + Math.random() * 2.5
          col.chars = []
          const trailLen = 8 + Math.floor(Math.random() * 14)
          for (let j = 0; j < trailLen; j++) {
            col.chars.push(CHARS[Math.floor(Math.random() * CHARS.length)])
          }
        }
      }

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', init)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="matrix-rain"
      aria-hidden="true"
    />
  )
}

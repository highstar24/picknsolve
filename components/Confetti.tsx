'use client'

import { useEffect, useRef } from 'react'

const COLORS = ['#00d4ff', '#ff3fa0', '#ffb800', '#a855f7', '#34d399', '#f97316', '#fff']

interface Piece {
  x: number; y: number
  w: number; h: number
  color: string
  angle: number
  speed: number
  spin: number
}

export default function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()

    const pieces: Piece[] = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      w: Math.random() * 10 + 6,
      h: Math.random() * 5 + 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      angle: Math.random() * Math.PI * 2,
      speed: Math.random() * 4 + 2,
      spin: (Math.random() - 0.5) * 0.15,
    }))

    let opacity = 1
    let frame: number

    function draw() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.globalAlpha = opacity

      pieces.forEach((p) => {
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.angle)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()

        p.y += p.speed
        p.angle += p.spin
        if (p.y > canvas.height + 10) {
          p.y = -10
          p.x = Math.random() * canvas.width
        }
      })

      // 2.5초 후 서서히 사라짐
      if (opacity > 0) {
        opacity -= 0.004
        frame = requestAnimationFrame(draw)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }

    draw()
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100vw', height: '100vh',
        pointerEvents: 'none', zIndex: 999,
      }}
    />
  )
}

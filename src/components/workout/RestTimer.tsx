import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FastForward, Minus, Plus, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui'

/** Calcula os segundos restantes a partir do timestamp de término (funciona mesmo se a aba ficar em 2º plano). */
export function remainingSeconds(endAtMs: number, nowMs: number = Date.now()): number {
  return Math.max(0, Math.ceil((endAtMs - nowMs) / 1000))
}

/** Formata segundos em M:SS */
export function formatCountdown(sec: number): string {
  const s = Math.max(0, Math.floor(sec))
  const m = Math.floor(s / 60)
  const rem = s % 60
  return `${m}:${rem.toString().padStart(2, '0')}`
}

/** Toca um bipe curto via Web Audio API (sem arquivos externos) e vibra se disponível. */
export function playBeep(freq = 880, durationMs = 140) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(durationMs)
    }
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.value = 0.18
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + durationMs / 1000)
    setTimeout(() => ctx.close().catch(() => {}), durationMs + 50)
  } catch {
    // Ignora caso o navegador bloqueie áudio automático
  }
}

interface RestTimerProps {
  initialSeconds: number | null
  nextLabel?: string
  onFinish: () => void
}

export function RestTimer({ initialSeconds, nextLabel, onFinish }: RestTimerProps) {
  const [totalSec, setTotalSec] = useState(initialSeconds ?? 0)
  const [endAt, setEndAt] = useState<number>(() =>
    initialSeconds ? Date.now() + initialSeconds * 1000 : 0,
  )
  const [left, setLeft] = useState(initialSeconds ?? 0)
  const lastBeepRef = useRef<number | null>(null)

  useEffect(() => {
    if (!initialSeconds || initialSeconds <= 0) {
      setLeft(0)
      return
    }
    const target = Date.now() + initialSeconds * 1000
    setTotalSec(initialSeconds)
    setEndAt(target)
    setLeft(initialSeconds)
    lastBeepRef.current = null
  }, [initialSeconds])

  useEffect(() => {
    if (!initialSeconds || initialSeconds <= 0 || endAt <= 0) return

    const tick = () => {
      const rem = remainingSeconds(endAt)
      setLeft(rem)

      if (rem > 0 && rem <= 3 && lastBeepRef.current !== rem) {
        lastBeepRef.current = rem
        playBeep(660, 110)
      }
      if (rem <= 0) {
        playBeep(980, 260)
        onFinish()
      }
    }

    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [initialSeconds, endAt, onFinish])

  const adjust = (deltaSec: number) => {
    const newEnd = Math.max(Date.now() + 1000, endAt + deltaSec * 1000)
    const newLeft = remainingSeconds(newEnd)
    setEndAt(newEnd)
    setLeft(newLeft)
    setTotalSec((prev) => Math.max(prev, newLeft))
  }

  const open = !!initialSeconds && initialSeconds > 0 && left > 0
  const progress = totalSec > 0 ? left / totalSec : 0
  const radius = 58
  const circumference = 2 * Math.PI * radius

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-label="Cronômetro de descanso"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="pb-safe fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[480px] rounded-t-3xl border-t border-border bg-surface/98 p-5 shadow-2xl backdrop-blur"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              <Volume2 className="size-4" /> Descanso em andamento
            </span>
            {nextLabel && <span className="text-xs text-muted">{nextLabel}</span>}
          </div>

          <div className="my-2 flex items-center justify-center gap-6">
            <button
              onClick={() => adjust(-15)}
              className="flex size-12 items-center justify-center rounded-2xl border border-border bg-elevated text-sm font-bold active:scale-95"
              aria-label="Diminuir 15 segundos"
            >
              <Minus className="size-4" />
              15s
            </button>

            <div className="relative flex size-36 items-center justify-center">
              <svg className="size-full -rotate-90" viewBox="0 0 140 140">
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke="var(--color-elevated)"
                  strokeWidth="10"
                />
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progress)}
                  className="transition-[stroke-dashoffset] duration-200"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="num text-4xl font-extrabold">{formatCountdown(left)}</span>
                <span className="text-[11px] text-muted">restantes</span>
              </div>
            </div>

            <button
              onClick={() => adjust(15)}
              className="flex size-12 items-center justify-center rounded-2xl border border-border bg-elevated text-sm font-bold active:scale-95"
              aria-label="Adicionar 15 segundos"
            >
              <Plus className="size-4" />
              15s
            </button>
          </div>

          <Button variant="secondary" fullWidth onClick={onFinish} className="mt-2">
            <FastForward className="size-5" /> Pular descanso
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

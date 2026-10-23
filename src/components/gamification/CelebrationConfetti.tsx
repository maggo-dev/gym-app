import { motion } from 'framer-motion'

const PARTICLES = [
  { x: -120, y: -90, color: '#22C55E', delay: 0 },
  { x: -75, y: -130, color: '#FACC15', delay: 0.05 },
  { x: -30, y: -110, color: '#F97316', delay: 0.08 },
  { x: 25, y: -125, color: '#22C55E', delay: 0.03 },
  { x: 75, y: -100, color: '#38BDF8', delay: 0.06 },
  { x: 120, y: -85, color: '#FACC15', delay: 0.1 },
  { x: -95, y: -55, color: '#38BDF8', delay: 0.12 },
  { x: 95, y: -50, color: '#F97316', delay: 0.11 },
]

/** Explosão leve de confete para comemoração de fim de treino ou recorde. */
export function CelebrationConfetti() {
  return (
    <div
      aria-hidden
      className="pointer-events-none relative flex h-0 w-full items-center justify-center overflow-visible"
    >
      {PARTICLES.map((p, i) => (
        <motion.span
          key={i}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{
            x: p.x,
            y: p.y,
            scale: [0, 1.2, 0.8],
            opacity: [1, 1, 0],
            rotate: [0, 140],
          }}
          transition={{ duration: 1.1, delay: p.delay, ease: 'easeOut' }}
          className="absolute size-3 rounded-sm"
          style={{ backgroundColor: p.color }}
        />
      ))}
    </div>
  )
}

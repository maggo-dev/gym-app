import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'

interface ProgressBarProps {
  /** 0 a 1 */
  value: number
  color?: 'primary' | 'streak' | 'xp'
  className?: string
}

const colors = {
  primary: 'bg-primary',
  streak: 'bg-streak',
  xp: 'bg-xp',
}

export function ProgressBar({ value, color = 'primary', className }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, value)) * 100
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={cn('h-4 w-full overflow-hidden rounded-full bg-elevated', className)}
    >
      <motion.div
        className={cn('relative h-full rounded-full', colors[color])}
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      >
        {/* brilho estilo Duolingo */}
        <span className="absolute left-2 right-2 top-1 h-1 rounded-full bg-white/30" />
      </motion.div>
    </div>
  )
}

import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Tone = 'neutral' | 'primary' | 'streak' | 'xp' | 'danger'

const tones: Record<Tone, string> = {
  neutral: 'bg-elevated text-muted',
  primary: 'bg-primary/15 text-primary',
  streak: 'bg-streak/15 text-streak',
  xp: 'bg-xp/15 text-xp',
  danger: 'bg-danger/15 text-danger',
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
}

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}

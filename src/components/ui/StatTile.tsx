import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

interface StatTileProps {
  icon: LucideIcon
  value: string
  label: string
  tone?: 'primary' | 'streak' | 'xp' | 'muted'
  className?: string
}

const tones = {
  primary: 'text-primary',
  streak: 'text-streak',
  xp: 'text-xp',
  muted: 'text-muted',
}

export function StatTile({ icon: Icon, value, label, tone = 'primary', className }: StatTileProps) {
  return (
    <div className={cn('flex flex-col gap-1 rounded-2xl bg-elevated p-3', className)}>
      <Icon className={cn('size-5', tones[tone])} strokeWidth={2.5} />
      <span className="num text-lg font-bold leading-tight">{value}</span>
      <span className="text-xs text-muted">{label}</span>
    </div>
  )
}

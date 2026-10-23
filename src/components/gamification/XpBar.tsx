import { Sparkles, Zap } from 'lucide-react'
import { Badge, Card, ProgressBar } from '@/components/ui'
import { fmt } from '@/lib/format'
import type { LevelInfo } from '@/lib/gamification'

interface XpBarProps {
  levelInfo: LevelInfo
}

export function XpBar({ levelInfo }: XpBarProps) {
  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="num flex size-9 items-center justify-center rounded-xl bg-xp/20 text-sm font-extrabold text-xp">
            Nv.{levelInfo.level}
          </span>
          <div>
            <p className="text-sm font-bold leading-tight">{levelInfo.title}</p>
            <p className="num text-xs text-muted">
              {fmt(levelInfo.totalXp)} / {fmt(levelInfo.nextLevelXp)} XP
            </p>
          </div>
        </div>
        <Badge tone="xp">
          <Zap className="size-3.5 fill-current" /> {fmt(levelInfo.totalXp)} XP
        </Badge>
      </div>
      <ProgressBar value={levelInfo.progress} color="xp" />
      <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted">
        <Sparkles className="size-3 text-xp" /> Faltam{' '}
        <span className="num font-semibold text-fg">
          {fmt(Math.max(0, levelInfo.nextLevelXp - levelInfo.totalXp))} XP
        </span>{' '}
        para o Nível {levelInfo.level + 1}
      </p>
    </Card>
  )
}

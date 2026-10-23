import { Check, Flame } from 'lucide-react'
import { Badge, Card, ProgressBar } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { WeeklyStreakInfo } from '@/lib/gamification'

const DAY_LABELS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']

interface WeeklyStreakCardProps {
  streak: WeeklyStreakInfo
  minDaysPerWeek: number
}

export function WeeklyStreakCard({ streak, minDaysPerWeek }: WeeklyStreakCardProps) {
  const active = streak.streakWeeks > 0 || streak.thisWeekCount > 0

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'flex size-10 items-center justify-center rounded-2xl',
              active ? 'bg-streak/20 text-streak' : 'bg-elevated text-muted',
            )}
          >
            <Flame className={cn('size-6', active && 'fill-current')} />
          </div>
          <div>
            <h2 className="font-bold leading-tight">Ofensiva Semanal</h2>
            <p className="text-xs text-muted">
              Descanso faz parte! Bata {minDaysPerWeek}+ treinos na semana para manter a chama.
            </p>
          </div>
        </div>
        <Badge tone={active ? 'streak' : 'neutral'}>
          <Flame className="size-3.5 fill-current" />
          <span className="num">
            {streak.streakWeeks} {streak.streakWeeks === 1 ? 'sem.' : 'semanas'}
          </span>
        </Badge>
      </div>

      {/* Bolinhas Seg..Dom estilo Duolingo */}
      <div className="mb-3 grid grid-cols-7 gap-1.5">
        {DAY_LABELS.map((label, i) => {
          const done = streak.weekDaysDone[i]
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-[11px] font-semibold text-muted">{label}</span>
              <span
                className={cn(
                  'flex size-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors',
                  done
                    ? 'border-streak bg-streak text-base'
                    : 'border-border bg-elevated text-muted',
                )}
              >
                {done ? <Check className="size-4" strokeWidth={3} /> : null}
              </span>
            </div>
          )
        })}
      </div>

      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-muted">Meta desta semana</span>
        <span className="num font-bold text-fg">
          {streak.thisWeekCount} / {streak.targetDays} treinos
        </span>
      </div>
      <ProgressBar value={streak.thisWeekCount / streak.targetDays} color="streak" />
    </Card>
  )
}

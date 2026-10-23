import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Clock, Dumbbell, Layers, Star } from 'lucide-react'
import { Badge, Card } from '@/components/ui'
import { ExerciseRow } from '@/components/workout/ExerciseRow'
import { muscleLabels } from '@/data/exercises'
import { cn } from '@/lib/cn'
import { generatePlan, weeklySetsByMuscle } from '@/lib/workoutGenerator'
import { useActivePlan, useActiveProfile } from '@/store/useAppStore'
import type { MuscleGroup } from '@/types'

const VOLUME_ORDER: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'calves', 'core',
]
/** Faixa de referência para intermediários (séries/semana) */
const VOLUME_MIN = 10
const VOLUME_MAX = 20

export function WorkoutPage() {
  const profile = useActiveProfile()
  const currentPlan = useActivePlan()
  const [days, setDays] = useState<3 | 4>(3)
  const [dayIdx, setDayIdx] = useState(0)

  // A prévia de 4 dias é calculada na hora, sem sobrescrever a ficha atual
  const plan = useMemo(
    () => (days === profile.daysPerWeek ? currentPlan : generatePlan(profile, days)),
    [days, profile, currentPlan],
  )
  const day = plan.days[Math.min(dayIdx, plan.days.length - 1)]
  const totalSets = day.exercises.reduce((n, e) => n + (e.durationSec ? 0 : e.sets), 0)
  const volume = weeklySetsByMuscle(plan)

  return (
    <motion.div key={profile.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
      <div className="flex items-end justify-between">
        <h1 className="text-3xl font-extrabold">Treino</h1>
        {/* seletor 3 | 4 dias */}
        <div className="flex rounded-2xl bg-surface p-1 text-sm font-semibold">
          {([3, 4] as const).map((d) => (
            <button
              key={d}
              onClick={() => {
                setDays(d)
                setDayIdx(0)
              }}
              className={cn('relative rounded-xl px-3 py-1.5', days === d ? 'text-base' : 'text-muted')}
            >
              {days === d && (
                <motion.span layoutId="days-toggle" className="absolute inset-0 rounded-xl bg-primary" />
              )}
              <span className="relative">{d === 4 ? '4 dias (meta)' : '3 dias'}</span>
            </button>
          ))}
        </div>
      </div>

      {days !== profile.daysPerWeek && (
        <p className="-mt-2 text-xs text-muted">
          Prévia da ficha ABCD para quando você chegar a 4 treinos por semana.
        </p>
      )}

      {/* abas A/B/C(/D) */}
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${plan.days.length}, 1fr)` }}>
        {plan.days.map((d, i) => (
          <button
            key={d.id}
            onClick={() => setDayIdx(i)}
            className={cn(
              'rounded-2xl border-2 py-2 text-xl font-extrabold transition-colors',
              i === dayIdx ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-surface text-muted',
            )}
          >
            {d.id}
          </button>
        ))}
      </div>

      <Card elevated>
        <p className="text-sm text-muted">{day.name}</p>
        <h2 className="mb-3 text-xl font-bold">{day.focus}</h2>
        <div className="flex flex-wrap gap-2">
          <Badge tone={day.estimatedMinutes > 70 ? 'xp' : 'primary'}>
            <Clock className="size-3.5" /> ~{day.estimatedMinutes} min
          </Badge>
          <Badge>
            <Dumbbell className="size-3.5" /> {day.exercises.length} exercícios
          </Badge>
          <Badge>
            <Layers className="size-3.5" /> {totalSets} séries
          </Badge>
        </div>
      </Card>

      <p className="-mb-2 flex items-center gap-1.5 text-xs text-muted">
        <Star className="size-3.5 fill-primary text-primary" /> Bons para começar o treino. Toque para ver dicas e alternativas.
      </p>
      <ul className="flex flex-col gap-2">
        {day.exercises.map((pe, i) => (
          <ExerciseRow key={`${day.id}-${pe.exerciseId}`} planned={pe} index={i} />
        ))}
      </ul>

      {/* volume semanal */}
      <Card>
        <h2 className="mb-1 flex items-center gap-2 font-bold">
          <BarChart3 className="size-5 text-xp" /> Volume semanal
        </h2>
        <p className="mb-3 text-xs text-muted">
          Séries por grupo muscular. Faixa indicada para intermediários: {VOLUME_MIN}–{VOLUME_MAX}.
        </p>
        <ul className="flex flex-col gap-2">
          {VOLUME_ORDER.filter((m) => volume[m]).map((m) => {
            const sets = volume[m]!
            const ok = sets >= VOLUME_MIN && sets <= VOLUME_MAX
            return (
              <li key={m} className="flex items-center gap-3 text-sm">
                <span className="w-24 shrink-0 text-muted">{muscleLabels[m]}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-elevated">
                  <motion.div
                    className={cn('h-full rounded-full', ok ? 'bg-primary' : 'bg-xp')}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(sets / VOLUME_MAX, 1) * 100}%` }}
                  />
                </div>
                <span className="num w-6 text-right font-semibold">{sets}</span>
              </li>
            )
          })}
        </ul>
      </Card>
    </motion.div>
  )
}

import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Beef, CalendarCheck, ChevronRight, Clock, Droplets, Dumbbell, Flame, Target } from 'lucide-react'
import { useActiveProfile, useNextWorkoutDay } from '@/store/useAppStore'
import { useProfileMetrics } from '@/hooks/useProfileMetrics'
import { fmt } from '@/lib/format'
import { firstName, goalLabels } from '@/lib/labels'
import { Badge, Button, Card, ProgressBar, StatTile } from '@/components/ui'

export function HomePage() {
  const profile = useActiveProfile()
  const metrics = useProfileMetrics()
  const { day: nextDay } = useNextWorkoutDay()

  return (
    <motion.div
      key={profile.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4"
    >
      <section>
        <p className="text-muted">Bora treinar?</p>
        <h1 className="text-3xl font-extrabold">Olá, {firstName(profile.name)} 👋</h1>
      </section>

      {/* Metas diárias */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Metas de hoje</h2>
          <Badge tone="primary">
            <Target className="size-3.5" /> {goalLabels[profile.goal]}
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <StatTile icon={Flame} value={fmt(metrics.calorieTarget)} label="kcal" tone="streak" />
          <StatTile icon={Beef} value={`${metrics.macros.proteinG} g`} label="Proteína" />
          <StatTile
            icon={Droplets}
            value={`${fmt(metrics.waterLitersTrainingDay, 1)} L`}
            label="Água (treino)"
            tone="xp"
          />
        </div>
        <Link
          to="/perfil"
          className="mt-3 flex items-center justify-end gap-1 text-sm font-semibold text-primary"
        >
          Ver detalhes <ChevronRight className="size-4" />
        </Link>
      </Card>

      {/* Meta semanal (placeholder até a Etapa 5) */}
      <Card>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-bold">
            <Flame className="size-5 text-streak" /> Meta da semana
          </h2>
          <span className="num text-sm text-muted">0 / {profile.targetDaysPerWeek} treinos</span>
        </div>
        <ProgressBar value={0} color="streak" />
        <p className="mt-2 text-xs text-muted">
          Hoje você treina {profile.daysPerWeek}x por semana — meta: {profile.targetDaysPerWeek}x.
        </p>
      </Card>

      {/* Treino do dia */}
      <Card elevated>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-bold">
            <CalendarCheck className="size-5 text-primary" /> Treino de hoje
          </h2>
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-xl font-extrabold text-base">
            {nextDay.id}
          </span>
        </div>
        <p className="mb-3 text-lg font-semibold">{nextDay.focus}</p>
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge>
            <Clock className="size-3.5" /> ~{nextDay.estimatedMinutes} min
          </Badge>
          <Badge>
            <Dumbbell className="size-3.5" /> {nextDay.exercises.length} exercícios
          </Badge>
          <Link to="/treino" className="ml-auto text-sm font-semibold text-primary">
            Ver ficha
          </Link>
        </div>
        <Button fullWidth disabled>
          Iniciar treino · Etapa 4
        </Button>
      </Card>
    </motion.div>
  )
}

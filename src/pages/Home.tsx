import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
  Beef,
  CalendarCheck,
  ChevronRight,
  Clock,
  Droplets,
  Dumbbell,
  Flame,
  Play,
  Target,
} from 'lucide-react'
import { useActiveProfile, useAppStore, useNextWorkoutDay } from '@/store/useAppStore'
import { useSessionStore } from '@/store/useSessionStore'
import { useProfileMetrics } from '@/hooks/useProfileMetrics'
import { fmt } from '@/lib/format'
import { firstName, goalLabels } from '@/lib/labels'
import { Badge, Button, Card, ProgressBar, StatTile } from '@/components/ui'

export function HomePage() {
  const navigate = useNavigate()
  const profile = useActiveProfile()
  const metrics = useProfileMetrics()
  const { day: nextDay } = useNextWorkoutDay()
  const activeSession = useSessionStore((s) => s.session)
  const history = useAppStore((s) => s.history)

  const hasActiveSessionForProfile = activeSession?.profileId === profile.id

  // Conta treinos concluídos nos últimos 7 dias para o perfil ativo
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const weeklyDoneCount = history.filter(
    (h) => h.profileId === profile.id && new Date(h.startedAt).getTime() >= weekAgo,
  ).length

  const handleStartOrResume = () => {
    if (hasActiveSessionForProfile) {
      navigate('/treino/sessao/foco')
    } else {
      navigate('/treino/sessao/checkin')
    }
  }

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

      {/* Meta semanal */}
      <Card>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-bold">
            <Flame className="size-5 text-streak" /> Meta da semana
          </h2>
          <span className="num text-sm text-muted">
            {weeklyDoneCount} / {profile.targetDaysPerWeek} treinos
          </span>
        </div>
        <ProgressBar value={weeklyDoneCount / profile.targetDaysPerWeek} color="streak" />
        <p className="mt-2 text-xs text-muted">
          Hoje você treina {profile.daysPerWeek}x por semana — meta: {profile.targetDaysPerWeek}x.
        </p>
      </Card>

      {/* Treino do dia */}
      <Card elevated>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-bold">
            <CalendarCheck className="size-5 text-primary" />{' '}
            {hasActiveSessionForProfile ? 'Treino em andamento' : 'Treino de hoje'}
          </h2>
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-xl font-extrabold text-base">
            {hasActiveSessionForProfile ? activeSession.dayId : nextDay.id}
          </span>
        </div>
        <p className="mb-3 text-lg font-semibold">
          {hasActiveSessionForProfile ? activeSession.dayFocus : nextDay.focus}
        </p>
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
        <Button fullWidth onClick={handleStartOrResume}>
          <Play className="size-5 fill-current" />
          {hasActiveSessionForProfile
            ? `Continuar Treino ${activeSession.dayId}`
            : `Iniciar Treino ${nextDay.id}`}
        </Button>
      </Card>
    </motion.div>
  )
}

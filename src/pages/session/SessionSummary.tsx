import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Award,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  RefreshCw,
  Trophy,
  Zap,
} from 'lucide-react'
import { Badge, Button, Card, ProgressBar, StatTile } from '@/components/ui'
import { CelebrationConfetti } from '@/components/gamification'
import { getExercise } from '@/data/exercises'
import { fmt } from '@/lib/format'
import {
  calculateProfileTotalXp,
  calculateSessionXp,
  detectPersonalRecords,
  levelFromXp,
} from '@/lib/gamification'
import { useAppStore } from '@/store/useAppStore'
import { sessionStats, useSessionStore } from '@/store/useSessionStore'

export function SessionSummaryPage() {
  const navigate = useNavigate()
  const session = useSessionStore((s) => s.session)
  const finishSession = useSessionStore((s) => s.finishSession)
  const discardSession = useSessionStore((s) => s.discardSession)
  const history = useAppStore((s) => s.history)
  const recordSession = useAppStore((s) => s.recordSession)

  useEffect(() => {
    if (!session) {
      navigate('/', { replace: true })
    }
  }, [session, navigate])

  if (!session) return null

  const stats = sessionStats(session)
  const xp = calculateSessionXp(session)
  const prevTotalXp = calculateProfileTotalXp(history, session.profileId)
  const newLevelInfo = levelFromXp(prevTotalXp + xp.totalXp)
  const prevLevelInfo = levelFromXp(prevTotalXp)
  const leveledUp = newLevelInfo.level > prevLevelInfo.level
  const prs = detectPersonalRecords(session, history)

  const handleSaveAndFinish = () => {
    const finished = finishSession()
    if (finished) {
      recordSession(finished)
    }
    navigate('/', { replace: true })
  }

  const handleDiscard = () => {
    discardSession()
    navigate('/', { replace: true })
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-auto flex min-h-full max-w-[480px] flex-col gap-4 px-4 pb-8 pt-6"
    >
      <div className="flex flex-col items-center text-center">
        <CelebrationConfetti />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16 }}
          className="mb-3 flex size-20 items-center justify-center rounded-3xl bg-primary/15 text-primary"
        >
          <Trophy className="size-10" />
        </motion.div>
        <Badge tone="primary" className="mb-1">
          {session.dayName} · {session.dayFocus}
        </Badge>
        <h1 className="text-3xl font-extrabold">Treino Concluído!</h1>
        <p className="text-sm text-muted">
          Mais um passo firme na sua evolução. Confira suas conquistas de hoje:
        </p>
      </div>

      {/* Card de XP & Nível */}
      <Card elevated className="border-xp/40">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="size-5 fill-xp text-xp" />
            <span className="font-bold">Recompensa do Treino</span>
          </div>
          <span className="num text-xl font-extrabold text-xp">+{xp.totalXp} XP</span>
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5 text-xs">
          <Badge tone="neutral">+{xp.setsXp} XP séries</Badge>
          {xp.exercisesXp > 0 && <Badge tone="neutral">+{xp.exercisesXp} XP exercícios</Badge>}
          {xp.finishBonusXp > 0 && <Badge tone="primary">+{xp.finishBonusXp} XP treino</Badge>}
          {xp.survivalBonusXp > 0 && (
            <Badge tone="streak">+{xp.survivalBonusXp} XP sobrevivência</Badge>
          )}
        </div>

        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-semibold">
            Nível {newLevelInfo.level} · {newLevelInfo.title}
          </span>
          {leveledUp ? (
            <Badge tone="xp">🎉 Subiu de nível!</Badge>
          ) : (
            <span className="num text-muted">
              {fmt(newLevelInfo.totalXp)} / {fmt(newLevelInfo.nextLevelXp)} XP
            </span>
          )}
        </div>
        <ProgressBar value={newLevelInfo.progress} color="xp" />
      </Card>

      {/* Novos Recordes Pessoais (PRs) */}
      {prs.length > 0 && (
        <Card className="border-streak/40 bg-streak/10">
          <h2 className="mb-2 flex items-center gap-2 font-bold text-streak">
            <Award className="size-5" /> Novos Recordes Pessoais ({prs.length})!
          </h2>
          <ul className="space-y-1.5 text-sm">
            {prs.map((pr) => (
              <li key={pr.exerciseId} className="flex items-center justify-between">
                <span className="font-semibold">{getExercise(pr.exerciseId).name}</span>
                <span className="num text-xs font-bold text-streak">
                  {pr.previousMaxWeightKg > 0 ? `${pr.previousMaxWeightKg} → ` : ''}
                  {pr.newMaxWeightKg} kg (1RM ~{pr.estimated1RM} kg)
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-2">
        <StatTile icon={Clock} value={`${stats.durationMinutes} min`} label="Duração" />
        <StatTile
          icon={CheckCircle2}
          value={`${stats.completedSets}/${stats.totalSets}`}
          label="Séries"
          tone="streak"
        />
        <StatTile
          icon={Dumbbell}
          value={`${fmt(stats.tonnageKg)} kg`}
          label="Volume total"
          tone="xp"
        />
      </div>

      <Card>
        <h2 className="mb-2 font-bold">Exercícios da sessão</h2>
        <ul className="divide-y divide-border text-sm">
          {session.queue.map((id) => {
            const log = session.logs[id]
            const ex = getExercise(log.exerciseId)
            const doneCount = log.sets.filter((st) => st.done).length
            const maxWeight = Math.max(
              0,
              ...log.sets.filter((st) => st.done).map((st) => st.weightKg),
            )

            return (
              <li key={id} className="flex items-center justify-between py-2.5">
                <div className="min-w-0 flex-1 pr-2">
                  <p className="truncate font-semibold">{ex.name}</p>
                  {log.substitutedFrom && (
                    <p className="flex items-center gap-1 text-xs text-xp">
                      <RefreshCw className="size-3" /> no lugar de{' '}
                      {getExercise(log.substitutedFrom).name}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="num font-bold text-primary">
                    {doneCount}/{log.sets.length} séries
                  </span>
                  {maxWeight > 0 && (
                    <span className="num block text-xs text-muted">máx. {maxWeight} kg</span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </Card>

      <div className="mt-auto flex flex-col gap-2 pt-2">
        <Button fullWidth onClick={handleSaveAndFinish}>
          <Flame className="size-5" /> Resgatar +{xp.totalXp} XP e Concluir
        </Button>
        <Button variant="ghost" size="md" fullWidth onClick={handleDiscard}>
          Descartar sessão sem salvar
        </Button>
      </div>
    </motion.div>
  )
}

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, Clock, Dumbbell, Flame, RefreshCw, Trophy } from 'lucide-react'
import { Badge, Button, Card, StatTile } from '@/components/ui'
import { getExercise } from '@/data/exercises'
import { fmt } from '@/lib/format'
import { useAppStore } from '@/store/useAppStore'
import { sessionStats, useSessionStore } from '@/store/useSessionStore'

export function SessionSummaryPage() {
  const navigate = useNavigate()
  const session = useSessionStore((s) => s.session)
  const finishSession = useSessionStore((s) => s.finishSession)
  const discardSession = useSessionStore((s) => s.discardSession)
  const recordSession = useAppStore((s) => s.recordSession)

  useEffect(() => {
    if (!session) {
      navigate('/', { replace: true })
    }
  }, [session, navigate])

  if (!session) return null

  const stats = sessionStats(session)

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
          Mais um passo firme na sua evolução. Confira o resumo de hoje:
        </p>
      </div>

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
            const maxWeight = Math.max(0, ...log.sets.filter((st) => st.done).map((st) => st.weightKg))

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
          <Flame className="size-5" /> Salvar treino e avançar ficha
        </Button>
        <Button variant="ghost" size="md" fullWidth onClick={handleDiscard}>
          Descartar sessão sem salvar
        </Button>
      </div>
    </motion.div>
  )
}

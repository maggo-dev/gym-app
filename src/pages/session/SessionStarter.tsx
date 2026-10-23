import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, Dumbbell, Play, Star } from 'lucide-react'
import { Badge, Card } from '@/components/ui'
import { equipmentLabels, getExercise, muscleLabels } from '@/data/exercises'
import { useSessionStore } from '@/store/useSessionStore'

export function SessionStarterPage() {
  const navigate = useNavigate()
  const session = useSessionStore((s) => s.session)
  const selectExercise = useSessionStore((s) => s.selectExercise)

  useEffect(() => {
    if (!session) {
      navigate('/treino', { replace: true })
    }
  }, [session, navigate])

  if (!session) return null

  const items = session.queue.map((id) => session.logs[id]).filter(Boolean)
  const starters = items.filter((item) => item.isStarter && item.status !== 'done')
  const others = items.filter((item) => !item.isStarter || item.status === 'done')

  const handlePick = (plannedId: string) => {
    selectExercise(plannedId)
    navigate('/treino/sessao/foco')
  }

  return (
    <div className="mx-auto flex min-h-full max-w-[480px] flex-col px-4 pb-8 pt-4">
      <header className="mb-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="flex size-10 items-center justify-center rounded-full bg-surface text-fg"
          aria-label="Voltar ao início"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {session.dayName} · {session.dayFocus}
          </p>
          <h1 className="text-xl font-extrabold">Por onde vamos começar?</h1>
        </div>
      </header>

      <p className="mb-4 text-sm text-muted">
        Olhe ao redor na academia: escolha qualquer um dos principais livres para iniciar sem fila!
      </p>

      {starters.length > 0 && (
        <section className="mb-5">
          <h2 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
            <Star className="size-4 fill-primary" /> Recomendados para começar
          </h2>
          <div className="flex flex-col gap-2.5">
            {starters.map((log, i) => {
              const ex = getExercise(log.exerciseId)
              return (
                <motion.button
                  key={log.plannedExerciseId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handlePick(log.plannedExerciseId)}
                  className="flex w-full items-center gap-3 rounded-2xl border-2 border-primary/50 bg-surface p-4 text-left active:scale-[0.99]"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                    <Dumbbell className="size-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{ex.name}</p>
                    <p className="text-xs text-muted">
                      {muscleLabels[ex.primary]} · {equipmentLabels[ex.equipment]}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Badge tone="primary">
                        {log.sets.length} × {log.repsMin}–{log.repsMax} reps
                      </Badge>
                    </div>
                  </div>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-base">
                    <Play className="size-5 fill-current" />
                  </span>
                </motion.button>
              )
            })}
          </div>
        </section>
      )}

      <section className="flex-1">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
          Restante da ficha (toque se preferir começar por aqui)
        </h2>
        <Card className="p-2">
          <ul className="divide-y divide-border">
            {others.map((log) => {
              const ex = getExercise(log.exerciseId)
              const done = log.status === 'done'
              return (
                <li key={log.plannedExerciseId}>
                  <button
                    onClick={() => handlePick(log.plannedExerciseId)}
                    className="flex w-full items-center gap-3 p-3 text-left"
                  >
                    {done ? (
                      <CheckCircle2 className="size-5 shrink-0 text-primary" />
                    ) : (
                      <span className="size-2.5 shrink-0 rounded-full bg-muted" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{ex.name}</p>
                      <p className="text-xs text-muted">
                        {muscleLabels[ex.primary]} ·{' '}
                        {log.durationSec
                          ? `${Math.round(log.durationSec / 60)} min`
                          : `${log.sets.length} × ${log.repsMin}–${log.repsMax}`}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-primary">
                      {done ? 'Rever' : 'Iniciar'}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>
      </section>
    </div>
  )
}

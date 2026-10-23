import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Check,
  ChevronDown,
  Clock,
  Info,
  ListOrdered,
  Minus,
  Plus,
  RefreshCw,
  SkipForward,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react'
import { Badge, Button, Card, ProgressBar } from '@/components/ui'
import { RestTimer, playBeep } from '@/components/workout/RestTimer'
import { equipmentLabels, getExercise, muscleLabels } from '@/data/exercises'
import { cn } from '@/lib/cn'
import { sessionStats, useSessionStore } from '@/store/useSessionStore'

export function SessionFocusPage() {
  const navigate = useNavigate()
  const session = useSessionStore((s) => s.session)
  const selectExercise = useSessionStore((s) => s.selectExercise)
  const updateSet = useSessionStore((s) => s.updateSet)
  const completeSet = useSessionStore((s) => s.completeSet)
  const skipToEnd = useSessionStore((s) => s.skipToEnd)
  const substitute = useSessionStore((s) => s.substitute)

  const [cuesOpen, setCuesOpen] = useState(false)
  const [occupiedOpen, setOccupiedOpen] = useState(false)
  const [restSeconds, setRestSeconds] = useState<number | null>(null)

  useEffect(() => {
    if (!session) {
      navigate('/treino', { replace: true })
    }
  }, [session, navigate])

  if (!session) return null

  const currentId = session.currentId ?? session.queue[0]
  const log = session.logs[currentId]
  if (!log) return null

  const ex = getExercise(log.exerciseId)
  const isCardio = ex.kind === 'cardio'
  const stats = sessionStats(session)
  const progress = stats.totalSets > 0 ? stats.completedSets / stats.totalSets : 0

  const activeSetIdx = log.sets.findIndex((st) => !st.done)
  const allSetsDone = activeSetIdx === -1

  // Próximos exercícios pendentes na fila
  const pendingIds = session.queue.filter(
    (id) => id !== currentId && session.logs[id]?.status !== 'done',
  )

  const handleCompleteNextSet = () => {
    if (activeSetIdx < 0) return
    const res = completeSet(currentId, activeSetIdx)
    if (res.exerciseCompleted) {
      playBeep(1046, 220)
      setRestSeconds(null)
    } else if (res.restSec > 0) {
      setRestSeconds(res.restSec)
    }
  }

  const handleSkipOccupied = () => {
    setOccupiedOpen(false)
    setRestSeconds(null)
    skipToEnd(currentId)
  }

  const handleSubstitute = (newExId: string) => {
    substitute(currentId, newExId)
    setOccupiedOpen(false)
  }

  const handleGoToNext = (nextId: string) => {
    setRestSeconds(null)
    selectExercise(nextId)
  }

  return (
    <div className="mx-auto flex min-h-full max-w-[480px] flex-col px-4 pb-8 pt-4">
      {/* Barra superior estilo Duolingo */}
      <header className="mb-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/treino/sessao/inicio')}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-muted"
          aria-label="Ver fila de exercícios"
          title="Ver fila de exercícios"
        >
          <ListOrdered className="size-5" />
        </button>
        <div className="flex-1">
          <ProgressBar value={progress} color="primary" />
        </div>
        <span className="num text-xs font-bold text-muted">
          {stats.completedSets}/{stats.totalSets}
        </span>
      </header>

      {/* Cabeçalho do exercício */}
      <motion.div
        key={`${currentId}-${log.exerciseId}`}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-1 flex-col gap-4"
      >
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge tone="primary">{muscleLabels[ex.primary]}</Badge>
            <Badge>{equipmentLabels[ex.equipment]}</Badge>
            {log.substitutedFrom && <Badge tone="xp">Substituído</Badge>}
          </div>
          <h1 className="text-2xl font-extrabold leading-tight">{ex.name}</h1>
          <p className="mt-0.5 text-sm text-muted">
            {isCardio
              ? `Meta: ${Math.round((log.durationSec ?? 720) / 60)} minutos em ritmo constante`
              : `Meta: ${log.sets.length} séries de ${log.repsMin} a ${log.repsMax} repetições · Descanso ${log.restSec}s`}
          </p>
        </div>

        {/* Dicas de execução colapsáveis */}
        <Card className="p-3">
          <button
            type="button"
            onClick={() => setCuesOpen((o) => !o)}
            className="flex w-full items-center justify-between text-left text-sm font-semibold"
          >
            <span className="flex items-center gap-2">
              <Info className="size-4 text-primary" /> Dicas de execução
            </span>
            <ChevronDown
              className={cn('size-4 text-muted transition-transform', cuesOpen && 'rotate-180')}
            />
          </button>
          <AnimatePresence initial={false}>
            {cuesOpen && (
              <motion.ul
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-2 list-disc space-y-1 overflow-hidden pl-5 text-xs text-muted"
              >
                {ex.cues.map((cue) => (
                  <li key={cue}>{cue}</li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </Card>

        {/* Lista de séries */}
        <div className="flex flex-col gap-2.5">
          {log.sets.map((st, idx) => {
            const isCurrent = idx === activeSetIdx
            return (
              <motion.div
                key={idx}
                layout
                className={cn(
                  'rounded-2xl border-2 p-3 transition-colors',
                  st.done
                    ? 'border-primary/40 bg-primary/10'
                    : isCurrent
                      ? 'border-primary bg-surface'
                      : 'border-border bg-surface/60 opacity-75',
                )}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted">
                    {isCardio ? 'Bloco único' : `Série ${idx + 1} de ${log.sets.length}`}
                  </span>
                  {st.done ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-primary">
                      <Check className="size-4" strokeWidth={3} /> Concluída
                    </span>
                  ) : isCurrent ? (
                    <span className="text-xs font-semibold text-primary">Série atual</span>
                  ) : null}
                </div>

                {isCardio ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">Duração (minutos)</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateSet(currentId, idx, { reps: st.reps - 1 })}
                        className="flex size-11 items-center justify-center rounded-xl bg-elevated font-bold active:scale-95"
                        aria-label="Diminuir minutos"
                      >
                        <Minus className="size-4" />
                      </button>
                      <span className="num w-14 text-center text-xl font-extrabold">
                        {st.reps}m
                      </span>
                      <button
                        type="button"
                        onClick={() => updateSet(currentId, idx, { reps: st.reps + 1 })}
                        className="flex size-11 items-center justify-center rounded-xl bg-elevated font-bold active:scale-95"
                        aria-label="Aumentar minutos"
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {/* Stepper de Carga (kg) */}
                    <div className="rounded-xl bg-elevated p-2">
                      <span className="mb-1 block text-center text-[11px] text-muted">
                        Carga (kg)
                      </span>
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => updateSet(currentId, idx, { weightKg: st.weightKg - 2.5 })}
                          className="flex size-10 items-center justify-center rounded-lg bg-surface font-bold active:scale-95"
                          aria-label={`Diminuir carga da série ${idx + 1}`}
                        >
                          <Minus className="size-4" />
                        </button>
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.5"
                          min="0"
                          value={st.weightKg}
                          onChange={(e) =>
                            updateSet(currentId, idx, {
                              weightKg: parseFloat(e.target.value) || 0,
                            })
                          }
                          aria-label={`Carga da série ${idx + 1}`}
                          className="num w-16 bg-transparent text-center text-lg font-extrabold focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => updateSet(currentId, idx, { weightKg: st.weightKg + 2.5 })}
                          className="flex size-10 items-center justify-center rounded-lg bg-surface font-bold active:scale-95"
                          aria-label={`Aumentar carga da série ${idx + 1}`}
                        >
                          <Plus className="size-4" />
                        </button>
                      </div>
                    </div>

                    {/* Stepper de Repetições */}
                    <div className="rounded-xl bg-elevated p-2">
                      <span className="mb-1 block text-center text-[11px] text-muted">
                        Repetições
                      </span>
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => updateSet(currentId, idx, { reps: st.reps - 1 })}
                          className="flex size-10 items-center justify-center rounded-lg bg-surface font-bold active:scale-95"
                          aria-label={`Diminuir repetições da série ${idx + 1}`}
                        >
                          <Minus className="size-4" />
                        </button>
                        <span className="num w-12 text-center text-lg font-extrabold">
                          {st.reps}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateSet(currentId, idx, { reps: st.reps + 1 })}
                          className="flex size-10 items-center justify-center rounded-lg bg-surface font-bold active:scale-95"
                          aria-label={`Aumentar repetições da série ${idx + 1}`}
                        >
                          <Plus className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Estado: Exercício concluído vs Série em andamento */}
        {allSetsDone ? (
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mt-auto flex flex-col gap-3 rounded-3xl border-2 border-primary bg-primary/10 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-base">
                <Sparkles className="size-6" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-primary">Exercício concluído!</p>
                <p className="text-xs text-muted">
                  {pendingIds.length > 0
                    ? `Faltam ${pendingIds.length} exercício(s) para fechar o treino.`
                    : 'Você completou todos os exercícios da fila!'}
                </p>
              </div>
            </div>

            {pendingIds.length > 0 ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">
                  Escolha o próximo livre:
                </p>
                {pendingIds.slice(0, 2).map((nextId, i) => {
                  const nextEx = getExercise(session.logs[nextId].exerciseId)
                  return (
                    <Button
                      key={nextId}
                      variant={i === 0 ? 'primary' : 'secondary'}
                      fullWidth
                      onClick={() => handleGoToNext(nextId)}
                    >
                      {nextEx.name}
                    </Button>
                  )
                })}
              </div>
            ) : (
              <Button fullWidth onClick={() => navigate('/treino/sessao/resumo')}>
                <Trophy className="size-5" /> Concluir Treino!
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="mt-auto flex flex-col gap-2.5 pt-2">
            <Button fullWidth onClick={handleCompleteNextSet}>
              <Check className="size-5" strokeWidth={3} /> Concluir Série {activeSetIdx + 1}
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setOccupiedOpen(true)}
                className="text-xs"
              >
                <Clock className="size-4 text-xp" /> Aparelho Ocupado
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={() => navigate('/treino/sessao/resumo')}
                className="text-xs"
              >
                Encerrar treino
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Cronômetro de descanso em overlay */}
      <RestTimer
        initialSeconds={restSeconds}
        nextLabel={`Próxima: Série ${Math.min(activeSetIdx + 1, log.sets.length)} de ${log.sets.length}`}
        onFinish={() => setRestSeconds(null)}
      />

      {/* Bottom Sheet: Aparelho Ocupado */}
      <AnimatePresence>
        {occupiedOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOccupiedOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-label="Aparelho ocupado"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 34 }}
              className="pb-safe fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[480px] rounded-t-3xl border-t border-border bg-surface p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-extrabold">Aparelho ocupado? ⏳</h2>
                <button
                  onClick={() => setOccupiedOpen(false)}
                  className="rounded-full p-1 text-muted"
                  aria-label="Fechar"
                >
                  <X className="size-5" />
                </button>
              </div>

              {pendingIds.length > 0 && (
                <div className="mb-4">
                  <Button variant="secondary" fullWidth onClick={handleSkipOccupied}>
                    <SkipForward className="size-5 text-primary" /> Fazer outro primeiro (jogar pro fim)
                  </Button>
                </div>
              )}

              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
                  <RefreshCw className="size-3.5" /> Ou substituir hoje por equivalente:
                </p>
                <div className="flex flex-col gap-2">
                  {ex.equivalents.map((eqId) => {
                    const eq = getExercise(eqId)
                    return (
                      <button
                        key={eqId}
                        onClick={() => handleSubstitute(eqId)}
                        className="flex w-full items-center justify-between rounded-2xl border border-border bg-elevated p-3 text-left active:bg-surface"
                      >
                        <div>
                          <p className="font-semibold">{eq.name}</p>
                          <p className="text-xs text-muted">{equipmentLabels[eq.equipment]}</p>
                        </div>
                        <span className="text-xs font-bold text-primary">Trocar</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

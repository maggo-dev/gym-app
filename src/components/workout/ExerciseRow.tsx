import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Clock, Repeat, Star, Timer } from 'lucide-react'
import { equipmentLabels, getExercise, muscleLabels } from '@/data/exercises'
import { cn } from '@/lib/cn'
import type { PlannedExercise } from '@/types'

const formatRest = (sec: number) =>
  sec >= 60 ? `${Math.floor(sec / 60)}min${sec % 60 ? ` ${sec % 60}s` : ''}` : `${sec}s`

export function prescriptionLabel(pe: PlannedExercise) {
  if (pe.durationSec) return `${Math.round(pe.durationSec / 60)} min`
  return `${pe.sets} × ${pe.repsMin}–${pe.repsMax}`
}

interface ExerciseRowProps {
  planned: PlannedExercise
  index: number
}

/** Linha expansível de exercício com dicas e equivalentes. */
export function ExerciseRow({ planned, index }: ExerciseRowProps) {
  const [open, setOpen] = useState(false)
  const ex = getExercise(planned.exerciseId)

  return (
    <li className="overflow-hidden rounded-2xl border border-border bg-surface">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 p-3 text-left"
        aria-expanded={open}
      >
        <span
          className={cn(
            'num flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold',
            planned.isStarter ? 'bg-primary text-base' : 'bg-elevated text-muted',
          )}
        >
          {index + 1}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{ex.name}</span>
          <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
            <span>{muscleLabels[ex.primary]}</span>
            <span className="num flex items-center gap-1">
              <Repeat className="size-3" /> {prescriptionLabel(planned)}
            </span>
            {planned.restSec > 0 && (
              <span className="num flex items-center gap-1">
                <Timer className="size-3" /> {formatRest(planned.restSec)}
              </span>
            )}
          </span>
        </span>
        {planned.isStarter && <Star className="size-4 shrink-0 fill-primary text-primary" />}
        <ChevronDown className={cn('size-5 shrink-0 text-muted transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 border-t border-border px-3 pb-3 pt-3 text-sm">
              <p className="text-xs text-muted">
                Equipamento: <span className="text-fg">{equipmentLabels[ex.equipment]}</span>
                {ex.secondary.length > 0 && (
                  <>
                    {' · '}Auxiliares:{' '}
                    <span className="text-fg">{ex.secondary.map((m) => muscleLabels[m]).join(', ')}</span>
                  </>
                )}
              </p>
              <div>
                <p className="mb-1 font-semibold">Dicas de execução</p>
                <ul className="list-disc space-y-0.5 pl-5 text-muted">
                  {ex.cues.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-1 flex items-center gap-1 font-semibold">
                  <Clock className="size-3.5" /> Aparelho ocupado? Alternativas:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {ex.equivalents.map((id) => (
                    <span key={id} className="rounded-full bg-elevated px-2.5 py-1 text-xs">
                      {getExercise(id).name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}

/**
 * Gerador de fichas ABC / ABCD a partir do perfil.
 *
 * Determinístico: o mesmo perfil sempre gera a mesma ficha.
 */
import { getExercise } from '@/data/exercises'
import { estimateSessionMinutes } from '@/lib/calculations'
import { prescribe } from '@/lib/prescription'
import type {
  Emphasis,
  Goal,
  MuscleGroup,
  PlannedExercise,
  UserProfile,
  WorkoutDay,
  WorkoutDayId,
  WorkoutPlan,
} from '@/types'

/** Incrementar sempre que templates/regras mudarem — força regenerar fichas salvas. */
export const GENERATOR_VERSION = 1

/** Quantos compostos iniciais recebem o selo "bom para começar". */
const STARTERS_PER_DAY = 3

interface Slot {
  exerciseId: string
  /** se definido, só entra para estas ênfases */
  onlyFor?: Emphasis[]
}

interface DayTemplate {
  id: WorkoutDayId
  name: string
  focus: string
  slots: Slot[]
}

const s = (exerciseId: string, onlyFor?: Emphasis[]): Slot => ({ exerciseId, onlyFor })

// ───────── ABC (3 dias) ─────────
const ABC: DayTemplate[] = [
  {
    id: 'A',
    name: 'Treino A',
    focus: 'Peito, Ombros e Tríceps',
    slots: [
      s('supino_reto_barra'),
      s('supino_inclinado_halteres'),
      s('desenvolvimento_halteres'),
      s('peck_deck'),
      s('elevacao_lateral'),
      s('triceps_corda'),
      s('triceps_frances'),
    ],
  },
  {
    id: 'B',
    name: 'Treino B',
    focus: 'Costas e Bíceps',
    slots: [
      s('puxada_frontal'),
      s('remada_curvada'),
      s('remada_baixa'),
      s('pulldown_braco_reto'),
      s('crucifixo_inverso'),
      s('rosca_direta'),
      s('rosca_martelo'),
    ],
  },
  {
    id: 'C',
    name: 'Treino C',
    focus: 'Pernas',
    slots: [
      s('agachamento_livre'),
      s('leg_press'),
      s('stiff'),
      s('elevacao_pelvica', ['glutes_legs']),
      s('cadeira_extensora'),
      s('mesa_flexora'),
      s('cadeira_abdutora', ['glutes_legs']),
      s('panturrilha_pe'),
      s('prancha'),
    ],
  },
]

// ───────── ABCD (4 dias) ─────────
const ABCD: DayTemplate[] = [
  {
    id: 'A',
    name: 'Treino A',
    focus: 'Peito e Tríceps',
    slots: [
      s('supino_reto_barra'),
      s('supino_inclinado_halteres'),
      s('supino_maquina'),
      s('crossover'),
      s('triceps_corda'),
      s('triceps_testa'),
    ],
  },
  {
    id: 'B',
    name: 'Treino B',
    focus: 'Costas e Bíceps',
    slots: [
      s('puxada_frontal'),
      s('remada_curvada'),
      s('remada_unilateral'),
      s('pulldown_braco_reto'),
      s('rosca_direta'),
      s('rosca_martelo'),
    ],
  },
  {
    id: 'C',
    name: 'Treino C',
    focus: 'Pernas (quadríceps)',
    slots: [
      s('agachamento_livre'),
      s('leg_press'),
      s('avanco'),
      s('cadeira_extensora'),
      s('cadeira_abdutora', ['glutes_legs']),
      s('panturrilha_pe'),
      s('abdominal_infra'),
    ],
  },
  {
    id: 'D',
    name: 'Treino D',
    focus: 'Ombros, Posteriores e Glúteos',
    slots: [
      s('desenvolvimento_halteres'),
      s('stiff'),
      s('elevacao_pelvica'),
      s('elevacao_lateral'),
      s('crucifixo_inverso'),
      s('mesa_flexora'),
      s('gluteo_cabo', ['glutes_legs']),
      s('prancha'),
    ],
  },
]

/** Objetivos que recebem cardio leve no fim do treino. */
const CARDIO_GOALS: Goal[] = ['recomposition', 'fat_loss']
const CARDIO_ID = 'esteira_inclinada'

export function templatesFor(daysPerWeek: number): DayTemplate[] {
  return daysPerWeek >= 4 ? ABCD : ABC
}

/** Converte a ficha para o formato do estimador de duração. */
export function dayMinutes(exercises: PlannedExercise[]): number {
  return estimateSessionMinutes(
    exercises.map((e) => ({ sets: e.sets, restSec: e.restSec, secPerSet: e.durationSec })),
  )
}

function plan(exerciseId: string, goal: Goal): PlannedExercise {
  const p = prescribe(goal, getExercise(exerciseId).kind)
  return { exerciseId, ...p, isStarter: false }
}

/**
 * Corta exercícios até caber no tempo máximo:
 * 1º o cardio, depois o último isolado (nunca remove compostos).
 */
function fitToTime(exercises: PlannedExercise[], maxMinutes: number): PlannedExercise[] {
  const list = [...exercises]
  while (dayMinutes(list) > maxMinutes) {
    const cardioIdx = list.findIndex((e) => getExercise(e.exerciseId).kind === 'cardio')
    if (cardioIdx >= 0) {
      list.splice(cardioIdx, 1)
      continue
    }
    const isoIdx = list.findLastIndex((e) => getExercise(e.exerciseId).kind === 'isolation')
    if (isoIdx < 0) break
    list.splice(isoIdx, 1)
  }
  return list
}

function markStarters(exercises: PlannedExercise[]): PlannedExercise[] {
  let count = 0
  return exercises.map((e) => {
    const isStarter = count < STARTERS_PER_DAY && getExercise(e.exerciseId).kind === 'compound'
    if (isStarter) count++
    return { ...e, isStarter }
  })
}

export function generatePlan(
  profile: UserProfile,
  daysPerWeek: number = profile.daysPerWeek,
): WorkoutPlan {
  const days: WorkoutDay[] = templatesFor(daysPerWeek).map((t) => {
    let exercises = t.slots
      .filter((slot) => !slot.onlyFor || slot.onlyFor.includes(profile.emphasis))
      // compostos primeiro, mantendo a ordem do template
      .sort((a, b) => {
        const rank = (id: string) => (getExercise(id).kind === 'compound' ? 0 : 1)
        return rank(a.exerciseId) - rank(b.exerciseId)
      })
      .map((slot) => plan(slot.exerciseId, profile.goal))

    if (CARDIO_GOALS.includes(profile.goal)) exercises.push(plan(CARDIO_ID, profile.goal))

    exercises = markStarters(fitToTime(exercises, profile.maxSessionMinutes))

    return {
      id: t.id,
      name: t.name,
      focus: t.focus,
      exercises,
      estimatedMinutes: dayMinutes(exercises),
    }
  })

  return {
    profileId: profile.id,
    daysPerWeek,
    days,
    generatorVersion: GENERATOR_VERSION,
    generatedAt: new Date().toISOString(),
  }
}

/** Séries semanais por grupo muscular (conta só o músculo primário). */
export function weeklySetsByMuscle(p: WorkoutPlan): Partial<Record<MuscleGroup, number>> {
  const out: Partial<Record<MuscleGroup, number>> = {}
  for (const day of p.days) {
    for (const e of day.exercises) {
      const m = getExercise(e.exerciseId).primary
      if (m === 'cardio') continue
      out[m] = (out[m] ?? 0) + e.sets
    }
  }
  return out
}

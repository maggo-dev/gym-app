import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, BatteryLow, Clock, Dumbbell, Flame, Smile } from 'lucide-react'
import { Badge, Button, Card } from '@/components/ui'
import { cn } from '@/lib/cn'
import { getLastWeightsForProfile, useAppStore, useNextWorkoutDay } from '@/store/useAppStore'
import {
  adaptExercisesForEnergy,
  estimateDayMinutesForEnergy,
  useSessionStore,
} from '@/store/useSessionStore'
import type { EnergyLevel } from '@/types'

const ENERGY_OPTIONS: {
  id: EnergyLevel
  title: string
  subtitle: string
  detail: string
  icon: typeof Flame
  tone: 'streak' | 'primary' | 'xp'
}[] = [
  {
    id: 'high',
    title: '🔥 Energia Alta / Monstro',
    subtitle: 'Dormi bem e estou 100%',
    detail: 'Treino completo + sugestão automática de +2 kg nos exercícios com carga anterior.',
    icon: Flame,
    tone: 'streak',
  },
  {
    id: 'normal',
    title: '😐 Normal',
    subtitle: 'Pronto para cumprir a ficha',
    detail: 'Volume, séries e intervalos padrão planejados para o seu objetivo.',
    icon: Smile,
    tone: 'primary',
  },
  {
    id: 'low',
    title: '🪫 Modo Sobrevivência',
    subtitle: 'Cansado, estressado ou sem tempo',
    detail: 'Reduz 1 série por exercício e corta acessórios finais. Você mantém o hábito sem se esgotar!',
    icon: BatteryLow,
    tone: 'xp',
  },
]

export function SessionCheckinPage() {
  const navigate = useNavigate()
  const { day } = useNextWorkoutDay()
  const profileId = useAppStore((s) => s.activeProfileId)
  const history = useAppStore((s) => s.history)
  const startSession = useSessionStore((s) => s.startSession)

  const [selected, setSelected] = useState<EnergyLevel>('normal')

  const handleContinue = () => {
    const lastWeights = getLastWeightsForProfile(history, profileId)
    startSession(profileId, day, selected, lastWeights)
    navigate('/treino/sessao/inicio', { replace: true })
  }

  return (
    <div className="mx-auto flex min-h-full max-w-[480px] flex-col px-4 pb-8 pt-4">
      <header className="mb-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex size-10 items-center justify-center rounded-full bg-surface text-fg"
          aria-label="Voltar"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {day.name} · {day.focus}
          </p>
          <h1 className="text-xl font-extrabold">Como está sua energia hoje?</h1>
        </div>
      </header>

      <p className="mb-4 text-sm text-muted">
        O treino se adapta ao seu estado de hoje para você evoluir com consistência.
      </p>

      <div className="flex flex-1 flex-col gap-3">
        {ENERGY_OPTIONS.map((opt) => {
          const isSelected = selected === opt.id
          const mins = estimateDayMinutesForEnergy(day, opt.id)
          const exCount = adaptExercisesForEnergy(day.exercises, opt.id).length

          return (
            <motion.button
              key={opt.id}
              type="button"
              whileTap={{ scale: 0.99 }}
              onClick={() => setSelected(opt.id)}
              className={cn(
                'w-full rounded-2xl border-2 p-4 text-left transition-colors',
                isSelected ? 'border-primary bg-primary/10' : 'border-border bg-surface',
              )}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-lg font-extrabold">{opt.title}</span>
                <Badge tone={opt.tone}>
                  <Clock className="size-3.5" /> ~{mins} min
                </Badge>
              </div>
              <p className="mb-2 text-sm font-medium text-fg">{opt.subtitle}</p>
              <p className="mb-3 text-xs text-muted">{opt.detail}</p>
              <div className="flex items-center gap-2 text-xs text-muted">
                <Dumbbell className="size-3.5 text-primary" />
                <span>{exCount} exercícios na fila de hoje</span>
              </div>
            </motion.button>
          )
        })}
      </div>

      <Card elevated className="mt-4">
        <Button fullWidth onClick={handleContinue}>
          Escolher por onde começar
        </Button>
      </Card>
    </div>
  )
}

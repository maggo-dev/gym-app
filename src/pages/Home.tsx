import { motion } from 'framer-motion'
import { CalendarCheck, Flame, Ruler, Scale, Target, Timer } from 'lucide-react'
import { useActiveProfile } from '@/store/useAppStore'
import { firstName, formatHeight, goalLabels } from '@/lib/labels'
import { Badge, Button, Card, ProgressBar, StatTile } from '@/components/ui'

export function HomePage() {
  const profile = useActiveProfile()

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

      {/* Resumo do perfil */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Seu perfil</h2>
          <Badge tone="primary">
            <Target className="size-3.5" /> {goalLabels[profile.goal]}
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <StatTile icon={Scale} value={`${profile.weightKg} kg`} label="Peso" />
          <StatTile icon={Ruler} value={formatHeight(profile.heightCm)} label="Altura" />
          <StatTile icon={Timer} value={`${profile.maxSessionMinutes} min`} label="Máx./treino" tone="xp" />
        </div>
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

      {/* Treino do dia (placeholder até a Etapa 4) */}
      <Card elevated>
        <div className="mb-3 flex items-center gap-2">
          <CalendarCheck className="size-5 text-primary" />
          <h2 className="font-bold">Treino de hoje</h2>
        </div>
        <p className="mb-4 text-sm text-muted">
          As fichas personalizadas chegam na Etapa 3. Por enquanto, este é só o espaço reservado.
        </p>
        <Button fullWidth disabled>
          Iniciar treino
        </Button>
      </Card>
    </motion.div>
  )
}

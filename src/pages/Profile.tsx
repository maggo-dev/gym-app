import { motion } from 'framer-motion'
import { Droplets, Flame, Gauge, PieChart, TriangleAlert } from 'lucide-react'
import { Avatar } from '@/components/layout/Avatar'
import { Badge, Card } from '@/components/ui'
import { useActiveProfile } from '@/store/useAppStore'
import { useProfileMetrics } from '@/hooks/useProfileMetrics'
import { bmiCategoryLabels } from '@/lib/calculations'
import { fmt } from '@/lib/format'
import { experienceLabels, formatHeight, genderLabels, goalLabels } from '@/lib/labels'

// Régua do IMC: 15 → 40
const BMI_MIN = 15
const BMI_MAX = 40
const bmiSegments = [
  { to: 18.5, color: '#38BDF8' },
  { to: 25, color: 'var(--color-primary)' },
  { to: 30, color: 'var(--color-xp)' },
  { to: 35, color: 'var(--color-streak)' },
  { to: BMI_MAX, color: 'var(--color-danger)' },
]

export function ProfilePage() {
  const p = useActiveProfile()
  const m = useProfileMetrics()

  const rows: [string, string][] = [
    ['Gênero', genderLabels[p.gender]],
    ['Idade', `${p.age} anos`],
    ['Peso', `${p.weightKg} kg`],
    ['Altura', formatHeight(p.heightCm)],
    ['Objetivo', goalLabels[p.goal]],
    ['Experiência', experienceLabels[p.experience]],
    ['Frequência', `${p.daysPerWeek}x/semana (meta ${p.targetDaysPerWeek}x)`],
    ['Duração máx.', `${p.maxSessionMinutes} min`],
  ]

  const { proteinG, carbsG, fatG, kcal } = m.macros
  const macroRows = [
    { label: 'Proteína', g: proteinG, kcal: proteinG * 4, color: 'var(--color-primary)' },
    { label: 'Carboidrato', g: carbsG, kcal: carbsG * 4, color: 'var(--color-xp)' },
    { label: 'Gordura', g: fatG, kcal: fatG * 9, color: 'var(--color-streak)' },
  ]

  const deficit = m.calorieDelta < 0
  const bmiPos = ((Math.min(Math.max(m.bmi, BMI_MIN), BMI_MAX) - BMI_MIN) / (BMI_MAX - BMI_MIN)) * 100

  return (
    <motion.div
      key={p.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4"
    >
      <div className="flex items-center gap-4">
        <Avatar profile={p} size="lg" />
        <div>
          <h1 className="text-2xl font-extrabold">{p.name}</h1>
          <p className="text-muted">{goalLabels[p.goal]}</p>
        </div>
      </div>

      {/* Gasto energético */}
      <Card>
        <h2 className="mb-3 flex items-center gap-2 font-bold">
          <Flame className="size-5 text-streak" /> Gasto energético
        </h2>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-elevated p-3">
            <p className="num text-lg font-bold">{fmt(m.bmr)}</p>
            <p className="text-xs text-muted">TMB (repouso)</p>
          </div>
          <div className="rounded-2xl bg-elevated p-3">
            <p className="num text-lg font-bold">{fmt(m.tdee)}</p>
            <p className="text-xs text-muted">Gasto total</p>
          </div>
          <div className="rounded-2xl border-2 border-primary bg-primary/10 p-3">
            <p className="num text-lg font-bold text-primary">{fmt(m.calorieTarget)}</p>
            <p className="text-xs text-muted">Meta diária</p>
          </div>
        </div>
        <div className="mt-3 flex justify-center">
          <Badge tone={deficit ? 'streak' : 'primary'}>
            {deficit ? 'Déficit' : 'Superávit'} de {fmt(Math.abs(m.calorieDelta))} kcal/dia
          </Badge>
        </div>
      </Card>

      {/* Macros */}
      <Card>
        <h2 className="mb-3 flex items-center gap-2 font-bold">
          <PieChart className="size-5 text-primary" /> Macros diários
          <span className="num ml-auto text-sm font-normal text-muted">{fmt(kcal)} kcal</span>
        </h2>
        {/* barra empilhada */}
        <div className="mb-4 flex h-4 overflow-hidden rounded-full">
          {macroRows.map((r) => (
            <motion.div
              key={r.label}
              initial={{ width: 0 }}
              animate={{ width: `${(r.kcal / kcal) * 100}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              style={{ backgroundColor: r.color }}
            />
          ))}
        </div>
        <ul className="flex flex-col gap-2">
          {macroRows.map((r) => (
            <li key={r.label} className="flex items-center gap-3">
              <span className="size-3 rounded-full" style={{ backgroundColor: r.color }} />
              <span className="flex-1">{r.label}</span>
              <span className="num font-bold">{r.g} g</span>
              <span className="num w-12 text-right text-sm text-muted">
                {Math.round((r.kcal / kcal) * 100)}%
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">
          Proteína ≈ {fmt(proteinG / p.weightKg, 1)} g por kg de peso corporal.
        </p>
      </Card>

      {/* IMC */}
      <Card>
        <h2 className="mb-3 flex items-center gap-2 font-bold">
          <Gauge className="size-5 text-xp" /> IMC
          <span className="num ml-auto text-lg">{fmt(m.bmi, 1)}</span>
        </h2>
        <div className="relative mb-2 pt-3">
          <motion.div
            className="absolute top-0 -ml-1.5 size-0 border-x-[6px] border-t-[8px] border-x-transparent border-t-fg"
            initial={{ left: '0%' }}
            animate={{ left: `${bmiPos}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 18 }}
          />
          <div className="flex h-3 overflow-hidden rounded-full">
            {bmiSegments.map((s, i) => {
              const from = i === 0 ? BMI_MIN : bmiSegments[i - 1].to
              return (
                <div
                  key={s.to}
                  style={{ width: `${((s.to - from) / (BMI_MAX - BMI_MIN)) * 100}%`, backgroundColor: s.color }}
                />
              )
            })}
          </div>
        </div>
        <p className="text-sm">
          Categoria: <span className="font-semibold">{bmiCategoryLabels[m.bmiCategory]}</span>
        </p>
        <p className="mt-1 text-xs text-muted">
          O IMC não diferencia músculo de gordura. Em pessoas musculosas, ele tende a superestimar.
        </p>
      </Card>

      {/* Hidratação */}
      <Card>
        <h2 className="mb-3 flex items-center gap-2 font-bold">
          <Droplets className="size-5 text-sky-400" /> Hidratação
        </h2>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-2xl bg-elevated p-3">
            <p className="num text-lg font-bold">{fmt(m.waterLiters, 1)} L</p>
            <p className="text-xs text-muted">Dia de descanso</p>
          </div>
          <div className="rounded-2xl bg-elevated p-3">
            <p className="num text-lg font-bold text-sky-400">{fmt(m.waterLitersTrainingDay, 1)} L</p>
            <p className="text-xs text-muted">Dia de treino</p>
          </div>
        </div>
      </Card>

      {/* Dados */}
      <Card>
        <h2 className="mb-1 font-bold">Dados do perfil</h2>
        <dl className="divide-y divide-border">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between py-2.5">
              <dt className="text-muted">{k}</dt>
              <dd className="num font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <p className="flex items-start gap-2 px-1 text-xs text-muted">
        <TriangleAlert className="mt-0.5 size-4 shrink-0" />
        Estimativas baseadas em fórmulas populacionais (Mifflin-St Jeor, OMS). Consulte um nutricionista.
      </p>
    </motion.div>
  )
}

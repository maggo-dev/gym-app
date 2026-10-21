import { Avatar } from '@/components/layout/Avatar'
import { Card } from '@/components/ui'
import { useActiveProfile } from '@/store/useAppStore'
import { experienceLabels, formatHeight, genderLabels, goalLabels } from '@/lib/labels'

export function ProfilePage() {
  const p = useActiveProfile()

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Avatar profile={p} size="lg" />
        <div>
          <h1 className="text-2xl font-extrabold">{p.name}</h1>
          <p className="text-muted">{goalLabels[p.goal]}</p>
        </div>
      </div>

      <Card>
        <dl className="divide-y divide-border">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between py-2.5">
              <dt className="text-muted">{k}</dt>
              <dd className="num font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <p className="text-center text-xs text-muted">
        Cálculos de TMB, gasto calórico, macros e água chegam na Etapa 2.
      </p>
    </div>
  )
}

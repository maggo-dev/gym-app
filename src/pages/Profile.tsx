import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Download,
  Droplets,
  Flame,
  Gauge,
  History,
  PieChart,
  Scale,
  TrendingUp,
  TriangleAlert,
  Upload,
} from 'lucide-react'
import { Avatar } from '@/components/layout/Avatar'
import { Badge, Button, Card, MiniLineChart } from '@/components/ui'
import { defaultProfiles } from '@/data/profiles'
import { getExercise } from '@/data/exercises'
import { todayDateKey, useActiveProfile, useAppStore } from '@/store/useAppStore'
import { useProfileMetrics } from '@/hooks/useProfileMetrics'
import {
  bodyWeightSeries,
  exerciseProgressionSeries,
  loggedExercisesForProfile,
  sessionTonnageSeries,
  shortDateLabel,
} from '@/lib/analytics'
import { bmiCategoryLabels } from '@/lib/calculations'
import { fmt } from '@/lib/format'
import { calculateSessionXp } from '@/lib/gamification'
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

  const history = useAppStore((s) => s.history)
  const weightEntries = useAppStore((s) => s.weightLogs[p.id]) ?? []
  const logBodyWeight = useAppStore((s) => s.logBodyWeight)
  const exportBackupJson = useAppStore((s) => s.exportBackupJson)
  const importBackupJson = useAppStore((s) => s.importBackupJson)

  const initialProfile = defaultProfiles.find((dp) => dp.id === p.id) ?? p
  const [weightInput, setWeightInput] = useState<string>(() => p.weightKg.toString())
  const [selectedExId, setSelectedExId] = useState<string>('')
  const [backupMessage, setBackupMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const wSeries = bodyWeightSeries(initialProfile.weightKg, weightEntries)
  const tonnageSeries = sessionTonnageSeries(history, p.id)
  const loggedExIds = loggedExercisesForProfile(history, p.id)
  const activeExId = selectedExId && loggedExIds.includes(selectedExId) ? selectedExId : (loggedExIds[0] ?? '')
  const exProg = activeExId ? exerciseProgressionSeries(history, p.id, activeExId) : []

  const profileSessions = history.filter((s) => s.profileId === p.id).slice(0, 6)

  const handleSaveWeight = () => {
    const val = parseFloat(weightInput.replace(',', '.'))
    if (!Number.isNaN(val) && val > 20 && val < 300) {
      logBodyWeight(p.id, val)
    }
  }

  const handleExportBackup = () => {
    const json = exportBackupJson()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gymapp-backup-${todayDateKey()}.json`
    a.click()
    URL.revokeObjectURL(url)
    setBackupMessage('Backup exportado com sucesso!')
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const res = importBackupJson(String(reader.result ?? ''))
      setBackupMessage(res.ok ? 'Backup restaurado com sucesso!' : (res.error ?? 'Erro ao importar.'))
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const rows: [string, string][] = [
    ['Gênero', genderLabels[p.gender]],
    ['Idade', `${p.age} anos`],
    ['Peso atual', `${fmt(p.weightKg, 1)} kg (início: ${initialProfile.weightKg} kg)`],
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

      {/* Evolução de Peso Corporal */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-bold">
            <Scale className="size-5 text-primary" /> Evolução de Peso Corporal
          </h2>
          <Badge tone="primary">
            {fmt(p.weightKg, 1)} kg
          </Badge>
        </div>

        <MiniLineChart
          data={wSeries.map((pt) => ({ label: pt.dateLabel, value: pt.weightKg }))}
          unit="kg"
          color="var(--color-primary)"
        />

        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            placeholder="Novo peso (kg)"
            aria-label="Registrar peso corporal de hoje em kg"
            className="num h-12 flex-1 rounded-xl border border-border bg-elevated px-3 text-sm font-bold text-fg focus:border-primary focus:outline-none"
          />
          <Button size="md" onClick={handleSaveWeight}>
            Registrar hoje
          </Button>
        </div>
        <p className="mt-1.5 text-[11px] text-muted">
          Ao atualizar seu peso, todas as metas de calorias, macros e água se recalibram automaticamente.
        </p>
      </Card>

      {/* Evolução de Volume e Cargas */}
      <Card>
        <h2 className="mb-2 flex items-center gap-2 font-bold">
          <TrendingUp className="size-5 text-streak" /> Evolução nos Treinos
        </h2>

        <p className="mb-1.5 text-xs font-semibold text-muted">
          Volume total levantado por sessão (kg)
        </p>
        <MiniLineChart
          data={tonnageSeries.map((pt) => ({
            label: `${pt.dayId} (${pt.dateLabel})`,
            value: pt.tonnageKg,
          }))}
          unit="kg"
          color="var(--color-streak)"
        />

        {loggedExIds.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-muted">Carga máxima por exercício:</span>
              <select
                value={activeExId}
                onChange={(e) => setSelectedExId(e.target.value)}
                aria-label="Selecionar exercício para ver evolução"
                className="max-w-[200px] truncate rounded-xl border border-border bg-elevated px-2.5 py-1.5 text-xs font-semibold text-fg"
              >
                {loggedExIds.map((id) => (
                  <option key={id} value={id}>
                    {getExercise(id).name}
                  </option>
                ))}
              </select>
            </div>
            <MiniLineChart
              data={exProg.map((pt) => ({ label: pt.dateLabel, value: pt.maxWeightKg }))}
              unit="kg"
              color="var(--color-xp)"
            />
          </div>
        )}
      </Card>

      {/* Histórico Recente de Sessões */}
      {profileSessions.length > 0 && (
        <Card>
          <h2 className="mb-2 flex items-center gap-2 font-bold">
            <History className="size-5 text-xp" /> Últimos Treinos Concluídos
          </h2>
          <ul className="divide-y divide-border text-sm">
            {profileSessions.map((s) => {
              const xp = calculateSessionXp(s).totalXp
              return (
                <li key={s.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="font-semibold">
                      {s.dayName} · {s.dayFocus}
                    </p>
                    <p className="num text-xs text-muted">
                      {shortDateLabel(s.startedAt)} · {Object.keys(s.logs).length} exercícios
                    </p>
                  </div>
                  <Badge tone="xp">+{xp} XP</Badge>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

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

      {/* Backup Exportar / Importar */}
      <Card>
        <h2 className="mb-1 font-bold">Backup dos Dados</h2>
        <p className="mb-3 text-xs text-muted">
          Seus treinos, cargas, peso e dieta ficam salvos neste aparelho. Baixe uma cópia para
          guardar ou transferir para outro celular.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" size="md" onClick={handleExportBackup}>
            <Download className="size-4 text-primary" /> Exportar JSON
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-4 text-xp" /> Importar JSON
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            className="hidden"
          />
        </div>
        {backupMessage && (
          <p className="mt-2 text-center text-xs font-semibold text-primary">{backupMessage}</p>
        )}
      </Card>

      <p className="flex items-start gap-2 px-1 text-xs text-muted">
        <TriangleAlert className="mt-0.5 size-4 shrink-0" />
        Estimativas baseadas em fórmulas populacionais (Mifflin-St Jeor, OMS). Consulte um nutricionista.
      </p>
    </motion.div>
  )
}

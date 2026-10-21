import { Dumbbell } from 'lucide-react'
import { PagePlaceholder } from './PagePlaceholder'

export function WorkoutPage() {
  return (
    <PagePlaceholder
      title="Treino"
      icon={Dumbbell}
      description="Fichas, check-in de energia e modo foco (1 exercício por tela) chegam nas Etapas 3 e 4."
    />
  )
}

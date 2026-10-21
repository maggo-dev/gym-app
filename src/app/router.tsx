import { createHashRouter } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { HomePage } from '@/pages/Home'
import { WorkoutPage } from '@/pages/Workout'
import { DietPage } from '@/pages/Diet'
import { ProfilePage } from '@/pages/Profile'

// HashRouter: funciona no GitHub Pages sem configuração de servidor
export const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'treino', element: <WorkoutPage /> },
      { path: 'dieta', element: <DietPage /> },
      { path: 'perfil', element: <ProfilePage /> },
    ],
  },
])

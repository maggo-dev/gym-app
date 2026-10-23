import { createHashRouter } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { HomePage } from '@/pages/Home'
import { WorkoutPage } from '@/pages/Workout'
import { DietPage } from '@/pages/Diet'
import { ProfilePage } from '@/pages/Profile'
import { SessionCheckinPage } from '@/pages/session/SessionCheckin'
import { SessionStarterPage } from '@/pages/session/SessionStarter'
import { SessionFocusPage } from '@/pages/session/SessionFocus'
import { SessionSummaryPage } from '@/pages/session/SessionSummary'

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
  // Fluxo de sessão ativa em tela cheia (sem BottomNav)
  { path: '/treino/sessao/checkin', element: <SessionCheckinPage /> },
  { path: '/treino/sessao/inicio', element: <SessionStarterPage /> },
  { path: '/treino/sessao/foco', element: <SessionFocusPage /> },
  { path: '/treino/sessao/resumo', element: <SessionSummaryPage /> },
])

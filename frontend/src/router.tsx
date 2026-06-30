import { createBrowserRouter } from 'react-router-dom'

import { Landing } from '@/pages/Landing'
import { Login } from '@/pages/auth/Login'
import { Register } from '@/pages/auth/Register'
import { ResetPassword } from '@/pages/auth/ResetPassword'
import { Dashboard } from '@/pages/Dashboard'
import { Upload } from '@/pages/deck/Upload'
import { Documents } from '@/pages/deck/Documents'
import { DeckDashboard } from '@/pages/deck/DeckDashboard'
import { Graph } from '@/pages/deck/Graph'
import { Wiki } from '@/pages/deck/Wiki'
import { Editor } from '@/pages/deck/Editor'
import { LlmWiki } from '@/pages/deck/LlmWiki'
import { Modules } from '@/pages/deck/Modules'
import { Health } from '@/pages/deck/Health'
import { Schedule } from '@/pages/deck/Schedule'
import { Settings } from '@/pages/Settings'
import { SessionPrep } from '@/pages/deck/session/SessionPrep'
import { QuestionRunner } from '@/pages/deck/session/QuestionRunner'
import { SessionSummary } from '@/pages/deck/session/SessionSummary'
import { RouteRecursos } from '@/pages/deck/session/RouteRecursos'
import { RouteRefuerzo } from '@/pages/deck/session/RouteRefuerzo'
import { SrsDue } from '@/pages/deck/session/SrsDue'

import { AppShell } from '@/components/layout/AppShell'

export const router = createBrowserRouter([
  // --- Públicas ---
  { path: '/', element: <Landing /> },
  { path: '/auth/login', element: <Login /> },
  { path: '/auth/register', element: <Register /> },
  { path: '/auth/reset-password', element: <ResetPassword /> },

  // --- Dashboard global ---
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/settings', element: <Settings /> },

  // --- Deck (con sidebar) ---
  {
    path: '/deck/:deckId',
    element: <AppShell />,
    children: [
      { path: 'dashboard', element: <DeckDashboard /> },
      { path: 'documents', element: <Documents /> },
      { path: 'documents/upload', element: <Upload /> },
      { path: 'graph', element: <Graph /> },
      { path: 'wiki/*', element: <Wiki /> },
      { path: 'editor/*', element: <Editor /> },
      // Sprint 3: sesiones de estudio
      { path: 'sessions/:moduleSlug', element: <SessionPrep /> },
      { path: 'sessions/:moduleSlug/questions/:sessionId', element: <QuestionRunner /> },
      { path: 'sessions/:moduleSlug/summary/:sessionId', element: <SessionSummary /> },
      { path: 'sessions/:moduleSlug/recursos/:sessionId', element: <RouteRecursos /> },
      { path: 'sessions/:moduleSlug/refuerzo/:sessionId', element: <RouteRefuerzo /> },
      // /review apunta ahora a la cola de repasos SRS (backward compat con el nav de AppShell)
      { path: 'review', element: <SrsDue /> },
      { path: 'srs/due', element: <SrsDue /> },
      { path: 'wiki-chat', element: <LlmWiki /> },
      { path: 'modules', element: <Modules /> },
      { path: 'health', element: <Health /> },
      { path: 'schedule', element: <Schedule /> },
    ],
  },
])

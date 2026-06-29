import { create } from 'zustand'
import type { StudySession } from '@/types'

interface StudyState {
  currentSession: StudySession | null
  setCurrentSession: (session: StudySession | null) => void
}

export const useStudyStore = create<StudyState>((set) => ({
  currentSession: null,
  setCurrentSession: (session) => set({ currentSession: session }),
}))

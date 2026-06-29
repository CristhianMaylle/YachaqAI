import { create } from 'zustand'
import type { Deck, IngestJob } from '@/types'

interface DeckState {
  decks: Deck[]
  currentDeck: Deck | null
  ingestJobs: IngestJob[]
  setDecks: (decks: Deck[]) => void
  setCurrentDeck: (deck: Deck | null) => void
  addIngestJob: (job: IngestJob) => void
  updateIngestJob: (jobId: string, updates: Partial<IngestJob>) => void
}

export const useDeckStore = create<DeckState>((set) => ({
  decks: [],
  currentDeck: null,
  ingestJobs: [],
  setDecks: (decks) => set({ decks }),
  setCurrentDeck: (deck) => set({ currentDeck: deck }),
  addIngestJob: (job) => set((s) => ({ ingestJobs: [...s.ingestJobs, job] })),
  updateIngestJob: (jobId, updates) =>
    set((s) => ({
      ingestJobs: s.ingestJobs.map((j) => (j.id === jobId ? { ...j, ...updates } : j)),
    })),
}))

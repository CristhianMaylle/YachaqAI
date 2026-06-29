import { create } from 'zustand'
import { api } from '@/lib/api'
import type { LLMProvider } from '@/types'

interface LLMStore {
  providers: LLMProvider[]
  activeProvider: string | null
  activeModel: string | null
  loading: boolean
  fetchProviders: () => Promise<void>
  selectModel: (provider: string, model: string) => Promise<void>
}

export const useLLMStore = create<LLMStore>((set) => ({
  providers: [],
  activeProvider: null,
  activeModel: null,
  loading: false,
  fetchProviders: async () => {
    set({ loading: true })
    try {
      const [providers, active] = await Promise.all([
        api.llm.providers(),
        api.llm.active(),
      ])
      set({ providers, activeProvider: active.provider, activeModel: active.model })
    } finally {
      set({ loading: false })
    }
  },
  selectModel: async (provider, model) => {
    const result = await api.llm.select(provider, model)
    set({ activeProvider: result.provider, activeModel: result.model })
  },
}))

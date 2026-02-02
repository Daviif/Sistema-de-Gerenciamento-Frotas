import { create } from 'zustand'
import type { StoreApi } from 'zustand'

export type UIState = {
  dark: boolean
  setDark: (d: boolean) => void
  toggle: () => void
}

export const useUIStore = create<UIState>((set: StoreApi<UIState>['setState']) => ({  
  dark: typeof window !== 'undefined' ? (localStorage.getItem('theme') === 'dark') : false,
  setDark: (d: boolean) => {
    set(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', d ? 'dark' : 'light')
        document.documentElement.classList.toggle('dark', d)
      }
      return { dark: d }
    })
  },
  toggle: () => set((state: UIState) => {
    const nd = !state.dark
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', nd ? 'dark' : 'light')
      document.documentElement.classList.toggle('dark', nd)
    }
    return { dark: nd }
  })
}))

// initialize on module load
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('theme')
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  const dark = stored ? stored === 'dark' : prefersDark
  document.documentElement.classList.toggle('dark', dark)
}

// src/hooks/useEstatisticasGerais.ts
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { EstatisticasGerais } from '@/types'

export function useEstatisticasGerais(meses = 6) {
  return useQuery({
    queryKey: ['estatisticas-gerais', meses],
    queryFn: async () => {
      const { data } = await api.get<EstatisticasGerais>('/estatisticas/geral', {
        params: { meses }
      })
      return data
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  })
}

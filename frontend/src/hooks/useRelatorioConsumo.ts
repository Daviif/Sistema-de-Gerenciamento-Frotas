import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { RelatorioConsumoVeiculo } from '@/types/relatorios'

export function useRelatorioConsumo() {
  return useQuery<RelatorioConsumoVeiculo[]>({
    queryKey: ['relatorios', 'consumo-combustivel'],
    queryFn: async () => {
      const { data } = await api.get<RelatorioConsumoVeiculo[]>(
        '/relatorios/consumo-combustivel'
      )
      return data
    }
  })
}

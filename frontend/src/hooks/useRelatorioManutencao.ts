import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { RelatorioManutencao } from '@/types/relatorios'

export function useRelatorioManutencao() {
  return useQuery<RelatorioManutencao[]>({
    queryKey: ['relatorios', 'custos-manutencao'],
    queryFn: async () => {
      const { data } = await api.get<RelatorioManutencao[]>(
        '/relatorios/custos-manutencao'
      )
      return data
    }
  })
}

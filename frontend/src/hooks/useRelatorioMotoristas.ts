
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { RelatorioMotorista } from '@/types/relatorios'

export function useRelatorioMotoristas() {
  return useQuery<RelatorioMotorista[]>({
    queryKey: ['relatorios', 'desempenho-motoristas'],
    queryFn: async () => {
      const { data } = await api.get<RelatorioMotorista[]>(
        '/relatorios/desempenho-motoristas'
      )
      return data
    }
  })
}

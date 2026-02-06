import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { RelatorioOverview, VeiculoCompleto, MotoristaCompleto,
    EficienciaCombustivel, ManutencaoCritica, RotaAnalise,
    CustoBeneficio, EventoTimeline, ComparativoMensal
 } from '@/types/relatorio'

export function useRelatorioOverview(meses = 6) {
  return useQuery({
    queryKey: ['relatorios', 'overview', meses],
    queryFn: async () => {
      const { data } = await api.get<RelatorioOverview>('/relatorios/overview', {
        params: { meses }
      })
      return data
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  })
}

export function useRelatorioFrotaCompleto(meses = 6) {
  return useQuery({
    queryKey: ['relatorios', 'frota-completo', meses],
    queryFn: async () => {
      const { data } = await api.get<VeiculoCompleto[]>('/relatorios/frota-completo', {
        params: { meses }
      })
      return data
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useRelatorioMotoristasCompleto(meses = 6) {
  return useQuery({
    queryKey: ['relatorios', 'motoristas-completo', meses],
    queryFn: async () => {
      const { data } = await api.get<MotoristaCompleto[]>('/relatorios/motoristas-completo', {
        params: { meses }
      })
      return data
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useRelatorioEficienciaCombustivel(meses = 6, tipo_combustivel?: string) {
  return useQuery({
    queryKey: ['relatorios', 'eficiencia-combustivel', meses, tipo_combustivel],
    queryFn: async () => {
      const { data } = await api.get<EficienciaCombustivel[]>('/relatorios/eficiencia-combustivel', {
        params: { meses, tipo_combustivel }
      })
      return data
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useRelatorioManutencaoCritica(meses = 6) {
  return useQuery({
    queryKey: ['relatorios', 'manutencao-critica', meses],
    queryFn: async () => {
      const { data } = await api.get<ManutencaoCritica[]>('/relatorios/manutencao-critica', {
        params: { meses }
      })
      return data
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useRelatorioRotasAnalise(meses = 6) {
  return useQuery({
    queryKey: ['relatorios', 'rotas-analise', meses],
    queryFn: async () => {
      const { data } = await api.get<RotaAnalise[]>('/relatorios/rotas-analise', {
        params: { meses }
      })
      return data
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useRelatorioCustoBeneficio(meses = 6) {
  return useQuery({
    queryKey: ['relatorios', 'custo-beneficio', meses],
    queryFn: async () => {
      const { data } = await api.get<CustoBeneficio[]>('/relatorios/custo-beneficio', {
        params: { meses }
      })
      return data
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useRelatorioTimeline(meses = 6, limit = 100) {
  return useQuery({
    queryKey: ['relatorios', 'timeline', meses, limit],
    queryFn: async () => {
      const { data } = await api.get<EventoTimeline[]>('/relatorios/timeline', {
        params: { meses, limit }
      })
      return data
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useRelatorioComparativoMensal(meses = 12) {
  return useQuery({
    queryKey: ['relatorios', 'comparativo-mensal', meses],
    queryFn: async () => {
      const { data } = await api.get<ComparativoMensal[]>('/relatorios/comparativo-mensal', {
        params: { meses }
      })
      return data
    },
    staleTime: 2 * 60 * 1000,
  })
}
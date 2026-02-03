// src/hooks/useStats.ts
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { DashboardStats, Driver } from '@/types'

async function fetchStats(): Promise<DashboardStats> {
  const [vehicles, drivers, trips, maintenance, estatisticas] = await Promise.all([
    api.get('/veiculos'),
    api.get('/motoristas'),
    api.get('/viagens/em-andamento'),
    api.get('/manutencao/pendentes/lista'),
    api.get('/estatisticas/geral', { params: { meses: 6 } }).catch(() => ({ data: null }))
  ])

  const eg = estatisticas.data as DashboardStats['estatisticasGerais'] | null
  const monthlyExpenses = eg?.por_mes?.map(m => ({ name: m.mes_nome, value: m.custo_total })) ?? []
  const kmTraveled = eg?.por_mes?.map(m => ({ name: m.mes_nome, value: m.km })) ?? []

  return {
    totalVehicles: vehicles.data.length,
    activeDrivers: drivers.data.filter((d: Driver) => d.status === 'ativo').length,
    tripsInProgress: trips.data.length,
    maintenancePending: maintenance.data.length,
    monthlyExpenses,
    kmTraveled,
    estatisticasGerais: eg ?? undefined,
  }
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
    staleTime: 1 * 60 * 1000, // 1 minuto
  })
}
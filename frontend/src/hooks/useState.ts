// src/hooks/useStats.ts
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { DashboardStats } from '@/types'

async function fetchStats(): Promise<DashboardStats> {
  // Buscar dados de múltiplos endpoints
  const [vehicles, drivers, trips, maintenance] = await Promise.all([
    api.get('/veiculos'),
    api.get('/motoristas'),
    api.get('/viagens/em-andamento'),
    api.get('/manutencao/pendentes/lista')
  ])

  // Buscar estatísticas de viagens
  const tripsStats = await api.get('/viagens/estatisticas/geral', {
    params: { meses: 6 }
  })

  return {
    totalVehicles: vehicles.data.length,
    activeDrivers: drivers.data.filter((d: any) => d.status === 'ativo').length,
    tripsInProgress: trips.data.length,
    maintenancePending: maintenance.data.length,
    
    // Mock data para gráficos - em produção, vir da API
    monthlyExpenses: [
      { name: 'Jan', value: 12000 },
      { name: 'Fev', value: 15000 },
      { name: 'Mar', value: 13500 },
      { name: 'Abr', value: 18000 },
      { name: 'Mai', value: 16000 },
      { name: 'Jun', value: 19000 },
    ],
    
    kmTraveled: [
      { name: 'Jan', value: 45000 },
      { name: 'Fev', value: 52000 },
      { name: 'Mar', value: 48000 },
      { name: 'Abr', value: 61000 },
      { name: 'Mai', value: 55000 },
      { name: 'Jun', value: 67000 },
    ]
  }
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
    staleTime: 1 * 60 * 1000, // 1 minuto
  })
}
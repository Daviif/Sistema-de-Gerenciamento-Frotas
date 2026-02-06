// src/components/dashboard/DashboardView.tsx
import { useMemo } from 'react' 
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ComposedChart } from 'recharts'
import { AlertTriangle, CheckCircle, Clock, AlertOctagon, Truck, Users, LucideIcon, Fuel, Wrench, DollarSign, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useStats } from '@/hooks/useStats'
import Loading from '@/components/ui/loading'
import { useDrivers } from '@/hooks/useMotorista'
import { useVehicles } from '@/hooks/useVeiculos'
import { Driver, Vehicle, VehicleStatus } from '@/types'

function formatCurrency(val: number): string {
  if (val === undefined || val === null || isNaN(val)) return 'R$ 0'
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function formatKm(val: number): string {
  if (val === undefined || val === null || isNaN(val)) return '0'
  return val.toLocaleString('pt-BR') + ' km'
}

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color: 'blue' | 'green' | 'amber' | 'red'
}
export default function DashboardView() {
  const { data: stats, isLoading: statsLoading } = useStats()
  const { data: drivers } = useDrivers()
  const { data: vehicles } = useVehicles()

  const alerts = useMemo(() => {
    if (!drivers || !vehicles) return { drivers: [], vehicles: [] }

    const expiringDrivers = drivers.filter((d: Driver) => { // MUDANÇA: Tipagem explícita
      const expiry = new Date(d.validade_cnh)
      const today = new Date()
      const threeMonths = new Date()
      threeMonths.setMonth(today.getMonth() + 3)
      return expiry < threeMonths && expiry > today
    })

    const maintenanceVehicles = vehicles.filter((v: Vehicle) => // MUDANÇA: Tipagem explícita
      v.km_atual > 100000 && v.status !== VehicleStatus.MAINTENANCE
    )

    return { drivers: expiringDrivers, vehicles: maintenanceVehicles }
  }, [drivers, vehicles])

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loading />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral da frota</p>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total de Veículos" 
          value={stats?.totalVehicles || 0} 
          icon={Truck} 
          color="blue" 
        />
        <StatCard 
          title="Motoristas Ativos" 
          value={stats?.activeDrivers || 0} 
          icon={Users} 
          color="green" 
        />
        <StatCard 
          title="Viagens em Andamento" 
          value={stats?.tripsInProgress || 0} 
          icon={Clock} 
          color="amber" 
        />
        <StatCard 
          title="Manutenções Pendentes" 
          value={stats?.maintenancePending || 0} 
          icon={AlertTriangle} 
          color="red" 
        />
      </div>

      {/* Estatísticas de Custos (dados cruzados) */}
      {stats?.estatisticasGerais && (
        <>
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-1">Estatísticas de Custos</h2>
            <p className="text-sm text-muted-foreground">Custos operacionais dos últimos {stats.estatisticasGerais.periodo_meses} meses</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              title="Custo Combustível"
              value={formatCurrency(stats.estatisticasGerais.resumo.custo_total_combustivel)}
              icon={Fuel}
              color="blue"
            />
            <StatCard
              title="Custo Manutenção"
              value={formatCurrency(stats.estatisticasGerais.resumo.custo_total_manutencao)}
              icon={Wrench}
              color="amber"
            />
            <StatCard
              title="Custo Total"
              value={formatCurrency(stats.estatisticasGerais.resumo.custo_total_operacional)}
              icon={DollarSign}
              color="red"
            />
            <StatCard
              title="KM Rodados"
              value={formatKm(stats.estatisticasGerais.resumo.km_total)}
              icon={TrendingUp}
              color="green"
            />
            <StatCard
              title="Custo por KM"
              value={formatCurrency(stats.estatisticasGerais.resumo.custo_por_km)}
              icon={DollarSign}
              color="blue"
            />
          </div>
        </>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Monthly Expenses Chart - Combustível + Manutenção */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Custos Operacionais (Combustível & Manutenção)</CardTitle>
            <p className="text-sm text-muted-foreground">Dados reais por mês</p>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={stats?.estatisticasGerais?.por_mes?.length ? stats.estatisticasGerais.por_mes : (stats?.monthlyExpenses?.map(m => ({ mes_nome: m.name, combustivel: m.value, manutencao: 0, custo_total: m.value })) || [])}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mes_nome" />
                  <YAxis tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="combustivel" name="Combustível" fill="#3b82f6" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="manutencao" name="Manutenção" fill="#f59e0b" stackId="a" radius={[4, 4, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Alerts Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertOctagon className="w-5 h-5 text-danger mr-2" />
              Alertas Críticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.drivers.length > 0 && (
                <div className="p-3 bg-danger-50 border border-danger rounded-lg">
                  <p className="text-sm font-semibold text-danger">
                    Motoristas - Vencimento CNH
                  </p>
                  <ul className="mt-1 text-sm text-danger">
                    {alerts.drivers.map(d => (
                      <li key={d.cpf}>
                        • {d.nome} ({d.validade_cnh ? new Date(d.validade_cnh).toLocaleDateString('pt-BR') : '-'})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {alerts.vehicles.length > 0 && (
                <div className="p-3 status-warning rounded-lg">
                  <p className="text-sm font-semibold" style={{ color: 'hsl(var(--warning))' }}>
                    Veículos - Alta Quilometragem
                  </p>
                  <ul className="mt-1 text-sm" style={{ color: 'hsl(var(--warning))' }}>
                    {alerts.vehicles.slice(0, 3).map(v => (
                      <li key={v.id_veiculo}>
                        • {v.modelo} {(v.km_atual !== undefined && v.km_atual !== null) ? `(${v.km_atual.toLocaleString('pt-BR')} km)` : '(-)'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {alerts.drivers.length === 0 && alerts.vehicles.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>Todos os sistemas normais</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KM Traveled Chart */}
      <Card>
        <CardHeader>
          <CardTitle>KM Percorridos por Mês</CardTitle>
          <p className="text-sm text-muted-foreground">Baseado em viagens finalizadas</p>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.estatisticasGerais?.por_mes?.map(m => ({ name: m.mes_nome, value: m.km })) || stats?.kmTraveled || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// StatCard Component
function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color 
}: StatCardProps) {
  
  const colorClasses: Record<string, string> = {
    blue: 'bg-primary/10 text-primary',
    green: 'status-success',
    amber: 'status-warning',
    red: 'status-danger',
  }

  return (
    <Card>
      <CardContent className="p-6 flex items-center">
        <div className={`p-3 rounded-lg mr-4 ${colorClasses[color]}`}>
          <Icon className="w-6 h-6 text-current" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h4 className="text-2xl font-bold text-foreground">{value}</h4>
        </div>
      </CardContent>
    </Card>
  )
}
// src/components/dashboard/DashboardView.tsx
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { AlertTriangle, CheckCircle, Clock, TrendingUp, AlertOctagon, Truck, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useStats } from '@/hooks/useStats'
import { useDrivers } from '@/hooks/useDrivers'
import { useVehicles } from '@/hooks/useVehicles'
import { Driver, Vehicle, VehicleStatus } from '@/types'

export default function DashboardView() {
  const { data: stats, isLoading: statsLoading } = useStats()
  const { data: drivers } = useDrivers()
  const { data: vehicles } = useVehicles()
  
  const [alerts, setAlerts] = useState<{drivers: Driver[], vehicles: Vehicle[]}>({
    drivers: [], 
    vehicles: []
  })

  useEffect(() => {
    if (drivers && vehicles) {
      // Filter drivers with CNH expiring in 3 months
      const expiringDrivers = drivers.filter(d => {
        const expiry = new Date(d.validade_cnh)
        const today = new Date()
        const threeMonths = new Date()
        threeMonths.setMonth(today.getMonth() + 3)
        return expiry < threeMonths && expiry > today
      })

      // Filter vehicles with high mileage
      const maintenanceVehicles = vehicles.filter(v => 
        v.km_atual > 100000 && v.status !== VehicleStatus.MAINTENANCE
      )

      setAlerts({ drivers: expiringDrivers, vehicles: maintenanceVehicles })
    }
  }, [drivers, vehicles])

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Monthly Expenses Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Custos Operacionais (Combustível & Manutenção)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.monthlyExpenses || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Alerts Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertOctagon className="w-5 h-5 text-red-500 mr-2" />
              Alertas Críticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.drivers.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                  <p className="text-sm font-semibold text-red-800">
                    Motoristas - Vencimento CNH
                  </p>
                  <ul className="mt-1 text-sm text-red-600">
                    {alerts.drivers.map(d => (
                      <li key={d.cpf}>
                        • {d.nome} ({new Date(d.validade_cnh).toLocaleDateString('pt-BR')})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {alerts.vehicles.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                  <p className="text-sm font-semibold text-amber-800">
                    Veículos - Alta Quilometragem
                  </p>
                  <ul className="mt-1 text-sm text-amber-600">
                    {alerts.vehicles.slice(0, 3).map(v => (
                      <li key={v.id_veiculo}>
                        • {v.modelo} ({v.km_atual.toLocaleString('pt-BR')} km)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {alerts.drivers.length === 0 && alerts.vehicles.length === 0 && (
                <div className="text-center py-8 text-slate-400">
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
          <CardTitle>Total de KM Percorridos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.kmTraveled || []}>
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
}: { 
  title: string
  value: string | number
  icon: any
  color: string 
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  }

  return (
    <Card>
      <CardContent className="p-6 flex items-center">
        <div className={`p-3 rounded-lg mr-4 ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h4 className="text-2xl font-bold text-slate-900">{value}</h4>
        </div>
      </CardContent>
    </Card>
  )
}
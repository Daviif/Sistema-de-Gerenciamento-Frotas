// src/components/relatorios/RelatorioOverview.tsx
import { Truck, Users, MapPin, DollarSign, TrendingUp, Fuel, Wrench, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import Loading from '@/components/ui/loading'
import { useRelatorioOverview } from '@/hooks/useRelatorios'

function formatCurrency(val: number | null | undefined): string {
  if (val === undefined || val === null) return '-'
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function formatNumber(val: number | null | undefined): string {
  if (val === undefined || val === null) return '-'
  return val.toLocaleString('pt-BR')
}

interface Props {
  meses: number
}

export default function RelatorioOverview({ meses }: Props) {
  const { data: overview, isLoading } = useRelatorioOverview(meses)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading />
      </div>
    )
  }

  if (!overview) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhum dado disponível</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Frota */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Truck className="w-5 h-5 text-primary" />
          Frota
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total de Veículos"
            value={overview.frota.total_veiculos}
            icon={Truck}
            color="blue"
          />
          <StatCard
            label="Veículos Ativos"
            value={overview.frota.veiculos_ativos}
            icon={TrendingUp}
            color="green"
          />
          <StatCard
            label="Em Viagem"
            value={overview.frota.veiculos_em_viagem}
            icon={MapPin}
            color="blue"
          />
          <StatCard
            label="Em Manutenção"
            value={overview.frota.veiculos_manutencao}
            icon={Wrench}
            color="amber"
          />
        </div>
      </div>

      {/* Motoristas */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Motoristas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Total de Motoristas"
            value={overview.motoristas.total_motoristas}
            icon={Users}
            color="blue"
          />
          <StatCard
            label="Motoristas Ativos"
            value={overview.motoristas.motoristas_ativos}
            icon={TrendingUp}
            color="green"
          />
          <StatCard
            label="Em Viagem"
            value={overview.motoristas.motoristas_em_viagem}
            icon={Clock}
            color="blue"
          />
        </div>
      </div>

      {/* Viagens */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Viagens (últimos {meses} meses)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            label="Total de Viagens"
            value={overview.viagens.total_viagens}
            icon={MapPin}
            color="blue"
          />
          <StatCard
            label="Em Andamento"
            value={overview.viagens.viagens_em_andamento}
            icon={Clock}
            color="blue"
          />
          <StatCard
            label="Finalizadas"
            value={overview.viagens.viagens_finalizadas}
            icon={TrendingUp}
            color="green"
          />
          <StatCard
            label="Canceladas"
            value={overview.viagens.viagens_canceladas}
            icon={Wrench}
            color="red"
          />
          <StatCard
            label="KM Total"
            value={formatNumber(overview.viagens.km_total_percorrido)}
            icon={TrendingUp}
            color="blue"
            suffix=" km"
          />
        </div>
      </div>

      {/* Custos */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          Custos Operacionais (últimos {meses} meses)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Combustível"
            value={formatCurrency(overview.custos.custo_total_combustivel)}
            icon={Fuel}
            color="blue"
          />
          <StatCard
            label="Manutenção"
            value={formatCurrency(overview.custos.custo_total_manutencao)}
            icon={Wrench}
            color="amber"
          />
          <StatCard
            label="Total Operacional"
            value={formatCurrency(overview.custos.custo_operacional_total)}
            icon={DollarSign}
            color="red"
          />
        </div>
      </div>

      {/* Outros */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Outros</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard
            label="Total de Cidades"
            value={overview.cidades.total_cidades}
            icon={MapPin}
            color="blue"
          />
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  color: 'blue' | 'green' | 'amber' | 'red'
  suffix?: string
}

function StatCard({ label, value, icon: Icon, color, suffix }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-primary/10 text-primary',
    green: 'status-success',
    amber: 'status-warning',
    red: 'status-danger',
  }

  return (
    <Card>
      <CardContent className="p-6 flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6 text-current" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <h4 className="text-2xl font-bold text-foreground">{value}{suffix ? ` ${suffix}` : ''}</h4>
        </div>
      </CardContent>
    </Card>
  )
}
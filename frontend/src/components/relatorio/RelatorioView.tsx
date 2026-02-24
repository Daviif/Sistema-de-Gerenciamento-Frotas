// src/components/relatorios/RelatoriosView.tsx
import { useState } from 'react'
import { FileText, TrendingUp, Users, Fuel, Wrench, DollarSign, Clock, BarChart3 } from 'lucide-react'
import { Card   } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import RelatorioOverview from './RelatorioOverview'
import RelatorioFrota from './RelatorioFrota'
import RelatorioMotoristas from './RelatorioMotoristas'
import RelatorioEficienciaCombustivel from './RelatorioEficienciaCombustivel'
import RelatorioManutencao from './RelatorioManutencao'
import RelatorioCustoBeneficio from './RelatorioCustoBeneficio'
import RelatorioTimeline from './RelatorioTimeline'
import RelatorioComparativo from './RelatorioComparativo'

type RelatorioTab = 
  | 'overview'
  | 'frota'
  | 'motoristas'
  | 'combustivel'
  | 'manutencao'
  | 'custo-beneficio'
  | 'timeline'
  | 'comparativo'

interface TabConfig {
  id: RelatorioTab
  label: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  description: string
}

const TABS: TabConfig[] = [
  {
    id: 'overview',
    label: 'Visão Geral',
    icon: FileText,
    description: 'Resumo geral do sistema'
  },
  {
    id: 'frota',
    label: 'Frota',
    icon: TrendingUp,
    description: 'Análise detalhada por veículo'
  },
  {
    id: 'motoristas',
    label: 'Motoristas',
    icon: Users,
    description: 'Performance dos motoristas'
  },
  {
    id: 'combustivel',
    label: 'Combustível',
    icon: Fuel,
    description: 'Eficiência de combustível'
  },
  {
    id: 'manutencao',
    label: 'Manutenção',
    icon: Wrench,
    description: 'Alertas de manutenção'
  },
  {
    id: 'custo-beneficio',
    label: 'Custo-Benefício',
    icon: DollarSign,
    description: 'Eficiência operacional'
  },
  {
    id: 'timeline',
    label: 'Timeline',
    icon: Clock,
    description: 'Linha do tempo de eventos'
  },
  {
    id: 'comparativo',
    label: 'Comparativo',
    icon: BarChart3,
    description: 'Comparação mensal'
  }
]

export default function RelatoriosView() {
  const [activeTab, setActiveTab] = useState<RelatorioTab>('overview')
  const [periodoMeses, setPeriodoMeses] = useState<number>(6)

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <RelatorioOverview meses={periodoMeses} />
      case 'frota':
        return <RelatorioFrota meses={periodoMeses} />
      case 'motoristas':
        return <RelatorioMotoristas meses={periodoMeses} />
      case 'combustivel':
        return <RelatorioEficienciaCombustivel meses={periodoMeses} />
      case 'manutencao':
        return <RelatorioManutencao meses={periodoMeses} />
      case 'custo-beneficio':
        return <RelatorioCustoBeneficio meses={periodoMeses} />
      case 'timeline':
        return <RelatorioTimeline meses={periodoMeses} />
      case 'comparativo':
        return <RelatorioComparativo meses={periodoMeses} />
      default:
        return <RelatorioOverview meses={periodoMeses} />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground mt-1">
            Análises e insights da frota
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Período:</span>
          <Select
            value={String(periodoMeses)}
            onValueChange={(v) => setPeriodoMeses(Number(v))}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 mês</SelectItem>
              <SelectItem value="3">3 meses</SelectItem>
              <SelectItem value="6">6 meses</SelectItem>
              <SelectItem value="12">12 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Card className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex flex-col items-center gap-2 p-4 rounded-lg transition-all
                  ${isActive 
                    ? 'bg-primary/10 text-primary border-2 border-primary' 
                    : 'bg-muted/30 hover:bg-muted/50 border-2 border-transparent'
                  }
                `}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="text-center">
                  <p className={`text-sm font-semibold ${isActive ? 'text-primary' : 'text-foreground'}`}>
                    {tab.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tab.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Content */}
      <div className="pb-8">
        {renderContent()}
      </div>
    </div>
  )
}
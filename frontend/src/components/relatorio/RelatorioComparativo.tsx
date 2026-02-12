import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import Loading from '@/components/ui/loading'
import { useRelatorioComparativoMensal } from '@/hooks/useRelatorios'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

function formatCurrency(val: number | null | undefined): string {
  if (val === undefined || val === null) return '-'
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

interface Props {
  meses: number
}

export default function RelatorioComparativo({ meses }: Props) {
  const { data: comparativo, isLoading } = useRelatorioComparativoMensal(meses)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading />
      </div>
    )
  }

  if (!comparativo || comparativo.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhum dado disponível</p>
      </div>
    )
  }

  const getTendenciaIcon = (tendencia: string | undefined | null) => {
    if (!tendencia) return <Minus className="w-4 h-4 text-muted-foreground" />
    switch (tendencia.toLowerCase()) {
      case 'crescimento':
        return <TrendingUp className="w-4 h-4 text-success" />
      case 'queda':
        return <TrendingDown className="w-4 h-4 text-danger" />
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getTendenciaColor = (tendencia: string | undefined | null) => {
    if (!tendencia) return 'bg-muted text-muted-foreground'
    switch (tendencia.toLowerCase()) {
      case 'crescimento':
        return 'status-success'
      case 'queda':
        return 'status-danger'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  // Dados para o gráfico
  const chartData = comparativo.map(m => ({
    mes: m.mes_nome,
    Viagens: m.total_viagens,
    Combustível: m.custo_combustivel,
    Manutenção: m.custo_manutencao,
    KM: m.km_rodados
  }))

  return (
    <div className="space-y-6">
      {/* Gráfico de Tendências */}
      <Card>
        <CardHeader>
          <CardTitle>Tendências Mensais</CardTitle>
          <p className="text-sm text-muted-foreground">Evolução de viagens e custos ao longo dos meses</p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mes" />
                <YAxis yAxisId="left" tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value: any, name?: string) => {
                    if (name === 'Viagens' || name === 'KM') return value !== undefined && value !== null ? Number(value).toLocaleString('pt-BR') : '-'
                    return formatCurrency(value)
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="Combustível" fill="#3b82f6" stackId="a" />
                <Bar yAxisId="left" dataKey="Manutenção" fill="#f59e0b" stackId="a" />
                <Line yAxisId="right" type="monotone" dataKey="Viagens" stroke="#10b981" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle>Comparativo Mensal Detalhado - Últimos {meses} meses</CardTitle>
          <p className="text-sm text-muted-foreground">Análise mês a mês com indicadores de tendência</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead className="text-center">Viagens</TableHead>
                  <TableHead className="text-center">Tendência</TableHead>
                  <TableHead className="text-right">KM Rodados</TableHead>
                  <TableHead className="text-right">Combustível</TableHead>
                  <TableHead className="text-right">Manutenção</TableHead>
                  <TableHead className="text-right">Custo Total</TableHead>
                  <TableHead className="text-center">Tendência Custos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparativo.map((mes) => (
                  <TableRow key={mes.mes}>
                    <TableCell className="font-medium">{mes.mes_nome}</TableCell>
                    <TableCell className="text-center">{mes.total_viagens}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {getTendenciaIcon(mes.tendencia_viagens)}
                        <Badge variant="outline" className={getTendenciaColor(mes.tendencia_viagens)}>
                          {mes.tendencia_viagens}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{mes.km_rodados !== undefined && mes.km_rodados !== null ? `${mes.km_rodados.toLocaleString('pt-BR')} km` : '-'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(mes.custo_combustivel)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(mes.custo_manutencao)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(mes.custo_total)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {getTendenciaIcon(mes.tendencia_custos)}
                        <Badge variant="outline" className={getTendenciaColor(mes.tendencia_custos)}>
                          {mes.tendencia_custos}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total de Viagens</p>
            <p className="text-2xl font-bold">
              {comparativo.reduce((acc, m) => acc + m.total_viagens, 0).toLocaleString('pt-BR')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total KM</p>
            <p className="text-2xl font-bold">
              {comparativo.reduce((acc, m) => acc + m.km_rodados, 0).toLocaleString('pt-BR')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Combustível</p>
            <p className="text-2xl font-bold">
              {formatCurrency(comparativo.reduce((acc, m) => acc + m.custo_combustivel, 0))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Manutenção</p>
            <p className="text-2xl font-bold">
              {formatCurrency(comparativo.reduce((acc, m) => acc + m.custo_manutencao, 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Legenda */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-semibold mb-2">Indicadores de Tendência</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-success" />
                <span className="text-muted-foreground">Crescimento - Aumento em relação ao mês anterior</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-danger" />
                <span className="text-muted-foreground">Queda - Redução em relação ao mês anterior</span>
              </div>
              <div className="flex items-center gap-2">
                <Minus className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Estável - Sem mudança significativa</span>
              </div>
            </div>
          </div>
          <div>
            <p className="font-semibold mb-2">Análise</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Viagens: Aumento indica maior demanda</li>
              <li>• Custos crescentes: Atenção à eficiência</li>
              <li>• Custos em queda: Possível economia</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
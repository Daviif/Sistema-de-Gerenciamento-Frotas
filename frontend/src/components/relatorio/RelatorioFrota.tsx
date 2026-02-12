// src/components/relatorios/RelatorioFrota.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Loading from '@/components/ui/loading'
import { useRelatorioFrotaCompleto } from '@/hooks/useRelatorios'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

function formatCurrency(val: number | null | undefined): string {
  if (val === undefined || val === null) return '-'
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
}

function formatNumber(val: number | null | undefined): string {
  if (val === undefined || val === null) return '-'
  return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

interface Props {
  meses: number
}

export default function RelatorioFrota({ meses }: Props) {
  const { data: frota, isLoading } = useRelatorioFrotaCompleto(meses)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading />
      </div>
    )
  }

  if (!frota || frota.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhum dado disponível</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Análise Completa da Frota - Últimos {meses} meses</CardTitle>
          <p className="text-sm text-muted-foreground">
            Dados detalhados de viagens, combustível, manutenção e métricas calculadas
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Veículo</TableHead>
                  <TableHead className="text-center">Viagens</TableHead>
                  <TableHead className="text-center">Abast.</TableHead>
                  <TableHead className="text-right">Litros</TableHead>
                  <TableHead className="text-right">Custo Comb.</TableHead>
                  <TableHead className="text-right">Custo Manut.</TableHead>
                  <TableHead className="text-right">KM Rodados</TableHead>
                  <TableHead className="text-right">Custo/KM</TableHead>
                  <TableHead className="text-right">Consumo (km/L)</TableHead>
                  <TableHead className="text-right">KM/Abast.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {frota.map((veiculo) => (
                  <TableRow key={veiculo.id_veiculo}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{veiculo.placa}</p>
                        <p className="text-xs text-muted-foreground">{veiculo.modelo}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{veiculo.total_viagens}</TableCell>
                    <TableCell className="text-center">{veiculo.total_abastecimentos}</TableCell>
                    <TableCell className="text-right">{formatNumber(veiculo.total_litros)} L</TableCell>
                    <TableCell className="text-right">{formatCurrency(veiculo.custo_combustivel)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(veiculo.custo_manutencao)}</TableCell>
                    <TableCell className="text-right">{formatNumber(veiculo.km_rodados)} km</TableCell>
                    <TableCell className="text-right">
                      <span className={veiculo.custo_por_km > 2 ? 'text-danger' : veiculo.custo_por_km > 1 ? 'text-warning' : 'text-success'}>
                        {formatCurrency(veiculo.custo_por_km)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {veiculo.consumo_medio_km_l >= 10 ? (
                          <TrendingUp className="w-4 h-4 text-success" />
                        ) : veiculo.consumo_medio_km_l < 6 ? (
                          <TrendingDown className="w-4 h-4 text-danger" />
                        ) : (
                          <Minus className="w-4 h-4 text-warning" />
                        )}
                        <span>{formatNumber(veiculo.consumo_medio_km_l)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(veiculo.km_por_abastecimento)} km</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Legenda */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-semibold mb-2">Consumo (km/L)</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-success" />
                <span className="text-muted-foreground">≥ 10 km/L - Excelente</span>
              </div>
              <div className="flex items-center gap-2">
                <Minus className="w-4 h-4 text-warning" />
                <span className="text-muted-foreground">6-10 km/L - Bom/Regular</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-danger" />
                <span className="text-muted-foreground">&lt; 6 km/L - Ruim</span>
              </div>
            </div>
          </div>
          <div>
            <p className="font-semibold mb-2">Custo por KM</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-success"></span>
                <span className="text-muted-foreground">&lt; R$ 1,00 - Econômico</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-warning"></span>
                <span className="text-muted-foreground">R$ 1,00-2,00 - Moderado</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-danger"></span>
                <span className="text-muted-foreground">&gt; R$ 2,00 - Alto</span>
              </div>
            </div>
          </div>
          <div>
            <p className="font-semibold mb-2">Métricas</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• KM/Abast.: Média de KM entre abastecimentos</li>
              <li>• Consumo: KM rodados ÷ Total de litros</li>
              <li>• Custo/KM: Custos totais ÷ KM rodados</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
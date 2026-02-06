// src/components/relatorios/RelatorioEficienciaCombustivel.tsx
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import Loading from '@/components/ui/loading'
import { useRelatorioEficienciaCombustivel } from '@/hooks/useRelatorios'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

function formatCurrency(val: number): string {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
}

function formatNumber(val: number): string {
  return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

interface Props {
  meses: number
}

const FUEL_TYPES = ['gasolina', 'etanol', 'diesel', 'gnv', 'flex']
const FUEL_LABELS: Record<string, string> = {
  gasolina: 'Gasolina',
  etanol: 'Etanol',
  diesel: 'Diesel',
  gnv: 'GNV',
  flex: 'Flex',
}

export default function RelatorioEficienciaCombustivel({ meses }: Props) {
  const [tipoCombustivel, setTipoCombustivel] = useState<string>('')
  const { data: eficiencia, isLoading } = useRelatorioEficienciaCombustivel(meses, tipoCombustivel)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading />
      </div>
    )
  }

  if (!eficiencia || eficiencia.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhum dado disponível</p>
      </div>
    )
  }

  const getClassificacaoColor = (classificacao: string) => {
    switch (classificacao.toLowerCase()) {
      case 'excelente':
        return 'status-success'
      case 'bom':
        return 'bg-primary/10 text-primary'
      case 'regular':
        return 'status-warning'
      case 'ruim':
        return 'status-danger'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getConsumoIcon = (consumo: number) => {
    if (consumo >= 10) return <TrendingUp className="w-4 h-4 text-success" />
    if (consumo < 6) return <TrendingDown className="w-4 h-4 text-danger" />
    return <Minus className="w-4 h-4 text-warning" />
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Eficiência de Combustível - Últimos {meses} meses</CardTitle>
              <p className="text-sm text-muted-foreground">Consumo médio e custos por veículo</p>
            </div>
            <Select value={tipoCombustivel} onValueChange={setTipoCombustivel}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {FUEL_TYPES.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {FUEL_LABELS[tipo]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Veículo</TableHead>
                  <TableHead className="text-center">Classificação</TableHead>
                  <TableHead className="text-right">Consumo (km/L)</TableHead>
                  <TableHead className="text-right">L/100km</TableHead>
                  <TableHead className="text-center">Abastecimentos</TableHead>
                  <TableHead className="text-right">Total Litros</TableHead>
                  <TableHead className="text-right">Custo Total</TableHead>
                  <TableHead className="text-right">Custo/KM</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eficiencia.map((veiculo) => (
                  <TableRow key={veiculo.id_veiculo}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{veiculo.placa}</p>
                        <p className="text-xs text-muted-foreground">{veiculo.modelo}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={getClassificacaoColor(veiculo.classificacao)}>
                        {veiculo.classificacao}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {getConsumoIcon(veiculo.consumo_medio_km_l)}
                        <span>{formatNumber(veiculo.consumo_medio_km_l)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(veiculo.litros_por_100km)}</TableCell>
                    <TableCell className="text-center">{veiculo.total_abastecimentos}</TableCell>
                    <TableCell className="text-right">{formatNumber(veiculo.total_litros)} L</TableCell>
                    <TableCell className="text-right">{formatCurrency(veiculo.custo_total)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(veiculo.custo_por_km)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Legenda */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-semibold mb-2">Classificação de Consumo</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-success"></span>
                <span className="text-muted-foreground">Excelente: ≥ 10 km/L</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary"></span>
                <span className="text-muted-foreground">Bom: 8-10 km/L</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-warning"></span>
                <span className="text-muted-foreground">Regular: 6-8 km/L</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-danger"></span>
                <span className="text-muted-foreground">Ruim: &lt; 6 km/L</span>
              </div>
            </div>
          </div>
          <div>
            <p className="font-semibold mb-2">Métricas</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• km/L: Quilômetros por litro</li>
              <li>• L/100km: Litros consumidos a cada 100km</li>
              <li>• Custo/KM: Custo de combustível por quilômetro</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Loading from '@/components/ui/loading'
import { useRelatorioCustoBeneficio } from '@/hooks/useRelatorios'

function formatCurrency(val: number | null | undefined): string {
  if (val === undefined || val === null) return '-'
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
}

interface Props {
  meses: number
}

export default function RelatorioCustoBeneficio({ meses }: Props) {
  const { data: veiculos, isLoading } = useRelatorioCustoBeneficio(meses)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading />
      </div>
    )
  }

  if (!veiculos || veiculos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhum dado disponível</p>
      </div>
    )
  }

  const maisEficientes = [...veiculos].sort((a, b) => a.custo_por_km - b.custo_por_km).slice(0, 3)
  const subutilizados = veiculos.filter(v => v.taxa_utilizacao < 30)

  const getEficienciaColor = (eficiencia: string | undefined | null) => {
    if (!eficiencia) return 'bg-muted text-muted-foreground'
    switch (eficiencia.toLowerCase()) {
      case 'excelente':
        return 'status-success'
      case 'bom':
        return 'bg-primary/10 text-primary'
      case 'regular':
        return 'status-warning'
      case 'baixo':
        return 'status-danger'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="space-y-6">
      {/* Destaques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-success">Veículos Mais Eficientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {maisEficientes.map((veiculo, idx) => (
                <div key={veiculo.id_veiculo} className="flex items-center justify-between p-3 bg-success-50 rounded-lg border border-success/20">
                  <div>
                    <p className="font-medium">#{idx + 1} {veiculo.placa} - {veiculo.modelo}</p>
                    <p className="text-sm text-muted-foreground">Custo/KM: {formatCurrency(veiculo.custo_por_km)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {subutilizados.length > 0 && (
          <Card className="border-warning/30">
            <CardHeader>
              <CardTitle className="text-warning">Veículos Subutilizados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {subutilizados.map((veiculo) => (
                  <div key={veiculo.id_veiculo} className="flex items-center justify-between p-3 bg-warning-50 rounded-lg border border-warning/20">
                    <div>
                      <p className="font-medium">{veiculo.placa} - {veiculo.modelo}</p>
                      <p className="text-sm text-muted-foreground">Taxa utilização: {veiculo.taxa_utilizacao.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabela Completa */}
      <Card>
        <CardHeader>
          <CardTitle>Análise Custo-Benefício - Últimos {meses} meses</CardTitle>
          <p className="text-sm text-muted-foreground">Eficiência operacional e utilização da frota</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Veículo</TableHead>
                  <TableHead className="text-right">Custo Operacional</TableHead>
                  <TableHead className="text-right">KM Rodados</TableHead>
                  <TableHead className="text-right">Custo/KM</TableHead>
                  <TableHead className="text-center">Total Viagens</TableHead>
                  <TableHead className="text-center">Taxa Utilização</TableHead>
                  <TableHead className="text-center">Eficiência</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {veiculos.map((veiculo) => (
                  <TableRow key={veiculo.id_veiculo}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{veiculo.placa}</p>
                        <p className="text-xs text-muted-foreground">{veiculo.modelo}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(veiculo.custo_operacional)}</TableCell>
                    <TableCell className="text-right">{veiculo.km_rodados !== undefined && veiculo.km_rodados !== null ? `${veiculo.km_rodados.toLocaleString('pt-BR')} km` : '-'}</TableCell>
                    <TableCell className="text-right">
                      <span className={veiculo.custo_por_km > 2 ? 'text-danger' : veiculo.custo_por_km > 1 ? 'text-warning' : 'text-success'}>
                        {formatCurrency(veiculo.custo_por_km)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">{veiculo.total_viagens}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={veiculo.taxa_utilizacao < 30 ? 'status-danger' : veiculo.taxa_utilizacao < 60 ? 'status-warning' : 'status-success'}>
                        {veiculo.taxa_utilizacao.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={getEficienciaColor(veiculo.eficiencia_operacional)}>
                        {veiculo.eficiencia_operacional}
                      </Badge>
                    </TableCell>
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
            <p className="font-semibold mb-2">Taxa de Utilização</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-success"></span>
                <span className="text-muted-foreground">≥ 60% - Boa utilização</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-warning"></span>
                <span className="text-muted-foreground">30-60% - Média utilização</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-danger"></span>
                <span className="text-muted-foreground">&lt; 30% - Subutilizado</span>
              </div>
            </div>
          </div>
          <div>
            <p className="font-semibold mb-2">Eficiência Operacional</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Excelente: Baixo custo/km e alta utilização</li>
              <li>• Bom: Custo médio e boa utilização</li>
              <li>• Regular: Custo alto ou média utilização</li>
              <li>• Baixo: Custo alto e baixa utilização</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-2">Recomendações</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Priorize veículos eficientes</li>
              <li>• Investigue veículos subutilizados</li>
              <li>• Considere realocar recursos</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
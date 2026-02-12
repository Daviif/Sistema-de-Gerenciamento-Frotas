import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Loading from '@/components/ui/loading'
import { useRelatorioManutencaoCritica } from '@/hooks/useRelatorios'
import { AlertTriangle } from 'lucide-react'

function formatCurrency(val: number | null | undefined): string {
  if (val === undefined || val === null) return '-'
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
}

interface Props {
  meses: number
}

export default function RelatorioManutencao({ meses }: Props) {
  const { data: manutencoes, isLoading } = useRelatorioManutencaoCritica(meses)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading />
      </div>
    )
  }

  if (!manutencoes || manutencoes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhum dado disponível</p>
      </div>
    )
  }

  const criticos = manutencoes.filter(m => m.status_alerta === 'critico')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critico':
        return 'status-danger'
      case 'atencao':
        return 'status-warning'
      default:
        return 'status-success'
    }
  }

  return (
    <div className="space-y-6">
      {/* Alertas Críticos */}
      {criticos.length > 0 && (
        <Card className="border-danger/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-danger">
              <AlertTriangle className="w-5 h-5" />
              Alertas Críticos ({criticos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticos.map((veiculo) => (
                <div key={veiculo.id_veiculo} className="p-3 bg-danger-50 rounded-lg border border-danger">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{veiculo.placa} - {veiculo.modelo}</p>
                      <p className="text-sm text-muted-foreground">
                        {veiculo.dias_desde_ultima} dias desde última manutenção
                      </p>
                    </div>
                    <Badge variant="destructive">Crítico</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela Completa */}
      <Card>
        <CardHeader>
          <CardTitle>Análise de Manutenção - Últimos {meses} meses</CardTitle>
          <p className="text-sm text-muted-foreground">Histórico e alertas de manutenção por veículo</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Veículo</TableHead>
                  <TableHead className="text-center">Total Manut.</TableHead>
                  <TableHead className="text-center">Preventivas</TableHead>
                  <TableHead className="text-center">Corretivas</TableHead>
                  <TableHead className="text-right">Custo Total</TableHead>
                  <TableHead className="text-right">Dias Última</TableHead>
                  <TableHead className="text-right">KM Última</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {manutencoes.map((veiculo) => (
                  <TableRow key={veiculo.id_veiculo}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{veiculo.placa}</p>
                        <p className="text-xs text-muted-foreground">{veiculo.modelo}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{veiculo.total_manutencoes}</TableCell>
                    <TableCell className="text-center text-primary">{veiculo.manutencoes_preventivas}</TableCell>
                    <TableCell className="text-center text-danger">{veiculo.manutencoes_corretivas}</TableCell>
                    <TableCell className="text-right">{formatCurrency(veiculo.custo_total)}</TableCell>
                    <TableCell className="text-right">{veiculo.dias_desde_ultima}</TableCell>
                    <TableCell className="text-right">{veiculo.km_desde_ultima !== undefined && veiculo.km_desde_ultima !== null ? `${veiculo.km_desde_ultima.toLocaleString('pt-BR')} km` : '-'}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={getStatusColor(veiculo.status_alerta)}>
                        {veiculo.status_alerta === 'critico' ? 'Crítico' : veiculo.status_alerta === 'atencao' ? 'Atenção' : 'OK'}
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
            <p className="font-semibold mb-2">Tipos de Manutenção</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Preventivas: Manutenções planejadas</li>
              <li>• Corretivas: Consertos de problemas</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-2">Critérios de Alerta</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Crítico: &gt; 90 dias ou &gt; 5 corretivas</li>
              <li>• Atenção: Manutenções pendentes</li>
              <li>• OK: Situação normal</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-2">Recomendações</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Priorize preventivas sobre corretivas</li>
              <li>• Verifique veículos críticos urgentemente</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
// src/components/relatorios/RelatorioMotoristas.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Loading from '@/components/ui/loading'
import { useRelatorioMotoristasCompleto } from '@/hooks/useRelatorios'
import { AlertTriangle, CheckCircle } from 'lucide-react'

function formatNumber(val: number): string {
  return val.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

interface Props {
  meses: number
}

export default function RelatorioMotoristas({ meses }: Props) {
  const { data: motoristas, isLoading } = useRelatorioMotoristasCompleto(meses)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading />
      </div>
    )
  }

  if (!motoristas || motoristas.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhum dado disponível</p>
      </div>
    )
  }

  // Separar motoristas com CNH vencida ou a vencer
  const cnhCritica = motoristas.filter(m => m.cnh_vencida || m.dias_para_vencer_cnh <= 90)
  const cnhOk = motoristas.filter(m => !m.cnh_vencida && m.dias_para_vencer_cnh > 90)

  return (
    <div className="space-y-6">
      {/* Alertas CNH */}
      {cnhCritica.length > 0 && (
        <Card className="border-danger/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-danger">
              <AlertTriangle className="w-5 h-5" />
              Alertas de CNH ({cnhCritica.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Motoristas com CNH vencida ou próxima do vencimento (≤ 90 dias)
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cnhCritica.map((motorista) => (
                <div key={motorista.cpf} className="flex items-center justify-between p-3 bg-danger-50 rounded-lg border border-danger">
                  <div>
                    <p className="font-medium">{motorista.nome}</p>
                    <p className="text-sm text-muted-foreground">CPF: {motorista.cpf}</p>
                  </div>
                  <div className="text-right">
                    {motorista.cnh_vencida ? (
                      <Badge variant="destructive">CNH Vencida</Badge>
                    ) : (
                      <Badge className="status-warning">
                        Vence em {motorista.dias_para_vencer_cnh} dias
                      </Badge>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(motorista.validade_cnh).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance dos Motoristas */}
      <Card>
        <CardHeader>
          <CardTitle>Performance dos Motoristas - Últimos {meses} meses</CardTitle>
          <p className="text-sm text-muted-foreground">
            Produtividade, taxa de conclusão e atividade
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Motorista</TableHead>
                  <TableHead className="text-center">Total Viagens</TableHead>
                  <TableHead className="text-center">Finalizadas</TableHead>
                  <TableHead className="text-center">Canceladas</TableHead>
                  <TableHead className="text-center">Taxa Conclusão</TableHead>
                  <TableHead className="text-right">KM Rodados</TableHead>
                  <TableHead className="text-center">Veículos Usados</TableHead>
                  <TableHead className="text-center">Rotas Diferentes</TableHead>
                  <TableHead className="text-center">Status CNH</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cnhOk.map((motorista) => (
                  <TableRow key={motorista.cpf}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{motorista.nome}</p>
                        <p className="text-xs text-muted-foreground">{motorista.cpf}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{motorista.total_viagens}</TableCell>
                    <TableCell className="text-center text-success">{motorista.viagens_finalizadas}</TableCell>
                    <TableCell className="text-center text-danger">{motorista.viagens_canceladas}</TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        className={
                          motorista.taxa_conclusao >= 90 
                            ? 'status-success' 
                            : motorista.taxa_conclusao >= 70 
                            ? 'status-warning' 
                            : 'status-danger'
                        }
                      >
                        {motorista.taxa_conclusao.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(motorista.km_rodados)} km</TableCell>
                    <TableCell className="text-center">{motorista.veiculos_diferentes}</TableCell>
                    <TableCell className="text-center">{motorista.rotas_diferentes}</TableCell>
                    <TableCell className="text-center">
                      <Badge className="status-success">
                        <CheckCircle className="w-3 h-3" />
                        OK
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
            <p className="font-semibold mb-2">Taxa de Conclusão</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-success"></span>
                <span className="text-muted-foreground">≥ 90% - Excelente</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-warning"></span>
                <span className="text-muted-foreground">70-90% - Bom</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-danger"></span>
                <span className="text-muted-foreground">&lt; 70% - Atenção</span>
              </div>
            </div>
          </div>
          <div>
            <p className="font-semibold mb-2">Produtividade</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Veículos usados: Versatilidade</li>
              <li>• Rotas diferentes: Experiência</li>
              <li>• KM rodados: Volume de trabalho</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-2">Status CNH</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="text-muted-foreground">OK - Válida (&gt; 90 dias)</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <span className="text-muted-foreground">Atenção - Vence em ≤ 90 dias</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-danger" />
                <span className="text-muted-foreground">Crítico - Vencida</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
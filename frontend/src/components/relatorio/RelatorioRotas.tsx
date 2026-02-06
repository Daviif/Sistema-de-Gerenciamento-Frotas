// src/components/relatorios/RelatorioRotas.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Loading from '@/components/ui/loading'
import { useRelatorioRotasAnalise } from '@/hooks/useRelatorios'

interface Props {
  meses: number
}

export default function RelatorioRotas({ meses }: Props) {
  const { data: rotas, isLoading } = useRelatorioRotasAnalise(meses)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading />
      </div>
    )
  }

  if (!rotas || rotas.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhum dado disponível</p>
      </div>
    )
  }

  const rotasOrdenadas = [...rotas].sort((a, b) => b.total_viagens - a.total_viagens)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Análise de Rotas - Últimos {meses} meses</CardTitle>
          <p className="text-sm text-muted-foreground">Rotas mais utilizadas e taxa de sucesso</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rota</TableHead>
                  <TableHead className="text-center">Total Viagens</TableHead>
                  <TableHead className="text-center">Finalizadas</TableHead>
                  <TableHead className="text-center">Canceladas</TableHead>
                  <TableHead className="text-center">Taxa Sucesso</TableHead>
                  <TableHead className="text-right">KM Médio</TableHead>
                  <TableHead className="text-right">Tempo Médio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rotasOrdenadas.map((rota, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <div className="font-medium">
                        {rota.cidade_origem} → {rota.cidade_destino}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{rota.total_viagens}</TableCell>
                    <TableCell className="text-center text-success">{rota.viagens_finalizadas}</TableCell>
                    <TableCell className="text-center text-danger">{rota.viagens_canceladas}</TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        className={
                          rota.taxa_sucesso >= 90 
                            ? 'status-success' 
                            : rota.taxa_sucesso >= 70 
                            ? 'status-warning' 
                            : 'status-danger'
                        }
                      >
                        {rota.taxa_sucesso.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{rota.km_medio.toFixed(0)} km</TableCell>
                    <TableCell className="text-right">{rota.tempo_medio_horas.toFixed(1)}h</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Rotas Únicas</p>
            <p className="text-2xl font-bold">{rotas.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Rota Mais Utilizada</p>
            <p className="text-xl font-bold">{rotasOrdenadas[0]?.cidade_origem} → {rotasOrdenadas[0]?.cidade_destino}</p>
            <p className="text-sm text-muted-foreground">{rotasOrdenadas[0]?.total_viagens} viagens</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Taxa Média de Sucesso</p>
            <p className="text-2xl font-bold">
              {(rotas.reduce((acc, r) => acc + r.taxa_sucesso, 0) / rotas.length).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
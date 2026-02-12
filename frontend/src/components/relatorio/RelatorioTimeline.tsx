import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Loading from '@/components/ui/loading'
import { useRelatorioTimeline } from '@/hooks/useRelatorios'
import { MapPin, Fuel, Wrench, Calendar } from 'lucide-react'

function formatCurrency(val: number | null | undefined): string {
  if (val === undefined || val === null) return '-'
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
}

interface Props {
  meses: number
}

export default function RelatorioTimeline({ meses }: Props) {
  const { data: eventos, isLoading } = useRelatorioTimeline(meses, 100)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading />
      </div>
    )
  }

  if (!eventos || eventos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhum evento disponível</p>
      </div>
    )
  }

  const getEventoIcon = (tipo: string | undefined | null) => {
    if (!tipo) return <Calendar className="w-5 h-5 text-muted-foreground" />
    switch (tipo.toLowerCase()) {
      case 'viagem':
        return <MapPin className="w-5 h-5 text-primary" />
      case 'abastecimento':
        return <Fuel className="w-5 h-5 text-warning" />
      case 'manutencao':
        return <Wrench className="w-5 h-5 text-danger" />
      default:
        return <Calendar className="w-5 h-5 text-muted-foreground" />
    }
  }

  const getEventoColor = (tipo: string | undefined | null) => {
    if (!tipo) return 'border-l-muted'
    switch (tipo.toLowerCase()) {
      case 'viagem':
        return 'border-l-primary'
      case 'abastecimento':
        return 'border-l-warning'
      case 'manutencao':
        return 'border-l-danger'
      default:
        return 'border-l-muted'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Timeline de Eventos - Últimos {meses} meses</CardTitle>
          <p className="text-sm text-muted-foreground">
            Últimos 100 eventos de viagens, abastecimentos e manutenções
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {eventos.map((evento, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-4 p-4 rounded-lg border-l-4 ${getEventoColor(evento.tipo)} bg-muted/20`}
              >
                <div className="mt-1">{getEventoIcon(evento.tipo)}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{evento.tipo}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(evento.data).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="font-medium">{evento.descricao}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Veículo: {evento.veiculo_placa}
                      </p>
                    </div>
                    <div className="text-right">
                      {evento.valor !== undefined && evento.valor !== null && (
                        <p className="font-semibold text-lg">{formatCurrency(evento.valor)}</p>
                      )}
                      {evento.km !== undefined && evento.km !== null && (
                        <p className="text-sm text-muted-foreground">{Number(evento.km).toLocaleString('pt-BR')} km</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Legenda */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-primary" />
            <div>
              <p className="font-semibold">Viagens</p>
              <p className="text-muted-foreground">Início e finalização de viagens</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Fuel className="w-5 h-5 text-warning" />
            <div>
              <p className="font-semibold">Abastecimentos</p>
              <p className="text-muted-foreground">Reabastecimento de combustível</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Wrench className="w-5 h-5 text-danger" />
            <div>
              <p className="font-semibold">Manutenções</p>
              <p className="text-muted-foreground">Serviços de manutenção realizados</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
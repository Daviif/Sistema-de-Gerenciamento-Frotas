// src/components/viagens/DetalhesViagem.tsx
import { DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Trip, TripStatus } from '@/types'
import { Calendar, User, Truck } from 'lucide-react'

const STATUS_LABELS: Record<TripStatus, string> = {
  [TripStatus.PLANNED]: 'Planejada',
  [TripStatus.IN_PROGRESS]: 'Em Andamento',
  [TripStatus.COMPLETED]: 'Finalizada',
  [TripStatus.CANCELLED]: 'Cancelada',
}

interface DetalhesViagemProps {
  trip: Trip
}

export default function DetalhesViagem({ trip }: DetalhesViagemProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Detalhes da Viagem</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b pb-3 gap-2">
          <span className="font-semibold text-lg">
            {trip.origem ?? 'Origem'} → {trip.destino ?? 'Destino'}
          </span>
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary flex-shrink-0">
            {STATUS_LABELS[trip.status_viagem]}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">Viagem #{trip.id_viagem}</p>
        <dl className="grid grid-cols-1 gap-3 text-sm">
          {trip.placa && (
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <div>
                <dt className="text-muted-foreground">Veículo</dt>
                <dd className="font-medium">
                  {trip.placa} {trip.modelo ? `- ${trip.modelo}` : ''}
                </dd>
              </div>
            </div>
          )}
          {trip.motorista && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <div>
                <dt className="text-muted-foreground">Motorista</dt>
                <dd className="font-medium">{trip.motorista}</dd>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <div>
              <dt className="text-muted-foreground">Data de saída</dt>
              <dd className="font-medium">
                {new Date(trip.data_saida).toLocaleDateString('pt-BR')}
              </dd>
            </div>
          </div>
          {trip.data_chegada && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <div>
                <dt className="text-muted-foreground">Data de chegada</dt>
                <dd className="font-medium">
                  {new Date(trip.data_chegada).toLocaleDateString('pt-BR')}
                </dd>
              </div>
            </div>
          )}
          {trip.km_rodados != null && (
            <div>
              <dt className="text-muted-foreground">KM rodados</dt>
              <dd className="font-medium">{trip.km_rodados.toLocaleString('pt-BR')} km</dd>
            </div>
          )}
          {trip.observacoes && (
            <div>
              <dt className="text-muted-foreground">Observações</dt>
              <dd className="font-medium">{trip.observacoes}</dd>
            </div>
          )}
        </dl>
      </div>
    </>
  )
}

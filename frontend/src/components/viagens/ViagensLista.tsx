// src/components/viagens/ViagensLista.tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, MapPin, Calendar, User, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import ViagemForm from './ViagemForm'
import Loading from '@/components/ui/loading'
import { Trip, TripStatus } from '@/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function TripsList() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  function handleStatusChange(value: string) {
    setStatusFilter(value === '__all__' ? '' : value)
  }

  const { data: trips, isLoading } = useQuery({
    queryKey: ['trips', statusFilter],
    queryFn: async () => {
      const { data } = await api.get<Trip[]>('/viagens', {
        params: statusFilter ? { status: statusFilter } : undefined
      })
      return data
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Viagens</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as viagens da frota
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4" aria-hidden="true" />
              Nova Viagem
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Viagem</DialogTitle>
            </DialogHeader>

            <ViagemForm onSuccess={() => setIsDialogOpen(false)} onCancel={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos</SelectItem>
              <SelectItem value={TripStatus.PLANNED}>Planejada</SelectItem>
              <SelectItem value={TripStatus.IN_PROGRESS}>Em Andamento</SelectItem>
              <SelectItem value={TripStatus.COMPLETED}>Finalizada</SelectItem>
              <SelectItem value={TripStatus.CANCELLED}>Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Trip List */}
      <div className="space-y-4">
        {trips?.map((trip) => (
          <Card key={trip.id_viagem} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <MapPin className="w-5 h-5 text-current" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">
                      {trip.origem} → {trip.destino}
                    </h3>
                    <StatusBadge status={trip.status_viagem} />
                  </div>
                  <p className="text-sm text-muted-foreground">Viagem #{trip.id_viagem}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="text-muted-foreground">Veículo</p>
                  <p className="font-medium">{trip.placa} - {trip.modelo}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="text-muted-foreground">Motorista</p>
                  <p className="font-medium">{trip.motorista}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="text-muted-foreground">Saída</p>
                  <p className="font-medium">
                    {new Date(trip.data_saida).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              {trip.data_chegada && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  <div>
                    <p className="text-muted-foreground">Chegada</p>
                    <p className="font-medium">
                      {new Date(trip.data_chegada).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {trip.km_rodados && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  KM Rodados: <span className="font-medium text-foreground">{trip.km_rodados !== undefined && trip.km_rodados !== null ? `${trip.km_rodados.toLocaleString('pt-BR')} km` : '-'} </span>
                </p>
              </div>
            )}

            {trip.status_viagem === TripStatus.IN_PROGRESS && (
              <div className="flex gap-2 mt-4">
                <Button variant="default" size="sm" className="shadow-sm">
                  Finalizar Viagem
                </Button>
                <Button variant="outline" size="sm" className="shadow-sm">
                  Cancelar
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {trips?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhuma viagem encontrada</p>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: TripStatus }) {
  const colors = {
    [TripStatus.PLANNED]: 'bg-muted text-muted-foreground',
    [TripStatus.IN_PROGRESS]: 'bg-primary/10 text-primary',
    [TripStatus.COMPLETED]: 'status-success',
    [TripStatus.CANCELLED]: 'status-danger',
  }

  const labels = {
    [TripStatus.PLANNED]: 'Planejada',
    [TripStatus.IN_PROGRESS]: 'Em Andamento',
    [TripStatus.COMPLETED]: 'Finalizada',
    [TripStatus.CANCELLED]: 'Cancelada',
  }

  return (
    <Badge className={colors[status]}>
      {labels[status]}
    </Badge>
  )
}
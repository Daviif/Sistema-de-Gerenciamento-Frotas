// src/components/veiculos/DetalhesVeiculos.tsx
import { DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Vehicle, VehicleStatus } from '@/types'

const STATUS_LABELS: Record<VehicleStatus, string> = {
  [VehicleStatus.ACTIVE]: 'Ativo',
  [VehicleStatus.ON_TRIP]: 'Em Viagem',
  [VehicleStatus.MAINTENANCE]: 'Manutenção',
  [VehicleStatus.INACTIVE]: 'Inativo',
}

interface DetalhesVeiculosProps {
  vehicle: Vehicle
}

export default function DetalhesVeiculos({ vehicle }: DetalhesVeiculosProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Detalhes do Veículo</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-2xl font-bold">{vehicle.placa}</span>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {STATUS_LABELS[vehicle.status]}
            </span>
          </div>
          <dl className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Marca</dt>
              <dd className="font-medium">{vehicle.marca}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Modelo</dt>
              <dd className="font-medium">{vehicle.modelo}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Ano</dt>
              <dd className="font-medium">{vehicle.ano}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tipo</dt>
              <dd className="font-medium">{vehicle.tipo}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">KM Atual</dt>
              <dd className="font-medium">
                {vehicle.km_atual !== undefined && vehicle.km_atual !== null
                  ? vehicle.km_atual.toLocaleString('pt-BR')
                  : '-'}
              </dd>
            </div>
            {vehicle.capacidade_tanque != null && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Capacidade do tanque (L)</dt>
                <dd className="font-medium">{vehicle.capacidade_tanque}</dd>
              </div>
            )}
          </dl>
        </div>
    </>
  )
}

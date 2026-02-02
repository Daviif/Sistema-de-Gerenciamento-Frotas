import { AlertOctagon, CheckCircle } from 'lucide-react'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Driver, Vehicle } from '@/types'

interface AlertsPanelProps {
  drivers: Driver[]
  vehicles: Vehicle[]
  maxVehiclesToShow?: number
}

export default function AlertsPanel({ drivers, vehicles, maxVehiclesToShow = 3 }: AlertsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertOctagon className="w-5 h-5 text-danger mr-2" />
          Alertas Críticos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {drivers.length > 0 && (
            <div className="p-3 bg-danger-50 border border-danger rounded-lg">
              <p className="text-sm font-semibold text-danger">Motoristas - Vencimento CNH</p>
              <ul className="mt-1 text-sm text-danger">
                {drivers.map(d => (
                  <li key={d.cpf}>• {d.nome} ({d.validade_cnh ? new Date(d.validade_cnh).toLocaleDateString('pt-BR') : '-'})</li>
                ))}
              </ul>
            </div>
          )}

          {vehicles.length > 0 && (
            <div className="p-3 status-warning rounded-lg">
              <p className="text-sm font-semibold" style={{ color: 'hsl(var(--warning))' }}>Veículos - Alta Quilometragem</p>
              <ul className="mt-1 text-sm" style={{ color: 'hsl(var(--warning))' }}>
                {vehicles.slice(0, maxVehiclesToShow).map(v => (
                  <li key={v.id_veiculo}>• {v.modelo} ({(v.km_atual !== undefined && v.km_atual !== null) ? v.km_atual.toLocaleString('pt-BR') + ' km' : '-'})</li>
                ))}
              </ul>
            </div>
          )}

          {drivers.length === 0 && vehicles.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>Todos os sistemas normais</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

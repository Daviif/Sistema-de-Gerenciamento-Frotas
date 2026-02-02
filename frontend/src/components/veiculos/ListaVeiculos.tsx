// src/components/veiculos/ListaVeiculos.tsx
import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import VeiculosForm from './VeiculosForm'
import { useVehicles } from '@/hooks/useVeiculos'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { VehicleStatus, Vehicle } from '@/types'

export default function VehiclesList() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  const { data: vehicles, isLoading } = useVehicles(statusFilter)

  const q = searchTerm.toLowerCase()
  function handleStatusChange(value: string) {
    setStatusFilter(value === '__all__' ? '' : value)
  }

  const filteredVehicles = vehicles?.filter(v => {
    const placa = (v.placa || '').toString().toLowerCase()
    const modelo = (v.modelo || '').toString().toLowerCase()
    const marca = (v.marca || '').toString().toLowerCase()
    return (
      placa.includes(q) ||
      modelo.includes(q) ||
      marca.includes(q)
    )
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-muted-foreground/10" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-6 w-1/2 bg-muted rounded mt-1" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Veículos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie a frota de veículos
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default" className="shadow">
              <Plus className="w-4 h-4 mr-2" />
              Novo Veículo
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Veículo</DialogTitle>
            </DialogHeader>

            <VeiculosForm onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/70" />
            <Input
              placeholder="Buscar por placa, modelo ou marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-primary/5 border border-primary/10 focus:border-primary/30 focus-visible:ring-primary/30"
            />
          </div>

          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-48 bg-primary/5 border border-primary/10">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos</SelectItem>
              <SelectItem value={VehicleStatus.ACTIVE}>Ativo</SelectItem>
              <SelectItem value={VehicleStatus.ON_TRIP}>Em Viagem</SelectItem>
              <SelectItem value={VehicleStatus.MAINTENANCE}>Manutenção</SelectItem>
              <SelectItem value={VehicleStatus.INACTIVE}>Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Vehicle List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVehicles?.map((vehicle: Vehicle) => (
          <Card key={vehicle.id_veiculo} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">{vehicle.placa}</h3>
                <p className="text-sm text-muted-foreground">{vehicle.modelo}</p>
              </div>
              <StatusBadge status={vehicle.status} />
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Marca:</span>
                <span className="font-medium">{vehicle.marca}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ano:</span>
                <span className="font-medium">{vehicle.ano}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">KM Atual:</span>
                <span className="font-medium">{vehicle.km_atual !== undefined && vehicle.km_atual !== null ? vehicle.km_atual.toLocaleString('pt-BR') : '-'}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button size="sm" className="flex-1">
                Detalhes
              </Button>
              <Button variant="outline" size="sm" className="flex-1 border-primary/20">
                Editar
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredVehicles?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum veículo encontrado</p>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: VehicleStatus }) {
  const colors = {
    [VehicleStatus.ACTIVE]: 'status-success',
    [VehicleStatus.ON_TRIP]: 'bg-primary/10 text-primary',
    [VehicleStatus.MAINTENANCE]: 'status-warning',
    [VehicleStatus.INACTIVE]: 'bg-muted text-muted-foreground',
  }

  const labels = {
    [VehicleStatus.ACTIVE]: 'Ativo',
    [VehicleStatus.ON_TRIP]: 'Em Viagem',
    [VehicleStatus.MAINTENANCE]: 'Manutenção',
    [VehicleStatus.INACTIVE]: 'Inativo',
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
      {labels[status]}
    </span>
  )
}
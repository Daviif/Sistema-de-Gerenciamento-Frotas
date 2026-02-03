// src/components/veiculos/ListaVeiculos.tsx
import { useState } from 'react'
import { Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import VeiculosForm from './VeiculosForm'
import DetalhesVeiculos from './DetalhesVeiculos'
import Loading from '@/components/ui/loading'
import { useVehicles, useDeleteVehicle } from '@/hooks/useVeiculos'
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
  const [vehicleToEdit, setVehicleToEdit] = useState<Vehicle | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const { data: vehicles, isLoading } = useVehicles(statusFilter)
  const deleteVehicle = useDeleteVehicle()

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function openDeleteConfirm() {
    if (selectedIds.size === 0) return
    setDeleteConfirmOpen(true)
  }

  async function confirmDelete() {
    if (selectedIds.size === 0) return
    for (const id of selectedIds) {
      try {
        await deleteVehicle.mutateAsync(id)
      } catch {
        // toast no hook
      }
    }
    setSelectedIds(new Set())
    setDeleteConfirmOpen(false)
  }

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
          <h1 className="text-3xl font-bold text-foreground">Veículos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie a frota de veículos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="default" size="sm" onClick={() => { setVehicleToEdit(null); setIsDialogOpen(true) }}>
            <Plus className="w-4 h-4" aria-hidden="true" />
            Novo Veículo
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
            disabled={selectedIds.size === 0 || deleteVehicle.isPending}
            onClick={openDeleteConfirm}
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            Deletar veículo{selectedIds.size > 1 ? 's' : ''}
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setVehicleToEdit(null) }}>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>{vehicleToEdit ? 'Editar Veículo' : 'Novo Veículo'}</DialogTitle>
            </DialogHeader>

            <VeiculosForm
              initialData={vehicleToEdit}
              onSuccess={() => setIsDialogOpen(false)}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Buscar por placa, modelo ou marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-muted/5 border border-border focus:border-primary/30 focus-visible:ring-primary/30"
            />
          </div>

          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-48 bg-muted/5 border border-border">
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
            <div className="flex items-start justify-between mb-4 gap-2">
              <label className="flex items-center gap-2 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={selectedIds.has(vehicle.id_veiculo)}
                  onChange={() => toggleSelect(vehicle.id_veiculo)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  aria-label={`Selecionar veículo ${vehicle.placa}`}
                />
              </label>
              <div className="min-w-0 flex-1">
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
              <Button
                size="sm"
                className="flex-1 shadow-sm"
                onClick={() => {
                  setSelectedVehicle(vehicle)
                  setDetailsOpen(true)
                }}
              >
                Detalhes
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-primary/20 shadow-sm"
                onClick={() => {
                  setVehicleToEdit(vehicle)
                  setIsDialogOpen(true)
                }}
              >
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

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedVehicle && <DetalhesVeiculos vehicle={selectedVehicle} />}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir veículo{selectedIds.size > 1 ? 's' : ''}</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm pt-2">
            {selectedIds.size === 1
              ? 'Deseja realmente excluir este veículo? Esta ação não pode ser desfeita.'
              : `Deseja realmente excluir ${selectedIds.size} veículos? Esta ação não pode ser desfeita.`}
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={deleteVehicle.isPending}
              onClick={confirmDelete}
            >
              {deleteVehicle.isPending ? 'Excluindo...' : 'Sim, excluir'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
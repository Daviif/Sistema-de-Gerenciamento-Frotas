// src/components/motoristas/MotoristaLista.tsx
import { useState } from 'react'
import { Plus, Search, Calendar, Trash2, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import MotoristaForm from './MotoristaForm'
import DetalhesMotorista from './DetalhesMotorista'
import Loading from '@/components/ui/loading'
import { useDrivers, useDeleteDriver, useReactivateDriver } from '@/hooks/useMotorista'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Driver, DriverStatus } from '@/types'

export default function DriversList() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [driverToEdit, setDriverToEdit] = useState<Driver | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [selectedCpfs, setSelectedCpfs] = useState<Set<string>>(new Set())
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const { data: drivers, isLoading } = useDrivers(statusFilter)
  const deleteDriver = useDeleteDriver()
  const reactivateDriver = useReactivateDriver()

  function toggleSelect(cpf: string) {
    setSelectedCpfs((prev) => {
      const next = new Set(prev)
      if (next.has(cpf)) next.delete(cpf)
      else next.add(cpf)
      return next
    })
  }

  function openDeleteConfirm() {
    if (selectedCpfs.size === 0) return
    setDeleteConfirmOpen(true)
  }

  async function confirmDelete() {
    if (selectedCpfs.size === 0) return
    for (const cpf of selectedCpfs) {
      try {
        await deleteDriver.mutateAsync(cpf)
      } catch {
        // toast no hook
      }
    }
    setSelectedCpfs(new Set())
    setDeleteConfirmOpen(false)
  }

  async function handleReactivate(cpf: string) {
    try {
      await reactivateDriver.mutateAsync(cpf)
    } catch {
      // toast no hook
    }
  }

  function handleStatusChange(value: string) {
    setStatusFilter(value === '__all__' ? '' : value)
  }

  const filteredDrivers = drivers?.filter((d: Driver) => 
    d.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.cpf.includes(searchTerm.replace(/\D/g, '')) ||
    d.cnh.includes(searchTerm.replace(/\D/g, ''))
  )

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
          <h1 className="text-3xl font-bold text-foreground">Motoristas</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os motoristas da frota
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => { setDriverToEdit(null); setIsDialogOpen(true) }}>
            <Plus className="w-4 h-4" aria-hidden="true" />
            Novo Motorista
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
            disabled={selectedCpfs.size === 0 || deleteDriver.isPending}
            onClick={openDeleteConfirm}
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            Deletar motorista{selectedCpfs.size > 1 ? 's' : ''}
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setDriverToEdit(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{driverToEdit ? 'Editar Motorista' : 'Novo Motorista'}</DialogTitle>
          </DialogHeader>

          <MotoristaForm
            initialData={driverToEdit}
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
              placeholder="Buscar por nome, CPF ou CNH..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-muted/5 border border-border focus:border-primary/30 focus-visible:ring-primary/30"
            />
          </div>

          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos</SelectItem>
              <SelectItem value={DriverStatus.ACTIVE}>Ativo</SelectItem>
              <SelectItem value={DriverStatus.ON_TRIP}>Em Viagem</SelectItem>
              <SelectItem value={DriverStatus.INACTIVE}>Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Driver List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDrivers?.map((driver: Driver) => (
          <Card key={driver.cpf} className="p-6">
            <div className="flex items-start justify-between mb-4 gap-2">
              <label className="flex items-center gap-2 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={selectedCpfs.has(driver.cpf)}
                  onChange={() => toggleSelect(driver.cpf)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  aria-label={`Selecionar motorista ${driver.nome}`}
                />
              </label>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-lg">{driver.nome}</h3>
                <p className="text-sm text-muted-foreground">CPF: {formatCPF(driver.cpf)}</p>
              </div>
              <StatusBadge status={driver.status} />
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">CNH:</span>
                <span className="font-medium">{formatCNH(driver.cnh)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Categoria:</span>
                <span className="font-medium">{driver.cat_cnh}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Validade CNH:</span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
                  <span className={`font-medium ${isCNHExpiring(driver.validade_cnh) ? 'text-danger' : ''}`}>
                    {driver.validade_cnh ? new Date(driver.validade_cnh).toLocaleDateString('pt-BR') : '-'}
                  </span>
                </div>
              </div>
            </div>

            {isCNHExpiring(driver.validade_cnh) && (
              <div className="mt-3 p-2 bg-danger-50 border border-danger rounded text-xs text-danger">
                ⚠️ CNH vencendo em breve
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 shadow-sm"
                onClick={() => {
                  setSelectedDriver(driver)
                  setDetailsOpen(true)
                }}
              >
                Detalhes
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 shadow-sm"
                onClick={() => {
                  setDriverToEdit(driver)
                  setIsDialogOpen(true)
                }}
              >
                Editar
              </Button>
            </div>

            {driver.status === DriverStatus.INACTIVE && (
              <Button
                type="button"
                size="sm"
                className="w-full mt-2"
                disabled={reactivateDriver.isPending}
                onClick={() => handleReactivate(driver.cpf)}
              >
                <Power className="w-4 h-4" aria-hidden="true" />
                Ativar novamente
              </Button>
            )}
          </Card>
        ))}
      </div>

      {filteredDrivers?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum motorista encontrado</p>
        </div>
      )}

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedDriver && <DetalhesMotorista driver={selectedDriver} />}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir motorista{selectedCpfs.size > 1 ? 's' : ''}</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm pt-2">
            {selectedCpfs.size === 1
              ? 'Deseja realmente excluir este motorista? Se houver histórico de viagens, ele será apenas inativado.'
              : `Deseja realmente excluir ${selectedCpfs.size} motoristas? Se houver histórico de viagens, eles serão apenas inativados.`}
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={deleteDriver.isPending}
              onClick={confirmDelete}
            >
              {deleteDriver.isPending ? 'Excluindo...' : 'Sim, excluir'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatusBadge({ status }: { status: DriverStatus }) {
  const colors = {
    [DriverStatus.ACTIVE]: 'status-success',
    [DriverStatus.ON_TRIP]: 'bg-primary/10 text-primary',
    [DriverStatus.INACTIVE]: 'bg-muted text-muted-foreground',
  }

  const labels = {
    [DriverStatus.ACTIVE]: 'Ativo',
    [DriverStatus.ON_TRIP]: 'Em Viagem',
    [DriverStatus.INACTIVE]: 'Inativo',
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
      {labels[status]}
    </span>
  )
}

function formatCPF(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

function formatCNH(cnh: string): string {
  return cnh.replace(/(\d{5})(\d{6})/, '$1 $2')
}

function isCNHExpiring(validade?: string): boolean {
  if (!validade) return false
  const expiry = new Date(validade)
  if (isNaN(expiry.getTime())) return false
  const today = new Date()
  const threeMonths = new Date()
  threeMonths.setMonth(today.getMonth() + 3)
  return expiry < threeMonths && expiry > today
}
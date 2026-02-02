// src/components/motoristas/MotoristaLista.tsx
import { useState } from 'react'
import { Plus, Search, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import MotoristaForm from './MotoristaForm'
import Loading from '@/components/ui/loading'
import { useDrivers } from '@/hooks/useMotorista'
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
  
  const { data: drivers, isLoading } = useDrivers(statusFilter)

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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4" aria-hidden="true" />
              Novo Motorista
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Motorista</DialogTitle>
            </DialogHeader>

            <MotoristaForm onSuccess={() => setIsDialogOpen(false)} onCancel={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

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
            <div className="flex items-start justify-between mb-4">
              <div>
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
              <Button variant="outline" size="sm" className="flex-1 shadow-sm">
                Detalhes
              </Button>
              <Button variant="outline" size="sm" className="flex-1 shadow-sm">
                Editar
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredDrivers?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum motorista encontrado</p>
        </div>
      )}
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
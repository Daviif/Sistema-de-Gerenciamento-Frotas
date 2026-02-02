// src/components/manutencao/ManutencaoLista.tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Wrench, Calendar, DollarSign, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import ManutencaoForm from './ManutencaoForm'
import Loading from '@/components/ui/loading'
import { api } from '@/lib/api'
import { Maintenance, MaintenanceType } from '@/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function MaintenanceList() {
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  function handleTypeChange(value: string) {
    setTypeFilter(value === '__all__' ? '' : value)
  }

  const { data: maintenances, isLoading } = useQuery({
    queryKey: ['maintenances', typeFilter],
    queryFn: async () => {
      const { data } = await api.get<Maintenance[]>('/manutencao', {
        params: typeFilter ? { tipo: typeFilter } : undefined
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
          <h1 className="text-3xl font-bold text-foreground">Manutenções</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as manutenções da frota
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4" aria-hidden="true" />
              Nova Manutenção
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Manutenção</DialogTitle>
            </DialogHeader>

            <ManutencaoForm onSuccess={() => setIsDialogOpen(false)} onCancel={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex gap-4">
          <Select value={typeFilter} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos</SelectItem>
              <SelectItem value={MaintenanceType.PREVENTIVE}>Preventiva</SelectItem>
              <SelectItem value={MaintenanceType.CORRECTIVE}>Corretiva</SelectItem>
              <SelectItem value={MaintenanceType.PREDICTIVE}>Preditiva</SelectItem>
              <SelectItem value={MaintenanceType.REVISION}>Revisão</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Maintenance List */}
      <div className="space-y-4">
        {maintenances?.map((maintenance) => (
          <Card key={maintenance.id_manutencao} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${maintenance.concluida ? 'status-success' : 'status-warning'}`}>
                  {maintenance.concluida ? (
                    <CheckCircle className="w-5 h-5 text-current" aria-hidden="true" />
                  ) : (
                    <Wrench className="w-5 h-5 text-current" aria-hidden="true" />
                  )} 
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{maintenance.descricao}</h3>
                    <TypeBadge type={maintenance.tipo} />
                    {maintenance.concluida && (
                      <Badge className="status-success">
                        Concluída
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {maintenance.placa} - {maintenance.modelo}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="text-muted-foreground">Data</p>
                  <p className="font-medium">
                    {new Date(maintenance.data_man).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="text-muted-foreground">Valor</p>
                  <p className="font-medium">
                    R$ {maintenance.valor !== undefined && maintenance.valor !== null ? maintenance.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-'}
                  </p>
                </div>
              </div>

              {maintenance.km_manutencao && (
                <div>
                  <p className="text-muted-foreground">KM</p>
                  <p className="font-medium">{maintenance.km_manutencao !== undefined && maintenance.km_manutencao !== null ? maintenance.km_manutencao.toLocaleString('pt-BR') : '-'}</p>
                </div>
              )}

              {maintenance.fornecedor && (
                <div>
                  <p className="text-muted-foreground">Fornecedor</p>
                  <p className="font-medium">{maintenance.fornecedor}</p>
                </div>
              )}
            </div>

            {!maintenance.concluida && (
              <div className="flex gap-2 mt-4">
                <Button variant="default" size="sm" className="shadow-sm">
                  Marcar como Concluída
                </Button>
                <Button variant="outline" size="sm" className="shadow-sm">
                  Editar
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {maintenances?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhuma manutenção encontrada</p>
        </div>
      )}
    </div>
  )
}

function TypeBadge({ type }: { type: MaintenanceType }) {
  const colors = {
    [MaintenanceType.PREVENTIVE]: 'bg-primary/10 text-primary',
    [MaintenanceType.CORRECTIVE]: 'status-danger',
    [MaintenanceType.PREDICTIVE]: 'status-info',
    [MaintenanceType.REVISION]: 'status-warning',
  }

  const labels = {
    [MaintenanceType.PREVENTIVE]: 'Preventiva',
    [MaintenanceType.CORRECTIVE]: 'Corretiva',
    [MaintenanceType.PREDICTIVE]: 'Preditiva',
    [MaintenanceType.REVISION]: 'Revisão',
  }

  return (
    <Badge className={colors[type]}>
      {labels[type]}
    </Badge>
  )
}
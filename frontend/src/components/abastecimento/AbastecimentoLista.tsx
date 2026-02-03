// src/components/abastecimento/AbastecimentoLista.tsx
import { useState } from 'react'
import { Plus, Fuel, Calendar, DollarSign, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import AbastecimentoForm from './AbastecimentoForm'
import DetalhesAbastecimento from './DetalhesAbastecimento'
import Loading from '@/components/ui/loading'
import { useAbastecimentos, useDeleteAbastecimento } from '@/hooks/useAbastecimento'
import { useVehicles } from '@/hooks/useVeiculos'
import { FuelRecord } from '@/types'
import { FUEL_TYPES } from '@/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const FUEL_LABELS: Record<string, string> = {
  gasolina: 'Gasolina',
  etanol: 'Etanol',
  diesel: 'Diesel',
  gnv: 'GNV',
  flex: 'Flex',
}

export default function AbastecimentoLista() {
  const [tipoFilter, setTipoFilter] = useState<string>('')
  const [idVeiculoFilter, setIdVeiculoFilter] = useState<string>('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [abastToEdit, setAbastToEdit] = useState<FuelRecord | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedAbast, setSelectedAbast] = useState<FuelRecord | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [abastToDelete, setAbastToDelete] = useState<FuelRecord | null>(null)
  const deleteAbast = useDeleteAbastecimento()

  const params: Record<string, string | number | undefined> = {}
  if (tipoFilter) params.tipo_combustivel = tipoFilter
  if (idVeiculoFilter) params.id_veiculo = Number(idVeiculoFilter)

  const { data: abastecimentos, isLoading } = useAbastecimentos(
    Object.keys(params).length ? params : undefined
  )

  function handleTipoChange(value: string) {
    setTipoFilter(value === '__all__' ? '' : value)
  }

  function handleVeiculoChange(value: string) {
    setIdVeiculoFilter(value === '__all__' ? '' : value)
  }

  function openDeleteConfirm(abast: FuelRecord) {
    setAbastToDelete(abast)
    setDeleteConfirmOpen(true)
  }

  async function confirmDelete() {
    if (!abastToDelete) return
    try {
      await deleteAbast.mutateAsync(abastToDelete.id_abastecimento)
      setDeleteConfirmOpen(false)
      setAbastToDelete(null)
    } catch {
      // handled by hook
    }
  }

  const { data: vehicles } = useVehicles()

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
          <h1 className="text-3xl font-bold text-foreground">Abastecimentos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os abastecimentos da frota
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setAbastToEdit(null) }}>
          <Button size="sm" onClick={() => { setAbastToEdit(null); setIsDialogOpen(true) }}>
            <Plus className="w-4 h-4" aria-hidden="true" />
            Novo Abastecimento
          </Button>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>{abastToEdit ? 'Editar Abastecimento' : 'Novo Abastecimento'}</DialogTitle>
              <DialogDescription className="sr-only">
                Formulário para cadastro ou edição de abastecimento
              </DialogDescription>
            </DialogHeader>

            <AbastecimentoForm
              key={abastToEdit?.id_abastecimento ?? 'new'}
              initialData={abastToEdit}
              onSuccess={() => setIsDialogOpen(false)}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-wrap gap-4">
          <Select value={tipoFilter || '__all__'} onValueChange={handleTipoChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tipo combustível" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos</SelectItem>
              {FUEL_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{FUEL_LABELS[t] || t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={idVeiculoFilter || '__all__'} onValueChange={handleVeiculoChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Veículo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos</SelectItem>
              {vehicles?.map((v) => (
                <SelectItem key={v.id_veiculo} value={String(v.id_veiculo)}>{v.placa} — {v.modelo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* List */}
      <div className="space-y-4">
        {abastecimentos?.map((abast) => (
          <Card key={abast.id_abastecimento} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Fuel className="w-5 h-5 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">
                      {FUEL_LABELS[abast.tipo_combustivel] || abast.tipo_combustivel}
                    </h3>
                    <span className="text-muted-foreground">{abast.litros} L</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {abast.placa} - {abast.modelo}
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
                    {new Date(abast.data_abast).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="text-muted-foreground">Valor Total</p>
                  <p className="font-medium">
                    R$ {abast.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {abast.km_abastecimento != null && (
                <div>
                  <p className="text-muted-foreground">KM</p>
                  <p className="font-medium">{abast.km_abastecimento.toLocaleString('pt-BR')}</p>
                </div>
              )}

              <div>
                <p className="text-muted-foreground">Preço/L</p>
                <p className="font-medium">
                  R$ {(abast.valor_total / abast.litros).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                className="shadow-sm"
                onClick={() => {
                  setSelectedAbast(abast)
                  setDetailsOpen(true)
                }}
              >
                Detalhes
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="shadow-sm"
                onClick={() => {
                  setAbastToEdit(abast)
                  setIsDialogOpen(true)
                }}
              >
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                disabled={deleteAbast.isPending}
                onClick={() => openDeleteConfirm(abast)}
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
                Excluir
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {abastecimentos?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum abastecimento encontrado</p>
        </div>
      )}

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedAbast && (
            <DetalhesAbastecimento abastecimento={selectedAbast} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={(open) => { if (!open) setAbastToDelete(null); setDeleteConfirmOpen(open) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir abastecimento</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm pt-2">
            Deseja realmente excluir este abastecimento? Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={deleteAbast.isPending}
              onClick={confirmDelete}
            >
              {deleteAbast.isPending ? 'Excluindo...' : 'Sim, excluir'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

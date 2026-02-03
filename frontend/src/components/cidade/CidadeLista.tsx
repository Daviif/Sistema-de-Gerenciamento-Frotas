// src/components/cidade/CidadeLista.tsx
import { useState } from 'react'
import { Plus, MapPin, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import CidadeForm from './CidadeForm'
import DetalhesCidade from './DetalhesCidade'
import Loading from '@/components/ui/loading'
import { useCidades, useDeleteCidade } from '@/hooks/useCidade'
import { City } from '@/types'
import { UFS_BRASIL } from '@/lib/validators'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function CidadeLista() {
  const [ufFilter, setUfFilter] = useState<string>('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [cidadeToEdit, setCidadeToEdit] = useState<City | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedCidade, setSelectedCidade] = useState<City | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [cidadeToDelete, setCidadeToDelete] = useState<City | null>(null)
  const deleteCidade = useDeleteCidade()

  const { data: cidades, isLoading } = useCidades(ufFilter || undefined)

  function handleUfChange(value: string) {
    setUfFilter(value === '__all__' ? '' : value)
  }

  function openDeleteConfirm(cidade: City) {
    setCidadeToDelete(cidade)
    setDeleteConfirmOpen(true)
  }

  async function confirmDelete() {
    if (!cidadeToDelete) return
    try {
      await deleteCidade.mutateAsync(cidadeToDelete.id_cidade)
      setDeleteConfirmOpen(false)
      setCidadeToDelete(null)
    } catch {
      // handled by hook
    }
  }

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
          <h1 className="text-3xl font-bold text-foreground">Cidades</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as cidades para origem e destino das viagens
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setCidadeToEdit(null) }}>
          <Button size="sm" onClick={() => { setCidadeToEdit(null); setIsDialogOpen(true) }}>
            <Plus className="w-4 h-4" aria-hidden="true" />
            Nova Cidade
          </Button>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>{cidadeToEdit ? 'Editar Cidade' : 'Nova Cidade'}</DialogTitle>
              <DialogDescription className="sr-only">
                Formulário para cadastro ou edição de cidade
              </DialogDescription>
            </DialogHeader>

            <CidadeForm
              key={cidadeToEdit?.id_cidade ?? 'new'}
              initialData={cidadeToEdit}
              onSuccess={() => setIsDialogOpen(false)}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-wrap gap-4">
          <Select value={ufFilter || '__all__'} onValueChange={handleUfChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por UF" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas as UFs</SelectItem>
              {UFS_BRASIL.map((uf) => (
                <SelectItem key={uf} value={uf}>{uf}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cidades?.map((cidade) => (
          <Card key={cidade.id_cidade} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MapPin className="w-5 h-5 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{cidade.nome}</h3>
                  <p className="text-sm text-muted-foreground">{cidade.uf}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 shadow-sm"
                onClick={() => {
                  setSelectedCidade(cidade)
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
                  setCidadeToEdit(cidade)
                  setIsDialogOpen(true)
                }}
              >
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                disabled={deleteCidade.isPending}
                onClick={() => openDeleteConfirm(cidade)}
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {cidades?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhuma cidade encontrada</p>
        </div>
      )}

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedCidade && (
            <DetalhesCidade cidade={selectedCidade} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={(open) => { if (!open) setCidadeToDelete(null); setDeleteConfirmOpen(open) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir cidade</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm pt-2">
            Deseja realmente excluir a cidade {cidadeToDelete?.nome} ({cidadeToDelete?.uf})? 
            Não é possível excluir cidades que possuem viagens cadastradas.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={deleteCidade.isPending}
              onClick={confirmDelete}
            >
              {deleteCidade.isPending ? 'Excluindo...' : 'Sim, excluir'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

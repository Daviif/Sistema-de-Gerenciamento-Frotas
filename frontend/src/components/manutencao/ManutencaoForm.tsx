import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useCreateMaintenance } from '@/hooks/useManutencao'
import { useVehicles } from '@/hooks/useVeiculos'
import { MaintenanceType, NewMaintenance } from '@/types'

type Props = { onSuccess?: () => void; onCancel?: () => void }

export default function ManutencaoForm({ onSuccess, onCancel }: Props) {
  const [form, setForm] = useState<Partial<NewMaintenance>>({ data_man: new Date().toISOString().slice(0, 10) })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const create = useCreateMaintenance()
  const { data: vehicles } = useVehicles()

  function update<K extends keyof NewMaintenance>(key: K, value: NewMaintenance[K] | undefined) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function isValidDate(s?: string) {
    if (!s) return false
    const d = new Date(s)
    return !isNaN(d.getTime())
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    const required = ['data_man', 'tipo', 'descricao', 'id_veiculo'] as Array<keyof NewMaintenance>
    const newErrors: Record<string, string> = {}
    for (const key of required) {
      if (!form[key]) newErrors[key] = 'Campo obrigatório'
    }

    if (!isValidDate(String(form.data_man))) newErrors.data_man = 'Data inválida'

    if (form.valor !== undefined && form.valor !== null) {
      const v = Number(form.valor)
      if (!Number.isFinite(v) || v < 0) newErrors.valor = 'Valor deve ser >= 0'
    }

    const vehicle = vehicles?.find((v) => v.id_veiculo === Number(form.id_veiculo))
    if (form.km_manutencao !== undefined && form.km_manutencao !== null) {
      const km = Number(form.km_manutencao)
      if (!Number.isFinite(km) || km < 0) newErrors.km_manutencao = 'KM inválido'
      if (vehicle && km < (vehicle.km_atual ?? 0)) newErrors.km_manutencao = 'KM não pode ser menor que o atual do veículo'
    }

    if (Object.keys(newErrors).length) {
      setErrors(newErrors)
      return
    }

    const payload: NewMaintenance = {
      data_man: String(form.data_man),
      tipo: form.tipo as MaintenanceType,
      descricao: String(form.descricao),
      valor: form.valor !== undefined ? Number(form.valor) : 0,
      id_veiculo: Number(form.id_veiculo),
      km_manutencao: form.km_manutencao !== undefined ? Number(form.km_manutencao) : undefined,
      fornecedor: form.fornecedor ? String(form.fornecedor) : undefined,
    }

    try {
      await create.mutateAsync(payload)
      setForm({ data_man: new Date().toISOString().slice(0, 10) })
      onSuccess?.()
    } catch {
      // handled by hook
    }
  }

  const creating = create.status === 'pending'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-8">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <Label htmlFor="manutencao-data" className="mb-2">Data</Label>
            <Input id="manutencao-data" name="data_man" className="py-3" type="date" value={form.data_man || ''} onChange={(e) => update('data_man', e.target.value)} required />
            {errors.data_man && <p className="text-danger text-sm mt-1">{errors.data_man}</p>}
          </div>

          <div>
            <Label htmlFor="manutencao-tipo" className="mb-2">Tipo</Label>
            <Select value={form.tipo || ''} onValueChange={(v) => update('tipo', v as MaintenanceType)}>
              <SelectTrigger id="manutencao-tipo" className="py-3">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={MaintenanceType.PREVENTIVE}>Preventiva</SelectItem>
                <SelectItem value={MaintenanceType.CORRECTIVE}>Corretiva</SelectItem>
                <SelectItem value={MaintenanceType.PREDICTIVE}>Preditiva</SelectItem>
                <SelectItem value={MaintenanceType.REVISION}>Revisão</SelectItem>
              </SelectContent>
            </Select>
            {errors.tipo && <p className="text-danger text-sm mt-1">{errors.tipo}</p>}
          </div>

          <div>
            <Label htmlFor="manutencao-descricao" className="mb-2">Descrição</Label>
            <Input id="manutencao-descricao" name="descricao" autoFocus className="py-3" value={form.descricao || ''} onChange={(e) => update('descricao', e.target.value)} required />
            {errors.descricao && <p className="text-danger text-sm mt-1">{errors.descricao}</p>}
          </div>

          <div>
            <Label htmlFor="manutencao-valor" className="mb-2">Valor (R$)</Label>
            <Input id="manutencao-valor" name="valor" className="py-3" type="number" value={form.valor ?? ''} onChange={(e) => update('valor', e.target.value ? Number(e.target.value) : undefined)} />
          </div>

          <div>
            <Label htmlFor="manutencao-veiculo" className="mb-2">Veículo</Label>
            <Select value={String(form.id_veiculo || '')} onValueChange={(v) => update('id_veiculo', Number(v))}>
              <SelectTrigger id="manutencao-veiculo" className="py-3">
                <SelectValue placeholder="Selecione o veículo" />
              </SelectTrigger>
              <SelectContent>
                {vehicles?.map((v) => (
                  <SelectItem key={v.id_veiculo} value={String(v.id_veiculo)}>{v.placa} — {v.modelo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.id_veiculo && <p className="text-danger text-sm mt-1">{errors.id_veiculo}</p>}
          </div>

          <div>
            <Label htmlFor="manutencao-km" className="mb-2">KM Manutenção</Label>
            <Input id="manutencao-km" name="km_manutencao" className="py-3" type="number" value={form.km_manutencao ?? ''} onChange={(e) => update('km_manutencao', e.target.value ? Number(e.target.value) : undefined)} />
          </div>

          <div>
            <Label htmlFor="manutencao-fornecedor" className="mb-2">Fornecedor</Label>
            <Input id="manutencao-fornecedor" name="fornecedor" className="py-3" value={form.fornecedor || ''} onChange={(e) => update('fornecedor', e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" type="button" onClick={() => onCancel?.()} size="sm">Cancelar</Button>
          <Button type="submit" disabled={creating} className="shadow-sm">
            {creating ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </Card>
    </form>
  )
}

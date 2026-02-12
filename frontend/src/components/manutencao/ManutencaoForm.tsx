import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useCreateMaintenance, useUpdateMaintenance } from '@/hooks/useManutencao'
import { useVehicles } from '@/hooks/useVeiculos'
import { MaintenanceType, NewMaintenance, Maintenance } from '@/types'
import { toast } from 'sonner'

type Props = { onSuccess?: () => void; onCancel?: () => void; initialData?: Maintenance | null }

function getInitialForm(initialData: Maintenance | null | undefined): Partial<NewMaintenance> {
  if (initialData) {
    const dataMan = initialData.data_man
    const dataManStr = typeof dataMan === 'string' ? dataMan.slice(0, 10) : new Date().toISOString().slice(0, 10)
    return {
      data_man: dataManStr,
      tipo: initialData.tipo,
      descricao: initialData.descricao,
      valor: initialData.valor,
      id_veiculo: initialData.id_veiculo,
      km_manutencao: initialData.km_manutencao,
      fornecedor: initialData.fornecedor,
    }
  }
  return { data_man: new Date().toISOString().slice(0, 10) }
}

export default function ManutencaoForm({ onSuccess, onCancel, initialData }: Props) {
  const isEdit = !!initialData
  const [form, setForm] = useState<Partial<NewMaintenance>>(() => getInitialForm(initialData))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const formRef = useRef<Partial<NewMaintenance>>(getInitialForm(initialData))

  const create = useCreateMaintenance()
  const updateMutation = useUpdateMaintenance()
  const { data: vehicles } = useVehicles()

  useEffect(() => {
    const next = getInitialForm(initialData)
    setForm(next)
    formRef.current = next
  }, [initialData])

  function update<K extends keyof NewMaintenance>(key: K, value: NewMaintenance[K] | undefined) {
    const next = { ...formRef.current, [key]: value }
    formRef.current = next
    setForm(next)
  }

  function isValidDate(s?: string) {
    if (!s) return false
    const d = new Date(s)
    return !isNaN(d.getTime())
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    const formData = formRef.current

    const required: Array<keyof NewMaintenance> = ['data_man', 'tipo', 'descricao', 'id_veiculo']
    const newErrors: Record<string, string> = {}
    for (const key of required) {
      const val = formData[key]
      if (val === undefined || val === null || val === '')
        newErrors[key] = 'Campo obrigatório'
      else if (key === 'id_veiculo' && !Number.isFinite(Number(val)))
        newErrors[key] = 'Campo obrigatório'
    }

    if (!isValidDate(String(formData.data_man))) newErrors.data_man = 'Data inválida'

    if (formData.valor !== undefined && formData.valor !== null) {
      const v = Number(formData.valor)
      if (!Number.isFinite(v) || v < 0) newErrors.valor = 'Valor deve ser >= 0'
    }

    const vehicle = vehicles?.find((v) => v.id_veiculo === Number(formData.id_veiculo))
    if (formData.km_manutencao !== undefined && formData.km_manutencao !== null && formData.km_manutencao !== '') {
      const km = Number(formData.km_manutencao)
      if (!Number.isFinite(km) || km < 0) newErrors.km_manutencao = 'KM inválido'
      if (vehicle && km < (vehicle.km_atual ?? 0)) newErrors.km_manutencao = 'KM não pode ser menor que o atual do veículo'
    }

    if (Object.keys(newErrors).length) {
      setErrors(newErrors)
      const camposFaltantes = Object.keys(newErrors).join(', ')
      toast.error(`Erros encontrados: ${camposFaltantes}`)
      return
    }

    const valorNum = formData.valor != null ? Number(formData.valor) : (isEdit ? undefined : 0)
    const kmNum = formData.km_manutencao != null ? Number(formData.km_manutencao) : undefined
    const basePayload = {
      data_man: String(formData.data_man),
      tipo: formData.tipo as MaintenanceType,
      descricao: String(formData.descricao),
      id_veiculo: Number(formData.id_veiculo),
      km_manutencao: kmNum,
      fornecedor: formData.fornecedor ? String(formData.fornecedor) : undefined,
    }
    try {
      if (isEdit && initialData) {
        const updateData = { ...basePayload, ...(valorNum != null ? { valor: valorNum } : {}) }
        await updateMutation.mutateAsync({ id: initialData.id_manutencao, data: updateData })
      } else {
        const createData: NewMaintenance = { ...basePayload, valor: valorNum ?? 0 }
        await create.mutateAsync(createData)
      }
      setForm({ data_man: new Date().toISOString().slice(0, 10) })
      onSuccess?.()
    } catch {
      // handled by hook
    }
  }

  const creating = create.status === 'pending' || updateMutation.status === 'pending'

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
            <Input id="manutencao-km" name="km_manutencao" className="py-3" type="number" value={form.km_manutencao ?? ''} onChange={(e) => update('km_manutencao', e.target.value !== '' ? Number(e.target.value) : undefined)} />
          </div>

          <div>
            <Label htmlFor="manutencao-fornecedor" className="mb-2">Fornecedor</Label>
            <Input id="manutencao-fornecedor" name="fornecedor" className="py-3" value={form.fornecedor || ''} onChange={(e) => update('fornecedor', e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" type="button" onClick={() => onCancel?.()} size="sm">Cancelar</Button>
          <Button
            type="button"
            disabled={creating}
            className="shadow-sm"
            onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent<HTMLFormElement>)}
          >
            {creating ? 'Salvando...' : isEdit ? 'Atualizar' : 'Salvar'}
          </Button>
        </div>
      </Card>
    </form>
  )
}

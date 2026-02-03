import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useCreateAbastecimento, useUpdateAbastecimento } from '@/hooks/useAbastecimento'
import { useVehicles } from '@/hooks/useVeiculos'
import { FuelRecord, NewFuelRecord, FUEL_TYPES } from '@/types'
import { toast } from 'sonner'

type Props = { onSuccess?: () => void; onCancel?: () => void; initialData?: FuelRecord | null }

const FUEL_LABELS: Record<string, string> = {
  gasolina: 'Gasolina',
  etanol: 'Etanol',
  diesel: 'Diesel',
  gnv: 'GNV',
  flex: 'Flex',
}

function getInitialForm(initialData: FuelRecord | null | undefined): Partial<NewFuelRecord> {
  if (initialData) {
    const dataAbast = initialData.data_abast
    const dataStr = typeof dataAbast === 'string' ? dataAbast.slice(0, 10) : new Date().toISOString().slice(0, 10)
    return {
      data_abast: dataStr,
      tipo_combustivel: initialData.tipo_combustivel,
      litros: initialData.litros,
      valor_total: initialData.valor_total,
      id_veiculo: initialData.id_veiculo,
      km_abastecimento: initialData.km_abastecimento,
    }
  }
  return { data_abast: new Date().toISOString().slice(0, 10) }
}

export default function AbastecimentoForm({ onSuccess, onCancel, initialData }: Props) {
  const isEdit = !!initialData
  const [form, setForm] = useState<Partial<NewFuelRecord>>(() => getInitialForm(initialData))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const create = useCreateAbastecimento()
  const updateMutation = useUpdateAbastecimento()
  const { data: vehicles } = useVehicles()

  useEffect(() => {
    setForm(getInitialForm(initialData))
  }, [initialData])

  function update<K extends keyof NewFuelRecord>(key: K, value: NewFuelRecord[K] | undefined) {
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

    const required: Array<keyof NewFuelRecord> = ['data_abast', 'tipo_combustivel', 'litros', 'valor_total', 'id_veiculo']
    const newErrors: Record<string, string> = {}
    for (const key of required) {
      const val = form[key]
      if (val === undefined || val === null || val === '')
        newErrors[key] = 'Campo obrigatório'
      else if ((key === 'id_veiculo') && !Number.isFinite(Number(val)))
        newErrors[key] = 'Campo obrigatório'
    }

    if (!isValidDate(String(form.data_abast))) newErrors.data_abast = 'Data inválida'

    const litros = Number(form.litros)
    if (form.litros !== undefined && form.litros !== null && (!Number.isFinite(litros) || litros <= 0))
      newErrors.litros = 'Litros deve ser positivo'

    const valor = Number(form.valor_total)
    if (form.valor_total !== undefined && form.valor_total !== null && (!Number.isFinite(valor) || valor <= 0))
      newErrors.valor_total = 'Valor deve ser positivo'

    const vehicle = vehicles?.find((v) => v.id_veiculo === Number(form.id_veiculo))
    if (form.km_abastecimento != null) {
      const km = Number(form.km_abastecimento)
      if (!Number.isFinite(km) || km < 0) newErrors.km_abastecimento = 'KM inválido'
      if (vehicle && km < (vehicle.km_atual ?? 0))
        newErrors.km_abastecimento = 'KM não pode ser menor que o atual do veículo'
    }

    if (Object.keys(newErrors).length) {
      setErrors(newErrors)
      toast.error('Preencha os campos obrigatórios e corrija os erros.')
      return
    }

    const payload: NewFuelRecord = {
      data_abast: String(form.data_abast),
      tipo_combustivel: String(form.tipo_combustivel).toLowerCase(),
      litros: Number(form.litros),
      valor_total: Number(form.valor_total),
      id_veiculo: Number(form.id_veiculo),
      km_abastecimento: form.km_abastecimento != null ? Number(form.km_abastecimento) : undefined,
    }

    try {
      if (isEdit && initialData) {
        await updateMutation.mutateAsync({ id: initialData.id_abastecimento, data: payload })
      } else {
        await create.mutateAsync(payload)
      }
      setForm({ data_abast: new Date().toISOString().slice(0, 10) })
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
            <Label htmlFor="abast-data" className="mb-2">Data</Label>
            <Input id="abast-data" name="data_abast" className="py-3" type="date" value={form.data_abast || ''} onChange={(e) => update('data_abast', e.target.value)} required />
            {errors.data_abast && <p className="text-danger text-sm mt-1">{errors.data_abast}</p>}
          </div>

          <div>
            <Label htmlFor="abast-tipo" className="mb-2">Tipo de Combustível</Label>
            <Select value={form.tipo_combustivel || ''} onValueChange={(v) => update('tipo_combustivel', v)}>
              <SelectTrigger id="abast-tipo" className="py-3">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {FUEL_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{FUEL_LABELS[t] || t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.tipo_combustivel && <p className="text-danger text-sm mt-1">{errors.tipo_combustivel}</p>}
          </div>

          <div>
            <Label htmlFor="abast-litros" className="mb-2">Litros</Label>
            <Input id="abast-litros" name="litros" className="py-3" type="number" step="0.01" min="0" value={form.litros ?? ''} onChange={(e) => update('litros', e.target.value ? Number(e.target.value) : undefined)} required />
            {errors.litros && <p className="text-danger text-sm mt-1">{errors.litros}</p>}
          </div>

          <div>
            <Label htmlFor="abast-valor" className="mb-2">Valor Total (R$)</Label>
            <Input id="abast-valor" name="valor_total" className="py-3" type="number" step="0.01" min="0" value={form.valor_total ?? ''} onChange={(e) => update('valor_total', e.target.value ? Number(e.target.value) : undefined)} required />
            {errors.valor_total && <p className="text-danger text-sm mt-1">{errors.valor_total}</p>}
          </div>

          <div>
            <Label htmlFor="abast-veiculo" className="mb-2">Veículo</Label>
            <Select value={String(form.id_veiculo || '')} onValueChange={(v) => update('id_veiculo', Number(v))}>
              <SelectTrigger id="abast-veiculo" className="py-3">
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
            <Label htmlFor="abast-km" className="mb-2">KM Abastecimento (opcional)</Label>
            <Input id="abast-km" name="km_abastecimento" className="py-3" type="number" value={form.km_abastecimento ?? ''} onChange={(e) => update('km_abastecimento', e.target.value ? Number(e.target.value) : undefined)} />
            {errors.km_abastecimento && <p className="text-danger text-sm mt-1">{errors.km_abastecimento}</p>}
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

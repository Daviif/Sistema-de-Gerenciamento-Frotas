import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { useCreateVehicle, useUpdateVehicle } from '@/hooks/useVeiculos'
import { NewVehicle, Vehicle } from '@/types'

type Props = {
  onSuccess?: () => void
  onCancel?: () => void
  initialData?: Vehicle | null
}

export default function VeiculosForm({ onSuccess, onCancel, initialData }: Props) {
  const isEdit = !!initialData
  const [form, setForm] = useState<Partial<NewVehicle>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const create = useCreateVehicle()
  const updateMutation = useUpdateVehicle()

  useEffect(() => {
    if (initialData) {
      setForm({
        placa: initialData.placa,
        marca: initialData.marca,
        modelo: initialData.modelo,
        ano: initialData.ano,
        tipo: initialData.tipo,
        km_atual: initialData.km_atual ?? undefined,
        capacidade_tanque: initialData.capacidade_tanque ?? undefined,
      })
    } else {
      setForm({})
    }
  }, [initialData])

  function update<K extends keyof NewVehicle>(key: K, value: NewVehicle[K] | undefined) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function validatePlaca(placa = '') {
    // Accept old pattern ABC-1234 and simple alphanumeric (basic sanitization)
    const p = String(placa).toUpperCase().replace(/[^A-Z0-9-]/g, '')
    const ok = /^[A-Z]{3}-?\d{4}$/.test(p) || /^[A-Z0-9]{5,8}$/.test(p)
    return { ok, placa: p }
  }

  function validateForm() {
    const required = ['placa', 'marca', 'modelo', 'ano', 'tipo'] as Array<keyof NewVehicle>
    const newErrors: Record<string, string> = {}

    for (const key of required) {
      if (!form[key]) newErrors[key] = 'Campo obrigatório'
    }

    // placa validation
    const { ok } = validatePlaca(form.placa)
    if (!ok) newErrors.placa = 'Placa inválida'

    // ano
    const ano = Number(form.ano)
    const currentYear = new Date().getFullYear()
    if (!Number.isFinite(ano) || ano < 1900 || ano > currentYear + 1) {
      newErrors.ano = 'Ano inválido'
    }

    // km and tanque
    if (form.km_atual !== undefined && form.km_atual !== null) {
      const km = Number(form.km_atual)
      if (!Number.isFinite(km) || km < 0) newErrors.km_atual = 'KM deve ser >= 0'
    }

    if (form.capacidade_tanque !== undefined && form.capacidade_tanque !== null) {
      const cap = Number(form.capacidade_tanque)
      if (!Number.isFinite(cap) || cap <= 0) newErrors.capacidade_tanque = 'Capacidade deve ser positiva'
    }

    return newErrors
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    const newErrors = validateForm()
    if (Object.keys(newErrors).length) {
      setErrors(newErrors)
      return
    }

    const payload: NewVehicle = {
      placa: validatePlaca(String(form.placa)).placa,
      marca: String(form.marca),
      modelo: String(form.modelo),
      ano: Number(form.ano),
      tipo: String(form.tipo),
      km_atual: form.km_atual ? Number(form.km_atual) : undefined,
      capacidade_tanque: form.capacidade_tanque ? Number(form.capacidade_tanque) : undefined,
    }

    try {
      if (isEdit && initialData) {
        await updateMutation.mutateAsync({ id: initialData.id_veiculo, data: payload })
      } else {
        await create.mutateAsync(payload)
      }
      setForm({})
      onSuccess?.()
    } catch {
      // error handled by hook toast
    }
  }

  const creating = create.status === 'pending' || updateMutation.status === 'pending'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-8">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <Label htmlFor="veiculo-placa" className="mb-2">Placa</Label>
            <Input id="veiculo-placa" name="placa" autoFocus className="py-3" value={form.placa || ''} onChange={(e) => update('placa', e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))} required readOnly={isEdit} />
            {errors.placa && <p className="text-danger text-sm mt-1">{errors.placa}</p>}
          </div>

          <div>
            <Label htmlFor="veiculo-marca" className="mb-2">Marca</Label>
            <Input id="veiculo-marca" name="marca" className="py-3" value={form.marca || ''} onChange={(e) => update('marca', e.target.value)} />
            {errors.marca && <p className="text-danger text-sm mt-1">{errors.marca}</p>}
          </div>

          <div>
            <Label htmlFor="veiculo-modelo" className="mb-2">Modelo</Label>
            <Input id="veiculo-modelo" name="modelo" className="py-3" value={form.modelo || ''} onChange={(e) => update('modelo', e.target.value)} />
            {errors.modelo && <p className="text-danger text-sm mt-1">{errors.modelo}</p>}
          </div>

          <div>
            <Label htmlFor="veiculo-ano" className="mb-2">Ano</Label>
            <Input id="veiculo-ano" name="ano" className="py-3" type="number" value={form.ano ?? ''} onChange={(e) => update('ano', Number(e.target.value))} required />
            {errors.ano && <p className="text-danger text-sm mt-1">{errors.ano}</p>}
          </div>

          <div>
            <Label htmlFor="veiculo-tipo" className="mb-2">Tipo</Label>
            <Input id="veiculo-tipo" name="tipo" className="py-3" value={form.tipo || ''} onChange={(e) => update('tipo', e.target.value)} required />
            {errors.tipo && <p className="text-danger text-sm mt-1">{errors.tipo}</p>}
          </div>

          <div>
            <Label htmlFor="veiculo-km" className="mb-2">KM Atual</Label>
            <Input id="veiculo-km" name="km_atual" className="py-3" type="number" value={form.km_atual ?? ''} onChange={(e) => update('km_atual', Number(e.target.value))} />
          </div>

          <div>
            <Label htmlFor="veiculo-capacidade" className="mb-2">Capacidade do Tanque (L)</Label>
            <Input id="veiculo-capacidade" name="capacidade_tanque" className="py-3" type="number" value={form.capacidade_tanque ?? ''} onChange={(e) => update('capacidade_tanque', Number(e.target.value))} />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" type="button" onClick={() => onCancel?.()} size="sm">Cancelar</Button>
          <Button type="submit" disabled={creating} className="shadow-sm">
            {creating ? 'Salvando...' : isEdit ? 'Atualizar' : 'Salvar'}
          </Button>
        </div>
      </Card>
    </form>
  )
}

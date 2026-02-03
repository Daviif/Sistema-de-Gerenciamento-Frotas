import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { useCreateDriver, useUpdateDriver } from '@/hooks/useMotorista'
import { NewDriver, Driver } from '@/types'
import { validarCPF, validarCNH, validarCategoriaCNH } from '@/lib/validators'

type Props = {
  onSuccess?: () => void
  onCancel?: () => void
  initialData?: Driver | null
}

export default function MotoristaForm({ onSuccess, onCancel, initialData }: Props) {
  const isEdit = !!initialData
  const [form, setForm] = useState<Partial<NewDriver>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const create = useCreateDriver()
  const updateMutation = useUpdateDriver()

  useEffect(() => {
    if (initialData) {
      setForm({
        nome: initialData.nome,
        cpf: initialData.cpf,
        cnh: initialData.cnh,
        cat_cnh: initialData.cat_cnh,
        validade_cnh: initialData.validade_cnh,
      })
    } else {
      setForm({})
    }
  }, [initialData])

  function update<K extends keyof NewDriver>(key: K, value: NewDriver[K] | undefined) {
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

    const required = ['nome', 'cpf', 'cnh', 'cat_cnh', 'validade_cnh'] as Array<keyof NewDriver>
    const newErrors: Record<string, string> = {}
    for (const key of required) {
      if (!form[key]) newErrors[key] = 'Campo obrigatório'
    }

    // cpf/cnh format + logical validation
    const cpf = String(form.cpf || '')
    if (!/^\d{11}$/.test(cpf) || !validarCPF(cpf)) newErrors.cpf = 'CPF inválido'

    const cnh = String(form.cnh || '')
    if (!/^\d{11}$/.test(cnh) || !validarCNH(cnh)) newErrors.cnh = 'CNH inválida'

    const cat = String(form.cat_cnh || '').toUpperCase()
    if (!validarCategoriaCNH(cat)) newErrors.cat_cnh = 'Categoria inválida'

    if (!isValidDate(String(form.validade_cnh))) {
      newErrors.validade_cnh = 'Data inválida'
    } else {
      const exp = new Date(String(form.validade_cnh))
      const today = new Date()
      // consider validity at least tomorrow
      if (exp <= today) newErrors.validade_cnh = 'CNH deve ter validade no futuro'
    }

    if (Object.keys(newErrors).length) {
      setErrors(newErrors)
      return
    }

    const payload: NewDriver = {
      nome: String(form.nome),
      cpf: cpf,
      cnh: cnh,
      cat_cnh: cat,
      validade_cnh: String(form.validade_cnh),
    }

    try {
      if (isEdit && initialData) {
        await updateMutation.mutateAsync({ cpf: initialData.cpf, data: payload })
      } else {
        await create.mutateAsync(payload)
      }
      setForm({})
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
            <Label htmlFor="motorista-nome" className="mb-2">Nome</Label>
            <Input id="motorista-nome" name="nome" autoFocus className="py-3" value={form.nome || ''} onChange={(e) => update('nome', e.target.value)} required />
            {errors.nome && <p className="text-danger text-sm mt-1">{errors.nome}</p>}
          </div>

          <div>
            <Label htmlFor="motorista-cpf" className="mb-2">CPF</Label>
            <Input id="motorista-cpf" name="cpf" className="py-3" value={form.cpf || ''} onChange={(e) => update('cpf', e.target.value.replace(/\D/g, ''))} required readOnly={isEdit} />
            {errors.cpf && <p className="text-danger text-sm mt-1">{errors.cpf}</p>}
          </div>

          <div>
            <Label htmlFor="motorista-cnh" className="mb-2">CNH</Label>
            <Input id="motorista-cnh" name="cnh" className="py-3" value={form.cnh || ''} onChange={(e) => update('cnh', e.target.value.replace(/\D/g, ''))} required />
            {errors.cnh && <p className="text-danger text-sm mt-1">{errors.cnh}</p>}
          </div>

          <div>
            <Label htmlFor="motorista-cat" className="mb-2">Categoria CNH</Label>
            <Input id="motorista-cat" name="cat_cnh" className="py-3" value={form.cat_cnh || ''} onChange={(e) => update('cat_cnh', e.target.value.toUpperCase())} required />
            {errors.cat_cnh && <p className="text-danger text-sm mt-1">{errors.cat_cnh}</p>}
          </div>

          <div>
            <Label htmlFor="motorista-validade" className="mb-2">Validade CNH</Label>
            <Input id="motorista-validade" name="validade_cnh" className="py-3" type="date" value={form.validade_cnh || ''} onChange={(e) => update('validade_cnh', e.target.value)} required />
            {errors.validade_cnh && <p className="text-danger text-sm mt-1">{errors.validade_cnh}</p>}
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

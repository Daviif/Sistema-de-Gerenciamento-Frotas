import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useCreateCidade, useUpdateCidade } from '@/hooks/useCidade'
import { City, NewCity } from '@/types'
import { validarUF, UFS_BRASIL } from '@/lib/validators'
import { toast } from 'sonner'

type Props = { onSuccess?: () => void; onCancel?: () => void; initialData?: City | null }

function getInitialForm(initialData: City | null | undefined): Partial<NewCity> {
  if (initialData) {
    return {
      nome: initialData.nome,
      uf: initialData.uf,
    }
  }
  return {}
}

export default function CidadeForm({ onSuccess, onCancel, initialData }: Props) {
  const isEdit = !!initialData
  const [form, setForm] = useState<Partial<NewCity>>(() => getInitialForm(initialData))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const create = useCreateCidade()
  const updateMutation = useUpdateCidade()

  useEffect(() => {
    setForm(getInitialForm(initialData))
  }, [initialData])

  function update<K extends keyof NewCity>(key: K, value: NewCity[K] | undefined) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    const newErrors: Record<string, string> = {}

    if (!form.nome || String(form.nome).trim() === '')
      newErrors.nome = 'Nome é obrigatório'

    if (!form.uf || String(form.uf).trim() === '')
      newErrors.uf = 'UF é obrigatória'
    else if (!validarUF(String(form.uf)))
      newErrors.uf = 'UF inválida'

    if (Object.keys(newErrors).length) {
      setErrors(newErrors)
      toast.error('Preencha os campos obrigatórios e corrija os erros.')
      return
    }

    const payload: NewCity = {
      nome: String(form.nome).trim(),
      uf: String(form.uf).toUpperCase(),
    }

    try {
      if (isEdit && initialData) {
        await updateMutation.mutateAsync({ id: initialData.id_cidade, data: payload })
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
            <Label htmlFor="cidade-nome" className="mb-2">Nome</Label>
            <Input id="cidade-nome" name="nome" autoFocus className="py-3" value={form.nome || ''} onChange={(e) => update('nome', e.target.value)} required />
            {errors.nome && <p className="text-danger text-sm mt-1">{errors.nome}</p>}
          </div>

          <div>
            <Label htmlFor="cidade-uf" className="mb-2">UF</Label>
            <Select value={form.uf || ''} onValueChange={(v) => update('uf', v)}>
              <SelectTrigger id="cidade-uf" className="py-3">
                <SelectValue placeholder="Selecione o estado" />
              </SelectTrigger>
              <SelectContent>
                {UFS_BRASIL.map((uf) => (
                  <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.uf && <p className="text-danger text-sm mt-1">{errors.uf}</p>}
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

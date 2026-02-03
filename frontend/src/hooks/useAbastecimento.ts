import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { FuelRecord, NewFuelRecord } from '@/types'
import { toast } from 'sonner'

const QUERY_KEYS = {
  all: ['abastecimentos'] as const,
  list: (params?: Record<string, unknown>) => ['abastecimentos', params] as const,
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const res = (error as { response?: { data?: { error?: string } } }).response
    if (res?.data?.error) return res.data.error
  }
  return error instanceof Error ? error.message : 'Erro na operação'
}

export function useAbastecimentos(params?: { id_veiculo?: number; tipo_combustivel?: string; data_inicio?: string; data_fim?: string }) {
  return useQuery({
    queryKey: QUERY_KEYS.list(params),
    queryFn: async () => {
      const { data } = await api.get<FuelRecord[]>('/abastecimento', { params: params || {} })
      return data
    },
  })
}

export function useAbastecimento(id: number) {
  return useQuery({
    queryKey: [...QUERY_KEYS.all, id],
    queryFn: async () => {
      const { data } = await api.get<FuelRecord>(`/abastecimento/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateAbastecimento() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (abastecimento: NewFuelRecord) => {
      const { data } = await api.post<FuelRecord>('/abastecimento', abastecimento)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all })
      toast.success('Abastecimento cadastrado com sucesso!')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })
}

export function useUpdateAbastecimento() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<NewFuelRecord> }) => {
      const { data: result } = await api.put<FuelRecord>(`/abastecimento/${id}`, data)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all })
      toast.success('Abastecimento atualizado com sucesso!')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })
}

export function useDeleteAbastecimento() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/abastecimento/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all })
      toast.success('Abastecimento excluído com sucesso!')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })
}

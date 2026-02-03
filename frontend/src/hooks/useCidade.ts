import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { City, NewCity } from '@/types'
import { toast } from 'sonner'

const QUERY_KEYS = {
  all: ['cidades'] as const,
  list: (uf?: string) => (uf ? ['cidades', uf] : ['cidades']),
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const res = (error as { response?: { data?: { error?: string } } }).response
    if (res?.data?.error) return res.data.error
  }
  return error instanceof Error ? error.message : 'Erro na operação'
}

export function useCidades(uf?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.list(uf),
    queryFn: async () => {
      const { data } = await api.get<City[]>('/cidade', {
        params: uf ? { uf } : undefined
      })
      return data
    },
  })
}

export function useCidade(id: number) {
  return useQuery({
    queryKey: [...QUERY_KEYS.all, id],
    queryFn: async () => {
      const { data } = await api.get<City>(`/cidade/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateCidade() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (cidade: NewCity) => {
      const { data } = await api.post<City>('/cidade', cidade)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['cities'] })
      toast.success('Cidade cadastrada com sucesso!')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })
}

export function useUpdateCidade() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<NewCity> }) => {
      const { data: result } = await api.put<City>(`/cidade/${id}`, data)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['cities'] })
      toast.success('Cidade atualizada com sucesso!')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })
}

export function useDeleteCidade() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/cidade/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['cities'] })
      toast.success('Cidade excluída com sucesso!')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })
}

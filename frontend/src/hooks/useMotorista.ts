// src/hooks/useDrivers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Driver, NewDriver } from '@/types'
import { toast } from 'sonner'

const QUERY_KEYS = {
  all: ['drivers'] as const,
  detail: (cpf: string) => ['drivers', cpf] as const,
  available: ['drivers', 'available'] as const,
}

export function useDrivers(status?: string) {
  return useQuery({
    queryKey: status ? [...QUERY_KEYS.all, status] : QUERY_KEYS.all,
    queryFn: async () => {
      const { data } = await api.get<Driver[]>('/motoristas', {
        params: status ? { status } : undefined
      })
      return data
    },
  })
}

export function useDriver(cpf: string) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(cpf),
    queryFn: async () => {
      const { data } = await api.get<Driver>(`/motoristas/${cpf}`)
      return data
    },
    enabled: !!cpf,
  })
}

export function useAvailableDrivers() {
  return useQuery({
    queryKey: QUERY_KEYS.available,
    queryFn: async () => {
      const { data } = await api.get<Driver[]>('/motoristas/disponiveis/lista')
      return data
    },
  })
}

export function useCreateDriver() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (driver: NewDriver) => {
      const { data } = await api.post<Driver>('/motoristas', driver)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all })
      toast.success('Motorista cadastrado com sucesso!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao cadastrar motorista')
    },
  })
}

export function useUpdateDriver() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ cpf, data }: { cpf: string; data: Partial<NewDriver> }) => {
      const response = await api.put<Driver>(`/motoristas/${cpf}`, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(variables.cpf) })
      toast.success('Motorista atualizado com sucesso!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao atualizar motorista')
    },
  })
}

export function useDeleteDriver() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (cpf: string) => {
      await api.delete(`/motoristas/${cpf}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all })
      toast.success('Motorista excluído com sucesso!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao excluir motorista')
    },
  })
}
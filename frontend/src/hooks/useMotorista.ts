// src/hooks/useDrivers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Driver, NewDriver } from '@/types'
import { toast } from 'sonner'

type DeleteDriverResponse = {
  message: string
  motorista?: Driver
}

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
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Erro ao cadastrar motorista'
      toast.error(message)
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
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar motorista'
      toast.error(message)
    },
  })
}

export function useDeleteDriver() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (cpf: string) => {
      const { data } = await api.delete<DeleteDriverResponse>(`/motoristas/${cpf}`)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all })

      if (data?.message?.toLowerCase().includes('inativado')) {
        toast.info(data.message)
        return
      }

      toast.success(data?.message || 'Motorista excluído com sucesso!')
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Erro ao excluir motorista'
      toast.error(message)
    },
  })
}

export function useReactivateDriver() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (cpf: string) => {
      const { data } = await api.put<Driver>(`/motoristas/${cpf}`, { status: 'ativo' })
      return data
    },
    onSuccess: (_, cpf) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(cpf) })
      toast.success('Motorista reativado com sucesso!')
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Erro ao reativar motorista'
      toast.error(message)
    },
  })
}
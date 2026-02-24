// src/hooks/useVehicles.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Vehicle, NewVehicle } from '@/types'
import { toast } from 'sonner'

const QUERY_KEYS = {
  all: ['vehicles'] as const,
  detail: (id: number) => ['vehicles', id] as const,
}

export function useVehicles(status?: string) {
  return useQuery({
    queryKey: status ? [...QUERY_KEYS.all, status] : QUERY_KEYS.all,
    queryFn: async () => {
      const { data } = await api.get<Vehicle[]>('/veiculos', {
        params: status ? { status } : undefined
      })
      return data
    },
  })
}

export function useVehicle(id: number) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: async () => {
      const { data } = await api.get<Vehicle>(`/veiculos/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (vehicle: NewVehicle) => {
      const { data } = await api.post<Vehicle>('/veiculos', vehicle)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all })
      toast.success('Veículo cadastrado com sucesso!')
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Erro ao cadastrar veículo'
      toast.error(message)
    },
  })
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<NewVehicle> }) => {
      const response = await api.put<Vehicle>(`/veiculos/${id}`, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(variables.id) })
      toast.success('Veículo atualizado com sucesso!')
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar veículo'
      toast.error(message)
    },
  })
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/veiculos/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all })
      toast.success('Veículo excluído com sucesso!')
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Erro ao excluir veículo'
      toast.error(message)
    },
  })
}

export function useReactivateVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.put<Vehicle>(`/veiculos/${id}`, { status: 'ativo' })
      return data
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) })
      toast.success('Veículo reativado com sucesso!')
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Erro ao reativar veículo'
      toast.error(message)
    },
  })
}
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { NewTrip, Trip } from '@/types'
import { toast } from 'sonner'

const QUERY_KEYS = {
  all: ['trips'] as const,
}

export function useCreateTrip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (trip: NewTrip) => {
      const { data } = await api.post('/viagens/criar', trip)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all })
      toast.success('Viagem criada com sucesso!')
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Erro ao criar viagem'
      toast.error(message)
    },
  })
}

export function useUpdateTripObservations() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, observacoes }: { id: number; observacoes?: string }) => {
      const { data } = await api.put<Trip>(`/viagens/${id}`, { observacoes: observacoes ?? '' })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all })
      toast.success('Observações atualizadas!')
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar observações'
      toast.error(message)
    },
  })
}

export function useFinalizeTrip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (idViagem: number) => {
      const { data } = await api.post<{ message: string; viagem: Trip; km_rodados: number }>(
        `/viagens/finalizar/${idViagem}`
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      toast.success('Viagem finalizada com sucesso!')
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Erro ao finalizar viagem'
      toast.error(message)
    },
  })
}

export function useCancelTrip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ idViagem, motivo }: { idViagem: number; motivo?: string }) => {
      const { data } = await api.post<{ message: string; viagem: Trip }>(
        `/viagens/cancelar/${idViagem}`,
        motivo != null ? { motivo } : undefined
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      toast.success('Viagem cancelada com sucesso!')
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Erro ao cancelar viagem'
      toast.error(message)
    },
  })
}

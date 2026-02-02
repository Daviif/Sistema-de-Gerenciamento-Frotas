import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { NewTrip } from '@/types'
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

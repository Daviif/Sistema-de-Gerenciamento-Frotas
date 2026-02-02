import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Maintenance, NewMaintenance } from '@/types'
import { toast } from 'sonner'

const QUERY_KEYS = {
  all: ['maintenances'] as const,
}

export function useCreateMaintenance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (maintenance: NewMaintenance) => {
      const { data } = await api.post<Maintenance>('/manutencao', maintenance)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all })
      toast.success('Manutenção cadastrada com sucesso!')
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Erro ao cadastrar manutenção'
      toast.error(message)
    },
  })
}

// src/components/motoristas/DetalhesMotorista.tsx
import { DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Driver, DriverStatus } from '@/types'

const STATUS_LABELS: Record<DriverStatus, string> = {
  [DriverStatus.ACTIVE]: 'Ativo',
  [DriverStatus.ON_TRIP]: 'Em Viagem',
  [DriverStatus.INACTIVE]: 'Inativo',
}

function formatCPF(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

function formatCNH(cnh: string): string {
  return cnh.replace(/(\d{5})(\d{6})/, '$1 $2')
}

interface DetalhesMotoristaProps {
  driver: Driver
}

export default function DetalhesMotorista({ driver }: DetalhesMotoristaProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Detalhes do Motorista</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b pb-3">
          <span className="text-xl font-bold">{driver.nome}</span>
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
            {STATUS_LABELS[driver.status]}
          </span>
        </div>
        <dl className="grid grid-cols-1 gap-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">CPF</dt>
            <dd className="font-medium">{formatCPF(driver.cpf)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">CNH</dt>
            <dd className="font-medium">{formatCNH(driver.cnh)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Categoria CNH</dt>
            <dd className="font-medium">{driver.cat_cnh}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Validade CNH</dt>
            <dd className="font-medium">
              {driver.validade_cnh
                ? new Date(driver.validade_cnh).toLocaleDateString('pt-BR')
                : '-'}
            </dd>
          </div>
        </dl>
      </div>
    </>
  )
}

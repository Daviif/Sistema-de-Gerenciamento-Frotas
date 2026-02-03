// src/components/manutencao/DetalhesManutencao.tsx
import { DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Maintenance, MaintenanceType } from '@/types'
import { Calendar, DollarSign, Wrench } from 'lucide-react'

const TYPE_LABELS: Record<MaintenanceType, string> = {
  [MaintenanceType.PREVENTIVE]: 'Preventiva',
  [MaintenanceType.CORRECTIVE]: 'Corretiva',
  [MaintenanceType.PREDICTIVE]: 'Preditiva',
  [MaintenanceType.REVISION]: 'Revisão',
}

interface DetalhesManutencaoProps {
  maintenance: Maintenance
}

export default function DetalhesManutencao({ maintenance }: DetalhesManutencaoProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Detalhes da Manutenção</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b pb-3 gap-2">
          <span className="font-semibold text-lg">{maintenance.descricao}</span>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge className={maintenance.concluida ? 'status-success' : 'status-warning'}>
              {maintenance.concluida ? 'Concluída' : 'Pendente'}
            </Badge>
            <Badge variant="secondary">{TYPE_LABELS[maintenance.tipo]}</Badge>
          </div>
        </div>
        {maintenance.placa && (
          <p className="text-sm text-muted-foreground">
            Veículo: {maintenance.placa} {maintenance.modelo ? `- ${maintenance.modelo}` : ''}
          </p>
        )}
        <dl className="grid grid-cols-1 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <div>
              <dt className="text-muted-foreground">Data</dt>
              <dd className="font-medium">
                {new Date(maintenance.data_man).toLocaleDateString('pt-BR')}
              </dd>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <div>
              <dt className="text-muted-foreground">Valor</dt>
              <dd className="font-medium">
                R${' '}
                {maintenance.valor !== undefined && maintenance.valor !== null
                  ? maintenance.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                  : '-'}
              </dd>
            </div>
          </div>
          {maintenance.km_manutencao != null && (
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <div>
                <dt className="text-muted-foreground">KM na manutenção</dt>
                <dd className="font-medium">
                  {maintenance.km_manutencao.toLocaleString('pt-BR')}
                </dd>
              </div>
            </div>
          )}
          {maintenance.fornecedor && (
            <div>
              <dt className="text-muted-foreground">Fornecedor</dt>
              <dd className="font-medium">{maintenance.fornecedor}</dd>
            </div>
          )}
        </dl>
      </div>
    </>
  )
}

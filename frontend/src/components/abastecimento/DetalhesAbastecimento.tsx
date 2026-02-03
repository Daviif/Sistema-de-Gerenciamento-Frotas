// src/components/abastecimento/DetalhesAbastecimento.tsx
import { DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { FuelRecord } from '@/types'
import { Calendar, Fuel, DollarSign, Gauge } from 'lucide-react'

const FUEL_LABELS: Record<string, string> = {
  gasolina: 'Gasolina',
  etanol: 'Etanol',
  diesel: 'Diesel',
  gnv: 'GNV',
  flex: 'Flex',
}

interface DetalhesAbastecimentoProps {
  abastecimento: FuelRecord
}

export default function DetalhesAbastecimento({ abastecimento }: DetalhesAbastecimentoProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Detalhes do Abastecimento</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b pb-3 gap-2">
          <span className="font-semibold text-lg">
            {FUEL_LABELS[abastecimento.tipo_combustivel] || abastecimento.tipo_combustivel}
          </span>
          <Badge variant="secondary">{abastecimento.litros} L</Badge>
        </div>
        {abastecimento.placa && (
          <p className="text-sm text-muted-foreground">
            Veículo: {abastecimento.placa} {abastecimento.modelo ? `- ${abastecimento.modelo}` : ''}
          </p>
        )}
        <dl className="grid grid-cols-1 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <div>
              <dt className="text-muted-foreground">Data</dt>
              <dd className="font-medium">
                {new Date(abastecimento.data_abast).toLocaleDateString('pt-BR')}
              </dd>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Fuel className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <div>
              <dt className="text-muted-foreground">Litros</dt>
              <dd className="font-medium">{abastecimento.litros} L</dd>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <div>
              <dt className="text-muted-foreground">Valor Total</dt>
              <dd className="font-medium">
                R${' '}
                {abastecimento.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </dd>
            </div>
          </div>
          {abastecimento.km_abastecimento != null && (
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <div>
                <dt className="text-muted-foreground">KM no abastecimento</dt>
                <dd className="font-medium">
                  {abastecimento.km_abastecimento.toLocaleString('pt-BR')}
                </dd>
              </div>
            </div>
          )}
        </dl>
      </div>
    </>
  )
}

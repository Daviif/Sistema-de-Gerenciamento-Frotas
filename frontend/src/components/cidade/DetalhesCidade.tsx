// src/components/cidade/DetalhesCidade.tsx
import { DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { City } from '@/types'
import { MapPin } from 'lucide-react'

interface DetalhesCidadeProps {
  cidade: City
}

export default function DetalhesCidade({ cidade }: DetalhesCidadeProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Detalhes da Cidade</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b pb-3 gap-2">
          <span className="font-semibold text-lg">{cidade.nome}</span>
          <Badge variant="secondary">{cidade.uf}</Badge>
        </div>
        <dl className="grid grid-cols-1 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <div>
              <dt className="text-muted-foreground">ID</dt>
              <dd className="font-medium">{cidade.id_cidade}</dd>
            </div>
          </div>
          <div>
            <dt className="text-muted-foreground">Estado</dt>
            <dd className="font-medium">{cidade.uf}</dd>
          </div>
        </dl>
      </div>
    </>
  )
}

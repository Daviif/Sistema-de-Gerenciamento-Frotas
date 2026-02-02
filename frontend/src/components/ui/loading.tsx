import { Loader2 } from 'lucide-react'

export default function Loading({ className = 'text-primary', size = 36 }: { className?: string; size?: number }) {
  return (
    <div role="status" aria-live="polite" aria-label="Carregando" className="flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="rounded-full p-3 bg-muted/5 shadow-md">
          <Loader2 className={`${className} animate-spin`} style={{ width: size, height: size }} />
        </div>
        <span className="text-sm text-muted-foreground">Carregando...</span>
      </div>
    </div>
  )
}

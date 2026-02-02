import { Menu, Moon, SunMedium } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUIStore, UIState } from '@/stores/useUIStore'

export default function Header({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const dark = useUIStore((s: UIState) => s.dark)
  const toggle = useUIStore((s: UIState) => s.toggle)

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 bg-card px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenSidebar}>
          <Menu className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold text-primary">Gerenciador de Frota</h1>
      </div>

      <div className="flex flex-1" />

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => {
            toggle()
            if (typeof window !== 'undefined') {
              const hasDark = document.documentElement.classList.contains('dark')
              const bg = getComputedStyle(document.documentElement).getPropertyValue('--background')
              // eslint-disable-next-line no-console
              console.log('[theme] toggled:', { dark: hasDark, '--background': bg?.trim() })
            }
          }} aria-label="Alternar tema">
          {dark ? <SunMedium className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {/* Perfil removido conforme solicitado */}
      </div>
    </div>
  )
}

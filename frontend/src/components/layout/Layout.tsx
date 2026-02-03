// src/components/layout/Layout.tsx
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  MapPin, 
  Wrench,
  Fuel,
  Map,
  X
} from 'lucide-react'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { Button } from '@/components/ui/button'
import Header from '@/components/layout/Header'
import { cn } from '@/lib/utils'

interface LayoutProps {
  children: React.ReactNode
}

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Veículos', href: '/veiculos', icon: Truck },
  { name: 'Motoristas', href: '/motoristas', icon: Users },
  { name: 'Viagens', href: '/viagens', icon: MapPin },
  { name: 'Manutenção', href: '/manutencao', icon: Wrench },
  { name: 'Abastecimento', href: '/abastecimento', icon: Fuel },
  { name: 'Cidades', href: '/cidades', icon: Map },
]

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div 
          className="fixed inset-0 overlay" 
          onClick={() => setSidebarOpen(false)} 
        />
        <div className="fixed inset-y-0 left-0 w-64 bg-card shadow-xl">
          <SidebarContent 
            navigation={navigation} 
            currentPath={location.pathname}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:z-40">
        <SidebarContent 
          navigation={navigation} 
          currentPath={location.pathname} 
        />
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <Header onOpenSidebar={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Error boundary to avoid blank pages on render errors */}
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  )
}

function SidebarContent({ 
  navigation, 
  currentPath,
  onClose 
}: { 
  navigation: NavigationItem[]
  currentPath: string
  onClose?: () => void
}) {
  return (
    <div data-slot="site-sidebar" className="flex grow flex-col gap-y-5 overflow-y-auto bg-card px-6 pb-4 shadow-lg">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-foreground">Frota</span>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const isActive = currentPath === item.href
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      onClick={onClose}
                      className={cn(
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-primary hover:bg-muted',
                        'group flex gap-x-3 rounded-lg px-3 py-2 text-sm leading-6 font-semibold transition-colors'
                      )}
                    >
                      <item.icon
                        className={cn(
                          isActive ? 'text-primary' : 'text-primary/70 group-hover:text-primary',
                          'h-6 w-6 shrink-0'
                        )}
                      />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  )
}
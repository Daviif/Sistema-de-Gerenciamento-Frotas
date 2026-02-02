// src/components/layout/Layout.tsx
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  MapPin, 
  Wrench,
  Menu,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface LayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Veículos', href: '/veiculos', icon: Truck },
  { name: 'Motoristas', href: '/motoristas', icon: Users },
  { name: 'Viagens', href: '/viagens', icon: MapPin },
  { name: 'Manutenção', href: '/manutencao', icon: Wrench },
]

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div 
          className="fixed inset-0 bg-slate-900/50" 
          onClick={() => setSidebarOpen(false)} 
        />
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
          <SidebarContent 
            navigation={navigation} 
            currentPath={location.pathname}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <SidebarContent 
          navigation={navigation} 
          currentPath={location.pathname} 
        />
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h1 className="text-xl font-bold text-slate-900">
                Gerenciador de Frota
              </h1>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
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
  navigation: typeof navigation
  currentPath: string
  onClose?: () => void
}) {
  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-slate-200 bg-white px-6 pb-4">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-slate-900">Frota</span>
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
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50',
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors'
                      )}
                    >
                      <item.icon
                        className={cn(
                          isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600',
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
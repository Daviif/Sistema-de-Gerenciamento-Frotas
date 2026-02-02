// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from '@/components/ui/sonner'
import { queryClient } from '@/lib/queryClient'
import Layout from '@/components/layout/Layout'
import DashboardView from '@/components/dashboard/DashboardView'
import VehiclesList from '@/components/veiculos/ListaVeiculos'
import DriversList from '@/components/motoristas/MotoristaLista'
import TripsList from '@/components/viagens/ViagensLista'
import MaintenanceList from '@/components/manutencao/ManutencaoLista'

import { useEffect, useState } from 'react'

function App() {
  const [themeDebug, setThemeDebug] = useState<{ primary?: string; background?: string }>({})

  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      const cs = getComputedStyle(document.documentElement)
      setThemeDebug({
        primary: cs.getPropertyValue('--primary')?.trim(),
        background: cs.getPropertyValue('--background')?.trim(),
      })
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/veiculos" element={<VehiclesList />} />
            <Route path="/motoristas" element={<DriversList />} />
            <Route path="/viagens" element={<TripsList />} />
            <Route path="/manutencao" element={<MaintenanceList />} />
          </Routes>
        </Layout>
      </BrowserRouter>
      
      <Toaster richColors position="top-right" />
      <ReactQueryDevtools initialIsOpen={false} />

      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 z-50 rounded-md p-2 text-xs bg-slate-900 text-white/90 shadow-lg">
          <div>primary: <span className="font-mono">{themeDebug.primary}</span></div>
          <div>background: <span className="font-mono">{themeDebug.background}</span></div>
        </div>
      )}
    </QueryClientProvider>
  )
}

export default App
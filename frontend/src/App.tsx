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

function App() {
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
    </QueryClientProvider>
  )
}

export default App
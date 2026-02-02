// src/types/index.ts

// ========== ENUMS ==========

export enum VehicleStatus {
  ACTIVE = 'ativo',
  ON_TRIP = 'em_viagem',
  MAINTENANCE = 'manutencao',
  INACTIVE = 'inativo'
}

export enum TripStatus {
  PLANNED = 'planejada',
  IN_PROGRESS = 'em_andamento',
  COMPLETED = 'finalizada',
  CANCELLED = 'cancelada'
}

export enum DriverStatus {
  ACTIVE = 'ativo',
  ON_TRIP = 'em_viagem',
  INACTIVE = 'inativo'
}

export enum MaintenanceType {
  PREVENTIVE = 'preventiva',
  CORRECTIVE = 'corretiva',
  PREDICTIVE = 'preditiva',
  REVISION = 'revisao'
}

// ========== VEHICLE TYPES ==========

export interface Vehicle {
  id_veiculo: number
  placa: string
  marca: string
  modelo: string
  ano: number
  tipo: string
  status: VehicleStatus
  data_insercao: string
  km_atual: number
  capacidade_tanque?: number
  currentKm: number // Alias for compatibility
  id: number // Alias for compatibility
  model: string // Alias for compatibility
}

export interface NewVehicle {
  placa: string
  marca: string
  modelo: string
  ano: number
  tipo: string
  km_atual?: number
  capacidade_tanque?: number
}

// ========== DRIVER TYPES ==========

export interface Driver {
  cpf: string
  nome: string
  cnh: string
  cat_cnh: string
  validade_cnh: string
  status: DriverStatus
  id: string // Alias
  name: string // Alias
  cnhExpiry: string // Alias
}

export interface NewDriver {
  nome: string
  cpf: string
  cnh: string
  cat_cnh: string
  validade_cnh: string
  status?: DriverStatus
}

// ========== TRIP TYPES ==========

export interface Trip {
  id_viagem: number
  data_saida: string
  data_chegada?: string
  km_inicial: number
  km_final?: number
  id_veiculo: number
  cpf_motorista: string
  cidade_origem: number
  cidade_destino: number
  status_viagem: TripStatus
  observacoes?: string
  placa?: string
  modelo?: string
  motorista?: string
  origem?: string
  origem_uf?: string
  destino?: string
  destino_uf?: string
  km_rodados?: number
}

export interface NewTrip {
  id_veiculo: number
  cpf_motorista?: string
  cidade_origem?: number
  cidade_destino?: number
}

// ========== MAINTENANCE TYPES ==========

export interface Maintenance {
  id_manutencao: number
  data_man: string
  tipo: MaintenanceType
  descricao: string
  valor: number
  id_veiculo: number
  km_manutencao?: number
  fornecedor?: string
  concluida: boolean
  placa?: string
  modelo?: string
}

export interface NewMaintenance {
  data_man: string
  tipo: MaintenanceType
  descricao: string
  valor: number
  id_veiculo: number
  km_manutencao?: number
  fornecedor?: string
}

// ========== FUEL TYPES ==========

export interface FuelRecord {
  id_abastecimento: number
  data_abast: string
  tipo_combustivel: string
  litros: number
  valor_total: number
  id_veiculo: number
  km_abastecimento?: number
  placa?: string
  modelo?: string
}

export interface NewFuelRecord {
  data_abast: string
  tipo_combustivel: string
  litros: number
  valor_total: number
  id_veiculo: number
  km_abastecimento?: number
}

// ========== CITY TYPES ==========

export interface City {
  id_cidade: number
  nome: string
  uf: string
}

export interface NewCity {
  nome: string
  uf: string
}

// ========== DASHBOARD TYPES ==========

export interface DashboardStats {
  totalVehicles: number
  activeDrivers: number
  tripsInProgress: number
  maintenancePending: number
  monthlyExpenses: ChartData[]
  kmTraveled: ChartData[]
}

export interface ChartData {
  name: string
  value: number
}

export interface AlertData {
  drivers: Driver[]
  vehicles: Vehicle[]
}

// ========== API RESPONSE TYPES ==========

export interface ApiError {
  error: string
  status: string
  details?: string
}

export interface TripSimulationResponse {
  message: string
  viagem: Trip
}

export interface TripFinalizationResponse {
  message: string
  viagem: Trip
  km_rodados: number
  combustivel_estimado: number
  tempo_viagem_minutos: number
}

export interface VehicleHistory {
  veiculo: Vehicle
  viagens: Trip[]
  abastecimentos: FuelRecord[]
  manutencoes: Maintenance[]
  estatisticas: {
    total_viagens: number
    total_abastecimentos: number
    total_manutencoes: number
    km_rodados: number
  }
}

// ========== FORM TYPES ==========

export interface VehicleFormData {
  placa: string
  marca: string
  modelo: string
  ano: number
  tipo: string
  km_atual: number
  capacidade_tanque?: number
}

export interface DriverFormData {
  nome: string
  cpf: string
  cnh: string
  cat_cnh: string
  validade_cnh: string
}

export interface TripFormData {
  id_veiculo: number
  cpf_motorista: string
  cidade_origem: number
  cidade_destino: number
}

export interface MaintenanceFormData {
  data_man: string
  tipo: MaintenanceType
  descricao: string
  valor: number
  id_veiculo: number
  km_manutencao?: number
  fornecedor?: string
}

// ========== CONSTANTS ==========

export const VEHICLE_TYPES = [
  'Caminhão',
  'Caminhão-trator',
  'Caminhonete',
  'Camioneta',
  'Micro-ônibus',
  'Motocicleta',
  'Motoneta',
  'Ônibus',
  'Reboque',
  'Semi-reboque',
  'Utilitário',
  'Basculante',
  'Munck'
] as const

export const CNH_CATEGORIES = ['A', 'B', 'AB', 'C', 'D', 'E', 'AC', 'AD', 'AE'] as const

export const FUEL_TYPES = ['gasolina', 'etanol', 'diesel', 'gnv', 'flex'] as const

export const VEHICLE_STATUS_LABELS: Record<VehicleStatus, string> = {
  [VehicleStatus.ACTIVE]: 'Ativo',
  [VehicleStatus.ON_TRIP]: 'Em Viagem',
  [VehicleStatus.MAINTENANCE]: 'Manutenção',
  [VehicleStatus.INACTIVE]: 'Inativo'
}

export const VEHICLE_STATUS_COLORS: Record<VehicleStatus, string> = {
  [VehicleStatus.ACTIVE]: 'status-success',
  [VehicleStatus.ON_TRIP]: 'bg-primary/10 text-primary',
  [VehicleStatus.MAINTENANCE]: 'status-warning',
  [VehicleStatus.INACTIVE]: 'bg-muted text-muted-foreground'
}

export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  [TripStatus.PLANNED]: 'Planejada',
  [TripStatus.IN_PROGRESS]: 'Em Andamento',
  [TripStatus.COMPLETED]: 'Finalizada',
  [TripStatus.CANCELLED]: 'Cancelada'
}

export const TRIP_STATUS_COLORS: Record<TripStatus, string> = {
  [TripStatus.PLANNED]: 'bg-muted text-muted-foreground',
  [TripStatus.IN_PROGRESS]: 'bg-primary/10 text-primary',
  [TripStatus.COMPLETED]: 'status-success',
  [TripStatus.CANCELLED]: 'status-danger'
}

export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
  [MaintenanceType.PREVENTIVE]: 'Preventiva',
  [MaintenanceType.CORRECTIVE]: 'Corretiva',
  [MaintenanceType.PREDICTIVE]: 'Preditiva',
  [MaintenanceType.REVISION]: 'Revisão'
}
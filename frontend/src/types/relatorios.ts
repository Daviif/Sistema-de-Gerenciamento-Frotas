export interface RelatorioConsumoVeiculo {
  id_veiculo: number
  placa: string
  modelo: string
  total_abastecimentos: number
  gasto_total: number
  litros_totais: number
  preco_medio_litro: number
}

export interface RelatorioManutencao {
  id_veiculo: number
  placa: string
  tipo_manutencao: string
  custo_total: number
  ultima_manutencao: string | null
}

export interface RelatorioMotorista {
  id_motorista: number
  nome: string
  total_viagens: number
  km_total: number
  media_km_por_viagem: number
}

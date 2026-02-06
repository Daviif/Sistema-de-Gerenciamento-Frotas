export interface RelatorioOverview {
  frota: {
    total_veiculos: number
    veiculos_ativos: number
    veiculos_em_viagem: number
    veiculos_manutencao: number
  }
  motoristas: {
    total_motoristas: number
    motoristas_ativos: number
    motoristas_em_viagem: number
  }
  viagens: {
    total_viagens: number
    viagens_em_andamento: number
    viagens_finalizadas: number
    viagens_canceladas: number
    km_total_percorrido: number
  }
  cidades: {
    total_cidades: number
  }
  custos: {
    custo_total_combustivel: number
    custo_total_manutencao: number
    custo_operacional_total: number
  }
  periodo_meses: number
}

export interface VeiculoCompleto {
  id_veiculo: number
  placa: string
  marca: string
  modelo: string
  ano: number
  total_viagens: number
  total_abastecimentos: number
  total_litros: number
  custo_combustivel: number
  custo_manutencao: number
  km_rodados: number
  custo_por_km: number
  consumo_medio_km_l: number
  km_por_abastecimento: number
}

export interface MotoristaCompleto {
  cpf: string
  nome: string
  total_viagens: number
  viagens_finalizadas: number
  viagens_canceladas: number
  taxa_conclusao: number
  km_rodados: number
  veiculos_diferentes: number
  rotas_diferentes: number
  validade_cnh: string
  cnh_vencida: boolean
  dias_para_vencer_cnh: number
}

export interface EficienciaCombustivel {
  id_veiculo: number
  placa: string
  modelo: string
  consumo_medio_km_l: number
  classificacao: string
  total_abastecimentos: number
  total_litros: number
  custo_total: number
  custo_por_km: number
  litros_por_100km: number
}

export interface ManutencaoCritica {
  id_veiculo: number
  placa: string
  modelo: string
  total_manutencoes: number
  manutencoes_preventivas: number
  manutencoes_corretivas: number
  custo_total: number
  dias_desde_ultima: number
  status_alerta: string
  km_desde_ultima: number
}

export interface RotaAnalise {
  cidade_origem: string
  cidade_destino: string
  total_viagens: number
  viagens_finalizadas: number
  viagens_canceladas: number
  taxa_sucesso: number
  km_medio: number
  tempo_medio_horas: number
}

export interface CustoBeneficio {
  id_veiculo: number
  placa: string
  modelo: string
  custo_operacional: number
  km_rodados: number
  custo_por_km: number
  total_viagens: number
  taxa_utilizacao: number
  eficiencia_operacional: string
}

export interface EventoTimeline {
  tipo: string
  data: string
  descricao: string
  veiculo_placa: string
  valor?: number
  km?: number
}

export interface ComparativoMensal {
  mes: string
  mes_nome: string
  total_viagens: number
  km_rodados: number
  custo_combustivel: number
  custo_manutencao: number
  custo_total: number
  tendencia_viagens: string
  tendencia_custos: string
}
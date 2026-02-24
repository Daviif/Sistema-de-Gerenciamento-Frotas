import { Router, Request, Response } from 'express'
import pool from '../db'
import { asyncHandler, AppError } from '../middleware/errorHandler'

const router = Router()

const MESES_NOMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

/**
 * GET /relatorios/overview - Visão geral do sistema
 */
router.get('/overview', asyncHandler(async (req: Request, res: Response) => {
  const { meses = 6 } = req.query

  // 1. Buscar total de veículos
  const totalVeiculos = await pool.query('SELECT COUNT(*) as total FROM veiculo')
  
  // 2. Buscar veículos ativos
  const veiculosAtivos = await pool.query(
    'SELECT COUNT(*) as total FROM veiculo WHERE status = $1',
    ['ativo']
  )

  // 2.1 Buscar veículos em viagem
  const veiculosEmViagem = await pool.query(
    'SELECT COUNT(*) as total FROM veiculo WHERE status = $1',
    ['em_viagem']
  )

  // 2.2 Buscar veículos em manutenção
  const veiculosManutencao = await pool.query(
    'SELECT COUNT(*) as total FROM veiculo WHERE status = $1',
    ['manutencao']
  )

  // 3. Buscar total de motoristas
  const totalMotoristas = await pool.query('SELECT COUNT(*) as total FROM motorista')
  
  // 4. Buscar motoristas ativos
  const motoristasAtivos = await pool.query(
    'SELECT COUNT(*) as total FROM motorista WHERE status = $1',
    ['ativo']
  )

  // 4.1 Buscar motoristas em viagem (viagens em andamento)
  const motoristasEmViagem = await pool.query(
    `SELECT COUNT(DISTINCT cpf_motorista) as total
     FROM viagem
     WHERE status_viagem = 'em_andamento'
     AND cpf_motorista IS NOT NULL`
  )

  // 5. Buscar total de cidades
  const totalCidades = await pool.query('SELECT COUNT(*) as total FROM cidade')

  // 6. Buscar viagens no período
  const viagensPeriodo = await pool.query(
    `SELECT COUNT(*) as total 
     FROM viagem 
     WHERE data_saida >= CURRENT_DATE - ($1::text || ' months')::interval`,
    [meses]
  )

  // 7. Buscar viagens em andamento
  const viagensAndamento = await pool.query(
    'SELECT COUNT(*) as total FROM viagem WHERE status_viagem = $1',
    ['em_andamento']
  )

  // 7.1 Buscar viagens finalizadas no período
  const viagensFinalizadas = await pool.query(
    `SELECT COUNT(*) as total
     FROM viagem
     WHERE status_viagem = 'finalizada'
     AND data_saida >= CURRENT_DATE - ($1::text || ' months')::interval`,
    [meses]
  )

  // 7.2 Buscar viagens canceladas no período
  const viagensCanceladas = await pool.query(
    `SELECT COUNT(*) as total
     FROM viagem
     WHERE status_viagem = 'cancelada'
     AND data_saida >= CURRENT_DATE - ($1::text || ' months')::interval`,
    [meses]
  )

  // 8. Calcular KM total (viagens finalizadas)
  const kmTotal = await pool.query(
    `SELECT SUM(km_final - km_inicial) as total 
     FROM viagem 
     WHERE km_final IS NOT NULL 
     AND data_saida >= CURRENT_DATE - ($1::text || ' months')::interval`,
    [meses]
  )

  // 9. Calcular custo total de combustível
  const custoCombustivel = await pool.query(
    `SELECT SUM(valor_total) as total 
     FROM abastecimento 
     WHERE data_abast >= CURRENT_DATE - ($1::text || ' months')::interval`,
    [meses]
  )

  // 10. Calcular custo total de manutenção
  const custoManutencao = await pool.query(
    `SELECT SUM(valor) as total 
     FROM manutencao 
     WHERE concluida = true 
     AND data_man >= CURRENT_DATE - ($1::text || ' months')::interval`,
    [meses]
  )

  // Calcular totais em JavaScript
  const combustivel = parseFloat(custoCombustivel.rows[0].total || 0)
  const manutencao = parseFloat(custoManutencao.rows[0].total || 0)

  res.json({
    periodo_meses: meses,
    frota: {
      total_veiculos: parseInt(totalVeiculos.rows[0].total, 10),
      veiculos_ativos: parseInt(veiculosAtivos.rows[0].total, 10),
      veiculos_em_viagem: parseInt(veiculosEmViagem.rows[0].total, 10),
      veiculos_manutencao: parseInt(veiculosManutencao.rows[0].total, 10)
    },
    motoristas: {
      total_motoristas: parseInt(totalMotoristas.rows[0].total, 10),
      motoristas_ativos: parseInt(motoristasAtivos.rows[0].total, 10),
      motoristas_em_viagem: parseInt(motoristasEmViagem.rows[0].total, 10)
    },
    viagens: {
      total_viagens: parseInt(viagensPeriodo.rows[0].total, 10),
      viagens_em_andamento: parseInt(viagensAndamento.rows[0].total, 10),
      viagens_finalizadas: parseInt(viagensFinalizadas.rows[0].total, 10),
      viagens_canceladas: parseInt(viagensCanceladas.rows[0].total, 10),
      km_total_percorrido: parseInt(kmTotal.rows[0].total || 0, 10)
    },
    cidades: {
      total_cidades: parseInt(totalCidades.rows[0].total, 10)
    },
    custos: {
      custo_total_combustivel: combustivel,
      custo_total_manutencao: manutencao,
      custo_operacional_total: combustivel + manutencao
    }
  })
}))

/**
 * GET /relatorios/veiculos - Relatório detalhado de veículos
 */
router.get('/frota-completo', asyncHandler(async (req: Request, res: Response) => {
  const { meses = 6 } = req.query

  // 1. Buscar todos os veículos
  const veiculos = await pool.query(
    'SELECT id_veiculo, placa, modelo, marca, ano, tipo, km_atual, status FROM veiculo ORDER BY placa'
  )

  const resultado = []

  // Para cada veículo, buscar dados relacionados
  for (const veiculo of veiculos.rows) {
    // 2. Contar viagens do veículo
    const viagens = await pool.query(
      `SELECT COUNT(*) as total 
       FROM viagem 
       WHERE id_veiculo = $1 
       AND data_saida >= CURRENT_DATE - ($2::text || ' months')::interval`,
      [veiculo.id_veiculo, meses]
    )

    // 3. Calcular KM rodados
    const kmRodados = await pool.query(
      `SELECT SUM(km_final - km_inicial) as total 
       FROM viagem 
       WHERE id_veiculo = $1 
       AND km_final IS NOT NULL 
       AND data_saida >= CURRENT_DATE - ($2::text || ' months')::interval`,
      [veiculo.id_veiculo, meses]
    )

    // 4.1 Buscar métricas de abastecimento
    const abastecimentos = await pool.query(
      `SELECT COUNT(*) as total_abastecimentos, SUM(litros) as total_litros
       FROM abastecimento
       WHERE id_veiculo = $1
       AND data_abast >= CURRENT_DATE - ($2::text || ' months')::interval`,
      [veiculo.id_veiculo, meses]
    )

    // 4. Buscar custos de combustível
    const combustivel = await pool.query(
      `SELECT SUM(valor_total) as total 
       FROM abastecimento 
       WHERE id_veiculo = $1 
       AND data_abast >= CURRENT_DATE - ($2::text || ' months')::interval`,
      [veiculo.id_veiculo, meses]
    )

    // 5. Buscar custos de manutenção
    const manutencao = await pool.query(
      `SELECT SUM(valor) as total 
       FROM manutencao 
       WHERE id_veiculo = $1 
       AND concluida = true 
       AND data_man >= CURRENT_DATE - ($2::text || ' months')::interval`,
      [veiculo.id_veiculo, meses]
    )

    // Calcular totais
    const totalAbastecimentos = parseInt(abastecimentos.rows[0].total_abastecimentos, 10)
    const totalLitros = parseFloat(abastecimentos.rows[0].total_litros || 0)
    const custoCombustivel = parseFloat(combustivel.rows[0].total || 0)
    const custoManutencao = parseFloat(manutencao.rows[0].total || 0)
    const kmTotal = parseFloat(kmRodados.rows[0].total || 0)
    const custoTotal = custoCombustivel + custoManutencao
    const consumoMedioKmL = totalLitros > 0 ? kmTotal / totalLitros : 0
    const kmPorAbastecimento = totalAbastecimentos > 0 ? kmTotal / totalAbastecimentos : 0

    resultado.push({
      ...veiculo,
      total_viagens: parseInt(viagens.rows[0].total, 10),
      total_abastecimentos: totalAbastecimentos,
      total_litros: totalLitros,
      km_rodados: kmTotal,
      custo_combustivel: custoCombustivel,
      custo_manutencao: custoManutencao,
      custo_total: custoTotal,
      custo_por_km: kmTotal > 0 ? custoTotal / kmTotal : 0,
      consumo_medio_km_l: consumoMedioKmL,
      km_por_abastecimento: kmPorAbastecimento
    })
  }

  res.json({
    periodo_meses: meses,
    veiculos: resultado
  })
}))

/**
 * GET /relatorios/motoristas - Relatório detalhado de motoristas
 */
router.get('/motoristas-completo', asyncHandler(async (req: Request, res: Response) => {
  const { meses = 6 } = req.query

  // 1. Buscar todos os motoristas
  const motoristas = await pool.query(
    'SELECT cpf, nome, cnh, cat_cnh, validade_cnh, status FROM motorista ORDER BY nome'
  )

  const resultado = []

  // Para cada motorista, buscar estatísticas
  for (const motorista of motoristas.rows) {
    // 2. Contar viagens total
    const totalViagens = await pool.query(
      `SELECT COUNT(*) as total 
       FROM viagem 
       WHERE cpf_motorista = $1 
       AND data_saida >= CURRENT_DATE - ($2::text || ' months')::interval`,
      [motorista.cpf, meses]
    )

    // 3. Contar viagens finalizadas
    const viagensFinalizadas = await pool.query(
      `SELECT COUNT(*) as total 
       FROM viagem 
       WHERE cpf_motorista = $1 
       AND status_viagem = 'finalizada'
       AND data_saida >= CURRENT_DATE - ($2::text || ' months')::interval`,
      [motorista.cpf, meses]
    )

    // 3.1 Contar viagens canceladas
    const viagensCanceladas = await pool.query(
      `SELECT COUNT(*) as total
       FROM viagem
       WHERE cpf_motorista = $1
       AND status_viagem = 'cancelada'
       AND data_saida >= CURRENT_DATE - ($2::text || ' months')::interval`,
      [motorista.cpf, meses]
    )

    // 4. Calcular KM total
    const kmTotal = await pool.query(
      `SELECT SUM(km_final - km_inicial) as total 
       FROM viagem 
       WHERE cpf_motorista = $1 
       AND km_final IS NOT NULL 
       AND data_saida >= CURRENT_DATE - ($2::text || ' months')::interval`,
      [motorista.cpf, meses]
    )

    // 5. Contar veículos diferentes utilizados
    const veiculosDiferentes = await pool.query(
      `SELECT COUNT(DISTINCT id_veiculo) as total
       FROM viagem
       WHERE cpf_motorista = $1
       AND data_saida >= CURRENT_DATE - ($2::text || ' months')::interval`,
      [motorista.cpf, meses]
    )

    // 6. Contar rotas diferentes (origem-destino)
    const rotasDiferentes = await pool.query(
      `SELECT COUNT(DISTINCT (cidade_origem::text || '-' || cidade_destino::text)) as total
       FROM viagem
       WHERE cpf_motorista = $1
       AND data_saida >= CURRENT_DATE - ($2::text || ' months')::interval`,
      [motorista.cpf, meses]
    )

    const total = parseInt(totalViagens.rows[0].total, 10)
    const finalizadas = parseInt(viagensFinalizadas.rows[0].total, 10)
    const canceladas = parseInt(viagensCanceladas.rows[0].total, 10)
    const km = parseFloat(kmTotal.rows[0].total || 0)

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const validadeCnhDate = motorista.validade_cnh ? new Date(motorista.validade_cnh) : null
    const diasParaVencerCnh = validadeCnhDate
      ? Math.ceil((validadeCnhDate.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
      : 0
    const cnhVencida = diasParaVencerCnh < 0

    resultado.push({
      ...motorista,
      total_viagens: total,
      viagens_finalizadas: finalizadas,
      viagens_canceladas: canceladas,
      km_rodados: km,
      taxa_conclusao: total > 0 ? (finalizadas / total) * 100 : 0,
      veiculos_diferentes: parseInt(veiculosDiferentes.rows[0].total, 10),
      rotas_diferentes: parseInt(rotasDiferentes.rows[0].total, 10),
      cnh_vencida: cnhVencida,
      dias_para_vencer_cnh: diasParaVencerCnh
    })
  }

  res.json({
    periodo_meses: meses,
    motoristas: resultado
  })
}))

/**
 * GET /relatorios/combustivel - Relatório de combustível
 */
router.get('/eficiencia-combustivel', asyncHandler(async (req: Request, res: Response) => {
  const { meses = 6 } = req.query

  // 1. Buscar veículos
  const veiculos = await pool.query('SELECT id_veiculo, placa, modelo FROM veiculo')

  const resultado = []

  for (const veiculo of veiculos.rows) {
    // 1.1 Contar abastecimentos no período
    const abastecimentos = await pool.query(
      `SELECT COUNT(*) as total
       FROM abastecimento
       WHERE id_veiculo = $1
       AND data_abast >= CURRENT_DATE - ($2::text || ' months')::interval`,
      [veiculo.id_veiculo, meses]
    )

    // 2. Buscar total de litros abastecidos
    const litros = await pool.query(
      `SELECT SUM(litros) as total 
       FROM abastecimento 
       WHERE id_veiculo = $1 
       AND data_abast >= CURRENT_DATE - ($2::text || ' months')::interval`,
      [veiculo.id_veiculo, meses]
    )

    // 3. Buscar custo total
    const custo = await pool.query(
      `SELECT SUM(valor_total) as total 
       FROM abastecimento 
       WHERE id_veiculo = $1 
       AND data_abast >= CURRENT_DATE - ($2::text || ' months')::interval`,
      [veiculo.id_veiculo, meses]
    )

    // 4. Buscar KM rodados
    const km = await pool.query(
      `SELECT SUM(km_final - km_inicial) as total 
       FROM viagem 
       WHERE id_veiculo = $1 
       AND km_final IS NOT NULL 
       AND data_saida >= CURRENT_DATE - ($2::text || ' months')::interval`,
      [veiculo.id_veiculo, meses]
    )

    const totalAbastecimentos = parseInt(abastecimentos.rows[0].total, 10)
    const totalLitros = parseFloat(litros.rows[0].total || 0)
    const totalCusto = parseFloat(custo.rows[0].total || 0)
    const totalKm = parseFloat(km.rows[0].total || 0)

    const consumoMedioKmL = totalKm > 0 && totalLitros > 0 ? totalKm / totalLitros : 0
    const litrosPor100Km = totalKm > 0 && totalLitros > 0 ? (totalLitros / totalKm) * 100 : 0

    let classificacao = 'Ruim'
    if (consumoMedioKmL >= 10) classificacao = 'Excelente'
    else if (consumoMedioKmL >= 8) classificacao = 'Bom'
    else if (consumoMedioKmL >= 6) classificacao = 'Regular'

    // Só incluir veículos que tiveram abastecimento
    if (totalLitros > 0) {
      resultado.push({
        ...veiculo,
        total_abastecimentos: totalAbastecimentos,
        total_litros: totalLitros,
        custo_total: totalCusto,
        km_rodados: totalKm,
        consumo_medio_km_l: consumoMedioKmL,
        litros_por_100km: litrosPor100Km,
        classificacao: classificacao,
        custo_por_km: totalKm > 0 ? totalCusto / totalKm : 0
      })
    }
  }

  res.json({
    periodo_meses: meses,
    veiculos: resultado
  })
}))

/**
 * GET /relatorios/manutencao - Relatório de manutenção
 */
router.get('/manutencao-critica', asyncHandler(async (req: Request, res: Response) => {
  const { meses = 12 } = req.query

  // 1. Buscar veículos
  const veiculos = await pool.query('SELECT id_veiculo, placa, modelo FROM veiculo')

  const resultado = []

  for (const veiculo of veiculos.rows) {
    // 2. Contar total de manutenções
    const total = await pool.query(
      `SELECT COUNT(*) as total 
       FROM manutencao 
       WHERE id_veiculo = $1 
       AND data_man >= CURRENT_DATE - ($2::text || ' months')::interval`,
      [veiculo.id_veiculo, meses]
    )

    // 3. Contar manutenções concluídas
    const concluidas = await pool.query(
      `SELECT COUNT(*) as total 
       FROM manutencao 
       WHERE id_veiculo = $1 
       AND concluida = true 
       AND data_man >= CURRENT_DATE - ($2::text || ' months')::interval`,
      [veiculo.id_veiculo, meses]
    )

    // 4. Calcular custo total
    const custo = await pool.query(
      `SELECT SUM(valor) as total 
       FROM manutencao 
       WHERE id_veiculo = $1 
       AND concluida = true 
       AND data_man >= CURRENT_DATE - ($2::text || ' months')::interval`,
      [veiculo.id_veiculo, meses]
    )

    // 5. Contar tipos de manutenção
    const tipos = await pool.query(
      `SELECT 
         COUNT(*) FILTER (WHERE tipo = 'preventiva') as preventivas,
         COUNT(*) FILTER (WHERE tipo = 'corretiva') as corretivas
       FROM manutencao
       WHERE id_veiculo = $1
       AND data_man >= CURRENT_DATE - ($2::text || ' months')::interval`,
      [veiculo.id_veiculo, meses]
    )

    resultado.push({
      ...veiculo,
      total_manutencoes: parseInt(total.rows[0].total, 10),
      manutencoes_preventivas: parseInt(tipos.rows[0].preventivas || 0, 10),
      manutencoes_corretivas: parseInt(tipos.rows[0].corretivas || 0, 10),
      manutencoes_concluidas: parseInt(concluidas.rows[0].total, 10),
      custo_total: parseFloat(custo.rows[0].total || 0)
    })
  }

  res.json({
    periodo_meses: meses,
    veiculos: resultado
  })
}))

/**
 * GET /relatorios/rotas - Relatório de rotas mais utilizadas
 */
router.get('/rotas-analise', asyncHandler(async (req: Request, res: Response) => {
  const { meses = 6 } = req.query

  // Query com JOIN básico e GROUP BY
  const rotas = await pool.query(
    `SELECT 
      c1.nome as origem,
      c1.uf as origem_uf,
      c2.nome as destino,
      c2.uf as destino_uf,
      COUNT(*) as total_viagens
     FROM viagem v
     JOIN cidade c1 ON c1.id_cidade = v.cidade_origem
     JOIN cidade c2 ON c2.id_cidade = v.cidade_destino
     WHERE v.data_saida >= CURRENT_DATE - ($1::text || ' months')::interval
     GROUP BY c1.nome, c1.uf, c2.nome, c2.uf
     ORDER BY total_viagens DESC
     LIMIT 20`,
    [meses]
  )

  res.json({
    periodo_meses: meses,
    rotas: rotas.rows.map(r => ({
      rota: `${r.origem} (${r.origem_uf}) → ${r.destino} (${r.destino_uf})`,
      total_viagens: parseInt(r.total_viagens, 10)
    }))
  })
}))

/**
 * GET /relatorios/mensal - Comparativo mensal
 */
router.get('/comparativo-mensal', asyncHandler(async (req: Request, res: Response) => {
  const { meses = 6 } = req.query
  const numMeses = parseInt(String(meses), 10)
  
  const resultado: any[] = []
  const hoje = new Date()

  // Para cada mês, fazer queries separadas
  for (let i = numMeses - 1; i >= 0; i--) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    const mesInicio = new Date(data.getFullYear(), data.getMonth(), 1)
    const mesFim = new Date(data.getFullYear(), data.getMonth() + 1, 0)

    // 1. Contar viagens no mês
    const viagens = await pool.query(
      'SELECT COUNT(*) as total FROM viagem WHERE data_saida >= $1 AND data_saida <= $2',
      [mesInicio, mesFim]
    )

    // 2. Calcular KM do mês
    const km = await pool.query(
      'SELECT SUM(km_final - km_inicial) as total FROM viagem WHERE km_final IS NOT NULL AND data_saida >= $1 AND data_saida <= $2',
      [mesInicio, mesFim]
    )

    // 3. Calcular custo combustível
    const combustivel = await pool.query(
      'SELECT SUM(valor_total) as total FROM abastecimento WHERE data_abast >= $1 AND data_abast <= $2',
      [mesInicio, mesFim]
    )

    // 4. Calcular custo manutenção
    const manutencao = await pool.query(
      'SELECT SUM(valor) as total FROM manutencao WHERE concluida = true AND data_man >= $1 AND data_man <= $2',
      [mesInicio, mesFim]
    )

    const totalViagens = parseInt(viagens.rows[0].total, 10)
    const kmRodados = parseFloat(km.rows[0].total || 0)
    const custoCombustivel = parseFloat(combustivel.rows[0].total || 0)
    const custoManutencao = parseFloat(manutencao.rows[0].total || 0)
    const custoTotal = custoCombustivel + custoManutencao

    resultado.push({
      mes: `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`,
      mes_nome: `${MESES_NOMES[data.getMonth()]} ${data.getFullYear()}`,
      total_viagens: totalViagens,
      km_rodados: kmRodados,
      custo_combustivel: custoCombustivel,
      custo_manutencao: custoManutencao,
      custo_total: custoTotal
    })
  }

  // Calcular tendências comparando com o mês anterior
  const comparativo = resultado.map((item, index) => {
    if (index === 0) {
      return {
        ...item,
        tendencia_viagens: 'Estável',
        tendencia_custos: 'Estável'
      }
    }

    const anterior = resultado[index - 1]
    const tendenciaViagens = item.total_viagens > anterior.total_viagens
      ? 'Crescimento'
      : item.total_viagens < anterior.total_viagens
        ? 'Queda'
        : 'Estável'

    const tendenciaCustos = item.custo_total > anterior.custo_total
      ? 'Crescimento'
      : item.custo_total < anterior.custo_total
        ? 'Queda'
        : 'Estável'

    return {
      ...item,
      tendencia_viagens: tendenciaViagens,
      tendencia_custos: tendenciaCustos
    }
  })

  res.json({
    periodo_meses: meses,
    comparativo
  })
}))

/**
 * GET /relatorios/custo-beneficio - Relatório de custo-benefício dos veículos
 */
router.get('/custo-beneficio', asyncHandler(async (req: Request, res: Response) => {
  const { meses = 6 } = req.query

  // 1. Buscar veículos
  const veiculos = await pool.query('SELECT id_veiculo, placa, modelo FROM veiculo')

  const resultado = []

  for (const veiculo of veiculos.rows) {
    // 2. Calcular custo combustível
    const combustivel = await pool.query(
      `SELECT SUM(valor_total) as total 
       FROM abastecimento 
       WHERE id_veiculo = $1 
       AND data_abast >= CURRENT_DATE - ($2::text || ' months')::interval`,
      [veiculo.id_veiculo, meses]
    )

    // 3. Calcular custo manutenção
    const manutencao = await pool.query(
      `SELECT SUM(valor) as total 
       FROM manutencao 
       WHERE id_veiculo = $1 
       AND concluida = true 
       AND data_man >= CURRENT_DATE - ($2::text || ' months')::interval`,
      [veiculo.id_veiculo, meses]
    )

    // 4. Calcular KM rodados
    const km = await pool.query(
      `SELECT SUM(km_final - km_inicial) as total 
       FROM viagem 
       WHERE id_veiculo = $1 
       AND km_final IS NOT NULL 
       AND data_saida >= CURRENT_DATE - ($2::text || ' months')::interval`,
      [veiculo.id_veiculo, meses]
    )

    // 5. Contar viagens
    const viagens = await pool.query(
      `SELECT COUNT(*) as total 
       FROM viagem 
       WHERE id_veiculo = $1 
       AND data_saida >= CURRENT_DATE - ($2::text || ' months')::interval`,
      [veiculo.id_veiculo, meses]
    )

    const custoCombustivel = parseFloat(combustivel.rows[0].total || 0)
    const custoManutencao = parseFloat(manutencao.rows[0].total || 0)
    const custoOperacional = custoCombustivel + custoManutencao
    const kmRodados = parseFloat(km.rows[0].total || 0)
    const totalViagens = parseInt(viagens.rows[0].total, 10)

    // Calcular métricas
    const custoPorKm = kmRodados > 0 ? custoOperacional / kmRodados : 0
    const taxaUtilizacao = totalViagens > 0 ? (totalViagens / (parseInt(String(meses), 10) * 30)) * 100 : 0

    // Determinar eficiência
    let eficienciaOperacional = 'Baixa'
    if (custoPorKm > 0 && custoPorKm < 2) eficienciaOperacional = 'Alta'
    else if (custoPorKm >= 2 && custoPorKm < 4) eficienciaOperacional = 'Média'

    resultado.push({
      ...veiculo,
      custo_operacional: custoOperacional,
      km_rodados: kmRodados,
      custo_por_km: custoPorKm,
      total_viagens: totalViagens,
      taxa_utilizacao: taxaUtilizacao,
      eficiencia_operacional: eficienciaOperacional
    })
  }

  res.json({
    periodo_meses: meses,
    veiculos: resultado
  })
}))

/**
 * GET /relatorios/timeline - Timeline de eventos
 */
router.get('/timeline', asyncHandler(async (req: Request, res: Response) => {
  const { meses = 6, limit = 100 } = req.query
  const limitNum = parseInt(String(limit), 10)

  // 1. Buscar viagens
  const viagens = await pool.query(
    `SELECT v.data_saida, v.km_final, v.km_inicial, ve.placa
     FROM viagem v
     JOIN veiculo ve ON ve.id_veiculo = v.id_veiculo
     WHERE v.data_saida >= CURRENT_DATE - ($1::text || ' months')::interval
     ORDER BY v.data_saida DESC
     LIMIT $2`,
    [meses, limitNum]
  )

  // 2. Buscar abastecimentos
  const abastecimentos = await pool.query(
    `SELECT a.data_abast, a.valor_total, a.litros, ve.placa
     FROM abastecimento a
     JOIN veiculo ve ON ve.id_veiculo = a.id_veiculo
     WHERE a.data_abast >= CURRENT_DATE - ($1::text || ' months')::interval
     ORDER BY a.data_abast DESC
     LIMIT $2`,
    [meses, limitNum]
  )

  // 3. Buscar manutenções
  const manutencoes = await pool.query(
    `SELECT m.data_man, m.valor, m.descricao, ve.placa
     FROM manutencao m
     JOIN veiculo ve ON ve.id_veiculo = m.id_veiculo
     WHERE m.data_man >= CURRENT_DATE - ($1::text || ' months')::interval
     ORDER BY m.data_man DESC
     LIMIT $2`,
    [meses, limitNum]
  )

  // 4. Processar eventos em JavaScript
  const eventos: any[] = []

  // Adicionar viagens
  viagens.rows.forEach((v: any) => {
    const kmPercorrido = v.km_final && v.km_inicial ? v.km_final - v.km_inicial : 0
    eventos.push({
      tipo: 'viagem',
      data: v.data_saida,
      descricao: kmPercorrido > 0 ? `Viagem - ${kmPercorrido} km` : 'Viagem iniciada',
      veiculo_placa: v.placa,
      km: kmPercorrido
    })
  })

  // Adicionar abastecimentos
  abastecimentos.rows.forEach((a: any) => {
    eventos.push({
      tipo: 'abastecimento',
      data: a.data_abast,
      descricao: `Abastecimento - ${parseFloat(a.litros).toFixed(1)}L`,
      veiculo_placa: a.placa,
      valor: parseFloat(a.valor_total)
    })
  })

  // Adicionar manutenções
  manutencoes.rows.forEach((m: any) => {
    eventos.push({
      tipo: 'manutencao',
      data: m.data_man,
      descricao: `Manutenção - ${m.descricao}`,
      veiculo_placa: m.placa,
      valor: parseFloat(m.valor)
    })
  })

  // Ordenar por data (mais recente primeiro)
  eventos.sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime())

  // Limitar resultado
  const eventosFinal = eventos.slice(0, limitNum)

  res.json({
    periodo_meses: meses,
    total_eventos: eventosFinal.length,
    eventos: eventosFinal
  })
}))

export default router

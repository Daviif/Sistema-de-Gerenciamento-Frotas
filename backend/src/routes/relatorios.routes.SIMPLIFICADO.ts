import { Router, Request, Response } from 'express'
import pool from '../db'
import { asyncHandler, AppError } from '../middleware/errorHandler'

const router = Router()

const MESES_NOMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

/**
 * GET /relatorios/overview - Visão geral do sistema
 * SIMPLIFICADO: Usa múltiplas queries simples ao invés de uma query complexa
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

  // 3. Buscar total de motoristas
  const totalMotoristas = await pool.query('SELECT COUNT(*) as total FROM motorista')
  
  // 4. Buscar motoristas ativos
  const motoristasAtivos = await pool.query(
    'SELECT COUNT(*) as total FROM motorista WHERE status = $1',
    ['ativo']
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
      veiculos_ativos: parseInt(veiculosAtivos.rows[0].total, 10)
    },
    motoristas: {
      total_motoristas: parseInt(totalMotoristas.rows[0].total, 10),
      motoristas_ativos: parseInt(motoristasAtivos.rows[0].total, 10)
    },
    viagens: {
      total_viagens: parseInt(viagensPeriodo.rows[0].total, 10),
      viagens_em_andamento: parseInt(viagensAndamento.rows[0].total, 10),
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
 * SIMPLIFICADO: Busca dados de cada veículo com queries simples
 */
router.get('/veiculos', asyncHandler(async (req: Request, res: Response) => {
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
    const custoCombus tivel = parseFloat(combustivel.rows[0].total || 0)
    const custoManutencao = parseFloat(manutencao.rows[0].total || 0)
    const kmTotal = parseFloat(kmRodados.rows[0].total || 0)
    const custoTotal = custoCombustivel + custoManutencao

    resultado.push({
      ...veiculo,
      total_viagens: parseInt(viagens.rows[0].total, 10),
      km_rodados: kmTotal,
      custo_combustivel: custoCombustivel,
      custo_manutencao: custoManutencao,
      custo_total: custoTotal,
      custo_por_km: kmTotal > 0 ? custoTotal / kmTotal : 0
    })
  }

  res.json({
    periodo_meses: meses,
    veiculos: resultado
  })
}))

/**
 * GET /relatorios/motoristas - Relatório detalhado de motoristas
 * SIMPLIFICADO: Uma query por dado necessário
 */
router.get('/motoristas', asyncHandler(async (req: Request, res: Response) => {
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

    // 4. Calcular KM total
    const kmTotal = await pool.query(
      `SELECT SUM(km_final - km_inicial) as total 
       FROM viagem 
       WHERE cpf_motorista = $1 
       AND km_final IS NOT NULL 
       AND data_saida >= CURRENT_DATE - ($2::text || ' months')::interval`,
      [motorista.cpf, meses]
    )

    const total = parseInt(totalViagens.rows[0].total, 10)
    const finalizadas = parseInt(viagensFinalizadas.rows[0].total, 10)
    const km = parseFloat(kmTotal.rows[0].total || 0)

    resultado.push({
      ...motorista,
      total_viagens: total,
      viagens_finalizadas: finalizadas,
      km_rodados: km,
      taxa_conclusao: total > 0 ? (finalizadas / total) * 100 : 0
    })
  }

  res.json({
    periodo_meses: meses,
    motoristas: resultado
  })
}))

/**
 * GET /relatorios/combustivel - Relatório de combustível
 * SIMPLIFICADO: Queries mais simples
 */
router.get('/combustivel', asyncHandler(async (req: Request, res: Response) => {
  const { meses = 6 } = req.query

  // 1. Buscar veículos
  const veiculos = await pool.query('SELECT id_veiculo, placa, modelo FROM veiculo')

  const resultado = []

  for (const veiculo of veiculos.rows) {
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

    const totalLitros = parseFloat(litros.rows[0].total || 0)
    const totalCusto = parseFloat(custo.rows[0].total || 0)
    const totalKm = parseFloat(km.rows[0].total || 0)

    // Só incluir veículos que tiveram abastecimento
    if (totalLitros > 0) {
      resultado.push({
        ...veiculo,
        total_litros: totalLitros,
        custo_total: totalCusto,
        km_rodados: totalKm,
        consumo_medio_km_l: totalKm > 0 && totalLitros > 0 ? totalKm / totalLitros : 0,
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
 * SIMPLIFICADO: Query direta por veículo
 */
router.get('/manutencao', asyncHandler(async (req: Request, res: Response) => {
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

    resultado.push({
      ...veiculo,
      total_manutencoes: parseInt(total.rows[0].total, 10),
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
 * SIMPLIFICADO: Query básica com JOIN e GROUP BY
 */
router.get('/rotas', asyncHandler(async (req: Request, res: Response) => {
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
 * SIMPLIFICADO: Loop com queries simples
 */
router.get('/mensal', asyncHandler(async (req: Request, res: Response) => {
  const { meses = 6 } = req.query
  const numMeses = parseInt(String(meses), 10)
  
  const resultado = []
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

    resultado.push({
      mes: `${MESES_NOMES[data.getMonth()]} ${data.getFullYear()}`,
      viagens: parseInt(viagens.rows[0].total, 10),
      km: parseFloat(km.rows[0].total || 0),
      custo_combustivel: parseFloat(combustivel.rows[0].total || 0),
      custo_manutencao: parseFloat(manutencao.rows[0].total || 0)
    })
  }

  res.json({
    periodo_meses: meses,
    meses: resultado
  })
}))

export default router

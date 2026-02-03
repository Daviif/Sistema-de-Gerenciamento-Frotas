import { Router, Request, Response } from 'express'
import pool from '../db'
import { asyncHandler } from '../middleware/errorHandler'

const router = Router()

const MESES_NOMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

// ✅ GET /estatisticas/geral - Estatísticas gerais cruzadas (combustível, manutenção, viagens)
router.get('/geral', asyncHandler(async (req: Request, res: Response) => {
  const meses = Math.min(12, Math.max(1, parseInt(String(req.query.meses || 6))))

  // Combustível - total e por mês
  const combustivelTotal = await pool.query(
    `SELECT 
      COALESCE(SUM(valor_total), 0) as total,
      COUNT(*) as quantidade
     FROM abastecimento
     WHERE data_abast >= CURRENT_DATE - ($1::text || ' months')::interval`,
    [meses]
  )

  const combustivelPorMes = await pool.query(
    `SELECT 
      TO_CHAR(data_abast, 'YYYY-MM') as mes,
      EXTRACT(MONTH FROM data_abast)::int as mes_num,
      EXTRACT(YEAR FROM data_abast)::int as ano,
      SUM(valor_total) as valor,
      SUM(litros) as litros,
      COUNT(*) as quantidade
     FROM abastecimento
     WHERE data_abast >= CURRENT_DATE - ($1::text || ' months')::interval
     GROUP BY TO_CHAR(data_abast, 'YYYY-MM'), EXTRACT(MONTH FROM data_abast), EXTRACT(YEAR FROM data_abast)
     ORDER BY mes ASC`,
    [meses]
  )

  // Manutenção - total e por mês (apenas concluídas para valor real)
  const manutencaoTotal = await pool.query(
    `SELECT 
      COALESCE(SUM(CASE WHEN concluida THEN COALESCE(valor, 0) ELSE 0 END), 0) as total,
      COUNT(*) as quantidade
     FROM manutencao
     WHERE data_man >= CURRENT_DATE - ($1::text || ' months')::interval`,
    [meses]
  )

  const manutencaoPorMes = await pool.query(
    `SELECT 
      TO_CHAR(data_man, 'YYYY-MM') as mes,
      EXTRACT(MONTH FROM data_man)::int as mes_num,
      EXTRACT(YEAR FROM data_man)::int as ano,
      SUM(CASE WHEN concluida THEN COALESCE(valor, 0) ELSE 0 END) as valor,
      COUNT(*) as quantidade
     FROM manutencao
     WHERE data_man >= CURRENT_DATE - ($1::text || ' months')::interval
     GROUP BY TO_CHAR(data_man, 'YYYY-MM'), EXTRACT(MONTH FROM data_man), EXTRACT(YEAR FROM data_man)
     ORDER BY mes ASC`,
    [meses]
  )

  // Viagens - KM total e por mês
  const viagensTotal = await pool.query(
    `SELECT 
      COUNT(*) as total_viagens,
      COUNT(CASE WHEN status_viagem = 'finalizada' THEN 1 END) as finalizadas,
      COALESCE(SUM(CASE WHEN km_final IS NOT NULL THEN km_final - km_inicial ELSE 0 END), 0) as km_total
     FROM viagem
     WHERE data_saida >= CURRENT_DATE - ($1::text || ' months')::interval`,
    [meses]
  )

  const kmPorMes = await pool.query(
    `SELECT 
      TO_CHAR(data_saida, 'YYYY-MM') as mes,
      EXTRACT(MONTH FROM data_saida)::int as mes_num,
      EXTRACT(YEAR FROM data_saida)::int as ano,
      COALESCE(SUM(CASE WHEN km_final IS NOT NULL THEN km_final - km_inicial ELSE 0 END), 0) as km
     FROM viagem
     WHERE data_saida >= CURRENT_DATE - ($1::text || ' months')::interval
     GROUP BY TO_CHAR(data_saida, 'YYYY-MM'), EXTRACT(MONTH FROM data_saida), EXTRACT(YEAR FROM data_saida)
     ORDER BY mes ASC`,
    [meses]
  )

  // Montar série mensal unificada (últimos N meses)
  const hoje = new Date()
  const seriesMensais: Array<{
    mes: string
    mes_nome: string
    combustivel: number
    manutencao: number
    km: number
    custo_total: number
  }> = []

  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    const mesKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const mesNome = MESES_NOMES[d.getMonth()] ?? 'N/A'

    const comb = combustivelPorMes.rows.find((r: { mes: string }) => r.mes === mesKey)
    const man = manutencaoPorMes.rows.find((r: { mes: string }) => r.mes === mesKey)
    const km = kmPorMes.rows.find((r: { mes: string }) => r.mes === mesKey)

    const combustivelVal = comb ? parseFloat(comb.valor) || 0 : 0
    const manutencaoVal = man ? parseFloat(man.valor) || 0 : 0
    const kmVal = km ? parseInt(km.km, 10) || 0 : 0

    seriesMensais.push({
      mes: mesKey,
      mes_nome: mesNome,
      combustivel: combustivelVal,
      manutencao: manutencaoVal,
      km: kmVal,
      custo_total: combustivelVal + manutencaoVal,
    })
  }

  const custoCombustivel = parseFloat(combustivelTotal.rows[0]?.total) || 0
  const custoManutencao = parseFloat(manutencaoTotal.rows[0]?.total) || 0
  const kmTotal = parseInt(viagensTotal.rows[0]?.km_total, 10) || 0
  const custoTotal = custoCombustivel + custoManutencao

  res.json({
    periodo_meses: meses,
    resumo: {
      custo_total_combustivel: custoCombustivel,
      custo_total_manutencao: custoManutencao,
      custo_total_operacional: custoTotal,
      km_total: kmTotal,
      custo_por_km: kmTotal > 0 ? custoTotal / kmTotal : 0,
      total_viagens: parseInt(viagensTotal.rows[0]?.total_viagens, 10) || 0,
      viagens_finalizadas: parseInt(viagensTotal.rows[0]?.finalizadas, 10) || 0,
      total_abastecimentos: parseInt(combustivelTotal.rows[0]?.quantidade, 10) || 0,
      total_manutencoes: parseInt(manutencaoTotal.rows[0]?.quantidade, 10) || 0,
    },
    por_mes: seriesMensais,
  })
}))

export default router

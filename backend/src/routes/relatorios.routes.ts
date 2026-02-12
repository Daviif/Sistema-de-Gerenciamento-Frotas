import { Router, Request, Response } from 'express'
import pool from '../db'
import { asyncHandler, AppError } from '../middleware/errorHandler'

const router = Router()

const MESES_NOMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

// ✅ GET /relatorios/overview - Visão geral completa do sistema
router.get('/overview', asyncHandler(async (req: Request, res: Response) => {
  const { meses = 6 } = req.query

  // Totalizadores gerais
  const [veiculos, motoristas, cidades] = await Promise.all([
    pool.query('SELECT COUNT(*) as total, COUNT(CASE WHEN status = $1 THEN 1 END) as ativos FROM veiculo', ['ativo']),
    pool.query('SELECT COUNT(*) as total, COUNT(CASE WHEN status = $1 THEN 1 END) as ativos FROM motorista', ['ativo']),
    pool.query('SELECT COUNT(*) as total FROM cidade')
  ])

  // Viagens
  const viagens = await pool.query(
    `SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN status_viagem = 'em_andamento' THEN 1 END) as em_andamento,
      COUNT(CASE WHEN status_viagem = 'finalizada' THEN 1 END) as finalizadas,
      COUNT(CASE WHEN status_viagem = 'cancelada' THEN 1 END) as canceladas,
      COALESCE(SUM(CASE WHEN km_final IS NOT NULL THEN km_final - km_inicial ELSE 0 END), 0) as km_total
     FROM viagem
     WHERE data_saida >= CURRENT_DATE - ($1::text || ' months')::interval`,
    [meses]
  )

  // Custos
  const custos = await pool.query(
    `SELECT 
      (SELECT COALESCE(SUM(valor_total), 0) FROM abastecimento WHERE data_abast >= CURRENT_DATE - ($1::text || ' months')::interval) as combustivel,
      (SELECT COALESCE(SUM(CASE WHEN concluida THEN valor ELSE 0 END), 0) FROM manutencao WHERE data_man >= CURRENT_DATE - ($1::text || ' months')::interval) as manutencao`,
    [meses]
  )

  const custoTotal = parseFloat(custos.rows[0].combustivel) + parseFloat(custos.rows[0].manutencao)
  const kmTotal = parseInt(viagens.rows[0].km_total, 10)

  // Dados de veículos em viagem e manutenção
  const veiculosStatus = await pool.query(
    `SELECT 
      COUNT(CASE WHEN status = 'em_viagem' THEN 1 END) as em_viagem,
      COUNT(CASE WHEN status = 'manutencao' THEN 1 END) as manutencao
     FROM veiculo`
  )

  // Dados de motoristas em viagem
  const motoristasStatus = await pool.query(
    `SELECT 
      COALESCE((SELECT COUNT(DISTINCT cpf_motorista) FROM viagem WHERE status_viagem = 'em_andamento'), 0) as em_viagem`
  )

  res.json({
    periodo_meses: meses,
    frota: {
      total_veiculos: parseInt(veiculos.rows[0].total, 10),
      veiculos_ativos: parseInt(veiculos.rows[0].ativos, 10),
      veiculos_em_viagem: parseInt(veiculosStatus.rows[0].em_viagem, 10),
      veiculos_manutencao: parseInt(veiculosStatus.rows[0].manutencao, 10)
    },
    motoristas: {
      total_motoristas: parseInt(motoristas.rows[0].total, 10),
      motoristas_ativos: parseInt(motoristas.rows[0].ativos, 10),
      motoristas_em_viagem: parseInt(motoristasStatus.rows[0].em_viagem, 10)
    },
    viagens: {
      total_viagens: parseInt(viagens.rows[0].total, 10),
      viagens_em_andamento: parseInt(viagens.rows[0].em_andamento, 10),
      viagens_finalizadas: parseInt(viagens.rows[0].finalizadas, 10),
      viagens_canceladas: parseInt(viagens.rows[0].canceladas, 10),
      km_total_percorrido: kmTotal
    },
    cidades: {
      total_cidades: parseInt(cidades.rows[0].total, 10)
    },
    custos: {
      custo_total_combustivel: parseFloat(custos.rows[0].combustivel),
      custo_total_manutencao: parseFloat(custos.rows[0].manutencao),
      custo_operacional_total: custoTotal
    }
  })
}))

// ✅ GET /relatorios/frota-completo - Análise detalhada da frota
router.get('/frota-completo', asyncHandler(async (req: Request, res: Response) => {
  const { meses = 6 } = req.query

  const frotaDetalhada = await pool.query(
    `SELECT 
      v.id_veiculo,
      v.placa,
      v.modelo,
      v.marca,
      v.ano,
      v.tipo,
      v.km_atual,
      v.status,
      v.capacidade_tanque,
      -- Viagens
      COUNT(DISTINCT vg.id_viagem) as total_viagens,
      COALESCE(SUM(CASE WHEN vg.km_final IS NOT NULL THEN vg.km_final - vg.km_inicial ELSE 0 END), 0) as km_viagens,
      -- Abastecimento
      COUNT(DISTINCT a.id_abastecimento) as total_abastecimentos,
      COALESCE(SUM(a.litros), 0) as total_litros,
      COALESCE(SUM(a.valor_total), 0) as custo_combustivel,
      -- Manutenção
      COUNT(DISTINCT m.id_manutencao) as total_manutencoes,
      COALESCE(SUM(CASE WHEN m.concluida THEN m.valor ELSE 0 END), 0) as custo_manutencao,
      COUNT(DISTINCT CASE WHEN NOT m.concluida THEN m.id_manutencao END) as manutencoes_pendentes
     FROM veiculo v
     LEFT JOIN viagem vg ON vg.id_veiculo = v.id_veiculo 
       AND vg.data_saida >= CURRENT_DATE - ($1::text || ' months')::interval
     LEFT JOIN abastecimento a ON a.id_veiculo = v.id_veiculo
       AND a.data_abast >= CURRENT_DATE - ($1::text || ' months')::interval
     LEFT JOIN manutencao m ON m.id_veiculo = v.id_veiculo
       AND m.data_man >= CURRENT_DATE - ($1::text || ' months')::interval
     GROUP BY v.id_veiculo, v.placa, v.modelo, v.marca, v.ano, v.tipo, v.km_atual, v.status, v.capacidade_tanque
     ORDER BY km_viagens DESC`,
    [meses]
  )

  const veiculos = frotaDetalhada.rows.map(v => {
    const custoTotal = Number(v.custo_combustivel) + Number(v.custo_manutencao)
    const kmRodados = Number(v.km_viagens)
    const totalLitros = Number(v.total_litros)
    const totalAbastecimentos = Number(v.total_abastecimentos)

    return {
      id_veiculo: v.id_veiculo,
      placa: v.placa,
      marca: v.marca,
      modelo: v.modelo,
      ano: v.ano,
      tipo: v.tipo,
      km_atual: v.km_atual,
      status: v.status,
      capacidade_tanque: v.capacidade_tanque,
      total_viagens: Number(v.total_viagens),
      total_abastecimentos: totalAbastecimentos,
      total_litros: totalLitros,
      custo_combustivel: Number(v.custo_combustivel),
      custo_manutencao: Number(v.custo_manutencao),
      km_rodados: kmRodados,
      custo_total: custoTotal,
      custo_por_km: kmRodados > 0 ? custoTotal / kmRodados : 0,
      consumo_medio_km_l: kmRodados > 0 && totalLitros > 0 ? kmRodados / totalLitros : 0,
      km_por_abastecimento: totalAbastecimentos > 0 ? kmRodados / totalAbastecimentos : 0
    }
  })

  res.json({
    periodo_meses: meses,
    veiculos,
    totalizadores: {
      total_veiculos: veiculos.length,
      km_total: veiculos.reduce((acc, v) => acc + v.km_rodados, 0),
      custo_total: veiculos.reduce((acc, v) => acc + v.custo_total, 0),
      total_viagens: veiculos.reduce((acc, v) => acc + parseInt(v.total_viagens, 10), 0)
    }
  })
}))

// ✅ GET /relatorios/motoristas-completo - Análise detalhada dos motoristas
router.get('/motoristas-completo', asyncHandler(async (req: Request, res: Response) => {
  const { meses = 6 } = req.query

  const motoristasDetalhado = await pool.query(
    `SELECT 
      m.cpf,
      m.nome,
      m.cnh,
      m.cat_cnh,
      m.validade_cnh,
      m.status,
      -- Viagens
      COUNT(DISTINCT v.id_viagem) as total_viagens,
      COUNT(DISTINCT CASE WHEN v.status_viagem = 'finalizada' THEN v.id_viagem END) as viagens_finalizadas,
      COUNT(DISTINCT CASE WHEN v.status_viagem = 'cancelada' THEN v.id_viagem END) as viagens_canceladas,
      COALESCE(SUM(CASE WHEN v.km_final IS NOT NULL THEN v.km_final - v.km_inicial ELSE 0 END), 0) as km_total,
      -- Média de KM por viagem
      COALESCE(AVG(CASE WHEN v.km_final IS NOT NULL THEN v.km_final - v.km_inicial ELSE NULL END), 0) as km_media_viagem,
      -- Veículos diferentes utilizados
      COUNT(DISTINCT v.id_veiculo) as veiculos_utilizados,
      -- Rotas diferentes
      COUNT(DISTINCT CONCAT(v.cidade_origem::text, '-', v.cidade_destino::text)) as rotas_diferentes,
      -- Horas (será calculado em JavaScript)
      array_agg(CASE WHEN v.data_chegada IS NOT NULL AND v.status_viagem = 'finalizada' THEN ROUND(EXTRACT(EPOCH FROM (v.data_chegada::timestamp - v.data_saida::timestamp))::numeric / 3600, 2) ELSE NULL END) as horas_array
     FROM motorista m
     LEFT JOIN viagem v ON v.cpf_motorista = m.cpf
       AND v.data_saida >= CURRENT_DATE - ($1::text || ' months')::interval
     GROUP BY m.cpf, m.nome, m.cnh, m.cat_cnh, m.validade_cnh, m.status
     ORDER BY total_viagens DESC`,
    [meses]
  )

  const motoristas = motoristasDetalhado.rows.map(m => {
    const validadeCnh = new Date(m.validade_cnh)
    const agora = new Date()
    const diasParaVencer = Math.ceil((validadeCnh.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24))
    
    // Calcular média de horas a partir do array
    const horasValidas = (m.horas_array || []).filter(h => h !== null && h !== undefined)
    const horasMediaViagem = horasValidas.length > 0 
      ? horasValidas.reduce((a, b) => a + b, 0) / horasValidas.length 
      : 0
    
    return {
      cpf: m.cpf,
      nome: m.nome,
      validade_cnh: m.validade_cnh,
      total_viagens: parseInt(m.total_viagens, 10),
      viagens_finalizadas: parseInt(m.viagens_finalizadas, 10),
      viagens_canceladas: parseInt(m.viagens_canceladas, 10),
      km_rodados: parseInt(m.km_total, 10),
      veiculos_diferentes: parseInt(m.veiculos_utilizados, 10),
      rotas_diferentes: parseInt(m.rotas_diferentes, 10),
      horas_media_viagem: horasMediaViagem,
      taxa_conclusao: parseInt(m.total_viagens, 10) > 0
        ? (parseInt(m.viagens_finalizadas, 10) / parseInt(m.total_viagens, 10)) * 100
        : 0,
      cnh_vencida: validadeCnh < agora,
      dias_para_vencer_cnh: diasParaVencer
    }
  })

  res.json({
    periodo_meses: meses,
    motoristas,
    totalizadores: {
      total_motoristas: motoristas.length,
      km_total: motoristas.reduce((acc, m) => acc + m.km_rodados, 0),
      total_viagens: motoristas.reduce((acc, m) => acc + m.total_viagens, 0),
      cnh_vencidas: motoristas.filter(m => m.cnh_vencida).length
    }
  })
}))

// ✅ GET /relatorios/eficiencia-combustivel - Análise de eficiência de combustível
router.get('/eficiencia-combustivel', asyncHandler(async (req: Request, res: Response) => {
  const { meses = 6, tipo_combustivel } = req.query

  let query = `
    SELECT 
      v.id_veiculo,
      v.placa,
      v.modelo,
      v.marca,
      v.tipo,
      -- Abastecimento
      COUNT(DISTINCT a.id_abastecimento) as total_abastecimentos,
      COALESCE(SUM(a.litros), 0) as total_litros,
      COALESCE(SUM(a.valor_total), 0) as custo_total,
      COALESCE(AVG(a.valor_total / a.litros), 0) as preco_medio_litro,
      -- Viagens
      COALESCE(SUM(CASE WHEN vg.km_final IS NOT NULL THEN vg.km_final - vg.km_inicial ELSE 0 END), 0) as km_rodados,
      -- Tipo de combustível predominante
      (
        SELECT tipo_combustivel 
        FROM abastecimento a2 
        WHERE a2.id_veiculo = v.id_veiculo
        GROUP BY tipo_combustivel 
        ORDER BY COUNT(*) DESC 
        LIMIT 1
      ) as combustivel_principal
    FROM veiculo v
    LEFT JOIN abastecimento a ON a.id_veiculo = v.id_veiculo
      AND a.data_abast >= CURRENT_DATE - ($1::text || ' months')::interval
      ${tipo_combustivel ? "AND a.tipo_combustivel = $2" : ""}
    LEFT JOIN viagem vg ON vg.id_veiculo = v.id_veiculo
      AND vg.data_saida >= CURRENT_DATE - ($1::text || ' months')::interval
      AND vg.km_final IS NOT NULL
    GROUP BY v.id_veiculo, v.placa, v.modelo, v.marca, v.tipo
    HAVING COUNT(DISTINCT a.id_abastecimento) > 0
    ORDER BY total_litros DESC
  `

  const params = tipo_combustivel ? [meses, tipo_combustivel] : [meses]
  const result = await pool.query(query, params)

  const veiculosProcessados = result.rows.map(v => {
    const kmRodados = Number(v.km_rodados) || 0
    const totalLitros = Number(v.total_litros) || 0
    const custoTotal = Number(v.custo_total) || 0
    const consumoMedio = totalLitros > 0 ? kmRodados / totalLitros : 0

    let classificacao = 'sem_dados'
    if (consumoMedio > 0) {
      if (consumoMedio >= 10) classificacao = 'excelente'
      else if (consumoMedio >= 8) classificacao = 'bom'
      else if (consumoMedio >= 6) classificacao = 'regular'
      else classificacao = 'ruim'
    }

    return {
      id_veiculo: v.id_veiculo,
      placa: v.placa,
      modelo: v.modelo,
      marca: v.marca,
      tipo: v.tipo,
      total_abastecimentos: Number(v.total_abastecimentos) || 0,
      total_litros: totalLitros,
      custo_total: custoTotal,
      consumo_medio_km_l: consumoMedio,
      custo_por_km: kmRodados > 0 ? custoTotal / kmRodados : 0,
      litros_por_100km: kmRodados > 0 ? (totalLitros / kmRodados) * 100 : 0,
      preco_medio_litro: Number(v.preco_medio_litro) || 0,
      combustivel_principal: v.combustivel_principal || 'Não informado',
      classificacao
    }
  })

  res.json({
    periodo_meses: meses,
    tipo_combustivel: tipo_combustivel || 'todos',
    veiculos: veiculosProcessados,
    estatisticas: {
      consumo_medio_geral: veiculosProcessados.length > 0
        ? veiculosProcessados.reduce((acc, v) => acc + v.consumo_medio_km_l, 0) / veiculosProcessados.length
        : 0,
      custo_medio_por_km: veiculosProcessados.length > 0
        ? veiculosProcessados.reduce((acc, v) => acc + v.custo_por_km, 0) / veiculosProcessados.length
        : 0,
      total_litros: veiculosProcessados.reduce((acc, v) => acc + v.total_litros, 0),
      total_gasto: veiculosProcessados.reduce((acc, v) => acc + v.custo_total, 0)
    }
  })
}))

// ✅ GET /relatorios/manutencao-critica - Análise crítica de manutenção
router.get('/manutencao-critica', asyncHandler(async (req: Request, res: Response) => {
  const { meses = 12 } = req.query

  // Veículos com mais manutenções
  const manutencoesPorVeiculo = await pool.query(
    `SELECT 
      v.id_veiculo,
      v.placa,
      v.modelo,
      v.marca,
      v.ano,
      v.km_atual,
      -- Manutenções
      COUNT(m.id_manutencao) as total_manutencoes,
      COUNT(CASE WHEN m.tipo = 'corretiva' THEN 1 END) as corretivas,
      COUNT(CASE WHEN m.tipo = 'preventiva' THEN 1 END) as preventivas,
      COUNT(CASE WHEN NOT m.concluida THEN 1 END) as pendentes,
      COALESCE(SUM(CASE WHEN m.concluida THEN m.valor ELSE 0 END), 0) as custo_total,
      COALESCE(AVG(m.valor), 0) as custo_medio,
      -- Últimas datas (será calculado em JavaScript)
      array_agg(m.data_man ORDER BY m.data_man DESC) as datas_manutencoes,
      -- Última manutenção
      MAX(m.data_man) as ultima_manutencao
     FROM veiculo v
     LEFT JOIN manutencao m ON m.id_veiculo = v.id_veiculo
       AND m.data_man >= CURRENT_DATE - ($1::text || ' months')::interval
     GROUP BY v.id_veiculo, v.placa, v.modelo, v.marca, v.ano, v.km_atual
     ORDER BY total_manutencoes DESC`,
    [meses]
  )

  // Veículos que precisam de atenção
  const veiculosAtencao = manutencoesPorVeiculo.rows.filter(v => {
    const diasDesdeUltima = v.ultima_manutencao
      ? Math.floor((Date.now() - new Date(v.ultima_manutencao).getTime()) / (1000 * 60 * 60 * 24))
      : null
    
    return (
      parseInt(v.pendentes, 10) > 0 ||
      parseInt(v.corretivas, 10) > 5 ||
      (diasDesdeUltima && diasDesdeUltima > 90)
    )
  })

  // Análise por tipo de manutenção
  const porTipo = await pool.query(
    `SELECT 
      tipo,
      COUNT(*) as quantidade,
      COALESCE(SUM(CASE WHEN concluida THEN valor ELSE 0 END), 0) as custo_total,
      COALESCE(AVG(CASE WHEN concluida THEN valor END), 0) as custo_medio,
      COUNT(CASE WHEN NOT concluida THEN 1 END) as pendentes
     FROM manutencao
     WHERE data_man >= CURRENT_DATE - ($1::text || ' months')::interval
     GROUP BY tipo
     ORDER BY quantidade DESC`,
    [meses]
  )

  res.json({
    periodo_meses: meses,
    veiculos: manutencoesPorVeiculo.rows.map(v => {
      const diasDesdeUltima = v.ultima_manutencao
        ? Math.floor((Date.now() - new Date(v.ultima_manutencao).getTime()) / (1000 * 60 * 60 * 24))
        : null
      
      // Calcular dias entre manutenções a partir do array de datas
      let diasEntreManutencoes = 0
      const datas = (v.datas_manutencoes || []).filter(d => d !== null && d !== undefined)
      if (datas.length > 1) {
        let totalDias = 0
        for (let i = 0; i < datas.length - 1; i++) {
          const diff = Math.floor((new Date(datas[i]).getTime() - new Date(datas[i + 1]).getTime()) / (1000 * 60 * 60 * 24))
          totalDias += diff
        }
        diasEntreManutencoes = totalDias / (datas.length - 1)
      }

      return {
        ...v,
        dias_desde_ultima_manutencao: diasDesdeUltima,
        dias_entre_manutencoes: diasEntreManutencoes,
        necessita_atencao: diasDesdeUltima && diasDesdeUltima > 90 || parseInt(v.pendentes, 10) > 0
      }
    }),
    veiculos_necessitam_atencao: veiculosAtencao.length,
    analise_por_tipo: porTipo.rows,
    estatisticas: {
      custo_total: manutencoesPorVeiculo.rows.reduce((acc, v) => acc + parseFloat(v.custo_total), 0),
      total_manutencoes: manutencoesPorVeiculo.rows.reduce((acc, v) => acc + parseInt(v.total_manutencoes, 10), 0),
      total_pendentes: manutencoesPorVeiculo.rows.reduce((acc, v) => acc + parseInt(v.pendentes, 10), 0)
    }
  })
}))

// ✅ GET /relatorios/rotas-analise - Análise completa de rotas
router.get('/rotas-analise', asyncHandler(async (req: Request, res: Response) => {
  const { meses = 6, limit = 20 } = req.query

  const rotasDetalhadas = await pool.query(
    `SELECT 
      c1.nome || ' (' || c1.uf || ')' as origem,
      c2.nome || ' (' || c2.uf || ')' as destino,
      COUNT(*) as total_viagens,
      COUNT(CASE WHEN v.status_viagem = 'finalizada' THEN 1 END) as finalizadas,
      COUNT(CASE WHEN v.status_viagem = 'cancelada' THEN 1 END) as canceladas,
      COALESCE(SUM(CASE WHEN v.km_final IS NOT NULL THEN v.km_final - v.km_inicial ELSE 0 END), 0) as km_total,
      COALESCE(AVG(CASE WHEN v.km_final IS NOT NULL THEN v.km_final - v.km_inicial ELSE NULL END), 0) as km_medio,
      -- Tempo médio de viagem (será calculado em JavaScript)
      array_agg(CASE WHEN v.data_chegada IS NOT NULL AND v.status_viagem = 'finalizada' THEN ROUND(EXTRACT(EPOCH FROM (v.data_chegada::timestamp - v.data_saida::timestamp))::numeric / 3600, 2) ELSE NULL END) as horas_array,
      -- Veículos diferentes nesta rota
      COUNT(DISTINCT v.id_veiculo) as veiculos_diferentes,
      -- Motoristas diferentes nesta rota
      COUNT(DISTINCT v.cpf_motorista) as motoristas_diferentes
     FROM viagem v
     JOIN cidade c1 ON c1.id_cidade = v.cidade_origem
     JOIN cidade c2 ON c2.id_cidade = v.cidade_destino
     WHERE v.data_saida >= CURRENT_DATE - ($1::text || ' months')::interval
     GROUP BY c1.nome, c1.uf, c2.nome, c2.uf
     ORDER BY total_viagens DESC
     LIMIT $2`,
    [meses, limit]
  )

  const rotas = rotasDetalhadas.rows.map(r => {
    const totalViagens = Number(r.total_viagens) || 0
    const finalizadas = Number(r.finalizadas) || 0
    
    // Calcular média de horas a partir do array
    const horasValidas = (r.horas_array || []).filter(h => h !== null && h !== undefined)
    const horasMedias = horasValidas.length > 0 
      ? horasValidas.reduce((a, b) => a + b, 0) / horasValidas.length 
      : 0
    
    return {
      origem: r.origem,
      destino: r.destino,
      total_viagens: totalViagens,
      finalizadas,
      canceladas: Number(r.canceladas) || 0,
      km_total: Number(r.km_total) || 0,
      km_medio: Number(r.km_medio) || 0,
      horas_medias: horasMedias,
      veiculos_diferentes: Number(r.veiculos_diferentes) || 0,
      motoristas_diferentes: Number(r.motoristas_diferentes) || 0,
      taxa_sucesso: totalViagens > 0 ? (finalizadas / totalViagens) * 100 : 0,
      popularidade: 'alta'
    }
  })

  // Cidades mais utilizadas
  const cidadesOrigem = await pool.query(
    `SELECT 
      c.nome || ' (' || c.uf || ')' as cidade,
      COUNT(*) as total_saidas
     FROM viagem v
     JOIN cidade c ON c.id_cidade = v.cidade_origem
     WHERE v.data_saida >= CURRENT_DATE - ($1::text || ' months')::interval
     GROUP BY c.nome, c.uf
     ORDER BY total_saidas DESC
     LIMIT 10`,
    [meses]
  )

  const cidadesDestino = await pool.query(
    `SELECT 
      c.nome || ' (' || c.uf || ')' as cidade,
      COUNT(*) as total_chegadas
     FROM viagem v
     JOIN cidade c ON c.id_cidade = v.cidade_destino
     WHERE v.data_saida >= CURRENT_DATE - ($1::text || ' months')::interval
     GROUP BY c.nome, c.uf
     ORDER BY total_chegadas DESC
     LIMIT 10`,
    [meses]
  )

  res.json({
    periodo_meses: meses,
    rotas_mais_utilizadas: rotas,
    cidades_origem_populares: cidadesOrigem.rows,
    cidades_destino_populares: cidadesDestino.rows,
    estatisticas: {
      total_rotas_diferentes: rotas.length,
      km_total: rotas.reduce((acc, r) => acc + r.km_total, 0),
      viagens_total: rotas.reduce((acc, r) => acc + r.total_viagens, 0)
    }
  })
}))

// ✅ GET /relatorios/custo-beneficio - Análise de custo-benefício por veículo
router.get('/custo-beneficio', asyncHandler(async (req: Request, res: Response) => {
  const { meses = 6 } = req.query

  const custoBeneficio = await pool.query(
    `SELECT 
      v.id_veiculo,
      v.placa,
      v.modelo,
      v.marca,
      v.ano,
      v.tipo,
      -- Receita (estimativa baseada em viagens finalizadas)
      COUNT(CASE WHEN vg.status_viagem = 'finalizada' THEN 1 END) as viagens_finalizadas,
      COALESCE(SUM(CASE WHEN vg.km_final IS NOT NULL THEN vg.km_final - vg.km_inicial ELSE 0 END), 0) as km_total,
      -- Custos
      COALESCE(SUM(a.valor_total), 0) as custo_combustivel,
      COALESCE(SUM(CASE WHEN m.concluida THEN m.valor ELSE 0 END), 0) as custo_manutencao,
      -- Utilização
      COUNT(DISTINCT DATE(vg.data_saida)) as dias_utilizados
     FROM veiculo v
     LEFT JOIN viagem vg ON vg.id_veiculo = v.id_veiculo
       AND vg.data_saida >= CURRENT_DATE - ($1::text || ' months')::interval
     LEFT JOIN abastecimento a ON a.id_veiculo = v.id_veiculo
       AND a.data_abast >= CURRENT_DATE - ($1::text || ' months')::interval
     LEFT JOIN manutencao m ON m.id_veiculo = v.id_veiculo
       AND m.data_man >= CURRENT_DATE - ($1::text || ' months')::interval
     GROUP BY v.id_veiculo, v.placa, v.modelo, v.marca, v.ano, v.tipo
     ORDER BY km_total DESC`,
    [meses]
  )

  const diasPeriodo = parseInt(String(meses), 10) * 30

  const veiculos = custoBeneficio.rows.map(v => {
    const custoTotal = parseFloat(v.custo_combustivel) + parseFloat(v.custo_manutencao)
    const kmTotal = parseFloat(v.km_total)
    const diasUtilizados = parseInt(v.dias_utilizados, 10)

    return {
      ...v,
      custo_total: custoTotal,
      custo_por_km: kmTotal > 0 ? custoTotal / kmTotal : 0,
      taxa_utilizacao: (diasUtilizados / diasPeriodo) * 100,
      km_por_dia_util: diasUtilizados > 0 ? kmTotal / diasUtilizados : 0,
      eficiencia_geral: kmTotal > 0 && custoTotal > 0 ? kmTotal / custoTotal : 0 // km por real gasto
    }
  })

  res.json({
    periodo_meses: meses,
    veiculos,
    analise: {
      veiculos_mais_eficientes: veiculos
        .filter(v => v.km_total > 0)
        .sort((a, b) => b.eficiencia_geral - a.eficiencia_geral)
        .slice(0, 5),
      veiculos_subutilizados: veiculos
        .filter(v => v.taxa_utilizacao < 30)
        .sort((a, b) => a.taxa_utilizacao - b.taxa_utilizacao)
        .slice(0, 5),
      veiculos_alto_custo: veiculos
        .filter(v => v.km_total > 0)
        .sort((a, b) => b.custo_por_km - a.custo_por_km)
        .slice(0, 5)
    }
  })
}))

// ✅ GET /relatorios/timeline - Timeline de eventos do período
router.get('/timeline', asyncHandler(async (req: Request, res: Response) => {
  const { meses = 3 } = req.query

  const eventos = await pool.query(
    `
    SELECT 
      'viagem' as tipo,
      vg.id_viagem as id,
      vg.data_saida as data,
      v.placa,
      m.nome as motorista,
      c1.nome || ' → ' || c2.nome as descricao,
      vg.status_viagem as status
    FROM viagem vg
    JOIN veiculo v ON v.id_veiculo = vg.id_veiculo
    JOIN motorista m ON m.cpf = vg.cpf_motorista
    JOIN cidade c1 ON c1.id_cidade = vg.cidade_origem
    JOIN cidade c2 ON c2.id_cidade = vg.cidade_destino
    WHERE vg.data_saida >= CURRENT_DATE - ($1::text || ' months')::interval

    UNION ALL

    SELECT 
      'abastecimento' as tipo,
      a.id_abastecimento as id,
      a.data_abast as data,
      v.placa,
      NULL as motorista,
      a.litros || 'L de ' || a.tipo_combustivel as descricao,
      'concluido' as status
    FROM abastecimento a
    JOIN veiculo v ON v.id_veiculo = a.id_veiculo
    WHERE a.data_abast >= CURRENT_DATE - ($1::text || ' months')::interval

    UNION ALL

    SELECT 
      'manutencao' as tipo,
      mt.id_manutencao as id,
      mt.data_man as data,
      v.placa,
      NULL as motorista,
      mt.tipo || ': ' || mt.descricao as descricao,
      CASE WHEN mt.concluida THEN 'concluida' ELSE 'pendente' END as status
    FROM manutencao mt
    JOIN veiculo v ON v.id_veiculo = mt.id_veiculo
    WHERE mt.data_man >= CURRENT_DATE - ($1::text || ' months')::interval

    ORDER BY data DESC
    LIMIT 100
    `,
    [meses]
  )

  res.json({
    periodo_meses: meses,
    eventos: eventos.rows,
    total_eventos: eventos.rowCount
  })
}))

// ✅ GET /relatorios/comparativo-mensal - Comparativo mês a mês
router.get('/comparativo-mensal', asyncHandler(async (req: Request, res: Response) => {
  const { meses = 12 } = req.query

  const hoje = new Date()
  const comparativo: any[] = []

  for (let i = parseInt(String(meses), 10) - 1; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    const mesKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const mesNome = `${MESES_NOMES[d.getMonth()]} ${d.getFullYear()}`

    const mesInicio = new Date(d.getFullYear(), d.getMonth(), 1)
    const mesFim = new Date(d.getFullYear(), d.getMonth() + 1, 0)

    const [viagens, combustivel, manutencao] = await Promise.all([
      pool.query(
        `SELECT 
          COUNT(*) as total,
          COALESCE(SUM(CASE WHEN km_final IS NOT NULL THEN km_final - km_inicial ELSE 0 END), 0) as km
         FROM viagem
         WHERE data_saida >= $1 AND data_saida <= $2`,
        [mesInicio, mesFim]
      ),
      pool.query(
        `SELECT COALESCE(SUM(valor_total), 0) as total
         FROM abastecimento
         WHERE data_abast >= $1 AND data_abast <= $2`,
        [mesInicio, mesFim]
      ),
      pool.query(
        `SELECT COALESCE(SUM(CASE WHEN concluida THEN valor ELSE 0 END), 0) as total
         FROM manutencao
         WHERE data_man >= $1 AND data_man <= $2`,
        [mesInicio, mesFim]
      )
    ])

    comparativo.push({
      mes: mesKey,
      mes_nome: mesNome,
      viagens: parseInt(viagens.rows[0].total, 10),
      km: parseFloat(viagens.rows[0].km),
      custo_combustivel: parseFloat(combustivel.rows[0].total),
      custo_manutencao: parseFloat(manutencao.rows[0].total),
      custo_total: parseFloat(combustivel.rows[0].total) + parseFloat(manutencao.rows[0].total)
    })
  }

  res.json({
    periodo_meses: meses,
    comparativo,
    tendencias: {
      viagens: comparativo.length > 1
        ? comparativo[comparativo.length - 1].viagens - comparativo[0].viagens
        : 0,
      custos: comparativo.length > 1
        ? comparativo[comparativo.length - 1].custo_total - comparativo[0].custo_total
        : 0
    }
  })
}))

export default router
import { Router, Request, Response } from 'express'
import { pool } from '../db'
import { asyncHandler, AppError } from '../middleware/errorHandler'
import {
  simularViagem,
  finalizarViagem,
  cancelarViagem,
  buscarViagensEmAndamento
} from '../services/simulacao.service'

const router = Router()

// ✅ GET /viagens - Listar todas as viagens
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { status, id_veiculo, cpf_motorista, limit = 50 } = req.query
  
  let query = `
    SELECT
      v.id_viagem,
      v.data_saida,
      v.data_chegada,
      v.km_inicial,
      v.km_final,
      v.status_viagem,
      v.observacoes,
      v.cpf_motorista,
      ve.placa,
      ve.modelo,
      m.nome AS motorista,
      c1.nome AS origem,
      c1.uf AS origem_uf,
      c2.nome AS destino,
      c2.uf AS destino_uf,
      CASE 
        WHEN v.km_final IS NOT NULL 
        THEN v.km_final - v.km_inicial 
        ELSE NULL 
      END AS km_rodados
    FROM viagem v
    JOIN veiculo ve ON ve.id_veiculo = v.id_veiculo
    JOIN motorista m ON m.cpf = v.cpf_motorista
    JOIN cidade c1 ON c1.id_cidade = v.cidade_origem
    JOIN cidade c2 ON c2.id_cidade = v.cidade_destino
    WHERE 1=1
  `
  const params: any[] = []
  let paramCount = 1
  
  if (status) {
    query += ` AND v.status_viagem = $${paramCount}`
    params.push(status)
    paramCount++
  }
  
  if (id_veiculo) {
    query += ` AND v.id_veiculo = $${paramCount}`
    params.push(id_veiculo)
    paramCount++
  }
  
  if (cpf_motorista) {
    query += ` AND v.cpf_motorista = $${paramCount}`
    params.push(cpf_motorista)
    paramCount++
  }
  
  query += ` ORDER BY v.id_viagem DESC LIMIT $${paramCount}`
  params.push(limit)

  const result = await pool.query(query, params)
  res.json(result.rows)
}))

// ✅ GET /viagens/em-andamento - Viagens em andamento
router.get('/em-andamento', asyncHandler(async (req: Request, res: Response) => {
  const viagens = await buscarViagensEmAndamento()
  res.json(viagens)
}))

// ✅ GET /viagens/:id - Buscar viagem por ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  
  const result = await pool.query(
    `SELECT
      v.*,
      ve.placa,
      ve.modelo,
      ve.marca,
      m.nome AS motorista,
      m.cnh,
      c1.nome AS origem,
      c1.uf AS origem_uf,
      c2.nome AS destino,
      c2.uf AS destino_uf,
      CASE 
        WHEN v.km_final IS NOT NULL 
        THEN v.km_final - v.km_inicial 
        ELSE NULL 
      END AS km_rodados
    FROM viagem v
    JOIN veiculo ve ON ve.id_veiculo = v.id_veiculo
    JOIN motorista m ON m.cpf = v.cpf_motorista
    JOIN cidade c1 ON c1.id_cidade = v.cidade_origem
    JOIN cidade c2 ON c2.id_cidade = v.cidade_destino
    WHERE v.id_viagem = $1`,
    [id]
  )
  
  if (result.rowCount === 0) {
    throw new AppError('Viagem não encontrada', 404)
  }
  
  res.json(result.rows[0])
}))

// ✅ POST /viagens/simular - Simular nova viagem (aleatória)
router.post('/simular/:idVeiculo', asyncHandler(async (req: Request, res: Response) => {
  const { idVeiculo } = req.params
  const viagem = await simularViagem(Number(idVeiculo))
  
  res.status(201).json({
    message: 'Viagem iniciada com sucesso',
    viagem
  })
}))

// ✅ POST /viagens/criar - Criar viagem com parâmetros específicos
router.post('/criar', asyncHandler(async (req: Request, res: Response) => {
  const {
    id_veiculo,
    cpf_motorista,
    cidade_origem,
    cidade_destino
  } = req.body

  if (!id_veiculo) {
    throw new AppError('ID do veículo é obrigatório')
  }

  const options: any = {};
  if (cpf_motorista) options.cpfMotorista = String(cpf_motorista)
  if (cidade_origem) options.cidadeOrigem = Number(cidade_origem)
  if (cidade_destino) options.cidadeDestino = Number(cidade_destino)

  const viagem = await simularViagem(Number(id_veiculo), options);
  
  res.status(201).json({
    message: 'Viagem criada com sucesso',
    viagem
  })
}))

// ✅ POST /viagens/finalizar/:id - Finalizar viagem
router.post('/finalizar/:idViagem', asyncHandler(async (req: Request, res: Response) => {
  const { idViagem } = req.params
  const resultado = await finalizarViagem(Number(idViagem))
  
  res.json({
    message: 'Viagem finalizada com sucesso',
    ...resultado
  })
}))

// ✅ POST /viagens/cancelar/:id - Cancelar viagem
router.post('/cancelar/:idViagem', asyncHandler(async (req: Request, res: Response) => {
  const { idViagem } = req.params
  const { motivo } = (req.body ?? {}) as { motivo?: string }
  
  const viagem = await cancelarViagem(Number(idViagem), motivo)
  
  res.json({
    message: 'Viagem cancelada com sucesso',
    viagem
  })
}))

// ✅ PUT /viagens/:id - Atualizar observações da viagem
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const { observacoes } = req.body

  const viagemExiste = await pool.query(
    'SELECT id_viagem FROM viagem WHERE id_viagem = $1',
    [id]
  )

  if (viagemExiste.rowCount === 0) {
    throw new AppError('Viagem não encontrada', 404)
  }

  const { rows } = await pool.query(
    `UPDATE viagem
     SET observacoes = $1
     WHERE id_viagem = $2
     RETURNING *`,
    [observacoes, id]
  )

  res.json(rows[0])
}))

// ✅ GET /viagens/estatisticas/geral - Estatísticas gerais
router.get('/estatisticas/geral', asyncHandler(async (req: Request, res: Response) => {
  const { meses = 6 } = req.query

  const stats = await pool.query(
    `SELECT 
      COUNT(*) as total_viagens,
      COUNT(CASE WHEN status_viagem = 'em_andamento' THEN 1 END) as em_andamento,
      COUNT(CASE WHEN status_viagem = 'finalizada' THEN 1 END) as finalizadas,
      COUNT(CASE WHEN status_viagem = 'cancelada' THEN 1 END) as canceladas,
      SUM(CASE WHEN km_final IS NOT NULL THEN km_final - km_inicial ELSE 0 END) as km_total,
      AVG(CASE WHEN km_final IS NOT NULL THEN km_final - km_inicial ELSE NULL END) as km_media_por_viagem
     FROM viagem
     WHERE data_saida >= CURRENT_DATE - INTERVAL '${meses} months'`
  )

  const porVeiculo = await pool.query(
    `SELECT 
      v.placa,
      v.modelo,
      COUNT(*) as total_viagens,
      SUM(CASE WHEN vg.km_final IS NOT NULL THEN vg.km_final - vg.km_inicial ELSE 0 END) as km_total
     FROM viagem vg
     JOIN veiculo v ON v.id_veiculo = vg.id_veiculo
     WHERE vg.data_saida >= CURRENT_DATE - INTERVAL '${meses} months'
     GROUP BY v.id_veiculo, v.placa, v.modelo
     ORDER BY total_viagens DESC
     LIMIT 10`
  )

  const porMotorista = await pool.query(
    `SELECT 
      m.nome,
      COUNT(*) as total_viagens,
      SUM(CASE WHEN vg.km_final IS NOT NULL THEN vg.km_final - vg.km_inicial ELSE 0 END) as km_total
     FROM viagem vg
     JOIN motorista m ON m.cpf = vg.cpf_motorista
     WHERE vg.data_saida >= CURRENT_DATE - INTERVAL '${meses} months'
     GROUP BY m.cpf, m.nome
     ORDER BY total_viagens DESC
     LIMIT 10`
  )

  res.json({
    periodo_meses: meses,
    resumo: stats.rows[0],
    top_veiculos: porVeiculo.rows,
    top_motoristas: porMotorista.rows
  })
}))

// ✅ GET /viagens/rotas/populares - Rotas mais utilizadas
router.get('/rotas/populares', asyncHandler(async (req: Request, res: Response) => {
  const { limit = 10 } = req.query

  const result = await pool.query(
    `SELECT 
      c1.nome || ' (' || c1.uf || ')' as origem,
      c2.nome || ' (' || c2.uf || ')' as destino,
      COUNT(*) as total_viagens
     FROM viagem v
     JOIN cidade c1 ON c1.id_cidade = v.cidade_origem
     JOIN cidade c2 ON c2.id_cidade = v.cidade_destino
     GROUP BY c1.nome, c1.uf, c2.nome, c2.uf
     ORDER BY total_viagens DESC
     LIMIT $1`,
    [limit]
  )

  res.json(result.rows)
}))

export default router
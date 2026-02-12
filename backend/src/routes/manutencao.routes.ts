import { Router, Request, Response } from 'express'
import pool from '../db'
import { asyncHandler, AppError } from '../middleware/errorHandler'
import { validarValorPositivo, validarData } from '../utils/validators'

const router = Router()

const TIPOS_MANUTENCAO = ['preventiva', 'corretiva', 'preditiva', 'revisao'] as const

// ✅ GET /manutencao - Listar todas as manutenções
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { id_veiculo, tipo, data_inicio, data_fim } = req.query
  
  let query = `
    SELECT 
      m.*,
      v.placa,
      v.modelo
    FROM manutencao m
    JOIN veiculo v ON v.id_veiculo = m.id_veiculo
    WHERE 1=1
  `
  const params: any[] = []
  let paramCount = 1
  
  if (id_veiculo) {
    query += ` AND m.id_veiculo = $${paramCount}`
    params.push(id_veiculo)
    paramCount++
  }
  
  if (tipo) {
    query += ` AND m.tipo = $${paramCount}`
    params.push(tipo)
    paramCount++
  }
  
  if (data_inicio) {
    query += ` AND m.data_man >= $${paramCount}`
    params.push(data_inicio)
    paramCount++
  }
  
  if (data_fim) {
    query += ` AND m.data_man <= $${paramCount}`
    params.push(data_fim)
    paramCount++
  }
  
  query += ' ORDER BY m.data_man DESC'
  
  const result = await pool.query(query, params)
  res.json(result.rows)
}))

// ✅ GET /manutencao/:id - Buscar manutenção por ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  
  const result = await pool.query(
    `SELECT 
      m.*,
      v.placa,
      v.modelo
     FROM manutencao m
     JOIN veiculo v ON v.id_veiculo = m.id_veiculo
     WHERE m.id_manutencao = $1`,
    [id]
  )
  
  if (result.rowCount === 0) {
    throw new AppError('Manutenção não encontrada', 404)
  }
  
  res.json(result.rows[0])
}))

// ✅ POST /manutencao - Criar nova manutenção
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const {
    data_man,
    tipo,
    descricao,
    valor,
    id_veiculo,
    km_manutencao,
    fornecedor
  } = req.body

  // Validações obrigatórias
  if (!data_man || !tipo || !descricao || !id_veiculo) {
    throw new AppError('Data, tipo, descrição e veículo são obrigatórios')
  }

  // Validar data
  if (!validarData(data_man)) {
    throw new AppError('Data inválida')
  }

  // Validar tipo
  if (!TIPOS_MANUTENCAO.includes(tipo)) {
    throw new AppError(`Tipo inválido (válidos: ${TIPOS_MANUTENCAO.join(', ')})`)
  }

  // Validar valor se fornecido
  if (valor !== undefined && valor !== null && !validarValorPositivo(valor)) {
    throw new AppError('Valor deve ser positivo')
  }

  // Verificar se veículo existe
  const veiculoExiste = await pool.query(
    'SELECT id_veiculo, km_atual, status FROM veiculo WHERE id_veiculo = $1',
    [id_veiculo]
  )

  if (veiculoExiste.rowCount === 0) {
    throw new AppError('Veículo não encontrado', 404)
  }

  const veiculo = veiculoExiste.rows[0]

  // Validar km se fornecido
  if (km_manutencao !== undefined && km_manutencao !== null) {
    if (!validarValorPositivo(km_manutencao)) {
      throw new AppError('Quilometragem deve ser positiva')
    }
    if (km_manutencao > veiculo.km_atual) {
      throw new AppError('Quilometragem da manutenção não pode ser maior que a atual do veículo')
    }
  }

  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    // Inserir manutenção
    const { rows } = await client.query(
      `INSERT INTO manutencao 
       (data_man, tipo, descricao, valor, id_veiculo, km_manutencao, fornecedor)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [data_man, tipo, descricao, valor, id_veiculo, km_manutencao, fornecedor]
    )

    // Atualizar km do veículo se fornecido
    if (km_manutencao) {
      await client.query(
        'UPDATE veiculo SET km_atual = $1 WHERE id_veiculo = $2',
        [km_manutencao, id_veiculo]
      )
    }

    // Se a manutenção for hoje ou futura e o veículo não está em viagem,
    // colocar veículo em manutenção
    const dataMan = new Date(data_man)
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    
    if (dataMan >= hoje && veiculo.status !== 'em_viagem') {
      await client.query(
        'UPDATE veiculo SET status = $1 WHERE id_veiculo = $2',
        ['manutencao', id_veiculo]
      )
    }

    // Também marcar como manutenção se há manutenções pendentes (mesmo do passado)
    if (veiculo.status !== 'em_viagem' && veiculo.status !== 'manutencao') {
      const manutencoesTotal = await client.query(
        'SELECT COUNT(*) as total FROM manutencao WHERE id_veiculo = $1 AND concluida = false',
        [id_veiculo]
      )
      
      if (parseInt(manutencoesTotal.rows[0].total, 10) > 0) {
        await client.query(
          'UPDATE veiculo SET status = $1 WHERE id_veiculo = $2',
          ['manutencao', id_veiculo]
        )
      }
    }

    await client.query('COMMIT')
    
    res.status(201).json(rows[0])

  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}))

// ✅ PUT /manutencao/:id - Atualizar manutenção
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const {
    data_man,
    tipo,
    descricao,
    valor,
    km_manutencao,
    fornecedor,
    concluida
  } = req.body

  // Verificar se manutenção existe
  const manutExiste = await pool.query(
    'SELECT m.*, v.status FROM manutencao m JOIN veiculo v ON v.id_veiculo = m.id_veiculo WHERE m.id_manutencao = $1',
    [id]
  )

  if (manutExiste.rowCount === 0) {
    throw new AppError('Manutenção não encontrada', 404)
  }

  // Validações
  if (data_man && !validarData(data_man)) {
    throw new AppError('Data inválida')
  }

  if (tipo && !TIPOS_MANUTENCAO.includes(tipo)) {
    throw new AppError(`Tipo inválido (válidos: ${TIPOS_MANUTENCAO.join(', ')})`)
  }

  if (valor !== undefined && valor !== null && !validarValorPositivo(valor)) {
    throw new AppError('Valor deve ser positivo')
  }

  if (km_manutencao !== undefined && km_manutencao !== null && !validarValorPositivo(km_manutencao)) {
    throw new AppError('Quilometragem deve ser positiva')
  }

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const { rows } = await client.query(
      `UPDATE manutencao
       SET 
         data_man = COALESCE($1, data_man),
         tipo = COALESCE($2, tipo),
         descricao = COALESCE($3, descricao),
         valor = COALESCE($4, valor),
         km_manutencao = COALESCE($5, km_manutencao),
         fornecedor = COALESCE($6, fornecedor),
         concluida = COALESCE($7, concluida)
       WHERE id_manutencao = $8
       RETURNING *`,
      [data_man, tipo, descricao, valor, km_manutencao, fornecedor, concluida, id]
    )

    // Se marcou como concluída, verificar se há outras manutenções pendentes
    if (concluida === true && manutExiste.rows[0].status === 'manutencao') {
      const outrasManutencoes = await client.query(
        'SELECT COUNT(*) as total FROM manutencao WHERE id_veiculo = $1 AND id_manutencao != $2 AND concluida = false',
        [manutExiste.rows[0].id_veiculo, id]
      )
      
      // Se não há outras manutenções pendentes, voltar para ativo
      if (parseInt(outrasManutencoes.rows[0].total, 10) === 0) {
        await client.query(
          'UPDATE veiculo SET status = $1 WHERE id_veiculo = $2',
          ['ativo', manutExiste.rows[0].id_veiculo]
        )
      }
    }

    await client.query('COMMIT')

    res.json(rows[0])

  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}))

// ✅ DELETE /manutencao/:id - Deletar manutenção
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params

  const manutExiste = await pool.query(
    'SELECT * FROM manutencao WHERE id_manutencao = $1',
    [id]
  )

  if (manutExiste.rowCount === 0) {
    throw new AppError('Manutenção não encontrada', 404)
  }

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const id_veiculo = manutExiste.rows[0].id_veiculo

    // Deletar manutenção
    await client.query('DELETE FROM manutencao WHERE id_manutencao = $1', [id])

    // Verificar se há outras manutenções pendentes
    const veiculoStatus = await client.query(
      'SELECT status FROM veiculo WHERE id_veiculo = $1',
      [id_veiculo]
    )

    if (veiculoStatus.rows[0].status === 'manutencao') {
      const outrasManutencoes = await client.query(
        'SELECT COUNT(*) as total FROM manutencao WHERE id_veiculo = $1 AND concluida = false',
        [id_veiculo]
      )

      // Se não há mais manutenções pendentes, voltar para ativo
      if (parseInt(outrasManutencoes.rows[0].total, 10) === 0) {
        await client.query(
          'UPDATE veiculo SET status = $1 WHERE id_veiculo = $2',
          ['ativo', id_veiculo]
        )
      }
    }

    await client.query('COMMIT')

    res.json({ message: 'Manutenção excluída com sucesso' })

  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}))

// ✅ GET /manutencao/veiculo/:id/estatisticas - Estatísticas de manutenção
router.get('/veiculo/:id/estatisticas', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const { meses = 12 } = req.query

  const veiculoExiste = await pool.query(
    'SELECT placa, modelo FROM veiculo WHERE id_veiculo = $1',
    [id]
  )

  if (veiculoExiste.rowCount === 0) {
    throw new AppError('Veículo não encontrado', 404)
  }

  const estatisticas = await pool.query(
    `SELECT 
      COUNT(*) as total_manutencoes,
      SUM(valor) as total_gasto,
      AVG(valor) as valor_medio,
      tipo
     FROM manutencao
     WHERE id_veiculo = $1
       AND data_man >= CURRENT_DATE - INTERVAL '${meses} months'
     GROUP BY tipo`,
    [id]
  )

  const pendentes = await pool.query(
    `SELECT COUNT(*) as total
     FROM manutencao
     WHERE id_veiculo = $1
       AND concluida = false`,
    [id]
  )

  res.json({
    veiculo: veiculoExiste.rows[0],
    periodo_meses: meses,
    manutencoes_pendentes: parseInt(pendentes.rows[0].total),
    estatisticas_por_tipo: estatisticas.rows
  })
}))

// ✅ GET /manutencao/pendentes - Listar manutenções pendentes
router.get('/pendentes/lista', asyncHandler(async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT 
      m.*,
      v.placa,
      v.modelo
     FROM manutencao m
     JOIN veiculo v ON v.id_veiculo = m.id_veiculo
     WHERE m.concluida = false
     ORDER BY m.data_man ASC`
  )

  res.json(result.rows)
}))

export default router
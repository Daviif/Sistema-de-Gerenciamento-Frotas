import { Router, Request, Response } from 'express'
import pool from '../db'
import { asyncHandler, AppError } from '../middleware/errorHandler'
import {
  validarCPF,
  validarCNH,
  validarCategoriaCNH,
  validarDataFutura
} from '../utils/validators'

const router = Router()

const limparString = (valor: any): string => {
  if (typeof valor !== 'string') return '';
  return valor.replace(/[^\d]/g, '');
}

// ✅ GET /motoristas - Listar todos os motoristas
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query
  
  let query = 'SELECT * FROM motorista'
  const params: any[] = []
  
  if (status) {
    query += ' WHERE status = $1'
    params.push(status)
  }
  
  query += ' ORDER BY nome'
  
  const result = await pool.query(query, params)
  res.json(result.rows)
}))

// ✅ GET /motoristas/:cpf - Buscar motorista por CPF
router.get('/:cpf', asyncHandler(async (req: Request, res: Response) => {
  const { cpf } = req.params

  const cpfLimpo = limparString(cpf)

  if (!validarCPF(cpfLimpo)) {
    throw new AppError('CPF inválido', 400)
  }
  
  const result = await pool.query(
    'SELECT * FROM motorista WHERE cpf = $1',
    [cpfLimpo]
  )
  
  if (result.rowCount === 0) {
    throw new AppError('Motorista não encontrado', 404)
  }
  
  res.json(result.rows[0])
}))

// ✅ POST /motoristas - Criar novo motorista
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const {
    nome,
    cpf,
    cnh,
    cat_cnh,
    validade_cnh,
    status = 'ativo'
  } = req.body

  // Validações obrigatórias
  if (!nome || !cpf || !cnh || !cat_cnh || !validade_cnh) {
    throw new AppError('Nome, CPF, CNH, categoria e validade são obrigatórios')
  }

  // Validar CPF
  if (!validarCPF(cpf)) {
    throw new AppError('CPF inválido')
  }

  // Validar CNH
  if (!validarCNH(cnh)) {
    throw new AppError('CNH inválida')
  }

  // Validar categoria CNH
  if (!validarCategoriaCNH(cat_cnh)) {
    throw new AppError('Categoria de CNH inválida (válidas: A, B, AB, C, D, E, AC, AD, AE)')
  }

  // Validar validade da CNH
  if (!validarDataFutura(validade_cnh)) {
    throw new AppError('Data de validade da CNH inválida ou vencida')
  }

  // Verificar se CPF já existe
  const cpfExiste = await pool.query(
    'SELECT cpf FROM motorista WHERE cpf = $1',
    [cpf.replace(/[^\d]/g, '')]
  )

  if (cpfExiste.rowCount! > 0) {
    throw new AppError('Já existe um motorista com este CPF', 409)
  }

  // Verificar se CNH já existe
  const cnhExiste = await pool.query(
    'SELECT cpf FROM motorista WHERE cnh = $1',
    [cnh.replace(/[^\d]/g, '')]
  )

  if (cnhExiste.rowCount! > 0) {
    throw new AppError('Já existe um motorista com esta CNH', 409)
  }

  const { rows } = await pool.query(
    `INSERT INTO motorista (nome, cpf, cnh, cat_cnh, validade_cnh, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      nome,
      cpf.replace(/[^\d]/g, ''),
      cnh.replace(/[^\d]/g, ''),
      cat_cnh.toUpperCase(),
      validade_cnh,
      status
    ]
  )

  res.status(201).json(rows[0])
}))

// ✅ PUT /motoristas/:cpf - Atualizar motorista
router.put('/:cpf', asyncHandler(async (req: Request, res: Response) => {
  const { cpf: cpfParam } = req.params;
  const cpfLimpo = limparString(cpfParam);

  if (!validarCPF(cpfLimpo)) {
    throw new AppError('CPF inválido', 400)
  }

  const {
    nome,
    cnh,
    cpf,
    cat_cnh,
    validade_cnh,
    status
  } = req.body

  // Verificar se motorista existe
  const motoristaExiste = await pool.query(
    'SELECT * FROM motorista WHERE cpf = $1',
    [cpfLimpo]
  )

  if (motoristaExiste.rowCount === 0) {
    throw new AppError('Motorista não encontrado', 404)
  }

  const motoristaAtual = motoristaExiste.rows[0]

  // Validações

  if (cnh && !validarCNH(cnh)) {
    throw new AppError('CNH inválida')
  }

  if (cat_cnh && !validarCategoriaCNH(cat_cnh)) {
    throw new AppError('Categoria de CNH inválida')
  }

  if (validade_cnh && !validarDataFutura(validade_cnh)) {
    throw new AppError('Data de validade da CNH inválida ou vencida')
  }

  // Verificar se novo CPF já existe (se diferente do atual)
  if (cpf) {
    const cpfLimpo = cpf.replace(/[^\d]/g, '')
    if (cpfLimpo !== motoristaAtual.cpf) {
      const cpfExiste = await pool.query(
        'SELECT cpf FROM motorista WHERE cpf = $1',
        [cpfLimpo]
      )

      if (cpfExiste.rowCount! > 0) {
        throw new AppError('Já existe um motorista com este CPF', 409)
      }
    }
  }

  // Verificar se nova CNH já existe (se diferente da atual)
  if (cnh) {
    const cnhLimpa = cnh.replace(/[^\d]/g, '')
    if (cnhLimpa !== motoristaAtual.cnh) {
      const cnhExiste = await pool.query(
        'SELECT cpf FROM motorista WHERE cnh = $1',
        [cnhLimpa]
      )

      if (cnhExiste.rowCount! > 0) {
        throw new AppError('Já existe um motorista com esta CNH', 409)
      }
    }
  }

  const { rows } = await pool.query(
    `UPDATE motorista
     SET 
       nome = COALESCE($1, nome),
       cpf = COALESCE($2, cpf),
       cnh = COALESCE($3, cnh),
       cat_cnh = COALESCE($4, cat_cnh),
       validade_cnh = COALESCE($5, validade_cnh),
       status = COALESCE($6, status)
     WHERE cpf = $7
     RETURNING *`,
    [
      nome,
      cpf ? limparString(cpf) : null,
      cnh ? limparString(cnh) : null,
      cat_cnh?.toUpperCase(),
      validade_cnh,
      status,
      cpfLimpo
    ]
  )

  res.json(rows[0])
}))

// ✅ DELETE /motoristas/:cpf - Deletar motorista
router.delete('/:cpf', asyncHandler(async (req: Request, res: Response) => {
  const { cpf } = req.params

  // Verificar se motorista existe
  const motoristaExiste = await pool.query(
    'SELECT * FROM motorista WHERE cpf = $1',
    [cpf]
  )

  if (motoristaExiste.rowCount === 0) {
    throw new AppError('Motorista não encontrado', 404)
  }

  // Verificar se motorista está em viagem
  const emViagem = await pool.query(
    `SELECT id_viagem FROM viagem 
     WHERE cpf_motorista = $1 AND status_viagem = 'em_andamento'`,
    [cpf]
  )

  if (emViagem.rowCount! > 0) {
    throw new AppError('Não é possível excluir motorista que está em viagem', 400)
  }

  // Verificar se tem histórico de viagens
  const temHistorico = await pool.query(
    'SELECT id_viagem FROM viagem WHERE cpf_motorista = $1 LIMIT 1',
    [cpf]
  )

  if (temHistorico.rowCount! > 0) {
    // Se tem histórico, apenas inativa
    const { rows } = await pool.query(
      `UPDATE motorista SET status = 'inativo' WHERE cpf = $1 RETURNING *`,
      [cpf]
    )
    return res.json({
      message: 'Motorista inativado (possui histórico de viagens)',
      motorista: rows[0]
    })
  }

  // Se não tem histórico, pode deletar
  await pool.query('DELETE FROM motorista WHERE cpf = $1', [cpf])
  
  res.json({ message: 'Motorista excluído com sucesso' })
}))

// ✅ GET /motoristas/:cpf/historico - Histórico do motorista
router.get('/:cpf/historico', asyncHandler(async (req: Request, res: Response) => {
  const { cpf } = req.params

  const motorista = await pool.query(
    'SELECT * FROM motorista WHERE cpf = $1',
    [cpf]
  )

  if (motorista.rowCount === 0) {
    throw new AppError('Motorista não encontrado', 404)
  }

  // Buscar viagens
  const viagens = await pool.query(
    `SELECT 
      v.*,
      ve.placa,
      ve.modelo,
      c1.nome AS origem,
      c2.nome AS destino
     FROM viagem v
     JOIN veiculo ve ON ve.id_veiculo = v.id_veiculo
     JOIN cidade c1 ON c1.id_cidade = v.cidade_origem
     JOIN cidade c2 ON c2.id_cidade = v.cidade_destino
     WHERE v.cpf_motorista = $1
     ORDER BY v.data_saida DESC`,
    [cpf]
  )

  // Calcular estatísticas
  const totalKm = viagens.rows
    .filter(v => v.km_final)
    .reduce((acc, v) => acc + (v.km_final - v.km_inicial), 0)

  res.json({
    motorista: motorista.rows[0],
    viagens: viagens.rows,
    estatisticas: {
      total_viagens: viagens.rowCount,
      total_km_rodados: totalKm,
      viagens_em_andamento: viagens.rows.filter(v => v.status_viagem === 'em_andamento').length
    }
  })
}))

// ✅ GET /motoristas/disponiveis - Listar motoristas disponíveis
router.get('/disponiveis/lista', asyncHandler(async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT m.*
     FROM motorista m
     WHERE m.status = 'ativo'
       AND m.validade_cnh > CURRENT_DATE
       AND NOT EXISTS (
         SELECT 1 FROM viagem v
         WHERE v.cpf_motorista = m.cpf
           AND v.status_viagem = 'em_andamento'
       )
     ORDER BY m.nome`
  )

  res.json(result.rows)
}))

export default router
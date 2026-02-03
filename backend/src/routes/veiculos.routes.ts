import { Router, Request, Response } from 'express'
import pool from '../db'
import { asyncHandler, AppError } from '../middleware/errorHandler'
import { validarPlaca, validarStatusVeiculo, validarValorPositivo, validarTipoVeiculo } from '../utils/validators'


const router = Router()

router.get('/', asyncHandler (async (req: Request, res: Response) => {
  const { status } = req.query

  let query = 'SELECT * FROM veiculo'
  const params: any[] = []

  if (status) {
    query += ' WHERE status = $1'
    params.push(status)
  }

  query += ' ORDER BY placa'

  const result = await pool.query(query, params)
  res.json(result.rows)
}))

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  
  const result = await pool.query(
    'SELECT * FROM veiculo WHERE id_veiculo = $1',
    [id]
  )
  
  if (result.rowCount === 0) {
    throw new AppError('Veículo não encontrado', 404)
  }
  
  res.json(result.rows[0])
}))

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { placa, marca, modelo, ano, tipo, km_atual, capacidade_tanque, status = 'ativo'} = req.body

  if (!placa || !modelo || !marca || !tipo) {
    throw new AppError('Placa, modelo, marca e tipo são obrigatórios')
  }

  if (!validarPlaca(placa)) {
    throw new AppError('Placa inválida')
  }

  if (!validarStatusVeiculo(status)) {
    throw new AppError('Status inválido')
  }

  if (ano && (ano < 1900 || ano > new Date().getFullYear() + 1)) {
    throw new AppError('Ano inválido')
  }

  const kmAtualPost = km_atual !== undefined && km_atual !== null && km_atual !== '' ? Number(km_atual) : undefined
  if (kmAtualPost !== undefined && !validarValorPositivo(kmAtualPost)) {
    throw new AppError('Quilometragem deve ser um valor positivo')
  }

  const tipoCorreto = validarTipoVeiculo(tipo)

  if (!tipoCorreto) {
    throw new AppError('Tipo de veículo inválido')
  }
  // Verificar se placa já existe
  const placaExiste = await pool.query(
    'SELECT id_veiculo FROM veiculo WHERE placa = $1',
    [placa.toUpperCase()]
  )

  if (placaExiste.rowCount! > 0) {
    throw new AppError('Já existe um veículo com esta placa', 409)
  }

  const kmAtualNum = kmAtualPost ?? 0
  const capTanqueNum = capacidade_tanque !== undefined && capacidade_tanque !== null && capacidade_tanque !== ''
    ? Number(capacidade_tanque)
    : null
  if (capTanqueNum !== null && !validarValorPositivo(capTanqueNum)) {
    throw new AppError('Capacidade do tanque deve ser um valor positivo')
  }

  const { rows } = await pool.query(
    `INSERT INTO veiculo (placa, modelo, marca, ano, tipo, km_atual, capacidade_tanque, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [placa.toUpperCase(), modelo, marca, ano, tipoCorreto, kmAtualNum, capTanqueNum, status]
  )

  res.status(201).json(rows[0])
}))

// ✅ PUT /veiculos/:id - Atualizar veículo
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const {
    placa,
    modelo,
    marca,
    ano,
    km_atual,
    capacidade_tanque,
    status
  } = req.body

  // Verificar se veículo existe
  const veiculoExiste = await pool.query(
    'SELECT * FROM veiculo WHERE id_veiculo = $1',
    [id]
  )

  if (veiculoExiste.rowCount === 0) {
    throw new AppError('Veículo não encontrado', 404)
  }

  const veiculoAtual = veiculoExiste.rows[0]

  // Validações
  if (placa && !validarPlaca(placa)) {
    throw new AppError('Placa inválida')
  }

  if (status && !validarStatusVeiculo(status)) {
    throw new AppError('Status inválido')
  }

  if (ano && (ano < 1900 || ano > new Date().getFullYear() + 1)) {
    throw new AppError('Ano inválido')
  }

  const kmAtualNum = km_atual !== undefined && km_atual !== null && km_atual !== '' ? Number(km_atual) : undefined
  if (kmAtualNum !== undefined) {
    if (!validarValorPositivo(kmAtualNum)) {
      throw new AppError('Quilometragem deve ser um valor positivo')
    }
    if (kmAtualNum < Number(veiculoAtual.km_atual)) {
      throw new AppError('Quilometragem não pode ser menor que a atual')
    }
  }

  // Verificar se nova placa já existe (se diferente da atual)
  if (placa && placa.toUpperCase() !== veiculoAtual.placa) {
    const placaExiste = await pool.query(
      'SELECT id_veiculo FROM veiculo WHERE placa = $1',
      [placa.toUpperCase()]
    )

    if (placaExiste.rowCount! > 0) {
      throw new AppError('Já existe um veículo com esta placa', 409)
    }
  }

  const { rows } = await pool.query(
    `UPDATE veiculo
     SET 
       placa = COALESCE($1, placa),
       modelo = COALESCE($2, modelo),
       marca = COALESCE($3, marca),
       ano = COALESCE($4, ano),
       km_atual = COALESCE($5, km_atual),
       capacidade_tanque = COALESCE($6, capacidade_tanque),
       status = COALESCE($7, status)
     WHERE id_veiculo = $8
     RETURNING *`,
    [
      placa?.toUpperCase(),
      modelo,
      marca,
      ano,
      kmAtualNum,
      capacidade_tanque != null && capacidade_tanque !== '' ? Number(capacidade_tanque) : capacidade_tanque,
      status,
      id
    ]
  )

  res.json(rows[0])
}))

// ✅ DELETE /veiculos/:id - Deletar veículo
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params

  // Verificar se veículo existe
  const veiculoExiste = await pool.query(
    'SELECT * FROM veiculo WHERE id_veiculo = $1',
    [id]
  )

  if (veiculoExiste.rowCount === 0) {
    throw new AppError('Veículo não encontrado', 404)
  }

  // Verificar se veículo está em viagem
  const emViagem = await pool.query(
    `SELECT id_viagem FROM viagem 
     WHERE id_veiculo = $1 AND status_viagem = 'em_andamento'`,
    [id]
  )

  if (emViagem.rowCount! > 0) {
    throw new AppError('Não é possível excluir veículo que está em viagem', 400)
  }

  // Verificar se tem histórico de viagens
  const temHistorico = await pool.query(
    'SELECT id_viagem FROM viagem WHERE id_veiculo = $1 LIMIT 1',
    [id]
  )

  if (temHistorico.rowCount! > 0) {
    // Se tem histórico, apenas inativa ao invés de deletar
    const { rows } = await pool.query(
      `UPDATE veiculo SET status = 'inativo' WHERE id_veiculo = $1 RETURNING *`,
      [id]
    )
    return res.json({
      message: 'Veículo inativado (possui histórico de viagens)',
      veiculo: rows[0]
    })
  }

  // Se não tem histórico, pode deletar
  await pool.query('DELETE FROM veiculo WHERE id_veiculo = $1', [id])
  
  res.json({ message: 'Veículo excluído com sucesso' })
}))

// ✅ GET /veiculos/:id/historico - Histórico completo do veículo
router.get('/:id/historico', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params

  const veiculo = await pool.query(
    'SELECT * FROM veiculo WHERE id_veiculo = $1',
    [id]
  )

  if (veiculo.rowCount === 0) {
    throw new AppError('Veículo não encontrado', 404)
  }

  // Buscar viagens
  const viagens = await pool.query(
    `SELECT 
      v.*,
      c1.nome AS origem,
      c2.nome AS destino,
      m.nome AS motorista
     FROM viagem v
     JOIN cidade c1 ON c1.id_cidade = v.cidade_origem
     JOIN cidade c2 ON c2.id_cidade = v.cidade_destino
     JOIN motorista m ON m.id_motorista = v.id_motorista
     WHERE v.id_veiculo = $1
     ORDER BY v.data_saida DESC`,
    [id]
  )

  // Buscar abastecimentos
  const abastecimentos = await pool.query(
    `SELECT * FROM abastecimento
     WHERE id_veiculo = $1
     ORDER BY data_abast DESC`,
    [id]
  )

  // Buscar manutenções
  const manutencoes = await pool.query(
    `SELECT * FROM manutencao
     WHERE id_veiculo = $1
     ORDER BY data_man DESC`,
    [id]
  )

  res.json({
    veiculo: veiculo.rows[0],
    viagens: viagens.rows,
    abastecimentos: abastecimentos.rows,
    manutencoes: manutencoes.rows,
    estatisticas: {
      total_viagens: viagens.rowCount,
      total_abastecimentos: abastecimentos.rowCount,
      total_manutencoes: manutencoes.rowCount,
      km_rodados: veiculo.rows[0].km_atual
    }
  })
}))

export default router
import { pool } from '../db'
import { AppError } from '../middleware/errorHandler'


const STATUS_VEICULO = {
  ATIVO: 'ativo',
  EM_VIAGEM: 'em_viagem',
  MANUTENCAO: 'manutencao',
  INATIVO: 'inativo'
} as const

const STATUS_VIAGEM = {
  PLANEJADA: 'planejada',
  EM_ANDAMENTO: 'em_andamento',
  FINALIZADA: 'finalizada',
  CANCELADA: 'cancelada'
} as const

const STATUS_MOTORISTA = {
  ATIVO: 'ativo',
  EM_VIAGEM: 'em_viagem',
  INATIVO: 'inativo'
} as const

function gerarKmFinal(km_inicial: number): number {
  const kmRodado = Math.floor(Math.random() * 550 + 50)
  return km_inicial + kmRodado
}

function calcularConsumo(kmRodados: number, consumoMedio: number = 10): number {
  return Number((kmRodados / consumoMedio).toFixed(2))
}

export async function finalizarViagem(idViagem: number) {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    
    const viagemRes = await client.query(
      `
      SELECT 
        id_viagem,
        id_veiculo,
        cpf_motorista
        km_inicial,
        status_viagem,
        data_saida
      FROM viagem
      WHERE id_viagem = $1
      FOR UPDATE
      `,
      [idViagem]
    )

    if (viagemRes.rowCount === 0) {
      throw new AppError('Viagem não encontrada', 404)
    }

    const viagem = viagemRes.rows[0]

    if (viagem.status_viagem !== STATUS_VIAGEM.EM_ANDAMENTO) {
      throw new AppError(`Viagem não está em andamento (status: ${viagem.status_viagem})`, 400)
    }

    const kmFinal = gerarKmFinal(viagem.km_inicial)
    const kmRodados = kmFinal - viagem.km_inicial

    const tempoViagem = Math.floor((Date.now() - new Date(viagem.data_saida).getTime()) / 1000 / 60) // em minutos

    await client.query(
       `
      UPDATE veiculo
      SET
        km_atual = $1,
        status = $2
      WHERE id_veiculo = $3
      `,
      [kmFinal, STATUS_VEICULO.ATIVO, viagem.id_veiculo]
    )

      await client.query(
      `
      UPDATE motorista
      SET status = $1
      WHERE cpf_motorista = $2
      `,
      [STATUS_MOTORISTA.ATIVO, viagem.cpf_motorista]
    )

    const viagemAtualizada = await client.query(
      `
      UPDATE viagem
      SET
        km_final = $1,
        data_chegada = NOW(),
        status_viagem = $2
      WHERE id_viagem = $3
      `,
      [kmFinal, STATUS_VIAGEM.FINALIZADA, idViagem]
    )

    await client.query('COMMIT')

    return {
      viagem: viagemAtualizada.rows[0],
      km_rodados: kmRodados,
      combustivel_estimado: calcularConsumo(kmRodados),
      tempo_viagem_minutos: tempoViagem
    }

  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function cancelarViagem(idViagem: number, motivo?: string) {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    
    const viagemRes = await client.query(
      `SELECT 
        id_viagem,
        id_veiculo,
        cpf_motorista,
        status_viagem
      FROM viagem
      WHERE id_viagem = $1
      FOR UPDATE`,
      [idViagem]
    )

    if (viagemRes.rowCount === 0) {
      throw new AppError('Viagem não encontrada', 404)
    }

    const viagem = viagemRes.rows[0]

    if (viagem.status_viagem === STATUS_VIAGEM.FINALIZADA) {
      throw new AppError('Não é possível cancelar viagem já finalizada', 400)
    }

    if (viagem.status_viagem === STATUS_VIAGEM.CANCELADA) {
      throw new AppError('Viagem já está cancelada', 400)
    }

    // Atualizar veículo para ativo
    await client.query(
      `UPDATE veiculo
       SET status = $1
       WHERE id_veiculo = $2`,
      [STATUS_VEICULO.ATIVO, viagem.id_veiculo]
    )

    // Atualizar motorista para ativo
    await client.query(
      `UPDATE motorista
       SET status = $1
       WHERE cpf_motorista = $2`,
      [STATUS_MOTORISTA.ATIVO, viagem.cpf_motorista]
    )

    // Cancelar viagem
    const viagemCancelada = await client.query(
      `UPDATE viagem
       SET
         status_viagem = $1,
         observacoes = $2
       WHERE id_viagem = $3
       RETURNING *`,
      [STATUS_VIAGEM.CANCELADA, motivo || 'Cancelada', idViagem]
    )

    await client.query('COMMIT')

    return viagemCancelada.rows[0]

  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function simularViagem(idVeiculo: number, params?: {
  cpfMotorista?: string
  cidadeOrigem?: number
  cidadeDestino?: number
}) {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // 1️⃣ Buscar e validar veículo
    const veiculoRes = await client.query(
      `SELECT id_veiculo, status, km_atual, placa, modelo
       FROM veiculo
       WHERE id_veiculo = $1
       FOR UPDATE`,
      [idVeiculo]
    )

    if (veiculoRes.rowCount === 0) {
      throw new AppError('Veículo não encontrado', 404)
    }

    const veiculo = veiculoRes.rows[0]

    if (veiculo.status !== STATUS_VEICULO.ATIVO) {
      throw new AppError(`Veículo não disponível para viagem (status: ${veiculo.status})`, 400)
    }

    // 2️⃣ Determinar cidades origem e destino
    let cidadeOrigem = params?.cidadeOrigem
    let cidadeDestino = params?.cidadeDestino

    if (!cidadeOrigem) {
      const origemRes = await client.query(
        `SELECT id_cidade FROM cidade ORDER BY RANDOM() LIMIT 1`
      )
      
      if (origemRes.rowCount === 0) {
        throw new AppError('Nenhuma cidade cadastrada no sistema', 400)
      }
      
      cidadeOrigem = origemRes.rows[0].id_cidade
    }

    if (!cidadeDestino) {
      const destinoRes = await client.query(
        `SELECT id_cidade
         FROM cidade
         WHERE id_cidade <> $1
         ORDER BY RANDOM()
         LIMIT 1`,
        [cidadeOrigem]
      )

      if (destinoRes.rowCount === 0) {
        throw new AppError('É necessário ter pelo menos 2 cidades cadastradas', 400)
      }

      cidadeDestino = destinoRes.rows[0].id_cidade
    }

    if (cidadeOrigem === cidadeDestino) {
      throw new AppError('Cidade de origem e destino não podem ser iguais', 400)
    }

    // Validar se cidades existem
    const cidadesValidas = await client.query(
      `SELECT id_cidade FROM cidade WHERE id_cidade IN ($1, $2)`,
      [cidadeOrigem, cidadeDestino]
    )

    if (cidadesValidas.rowCount !== 2) {
      throw new AppError('Uma ou ambas as cidades são inválidas', 400)
    }

    // 3️⃣ Selecionar motorista
    let cpfMotorista = params?.cpfMotorista

    if (!cpfMotorista) {
      const motoristaRes = await client.query(
        `SELECT m.cpf, m.nome
         FROM motorista m
         WHERE m.status = '${STATUS_MOTORISTA.ATIVO}'
           AND m.validade_cnh > CURRENT_DATE
           AND NOT EXISTS (
             SELECT 1
             FROM viagem v
             WHERE v.cpf_motorista = m.cpf
               AND v.status_viagem = '${STATUS_VIAGEM.EM_ANDAMENTO}'
           )
         ORDER BY RANDOM()
         LIMIT 1`
      )

      if (motoristaRes.rowCount === 0) {
        throw new AppError('Nenhum motorista disponível (todos em viagem ou inativos)', 400)
      }

      cpfMotorista = motoristaRes.rows[0].cpf
    } else {
      // Validar motorista específico
      const motoristaValido = await client.query(
        `SELECT m.cpf
         FROM motorista m
         WHERE m.cpf = $1
           AND m.status = '${STATUS_MOTORISTA.ATIVO}'
           AND m.validade_cnh > CURRENT_DATE
           AND NOT EXISTS (
             SELECT 1
             FROM viagem v
             WHERE v.cpf_motorista = m.cpf
               AND v.status_viagem = '${STATUS_VIAGEM.EM_ANDAMENTO}'
           )`,
        [cpfMotorista]
      )

      if (motoristaValido.rowCount === 0) {
        throw new AppError('Motorista não disponível (em viagem, inativo ou CNH vencida)', 400)
      }
    }

    // 4️⃣ Inserir viagem
    const viagemRes = await client.query(
      `INSERT INTO viagem (
         id_veiculo,
         cpf,
         cidade_origem,
         cidade_destino,
         data_saida,
         status_viagem,
         km_inicial
       )
       VALUES ($1, $2, $3, $4, NOW(), $5, $6)
       RETURNING *`,
      [
        idVeiculo,
        cpfMotorista,
        cidadeOrigem,
        cidadeDestino,
        STATUS_VIAGEM.EM_ANDAMENTO,
        veiculo.km_atual
      ]
    )

    // 5️⃣ Atualizar status do veículo
    await client.query(
      `UPDATE veiculo
       SET status = $1
       WHERE id_veiculo = $2`,
      [STATUS_VEICULO.EM_VIAGEM, idVeiculo]
    )

    // 6️⃣ Atualizar status do motorista
    await client.query(
      `UPDATE motorista
       SET status = $1
       WHERE cpf_motorista = $2`,
      [STATUS_MOTORISTA.EM_VIAGEM, cpfMotorista]
    )

    // 7️⃣ Buscar informações completas para retorno
    const viagemCompleta = await client.query(
      `SELECT 
         v.*,
         ve.placa,
         ve.modelo,
         m.nome as motorista,
         c1.nome as origem,
         c1.uf as origem_uf,
         c2.nome as destino,
         c2.uf as destino_uf
       FROM viagem v
       JOIN veiculo ve ON ve.id_veiculo = v.id_veiculo
       JOIN motorista m ON m.cpf = v.cpf_motorista
       JOIN cidade c1 ON c1.id_cidade = v.cidade_origem
       JOIN cidade c2 ON c2.id_cidade = v.cidade_destino
       WHERE v.id_viagem = $1`,
      [viagemRes.rows[0].id_viagem]
    )

    await client.query('COMMIT')
    
    return viagemCompleta.rows[0]

  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/**
 * Busca viagens em andamento
 */
export async function buscarViagensEmAndamento() {
  const result = await pool.query(
    `SELECT 
       v.*,
       ve.placa,
       ve.modelo,
       m.nome as motorista,
       c1.nome as origem,
       c2.nome as destino,
       EXTRACT(EPOCH FROM (NOW() - v.data_saida)) / 60 as minutos_em_viagem
     FROM viagem v
     JOIN veiculo ve ON ve.id_veiculo = v.id_veiculo
     JOIN motorista m ON m.cpf = v.cpf_motorista
     JOIN cidade c1 ON c1.id_cidade = v.cidade_origem
     JOIN cidade c2 ON c2.id_cidade = v.cidade_destino
     WHERE v.status_viagem = $1
     ORDER BY v.data_saida DESC`,
    [STATUS_VIAGEM.EM_ANDAMENTO]
  )

  return result.rows
}

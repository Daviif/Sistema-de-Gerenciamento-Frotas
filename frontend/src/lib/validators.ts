export function validarCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]/g, '')
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false

  let soma = 0
  let resto: number

  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cpf.substring(i - 1, i)) * (11 - i)
  }
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(cpf.substring(9, 10))) return false

  soma = 0
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(cpf.substring(i - 1, i)) * (12 - i)
  }
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(cpf.substring(10, 11))) return false

  return true
}

export function validarCNH(cnh: string): boolean {
  // Basic CNH validation: only digits and length 11, reject sequences
  cnh = cnh.replace(/[^\d]/g, '')
  if (cnh.length !== 11 || /^(\d)\1+$/.test(cnh)) return false
  // CNH has a more complex verification but backend currently only checks length and repeated digits
  // If needed, implement exact Brazilian CNH checksum here
  return true
}

export function validarCategoriaCNH(categoria: string): boolean {
  const categoriasValidas = ['A', 'B', 'AB', 'C', 'D', 'E', 'AC', 'AD', 'AE']
  return categoriasValidas.includes(categoria.toUpperCase())
}

export function validarUF(uf: string): boolean {
  const ufsValidas = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ]
  return ufsValidas.includes(uf.toUpperCase())
}

export const UFS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
] as const

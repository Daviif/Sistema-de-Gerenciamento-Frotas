// Validações de CPF, CNH, Placa, etc.

export function validarCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]/g, '')
  
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
    return false
  }

  let soma = 0
  let resto

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
  cnh = cnh.replace(/[^\d]/g, '')
  return cnh.length === 11 && !/^(\d)\1+$/.test(cnh)
}

export function validarPlaca(placa: string): boolean {
  // Valida placas antigas (ABC1234) e Mercosul (ABC1D23)
  const regexAntiga = /^[A-Z]{3}\d{4}$/
  const regexMercosul = /^[A-Z]{3}\d[A-Z]\d{2}$/
  
  placa = placa.toUpperCase().replace(/[^A-Z0-9]/g, '')
  
  return regexAntiga.test(placa) || regexMercosul.test(placa)
}

export function validarData(data: string): boolean {
  const dataObj = new Date(data)
  return dataObj instanceof Date && !isNaN(dataObj.getTime())
}

export function validarDataFutura(data: string): boolean {
  if (!validarData(data)) return false
  const dataObj = new Date(data)
  const hoje = new Date()
  return dataObj > hoje
}

export function validarUF(uf: string): boolean {
  const ufsValidas = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ]
  return ufsValidas.includes(uf.toUpperCase())
}

export function validarCategoriaCNH(categoria: string): boolean {
  const categoriasValidas = ['A', 'B', 'AB', 'C', 'D', 'E', 'AC', 'AD', 'AE']
  return categoriasValidas.includes(categoria.toUpperCase())
}


export function validarTipoVeiculo(tipo: string): string | null {
  const normalizar = (str: string) => 
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const tiposValidos = ['Caminhão', 'Caminhão-trator', 'Caminhonete', 'Camioneta', 'Micro-ônibus', 'Hatch',
    'Motocicleta', 'Motoneta', 'Ônibus', 'Reboque', 'Semi-reboque', 'Utilitário', 'Basculante', 'Munck', 'Sedã'
  ];

  const busca = normalizar(tipo);

  return tiposValidos.find(t => normalizar(t) === busca) || null;
}
export function validarTipoCombustivel(tipo: string): boolean {
  const tiposValidos = ['gasolina', 'etanol', 'diesel', 'gnv', 'flex']
  return tiposValidos.includes(tipo.toLowerCase())
}

export function validarStatusVeiculo(status: string): boolean {
  const statusValidos = ['ativo', 'em_viagem', 'manutencao', 'inativo']
  return statusValidos.includes(status.toLowerCase())
}

export function validarStatusViagem(status: string): boolean {
  const statusValidos = ['planejada', 'em_andamento', 'finalizada', 'cancelada']
  return statusValidos.includes(status.toLowerCase())
}

export function validarValorPositivo(valor: number): boolean {
  return typeof valor === 'number' && valor > 0 && !isNaN(valor)
}
# Sistema de Gerenciamento de Frotas
Esse é um sistema de Gerenciamento de Frotas, em desenvolvimento para um trabalho de Banco de Dados I<br>

Desenvolvimento: Davi Emílio de Paula Fonseca - Matrícula 24.1.8158<br>

O Sistema de Gerenciamento de Frota de Veículos tem como finalidade auxiliar empresas ou instituições no controle operacional e analítico da frota. Atualmente, o sistema permite:

1. Cadastro e consulta de veículos
2. Cadastro e consulta de motoristas
3. Registro e acompanhamento de manutenções
4. Controle de abastecimentos
5. Registro de viagens com criação, finalização e cancelamento
6. Cadastro e gestão de cidades (origem/destino)
7. Dashboard com indicadores da operação
8. Estatísticas gerais e relatórios gerenciais

## Regras de negócio implementadas

1. O sistema permite o cadastro e gestão de veículos contendo:
   - Placa (com validação)
   - Modelo
   - Marca
   - Ano
   - Tipo
   - Quilometragem atual
   - Capacidade do tanque
   - Status (ativo, em_viagem, manutencao, inativo)

2. O sistema permite o cadastro e gestão de motoristas contendo:
   - Nome
   - CPF (com validação)
   - CNH (com validação)
   - Categoria da CNH
   - Validade da CNH
   - Status

3. O sistema permite o registro de manutenções com:
   - Veículo
   - Data
   - Tipo de manutenção
   - Descrição
   - Valor
   - Quilometragem da manutenção (opcional)
   - Fornecedor (opcional)
   - Controle de conclusão

4. O sistema permite o registro de abastecimentos com:
   - Veículo
   - Data
   - Tipo de combustível
   - Litros
   - Valor total
   - Quilometragem no abastecimento (opcional)

5. O sistema permite o registro e ciclo de vida de viagens contendo:
   - Veículo utilizado
   - Motorista responsável
   - Cidade de origem e destino
   - Data de saída e chegada
   - Quilometragem inicial e final
   - Observações
   - Status da viagem (em_andamento, finalizada, cancelada)

6. O sistema permite consultas e análises como:
   - Histórico completo do veículo (viagens, abastecimentos e manutenções)
   - Histórico de viagens por motorista
   - Motoristas disponíveis (status ativo e CNH válida)
   - Veículos disponíveis e por status
   - Rotas mais populares
   - Estatísticas por período (custos, km, viagens)

## Stack utilizada

- Backend: Node.js + Express + TypeScript + PostgreSQL
- Frontend: React + Vite + TypeScript + React Query + Tailwind CSS

## Estrutura do projeto

- `backend/`: API REST, regras de negócio e acesso ao banco
- `frontend/`: interface web com dashboard, cadastros e relatórios

## Como executar

### 1) Backend

```bash
cd backend
npm install
npm run dev
```

Servidor padrão: `http://localhost:3001`

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Aplicação padrão: `http://localhost:5173`

## Configuração do banco de dados

- O backend usa PostgreSQL.
- A conexão está definida em `backend/src/db.ts`.
- Ajuste usuário, senha, host, porta e nome do banco conforme seu ambiente.

## Documentação da API

Para detalhes dos endpoints e exemplos de payloads, consulte:

- `backend/API_DOCS.md`

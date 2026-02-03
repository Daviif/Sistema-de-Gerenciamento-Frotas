import express from 'express'
import cors from 'cors'
import { errorHandler } from './middleware/errorHandler'
import veiculosRoutes from './routes/veiculos.routes'
import viagensRoutes from './routes/viagens.routes'
import abastecimentoRoutes from './routes/abastecimento.routes'
import cidadeRoutes from './routes/cidade.routes'
import motoristasRoutes from './routes/motoristas.routes'
import manutencaoRoutes from './routes/manutencao.routes'
import estatisticasRoutes from './routes/estatisticas.routes'

const app = express()

// Middlewares
app.use(cors())
app.use(express.json())

// Log de requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// Rotas
app.use('/veiculos', veiculosRoutes)
app.use('/viagens', viagensRoutes)
app.use('/abastecimento', abastecimentoRoutes)
app.use('/cidade', cidadeRoutes)
app.use('/motoristas', motoristasRoutes)
app.use('/manutencao', manutencaoRoutes)
app.use('/estatisticas', estatisticasRoutes)

// Rota 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.path
  })
})

// Middleware de erro (deve ser o último)
app.use(errorHandler)

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════╗')
  console.log('║   🚛 GERENCIADOR DE FROTA - API       ║')
  console.log('╠════════════════════════════════════════╣')
  console.log(`║   Servidor: http://localhost:${PORT}     ║`)
  console.log(`║   Status: ✅ Rodando                    ║`)
  console.log('╚════════════════════════════════════════╝')
  console.log('')
  console.log('📋 Rotas disponíveis:')
  console.log('  • GET    /health')
  console.log('  • CRUD   /veiculos')
  console.log('  • CRUD   /motoristas')
  console.log('  • CRUD   /viagens')
  console.log('  • CRUD   /abastecimento')
  console.log('  • CRUD   /manutencao')
  console.log('  • CRUD   /cidade')
  console.log('  • GET    /estatisticas/geral')
  console.log('')
})

export default app
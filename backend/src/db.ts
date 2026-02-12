import { Pool } from 'pg'

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'gerenciador de frota',
  password: '33624055',
  port: 5432
})

export { pool }
export default pool
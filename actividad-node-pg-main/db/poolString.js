// db/poolString.js
// Enfoque 2: conexión por connection string (URI)

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // connectionString se construye internamente por pg con los datos anteriores
  // Esto es equivalente a: postgresql://user:pass@host:port/db
});

// Verificar conexión al iniciar
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error al conectar (connection string):', err.message);
  } else {
    console.log('✅ Pool por connection string conectado a PostgreSQL');
    release();
  }
});

module.exports = pool;
// db/poolConfig.js
// Enfoque 1: conexión por configuración (host, port, user, password, database)

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Verificar conexión al iniciar
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error al conectar (configuración):', err.message);
  } else {
    console.log('✅ Pool por configuración conectado a PostgreSQL');
    release();
  }
});

module.exports = pool;

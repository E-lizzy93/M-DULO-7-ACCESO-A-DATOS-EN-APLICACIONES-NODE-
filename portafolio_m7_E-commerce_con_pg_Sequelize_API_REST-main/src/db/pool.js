// src/db/pool.js — conexión con pg (prepared statements)
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error al conectar (pg):', err.message);
  } else {
    console.log('✅ pg Pool conectado a PostgreSQL');
    release();
  }
});

module.exports = pool;

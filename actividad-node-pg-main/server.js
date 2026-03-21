require('dotenv').config();
const express = require('express');
const path    = require('path');

// Importar los dos pools (cada uno usa un enfoque distinto)
const poolConfig = require('./db/poolConfig');
const poolString = require('./db/poolString');

const app  = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Crear tablas si no existen y poblarlas ────────────────────────────────
async function inicializarBD() {
  // Tabla finanzas_personales (enfoque 1 — pool por configuración)
  await poolConfig.query(`
    CREATE TABLE IF NOT EXISTS finanzas_personales (
      nombre         VARCHAR(50) PRIMARY KEY,
      me_debe        INTEGER DEFAULT 0,
      cuotas_cobrar  INTEGER DEFAULT 0,
      le_debo        INTEGER DEFAULT 0,
      cuotas_pagar   INTEGER DEFAULT 0
    )
  `);

  const { rowCount } = await poolConfig.query('SELECT 1 FROM finanzas_personales LIMIT 1');
  if (rowCount === 0) {
    await poolConfig.query(`
      INSERT INTO finanzas_personales (nombre, me_debe, cuotas_cobrar, le_debo, cuotas_pagar) VALUES
        ('tía carmen',        0,     0, 5000,  1),
        ('papá',              0,     0, 15000, 3),
        ('nacho',             10000, 2, 7000,  1),
        ('almacén esquina',   0,     0, 13000, 2),
        ('vicios varios',     0,     0, 35000, 35),
        ('compañero trabajo', 50000, 5, 0,     0)
    `);
    console.log('📊 Tabla finanzas_personales poblada con datos iniciales');
  }

  // Tabla clientes (enfoque 2 — pool por connection string)
  await poolString.query(`
    CREATE TABLE IF NOT EXISTS clientes (
      id       SERIAL PRIMARY KEY,
      nombre   VARCHAR(80)  NOT NULL,
      email    VARCHAR(100) NOT NULL,
      telefono VARCHAR(20),
      ciudad   VARCHAR(50)
    )
  `);

  const { rowCount: rc2 } = await poolString.query('SELECT 1 FROM clientes LIMIT 1');
  if (rc2 === 0) {
    await poolString.query(`
      INSERT INTO clientes (nombre, email, telefono, ciudad) VALUES
        ('Ana González',    'ana.gonzalez@email.com',    '+56912345678', 'Santiago'),
        ('Luis Martínez',   'luis.martinez@email.com',   '+56923456789', 'Valparaíso'),
        ('Carmen López',    'carmen.lopez@email.com',    '+56934567890', 'Concepción'),
        ('Pedro Ramírez',   'pedro.ramirez@email.com',   '+56945678901', 'Santiago'),
        ('María Fernández', 'maria.fernandez@email.com', '+56956789012', 'La Serena')
    `);
    console.log('👥 Tabla clientes poblada con datos iniciales');
  }
}

// ── GET /finanzas → pool por configuración ────────────────────────────────
app.get('/finanzas', async (req, res) => {
  try {
    const { rows } = await poolConfig.query(
      'SELECT * FROM finanzas_personales ORDER BY nombre'
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error en GET /finanzas:', err.message);
    res.status(500).json({ error: 'Error al consultar finanzas_personales', detalle: err.message });
  }
});

// ── GET /clientes → pool por connection string ────────────────────────────
app.get('/clientes', async (req, res) => {
  try {
    const { rows } = await poolString.query(
      'SELECT * FROM clientes ORDER BY id'
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error en GET /clientes:', err.message);
    res.status(500).json({ error: 'Error al consultar clientes', detalle: err.message });
  }
});

// ── Iniciar servidor ──────────────────────────────────────────────────────
inicializarBD()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Error al inicializar la BD:', err.message);
    process.exit(1);
  });

require('dotenv').config();
const express = require('express');
const path    = require('path');
const pool    = require('./db/pool');

const app  = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Crear tabla si no existe ──────────────────────────────────────────────
async function inicializarBD() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clientes_v2 (
      rut     VARCHAR(12) PRIMARY KEY,
      nombre  VARCHAR(80) NOT NULL,
      edad    INTEGER     NOT NULL
    )
  `);

  const { rowCount } = await pool.query('SELECT 1 FROM clientes_v2 LIMIT 1');
  if (rowCount === 0) {
    await pool.query(`
      INSERT INTO clientes_v2 (rut, nombre, edad) VALUES
        ('12345678-9', 'Ana González',    28),
        ('98765432-1', 'Luis Martínez',   35),
        ('11111111-1', 'Carmen López',    28),
        ('22222222-2', 'Pedro Ramírez',   42),
        ('33333333-3', 'María Fernández', 35),
        ('44444444-4', 'Jorge Soto',      19),
        ('55555555-5', 'Valentina Rojas', 25)
    `);
    console.log('👥 Tabla clientes_v2 poblada con datos iniciales');
  }
}

// ── GET /clientes → todos los clientes ───────────────────────────────────
app.get('/clientes', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM clientes_v2 ORDER BY nombre');
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error en GET /clientes:', err.message);
    res.status(500).json({ error: 'Error al consultar clientes', detalle: err.message });
  }
});

// ── POST /clientes → crear nuevo cliente ──────────────────────────────────
app.post('/clientes', async (req, res) => {
  try {
    const { rut, nombre, edad } = req.body;

    if (!rut || !nombre || edad === undefined) {
      return res.status(400).json({ error: 'Los campos rut, nombre y edad son obligatorios' });
    }
    if (isNaN(edad) || !Number.isInteger(Number(edad))) {
      return res.status(400).json({ error: 'La edad debe ser un número entero' });
    }

    await pool.query(
      'INSERT INTO clientes_v2 (rut, nombre, edad) VALUES ($1, $2, $3)',
      [rut, nombre, parseInt(edad)]
    );

    res.status(201).json({ mensaje: 'Cliente creado correctamente', cliente: { rut, nombre, edad: parseInt(edad) } });

  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: `Ya existe un cliente con el RUT ${req.body.rut}` });
    }
    console.error('Error en POST /clientes:', err.message);
    res.status(500).json({ error: 'Error al crear cliente', detalle: err.message });
  }
});

// ── PUT /clientes/:rut → modificar nombre ────────────────────────────────
app.put('/clientes/:rut', async (req, res) => {
  try {
    const { rut }    = req.params;
    const { nombre } = req.body;

    if (!nombre) return res.status(400).json({ error: 'El campo nombre es obligatorio' });

    const { rowCount } = await pool.query(
      'UPDATE clientes_v2 SET nombre = $1 WHERE rut = $2', [nombre, rut]
    );

    if (rowCount === 0) return res.status(404).json({ mensaje: 'Cliente no existe' });

    res.status(200).json({ mensaje: 'Cliente actualizado correctamente', cliente: { rut, nombre } });

  } catch (err) {
    console.error('Error en PUT /clientes:', err.message);
    res.status(500).json({ error: 'Error al actualizar cliente', detalle: err.message });
  }
});

// ── DELETE /clientes/:rut → eliminar por RUT ─────────────────────────────
app.delete('/clientes/:rut', async (req, res) => {
  try {
    const { rut } = req.params;

    const { rows, rowCount } = await pool.query(
      'DELETE FROM clientes_v2 WHERE rut = $1 RETURNING nombre', [rut]
    );

    if (rowCount === 0) return res.status(404).json({ mensaje: 'Cliente no existe' });

    res.status(200).json({ mensaje: `Cliente "${rows[0].nombre}" eliminado correctamente` });

  } catch (err) {
    console.error('Error en DELETE /clientes:', err.message);
    res.status(500).json({ error: 'Error al eliminar cliente', detalle: err.message });
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

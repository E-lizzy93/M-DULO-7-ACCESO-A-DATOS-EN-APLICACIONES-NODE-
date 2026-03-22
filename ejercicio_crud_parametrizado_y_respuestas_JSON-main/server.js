require('dotenv').config();
const express = require('express');
const path    = require('path');
const pool    = require('./db/pool');

const app  = express();

// Valida formato RUT chileno: 12345678-9 o 1234567-K
function validarRut(rut) {
  return /^\d{7,8}-[\dkK]$/.test(rut);
}
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Inicializar tabla ─────────────────────────────────────────────────────
async function inicializarBD() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clientes_v2 (
      rut    VARCHAR(12) PRIMARY KEY,
      nombre VARCHAR(80) NOT NULL,
      edad   INTEGER     NOT NULL
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
    console.log('👥 Tabla clientes poblada con datos iniciales');
  }
}

// ── GET /clientes ─────────────────────────────────────────────────────────
// Parámetros opcionales: ?rut=X | ?edad=N | ?nombre=texto
app.get('/clientes', async (req, res) => {
  try {
    const { rut, edad, nombre } = req.query;
    let q;

    if (rut) {
      q = { text: 'SELECT * FROM clientes_v2 WHERE rut = $1', values: [rut] };
    } else if (edad !== undefined) {
      if (isNaN(edad)) return res.status(400).json({ ok: false, mensaje: 'La edad debe ser un número' });
      q = { text: 'SELECT * FROM clientes_v2 WHERE edad = $1 ORDER BY nombre', values: [parseInt(edad)] };
    } else if (nombre) {
      q = { text: 'SELECT * FROM clientes_v2 WHERE nombre ILIKE $1 ORDER BY nombre', values: [`${nombre}%`] };
    } else {
      q = { text: 'SELECT * FROM clientes_v2 ORDER BY nombre', values: [] };
    }

    const { rows } = await pool.query(q);

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'No se encontraron clientes con ese criterio' });
    }

    res.status(200).json({ ok: true, data: rows });

  } catch (err) {
    console.error('Error en GET /clientes:', err.message);
    res.status(500).json({ ok: false, mensaje: 'Error al consultar clientes', detalle: err.message });
  }
});

// ── POST /clientes → crear cliente ────────────────────────────────────────
app.post('/clientes', async (req, res) => {
  try {
    const { rut, nombre, edad } = req.body;

    if (!rut || !nombre || edad === undefined) {
      return res.status(400).json({ ok: false, mensaje: 'Los campos rut, nombre y edad son obligatorios' });
    }
    if (isNaN(edad) || !Number.isInteger(Number(edad))) {
      return res.status(400).json({ ok: false, mensaje: 'La edad debe ser un número entero' });
    }
    if (!validarRut(rut)) {
      return res.status(400).json({ ok: false, mensaje: 'Formato de RUT inválido. Usa el formato 12345678-9 o 1234567-K' });
    }

    const q = {
      text:   'INSERT INTO clientes_v2 (rut, nombre, edad) VALUES ($1, $2, $3)',
      values: [rut, nombre, parseInt(edad)]
    };

    await pool.query(q);

    res.status(201).json({ ok: true, data: { rut, nombre, edad: parseInt(edad) } });

  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ ok: false, mensaje: `Ya existe un cliente con el RUT ${req.body.rut}` });
    }
    console.error('Error en POST /clientes:', err.message);
    res.status(500).json({ ok: false, mensaje: 'Error al crear cliente', detalle: err.message });
  }
});

// ── PUT /clientes/:rut → modificar nombre ────────────────────────────────
app.put('/clientes/:rut', async (req, res) => {
  try {
    const { rut }    = req.params;
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({ ok: false, mensaje: 'El campo nombre es obligatorio' });
    }

    const q = {
      text:   'UPDATE clientes_v2 SET nombre = $1 WHERE rut = $2',
      values: [nombre, rut]
    };

    const { rowCount } = await pool.query(q);

    if (rowCount === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Cliente no existe' });
    }

    res.status(200).json({ ok: true, rowCount, mensaje: 'Actualizado correctamente' });

  } catch (err) {
    console.error('Error en PUT /clientes:', err.message);
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar cliente', detalle: err.message });
  }
});

// ── DELETE /clientes → eliminar por rut, nombre o edad ───────────────────
app.delete('/clientes', async (req, res) => {
  try {
    const { rut, nombre, edad } = req.query;

    // Eliminar por RUT (único, directo)
    if (rut) {
      const q = { text: 'DELETE FROM clientes_v2 WHERE rut = $1', values: [rut] };
      const { rowCount } = await pool.query(q);
      if (rowCount === 0) return res.status(404).json({ ok: false, mensaje: 'Cliente no existe' });
      return res.status(200).json({ ok: true, rowCount, mensaje: 'Eliminado correctamente' });
    }

    // Eliminar por nombre — prohibido si hay más de 1
    if (nombre) {
      const check = await pool.query({
        text:   'SELECT rut FROM clientes_v2 WHERE nombre ILIKE $1',
        values: [`${nombre}%`]
      });
      if (check.rowCount === 0) return res.status(404).json({ ok: false, mensaje: 'No se encontraron clientes con ese nombre' });
      if (check.rowCount > 1)  return res.status(400).json({ ok: false, mensaje: `Se encontraron ${check.rowCount} clientes con ese criterio. Refine la búsqueda usando el RUT` });

      const { rowCount } = await pool.query({
        text:   'DELETE FROM clientes_v2 WHERE rut = $1',
        values: [check.rows[0].rut]
      });
      return res.status(200).json({ ok: true, rowCount, mensaje: 'Eliminado correctamente' });
    }

    // Eliminar por edad — prohibido si hay más de 1
    if (edad !== undefined) {
      if (isNaN(edad)) return res.status(400).json({ ok: false, mensaje: 'La edad debe ser un número' });

      const check = await pool.query({
        text:   'SELECT rut FROM clientes_v2 WHERE edad = $1',
        values: [parseInt(edad)]
      });
      if (check.rowCount === 0) return res.status(404).json({ ok: false, mensaje: 'No se encontraron clientes con esa edad' });
      if (check.rowCount > 1)  return res.status(400).json({ ok: false, mensaje: `Se encontraron ${check.rowCount} clientes con edad ${edad}. Refine la búsqueda usando el RUT` });

      const { rowCount } = await pool.query({
        text:   'DELETE FROM clientes_v2 WHERE rut = $1',
        values: [check.rows[0].rut]
      });
      return res.status(200).json({ ok: true, rowCount, mensaje: 'Eliminado correctamente' });
    }

    res.status(400).json({ ok: false, mensaje: 'Se requiere parámetro rut, nombre o edad' });

  } catch (err) {
    console.error('Error en DELETE /clientes:', err.message);
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar cliente', detalle: err.message });
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
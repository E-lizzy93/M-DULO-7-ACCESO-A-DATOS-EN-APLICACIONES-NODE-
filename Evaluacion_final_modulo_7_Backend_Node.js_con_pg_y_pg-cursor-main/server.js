require('dotenv').config();
const express = require('express');
const path    = require('path');
const pool    = require('./db/pool');
const Cursor  = require('pg-cursor');

const app  = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── GET /paises → lista en bloques con cursor ─────────────────────────────
// Query params: ?limite=5|10|20 &offset=0
// Usa pg-cursor para leer los registros en bloques (no todos a la vez)
app.get('/paises', async (req, res) => {
  const limite = parseInt(req.query.limite) || 5;
  const offset = parseInt(req.query.offset) || 0;

  const client = await pool.connect();
  try {
    // pg-cursor: abre un cursor en la BD y lee los registros de a bloques
    const cursor = client.query(
      new Cursor(`
        SELECT p.nombre, p.continente, p.poblacion,
               pp.pib_2019, pp.pib_2020
        FROM paises p
        JOIN paises_pib pp ON pp.nombre = p.nombre
        ORDER BY p.nombre
      `)
    );

    // Saltar los registros anteriores al offset
    if (offset > 0) {
      await new Promise((resolve, reject) => {
        cursor.read(offset, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    // Leer el bloque solicitado
    const rows = await new Promise((resolve, reject) => {
      cursor.read(limite, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Contar el total de registros para la paginación
    const { rows: total } = await pool.query('SELECT COUNT(*) FROM paises');

    cursor.close(() => {});

    res.status(200).json({
      ok:     true,
      data:   rows,
      total:  parseInt(total[0].count),
      limite,
      offset
    });

  } catch (err) {
    console.error('Error en GET /paises:', err.message);
    res.status(500).json({ ok: false, mensaje: 'Error al consultar países', detalle: err.message });
  } finally {
    client.release();
  }
});

// ── POST /paises → agrega país + pib + registro en paises_data_web ────────
app.post('/paises', async (req, res) => {
  const { nombre, continente, poblacion, pib_2019, pib_2020 } = req.body;

  if (!nombre || !continente || !poblacion || !pib_2019 || !pib_2020) {
    return res.status(400).json({ ok: false, mensaje: 'Todos los campos son obligatorios: nombre, continente, poblacion, pib_2019, pib_2020' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insertar en paises
    await client.query({
      text:   'INSERT INTO paises (nombre, continente, poblacion) VALUES ($1, $2, $3)',
      values: [nombre, continente, parseInt(poblacion)]
    });

    // 2. Insertar en paises_pib
    await client.query({
      text:   'INSERT INTO paises_pib (nombre, pib_2019, pib_2020) VALUES ($1, $2, $3)',
      values: [nombre, parseInt(pib_2019), parseInt(pib_2020)]
    });

    // 3. Insertar en paises_data_web con accion = 1 (INSERT)
    await client.query({
      text:   'INSERT INTO paises_data_web (nombre_pais, accion) VALUES ($1, $2) ON CONFLICT (nombre_pais) DO UPDATE SET accion = 1',
      values: [nombre, 1]
    });

    await client.query('COMMIT');

    res.status(201).json({
      ok:      true,
      mensaje: `País "${nombre}" agregado correctamente`,
      data:    { nombre, continente, poblacion, pib_2019, pib_2020 }
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('ROLLBACK — Error en POST /paises:', err.message);

    if (err.code === '23505') {
      return res.status(409).json({ ok: false, mensaje: `El país "${nombre}" ya existe` });
    }
    res.status(500).json({ ok: false, mensaje: 'Error al agregar país', detalle: err.message });
  } finally {
    client.release();
  }
});

// ── DELETE /paises?nombre=X → elimina país + pib + registro data_web ──────
app.delete('/paises', async (req, res) => {
  const { nombre } = req.query;

  if (!nombre) {
    return res.status(400).json({ ok: false, mensaje: 'Se requiere el parámetro nombre' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verificar que existe
    const { rows } = await client.query({
      text:   'SELECT nombre FROM paises WHERE nombre = $1',
      values: [nombre]
    });
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ ok: false, mensaje: `País "${nombre}" no encontrado` });
    }

    // 1. Eliminar de paises_pib
    await client.query({
      text:   'DELETE FROM paises_pib WHERE nombre = $1',
      values: [nombre]
    });

    // 2. Eliminar de paises
    await client.query({
      text:   'DELETE FROM paises WHERE nombre = $1',
      values: [nombre]
    });

    // 3. Registrar en paises_data_web con accion = 0 (DELETE)
    await client.query({
      text:   'INSERT INTO paises_data_web (nombre_pais, accion) VALUES ($1, $2) ON CONFLICT (nombre_pais) DO UPDATE SET accion = 0',
      values: [nombre, 0]
    });

    await client.query('COMMIT');

    res.status(200).json({
      ok:      true,
      mensaje: `País "${nombre}" eliminado correctamente`
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('ROLLBACK — Error en DELETE /paises:', err.message);
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar país', detalle: err.message });
  } finally {
    client.release();
  }
});

// ── Iniciar servidor ──────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

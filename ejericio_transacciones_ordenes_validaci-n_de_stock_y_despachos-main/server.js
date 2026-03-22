require('dotenv').config();
const express = require('express');
const path    = require('path');
const pool    = require('./db/pool');

const app  = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Inicializar tablas ────────────────────────────────────────────────────
async function inicializarBD() {
  // Crear todas las tablas en una sola query respetando el orden de dependencias
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clientes_ordenes (
      rut    VARCHAR(10)  PRIMARY KEY,
      nombre VARCHAR(50)  NOT NULL
    );
    CREATE TABLE IF NOT EXISTS direcciones (
      id_direccion SERIAL       PRIMARY KEY,
      rut          VARCHAR(10)  NOT NULL REFERENCES clientes_ordenes(rut),
      direccion    VARCHAR(200) NOT NULL
    );
    CREATE TABLE IF NOT EXISTS productos (
      id_producto  SERIAL       PRIMARY KEY,
      nombre       VARCHAR(200) NOT NULL,
      precio       INTEGER      NOT NULL,
      existencias  INTEGER      NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS orden (
      id_orden     SERIAL      PRIMARY KEY,
      rut          VARCHAR(10) NOT NULL REFERENCES clientes_ordenes(rut),
      id_direccion INTEGER     NOT NULL REFERENCES direcciones(id_direccion),
      precio_total INTEGER     NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS lista_productos (
      id_lista          SERIAL  PRIMARY KEY,
      id_orden          INTEGER NOT NULL REFERENCES orden(id_orden),
      id_producto       INTEGER NOT NULL REFERENCES productos(id_producto),
      cantidad_producto INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS despachos (
      id_despacho  SERIAL  PRIMARY KEY,
      id_orden     INTEGER NOT NULL REFERENCES orden(id_orden),
      id_direccion INTEGER NOT NULL REFERENCES direcciones(id_direccion)
    );
  `);

  // Poblar datos iniciales si no existen
  const { rowCount } = await pool.query('SELECT 1 FROM clientes_ordenes LIMIT 1');
  if (rowCount === 0) {
    await pool.query(`
      INSERT INTO clientes_ordenes (rut, nombre) VALUES
        ('12345678-9', 'Ana González'),
        ('98765432-1', 'Luis Martínez'),
        ('11111111-1', 'Carmen López')
    `);
    await pool.query(`
      INSERT INTO direcciones (rut, direccion) VALUES
        ('12345678-9', 'Av. Providencia 1234, Santiago'),
        ('12345678-9', 'Calle Los Leones 567, Providencia'),
        ('98765432-1', 'Av. Las Condes 890, Las Condes'),
        ('11111111-1', 'Pasaje El Sol 123, Maipú')
    `);
    await pool.query(`
      INSERT INTO productos (nombre, precio, existencias) VALUES
        ('Notebook Lenovo IdeaPad',    450000, 10),
        ('Mouse Inalámbrico Logitech',  25000, 50),
        ('Teclado Mecánico Redragon',   45000, 30),
        ('Monitor Samsung 24"',        180000,  8),
        ('Audífonos Sony WH-1000XM4',  220000, 15),
        ('Webcam Logitech HD',          35000, 25),
        ('Disco SSD 1TB Samsung',       75000, 20),
        ('Hub USB-C 7 puertos',         18000, 40)
    `);
    // Órdenes de prueba
    await pool.query(`
      INSERT INTO orden (rut, id_direccion, precio_total) VALUES
        ('12345678-9', 1, 70000),
        ('12345678-9', 2, 220000),
        ('98765432-1', 3, 45000)
    `);
    await pool.query(`
      INSERT INTO despachos (id_orden, id_direccion) VALUES
        (1, 1),
        (2, 2),
        (3, 3)
    `);
    await pool.query(`
      INSERT INTO lista_productos (id_orden, id_producto, cantidad_producto) VALUES
        (1, 2, 1),
        (1, 3, 1),
        (2, 5, 1),
        (3, 3, 1)
    `);
    await pool.query(`
      UPDATE productos SET existencias = existencias - 1 WHERE id_producto IN (2, 3, 5);
      UPDATE productos SET existencias = existencias - 1 WHERE id_producto = 3
    `);
    console.log('🌱 Datos iniciales insertados');
  }
}

// ── GET /api → endpoints de consulta ─────────────────────────────────────
// ?filtro=productos
// ?filtro=productos&id=X
// ?filtro=productos&orden=X
// ?filtro=ordenes&rut=X
// ?filtro=clientes_ordenes
// ?filtro=clientes_ordenes&rut=X
// ?filtro=direcciones&rut=X
// ?filtro=despachos&orden=X
app.get('/api', async (req, res) => {
  try {
    const { filtro, id, rut, orden } = req.query;

    if (!filtro) {
      return res.status(400).json({ ok: false, mensaje: 'Se requiere el parámetro filtro' });
    }

    let q, rows;

    if (filtro === 'productos') {
      if (id) {
        // Producto por id
        q = { text: 'SELECT * FROM productos WHERE id_producto = $1', values: [id] };
        ({ rows } = await pool.query(q));
        if (rows.length === 0) return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });
        return res.status(200).json({ ok: true, data: rows[0] });
      }
      if (orden) {
        // Productos de una orden
        q = {
          text: `SELECT p.id_producto, p.nombre, p.precio, lp.cantidad_producto,
                        (p.precio * lp.cantidad_producto) AS subtotal
                 FROM lista_productos lp
                 JOIN productos p ON p.id_producto = lp.id_producto
                 WHERE lp.id_orden = $1`,
          values: [orden]
        };
        ({ rows } = await pool.query(q));
        if (rows.length === 0) return res.status(404).json({ ok: false, mensaje: 'No se encontraron productos para esa orden' });
        return res.status(200).json({ ok: true, data: rows });
      }
      // Todos los productos
      q = { text: 'SELECT * FROM productos ORDER BY id_producto', values: [] };
      ({ rows } = await pool.query(q));
      return res.status(200).json({ ok: true, data: rows });
    }

    if (filtro === 'ordenes') {
      if (!rut) return res.status(400).json({ ok: false, mensaje: 'Se requiere el parámetro rut' });
      q = {
        text: `SELECT o.id_orden, o.rut, o.precio_total,
                      d.direccion, c.nombre AS cliente
               FROM orden o
               JOIN clientes_ordenes c    ON c.rut = o.rut
               JOIN direcciones d ON d.id_direccion = o.id_direccion
               WHERE o.rut = $1
               ORDER BY o.id_orden DESC`,
        values: [rut]
      };
      ({ rows } = await pool.query(q));
      if (rows.length === 0) return res.status(404).json({ ok: false, mensaje: 'No se encontraron órdenes para ese RUT' });
      return res.status(200).json({ ok: true, data: rows });
    }

    if (filtro === 'clientes') {
      if (rut) {
        q = { text: 'SELECT * FROM clientes_ordenes WHERE rut = $1', values: [rut] };
        ({ rows } = await pool.query(q));
        if (rows.length === 0) return res.status(404).json({ ok: false, mensaje: 'Cliente no encontrado' });
        return res.status(200).json({ ok: true, data: rows[0] });
      }
      q = { text: 'SELECT * FROM clientes_ordenes ORDER BY nombre', values: [] };
      ({ rows } = await pool.query(q));
      return res.status(200).json({ ok: true, data: rows });
    }

    if (filtro === 'direcciones') {
      if (!rut) return res.status(400).json({ ok: false, mensaje: 'Se requiere el parámetro rut' });
      q = { text: 'SELECT * FROM direcciones WHERE rut = $1 ORDER BY id_direccion', values: [rut] };
      ({ rows } = await pool.query(q));
      if (rows.length === 0) return res.status(404).json({ ok: false, mensaje: 'No se encontraron direcciones para ese RUT' });
      return res.status(200).json({ ok: true, data: rows });
    }

    if (filtro === 'despachos') {
      if (!orden) return res.status(400).json({ ok: false, mensaje: 'Se requiere el parámetro orden' });
      q = {
        text: `SELECT d.id_despacho, d.id_orden, dir.direccion
               FROM despachos d
               JOIN direcciones dir ON dir.id_direccion = d.id_direccion
               WHERE d.id_orden = $1`,
        values: [orden]
      };
      ({ rows } = await pool.query(q));
      if (rows.length === 0) return res.status(404).json({ ok: false, mensaje: 'No se encontró despacho para esa orden' });
      return res.status(200).json({ ok: true, data: rows[0] });
    }

    res.status(400).json({ ok: false, mensaje: `Filtro desconocido: ${filtro}` });

  } catch (err) {
    console.error('Error en GET /api:', err.message);
    res.status(500).json({ ok: false, mensaje: 'Error al consultar', detalle: err.message });
  }
});

// ── POST /orden → Transacción completa ───────────────────────────────────
// Body: { rut, id_direccion, productos: [{ id_producto, cantidad_producto }] }
app.post('/orden', async (req, res) => {
  const { rut, id_direccion, productos } = req.body;

  // Validaciones básicas
  if (!rut || !id_direccion || !productos || productos.length === 0) {
    return res.status(400).json({ ok: false, mensaje: 'Se requieren rut, id_direccion y al menos un producto' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Calcular precio total y validar stock
    let precioTotal = 0;

    for (const item of productos) {
      const { rows } = await client.query({
        text:   'SELECT nombre, precio, existencias FROM productos WHERE id_producto = $1',
        values: [item.id_producto]
      });

      if (rows.length === 0) {
        throw new Error(`Producto con id ${item.id_producto} no existe`);
      }

      const producto = rows[0];

      // Validar stock
      if (producto.existencias < item.cantidad_producto) {
        throw new Error(`Stock insuficiente para "${producto.nombre}". Disponible: ${producto.existencias}, solicitado: ${item.cantidad_producto}`);
      }

      precioTotal += producto.precio * item.cantidad_producto;
    }

    // 2. Insertar orden
    const { rows: ordenRows } = await client.query({
      text:   'INSERT INTO orden (rut, id_direccion, precio_total) VALUES ($1, $2, $3) RETURNING id_orden',
      values: [rut, id_direccion, precioTotal]
    });
    const id_orden = ordenRows[0].id_orden;

    // 3. Insertar despacho
    await client.query({
      text:   'INSERT INTO despachos (id_orden, id_direccion) VALUES ($1, $2)',
      values: [id_orden, id_direccion]
    });

    // 4. Insertar lista de productos y descontar stock
    for (const item of productos) {
      // Insertar en lista_productos
      await client.query({
        text:   'INSERT INTO lista_productos (id_orden, id_producto, cantidad_producto) VALUES ($1, $2, $3)',
        values: [id_orden, item.id_producto, item.cantidad_producto]
      });

      // Descontar existencias
      await client.query({
        text:   'UPDATE productos SET existencias = existencias - $1 WHERE id_producto = $2',
        values: [item.cantidad_producto, item.id_producto]
      });
    }

    // 5. COMMIT
    await client.query('COMMIT');

    res.status(201).json({
      ok: true,
      mensaje: 'Orden creada correctamente',
      data: {
        id_orden,
        rut,
        id_direccion,
        precio_total: precioTotal,
        productos
      }
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('ROLLBACK — Error en POST /orden:', err.message);

    const esStock = err.message.includes('Stock insuficiente');
    res.status(esStock ? 409 : 500).json({
      ok: false,
      mensaje: err.message
    });

  } finally {
    client.release();
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
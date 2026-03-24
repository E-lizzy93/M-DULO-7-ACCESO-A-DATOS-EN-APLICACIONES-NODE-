// src/routes/ventas.js
const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');
const { Venta, VentaItem, Producto } = require('../models');

// ── GET /ventas → historial con Sequelize ────────────────────────────────
router.get('/', async (_req, res) => {
  try {
    const ventas = await Venta.findAll({
      include: [{
        model:      VentaItem,
        include:    [{ model: Producto, attributes: ['nombre'] }],
        attributes: ['id_item', 'id_producto', 'cantidad', 'precio_unitario']
      }],
      order: [['id_orden', 'DESC']]
    });

    // Calcular subtotal, IVA y total con IVA para cada venta
    const resultado = ventas.map(v => {
      const items    = v.VentaItems || [];
      const subtotal = items.reduce((sum, i) => sum + (parseFloat(i.precio_unitario) * i.cantidad), 0);
      const iva      = Math.round(subtotal * 0.19);
      const total    = subtotal + iva;
      return {
        id_venta: v.id_orden,
        fecha:    v.fecha,
        items:    items.length,
        subtotal,
        iva,
        total,
        detalle:  items.map(i => ({
          producto:        i.Producto?.nombre || '—',
          cantidad:        i.cantidad,
          precio_unitario: parseFloat(i.precio_unitario),
          subtotal_item:   parseFloat(i.precio_unitario) * i.cantidad
        }))
      };
    });

    res.status(200).json(resultado);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener ventas', detalle: err.message });
  }
});

// ── POST /venta → transacción con pg ─────────────────────────────────────
// Body: { id_usuario: 1, items: [{ id_producto, cantidad, precio_unit }] }
router.post('/', async (req, res) => {
  const { id_usuario = 1, items } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Se requiere al menos un producto en el carrito' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Crear la orden
    const { rows: orden } = await client.query({
      text:   'INSERT INTO ordenes (id_usuario, fecha, total) VALUES ($1, NOW(), 0) RETURNING id_orden',
      values: [id_usuario]
    });
    const id_orden = orden[0].id_orden;

    let subtotal = 0;

    // 2. Procesar cada ítem
    for (const item of items) {
      // Descontar stock — si no hay suficiente lanza error
      const { rowCount } = await client.query({
        text:   'UPDATE inventario SET stock = stock - $1 WHERE id_producto = $2 AND stock >= $1',
        values: [item.cantidad, item.id_producto]
      });

      if (rowCount === 0) {
        // No se pudo descontar — stock insuficiente
        const { rows } = await client.query({
          text:   'SELECT nombre FROM productos WHERE id_producto = $1',
          values: [item.id_producto]
        });
        const nombre = rows[0]?.nombre || `ID ${item.id_producto}`;
        throw new Error(`Stock insuficiente para "${nombre}"`);
      }

      // Insertar ítem de la venta
      await client.query({
        text:   'INSERT INTO orden_items (id_orden, id_producto, cantidad, precio_unitario) VALUES ($1, $2, $3, $4)',
        values: [id_orden, item.id_producto, item.cantidad, item.precio_unit]
      });

      subtotal += item.precio_unit * item.cantidad;
    }

    // 3. Actualizar total de la orden
    await client.query({
      text:   'UPDATE ordenes SET total = $1 WHERE id_orden = $2',
      values: [subtotal, id_orden]
    });

    await client.query('COMMIT');

    const iva   = Math.round(subtotal * 0.19);
    const total = subtotal + iva;

    res.status(201).json({
      ok:       true,
      id_venta: id_orden,
      fecha:    new Date(),
      subtotal,
      iva,
      total,
      items
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('ROLLBACK — Error en POST /venta:', err.message);

    const esStock = err.message.includes('Stock insuficiente');
    res.status(esStock ? 409 : 500).json({ error: err.message });

  } finally {
    client.release();
  }
});

module.exports = router;

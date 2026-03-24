// src/routes/productos.js
const express    = require('express');
const router     = express.Router();
const pool       = require('../db/pool');
const { Producto, Inventario } = require('../models');

// ── GET /productos → Sequelize con JOIN inventario ────────────────────────
router.get('/', async (_req, res) => {
  try {
    const productos = await Producto.findAll({
      where:   { activo: true },
      include: [{ model: Inventario, attributes: ['stock'] }],
      order:   [['id_producto', 'ASC']]
    });
    res.status(200).json(productos);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener productos', detalle: err.message });
  }
});

// ── GET /productos/raw → pg con prepared statement ────────────────────────
// Evidencia el uso de pg + consultas parametrizadas
router.get('/raw', async (_req, res) => {
  try {
    const { rows } = await pool.query({
      text:   'SELECT p.id_producto, p.nombre, p.precio, p.activo, i.stock FROM productos p JOIN inventario i ON i.id_producto = p.id_producto WHERE p.activo = $1 ORDER BY p.id_producto',
      values: [true]
    });
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener productos (raw)', detalle: err.message });
  }
});

// ── POST /producto → crear producto con Sequelize ─────────────────────────
router.post('/', async (req, res) => {
  try {
    const { nombre, precio, stock = 0 } = req.body;

    if (!nombre || precio === undefined) {
      return res.status(400).json({ error: 'Los campos nombre y precio son obligatorios' });
    }
    if (isNaN(precio) || precio < 0) {
      return res.status(400).json({ error: 'El precio debe ser un número positivo' });
    }

    const producto = await Producto.create({ nombre, precio: parseFloat(precio) });
    await Inventario.create({ id_producto: producto.id_producto, stock: parseInt(stock) });

    res.status(201).json({ ...producto.toJSON(), stock: parseInt(stock) });

  } catch (err) {
    res.status(500).json({ error: 'Error al crear producto', detalle: err.message });
  }
});

// ── PUT /producto → actualizar con Sequelize ──────────────────────────────
router.put('/', async (req, res) => {
  try {
    const { id_producto, nombre, precio, stock } = req.body;

    if (!id_producto) {
      return res.status(400).json({ error: 'Se requiere id_producto' });
    }

    const producto = await Producto.findByPk(id_producto);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

    if (nombre  !== undefined) producto.nombre = nombre;
    if (precio  !== undefined) producto.precio = parseFloat(precio);
    await producto.save();

    if (stock !== undefined) {
      await Inventario.update(
        { stock: parseInt(stock) },
        { where: { id_producto } }
      );
    }

    res.status(200).json({ mensaje: 'Producto actualizado correctamente' });

  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar producto', detalle: err.message });
  }
});

// ── DELETE /producto → eliminar (soft delete) con Sequelize ───────────────
router.delete('/', async (req, res) => {
  try {
    const { id_producto } = req.query;

    if (!id_producto) {
      return res.status(400).json({ error: 'Se requiere id_producto' });
    }

    const producto = await Producto.findByPk(id_producto);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

    // Soft delete: marcar como inactivo en vez de borrar
    await producto.update({ activo: false });

    res.status(200).json({ mensaje: `Producto "${producto.nombre}" eliminado correctamente` });

  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar producto', detalle: err.message });
  }
});

module.exports = router;

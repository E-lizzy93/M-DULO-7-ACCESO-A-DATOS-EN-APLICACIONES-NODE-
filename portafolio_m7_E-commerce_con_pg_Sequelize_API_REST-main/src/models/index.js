// src/models/index.js — modelos Sequelize
const { DataTypes } = require('sequelize');
const sequelize     = require('../db/sequelize');

// ── Modelo Producto ───────────────────────────────────────────────────────
const Producto = sequelize.define('Producto', {
  id_producto: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre:      { type: DataTypes.TEXT,    allowNull: false },
  precio:      { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  activo:      { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'productos', timestamps: false });

// ── Modelo Inventario ─────────────────────────────────────────────────────
const Inventario = sequelize.define('Inventario', {
  id_producto: { type: DataTypes.INTEGER, primaryKey: true },
  stock:       { type: DataTypes.INTEGER, allowNull: false }
}, { tableName: 'inventario', timestamps: false });

// ── Modelo Venta ──────────────────────────────────────────────────────────
const Venta = sequelize.define('Venta', {
  id_orden:   { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_usuario: { type: DataTypes.INTEGER, allowNull: false },
  fecha:      { type: DataTypes.DATE,    allowNull: false, defaultValue: DataTypes.NOW },
  total:      { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 }
}, { tableName: 'ordenes', timestamps: false });

// ── Modelo VentaItem ──────────────────────────────────────────────────────
const VentaItem = sequelize.define('VentaItem', {
  id_item:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_orden:        { type: DataTypes.INTEGER, allowNull: false },
  id_producto:     { type: DataTypes.INTEGER, allowNull: false },
  cantidad:        { type: DataTypes.INTEGER, allowNull: false },
  precio_unitario: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
}, { tableName: 'orden_items', timestamps: false });

// ── Asociaciones ──────────────────────────────────────────────────────────
Producto.hasOne(Inventario,  { foreignKey: 'id_producto' });
Inventario.belongsTo(Producto, { foreignKey: 'id_producto' });
Venta.hasMany(VentaItem,    { foreignKey: 'id_orden' });
VentaItem.belongsTo(Producto, { foreignKey: 'id_producto' });

module.exports = { Producto, Inventario, Venta, VentaItem, sequelize };

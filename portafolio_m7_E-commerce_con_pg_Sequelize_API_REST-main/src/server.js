require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const path      = require('path');
const sequelize = require('./db/sequelize');

const productosRouter = require('./routes/productos');
const ventasRouter    = require('./routes/ventas');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── Rutas ─────────────────────────────────────────────────────────────────
app.use('/productos', productosRouter);
app.use('/ventas',    ventasRouter);
app.post('/venta',    (req, res) => ventasRouter.handle(req, res));
app.get('/venta',     (_req, res) => res.redirect('/ventas'));

// ── Ruta raíz → sirve el frontend ────────────────────────────────────────
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ── Iniciar servidor ──────────────────────────────────────────────────────
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Sequelize conectado a PostgreSQL');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error('❌ Error al iniciar:', err.message);
    process.exit(1);
  }
})();

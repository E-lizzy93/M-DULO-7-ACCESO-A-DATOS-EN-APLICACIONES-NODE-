import 'dotenv/config';
import express  from 'express';
import cors     from 'cors';
import path     from 'path';
import { fileURLToPath } from 'url';
import { Sequelize, DataTypes } from 'sequelize';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Conexión a PostgreSQL con Sequelize ───────────────────────────────────
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host:    process.env.DB_HOST,
    port:    process.env.DB_PORT,
    dialect: 'postgres',
    logging: false   // evita que Sequelize imprima cada query en consola
  }
);

// ── Modelo Cliente ────────────────────────────────────────────────────────
const Cliente = sequelize.define('Cliente', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true
  },
  nombre: {
    type:      DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type:      DataTypes.STRING(120),
    allowNull: false,
    unique:    true
  }
}, {
  tableName:  'clientes_seq',  // nombre de la tabla en PostgreSQL
  timestamps: false            // no agrega createdAt ni updatedAt
});

// ── Express ───────────────────────────────────────────────────────────────
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── GET /clientes → retorna todos los clientes ────────────────────────────
app.get('/clientes', async (_req, res) => {
  try {
    const clientes = await Cliente.findAll({ order: [['id', 'ASC']] });
    res.status(200).json(clientes);
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: err.message });
  }
});

// ── POST /clientes → crea un nuevo cliente ────────────────────────────────
app.post('/clientes', async (req, res) => {
  try {
    const { nombre, email } = req.body;

    if (!nombre || !email) {
      return res.status(400).json({ ok: false, mensaje: 'Los campos nombre y email son obligatorios' });
    }

    const creado = await Cliente.create({ nombre, email });
    res.status(201).json(creado);

  } catch (err) {
    // Email duplicado
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ ok: false, mensaje: `El email ${req.body.email} ya está registrado` });
    }
    res.status(400).json({ ok: false, mensaje: err.message });
  }
});

// ── Iniciar servidor ──────────────────────────────────────────────────────
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a PostgreSQL con Sequelize');

    // Crea la tabla si no existe (sync sin force para no borrar datos)
    await sequelize.sync();
    console.log('📋 Tabla clientes_seq sincronizada');

    // Poblar datos de prueba si la tabla está vacía
    const count = await Cliente.count();
    if (count === 0) {
      await Cliente.bulkCreate([
        { nombre: 'Ana González',    email: 'ana.gonzalez@email.com'    },
        { nombre: 'Luis Martínez',   email: 'luis.martinez@email.com'   },
        { nombre: 'Carmen López',    email: 'carmen.lopez@email.com'    },
        { nombre: 'Pedro Ramírez',   email: 'pedro.ramirez@email.com'   },
        { nombre: 'María Fernández', email: 'maria.fernandez@email.com' }
      ]);
      console.log('🌱 Datos iniciales insertados');
    }

    app.listen(3000, () => {
      console.log('🚀 Servidor corriendo en http://localhost:3000');
    });

  } catch (err) {
    console.error('❌ Error al iniciar:', err.message);
    process.exit(1);
  }
})();

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
    logging: false
  }
);

// ── Modelo Pelicula ───────────────────────────────────────────────────────
const Pelicula = sequelize.define('Pelicula', {
  id:     { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  titulo: { type: DataTypes.STRING(150), allowNull: false },
  anio:   { type: DataTypes.INTEGER,     allowNull: false }
}, {
  tableName:  'peliculas',
  timestamps: false
});

// ── Modelo Actor ──────────────────────────────────────────────────────────
const Actor = sequelize.define('Actor', {
  id:               { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre:           { type: DataTypes.STRING(120), allowNull: false },
  fecha_nacimiento: { type: DataTypes.DATEONLY,    allowNull: false }
}, {
  tableName:  'actores',
  timestamps: false
});

// ── Tabla intermedia N-N ──────────────────────────────────────────────────
// Una película puede tener muchos actores y un actor puede estar en muchas películas
const PeliculasActores = sequelize.define('PeliculasActores', {}, {
  tableName:  'peliculas_actores',
  timestamps: false
});

// ── Asociaciones ──────────────────────────────────────────────────────────
Pelicula.belongsToMany(Actor,    { through: PeliculasActores, foreignKey: 'pelicula_id', otherKey: 'actor_id' });
Actor.belongsToMany(Pelicula,    { through: PeliculasActores, foreignKey: 'actor_id',    otherKey: 'pelicula_id' });

// ── Express ───────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── GET /peliculas → lista todas las películas con sus actores ────────────
app.get('/peliculas', async (_req, res) => {
  try {
    const peliculas = await Pelicula.findAll({
      include: { model: Actor, through: { attributes: [] } },
      order:   [['anio', 'DESC']]
    });
    res.status(200).json(peliculas);
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: err.message });
  }
});

// ── POST /peliculas → crea una película (opcionalmente con actores) ────────
app.post('/peliculas', async (req, res) => {
  try {
    const { titulo, anio, actores_ids } = req.body;

    if (!titulo || !anio) {
      return res.status(400).json({ ok: false, mensaje: 'Los campos titulo y anio son obligatorios' });
    }
    if (isNaN(anio)) {
      return res.status(400).json({ ok: false, mensaje: 'El campo anio debe ser un número' });
    }

    const pelicula = await Pelicula.create({ titulo, anio: parseInt(anio) });

    // Si se enviaron actores, asignarlos
    if (actores_ids && actores_ids.length > 0) {
      await pelicula.setActors(actores_ids);
    }

    // Retornar la película con sus actores
    const resultado = await Pelicula.findByPk(pelicula.id, {
      include: { model: Actor, through: { attributes: [] } }
    });

    res.status(201).json(resultado);

  } catch (err) {
    res.status(400).json({ ok: false, mensaje: err.message });
  }
});

// ── GET /actores → lista todos los actores con sus películas ──────────────
app.get('/actores', async (_req, res) => {
  try {
    const actores = await Actor.findAll({
      include: { model: Pelicula, through: { attributes: [] } },
      order:   [['nombre', 'ASC']]
    });
    res.status(200).json(actores);
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: err.message });
  }
});

// ── POST /actores → crea un actor ─────────────────────────────────────────
app.post('/actores', async (req, res) => {
  try {
    const { nombre, fecha_nacimiento } = req.body;

    if (!nombre || !fecha_nacimiento) {
      return res.status(400).json({ ok: false, mensaje: 'Los campos nombre y fecha_nacimiento son obligatorios' });
    }

    const actor = await Actor.create({ nombre, fecha_nacimiento });
    res.status(201).json(actor);

  } catch (err) {
    res.status(400).json({ ok: false, mensaje: err.message });
  }
});

// ── POST /asignar-actor → asigna actor a película con transacción ─────────
app.post('/asignar-actor', async (req, res) => {
  try {
    const { pelicula_id, actor_id } = req.body;

    if (!pelicula_id || !actor_id) {
      return res.status(400).json({ ok: false, mensaje: 'Se requieren pelicula_id y actor_id' });
    }

    // Verificar que existen
    const pelicula = await Pelicula.findByPk(pelicula_id);
    const actor    = await Actor.findByPk(actor_id);

    if (!pelicula) return res.status(404).json({ ok: false, mensaje: 'Película no encontrada' });
    if (!actor)    return res.status(404).json({ ok: false, mensaje: 'Actor no encontrado' });

    // Transacción — la asignación se confirma solo si todo sale bien
    await sequelize.transaction(async (t) => {
      await PeliculasActores.create({ pelicula_id, actor_id }, { transaction: t });
    });

    res.status(201).json({
      ok:      true,
      mensaje: `Actor "${actor.nombre}" asignado a "${pelicula.titulo}" correctamente`
    });

  } catch (err) {
    // Error de clave duplicada — ya estaba asignado
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ ok: false, mensaje: 'Este actor ya está asignado a esa película' });
    }
    res.status(500).json({ ok: false, mensaje: err.message });
  }
});

// ── Iniciar servidor ──────────────────────────────────────────────────────
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a PostgreSQL con Sequelize');

    await sequelize.sync();
    console.log('📋 Tablas sincronizadas: peliculas, actores, peliculas_actores');

    // Datos de prueba si las tablas están vacías
    const countPeliculas = await Pelicula.count();
    if (countPeliculas === 0) {
      const peliculas = await Pelicula.bulkCreate([
        { titulo: 'Inception',               anio: 2010 },
        { titulo: 'The Dark Knight',         anio: 2008 },
        { titulo: 'Interstellar',            anio: 2014 },
        { titulo: 'Pulp Fiction',            anio: 1994 },
        { titulo: 'El Lobo de Wall Street',  anio: 2013 }
      ]);

      const actores = await Actor.bulkCreate([
        { nombre: 'Leonardo DiCaprio',    fecha_nacimiento: '1974-11-11' },
        { nombre: 'Joseph Gordon-Levitt', fecha_nacimiento: '1981-02-17' },
        { nombre: 'Tom Hardy',            fecha_nacimiento: '1977-09-15' },
        { nombre: 'Elliot Page',          fecha_nacimiento: '1987-02-21' },
        { nombre: 'Christian Bale',       fecha_nacimiento: '1974-01-30' },
        { nombre: 'Heath Ledger',         fecha_nacimiento: '1979-04-04' },
        { nombre: 'Matthew McConaughey',  fecha_nacimiento: '1969-11-04' },
        { nombre: 'Anne Hathaway',        fecha_nacimiento: '1982-11-12' },
        { nombre: 'John Travolta',        fecha_nacimiento: '1954-02-18' },
        { nombre: 'Samuel L. Jackson',    fecha_nacimiento: '1948-12-21' },
        { nombre: 'Uma Thurman',          fecha_nacimiento: '1970-04-29' },
        { nombre: 'Jonah Hill',           fecha_nacimiento: '1983-12-20' },
        { nombre: 'Margot Robbie',        fecha_nacimiento: '1990-07-02' }
      ]);

      // Inception → DiCaprio + Gordon-Levitt + Tom Hardy + Elliot Page
      await peliculas[0].addActors([actores[0], actores[1], actores[2], actores[3]]);
      // The Dark Knight → Bale + Heath Ledger
      await peliculas[1].addActors([actores[4], actores[5]]);
      // Interstellar → McConaughey + Hathaway
      await peliculas[2].addActors([actores[6], actores[7]]);
      // Pulp Fiction → Travolta + Samuel L. Jackson + Uma Thurman
      await peliculas[3].addActors([actores[8], actores[9], actores[10]]);
      // El Lobo de Wall Street → DiCaprio + Jonah Hill + Margot Robbie
      await peliculas[4].addActors([actores[0], actores[11], actores[12]]);

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
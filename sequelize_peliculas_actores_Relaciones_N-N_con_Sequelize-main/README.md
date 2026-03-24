# Ejercicio — Relaciones N-N con Sequelize: Películas y Actores

Aplicación full stack con Node.js + Express + Sequelize modelando la relación muchos a muchos entre Películas y Actores.

## ¿Qué hace este ejercicio?

Implementa una relación **N-N (muchos a muchos)** — una película puede tener muchos actores y un actor puede estar en muchas películas. Sequelize maneja esto con tres tablas:

- `peliculas` → id, titulo, anio
- `actores` → id, nombre, fecha_nacimiento
- `peliculas_actores` → tabla intermedia con pelicula_id y actor_id

**¿Cómo se define la relación en Sequelize?**
```js
Pelicula.belongsToMany(Actor, { through: PeliculasActores, foreignKey: 'pelicula_id', otherKey: 'actor_id' });
Actor.belongsToMany(Pelicula, { through: PeliculasActores, foreignKey: 'actor_id',    otherKey: 'pelicula_id' });
```
Con esto, Sequelize sabe cómo hacer los JOINs automáticamente al usar `include`.

**Asignación con transacción:**
El endpoint `POST /asignar-actor` usa `sequelize.transaction()` para garantizar que la asignación se confirma solo si todo sale bien, igual que `BEGIN/COMMIT/ROLLBACK` en SQL puro.

## ⚙️ Configuración

### 1. Crear la base de datos en pgAdmin
- Click derecho en **Bases de datos** → **Crear** → **Base de datos**
- Nombre: `peliculas_db` → **Guardar**

> Las tablas se crean automáticamente al iniciar el servidor. Para verlas en pgAdmin:
> **peliculas_db → Schemas → public → Tables** → verás `peliculas`, `actores` y `peliculas_actores`.
> Si no aparecen, click derecho en **Tables** → **Refresh**.

### 2. Editar el archivo `.env`
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_contraseña_de_PostgreSQL
DB_NAME=peliculas_db
```

**¿Dónde encuentro estos datos?**
- `DB_PASSWORD` → es la contraseña que pusiste cuando instalaste PostgreSQL en tu equipo
- `DB_NAME` → para este ejercicio: `peliculas_db`
- El resto de valores (`localhost`, `5432`, `postgres`) generalmente no cambian en una instalación local

## 📥 Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/nombre-del-repositorio.git
cd sequelize-peliculas
npm install
```

Luego edita el archivo `.env` con tus credenciales y ejecuta `npm start`.

## 🚀 Instalación y uso

```bash
npm install
npm start
```

Abre http://localhost:3000

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/peliculas` | Lista todas las películas con sus actores |
| POST | `/peliculas` | Crea una película |
| GET | `/actores` | Lista todos los actores con sus películas |
| POST | `/actores` | Crea un actor |
| POST | `/asignar-actor` | Asigna actor a película con transacción |

## Estructura

```
sequelize-peliculas/
├── server.js          # Modelos, asociaciones N-N y endpoints
├── .env               # Credenciales (editar antes de iniciar)
├── package.json       # Dependencias — incluye "type": "module"
├── README.md          # Instrucciones de instalación y uso
└── public/
    ├── style.css      # Tema indigo/morado con tabs
    └── index.html     # Interfaz con tabs: Películas, Actores, Asignar, Crear
```
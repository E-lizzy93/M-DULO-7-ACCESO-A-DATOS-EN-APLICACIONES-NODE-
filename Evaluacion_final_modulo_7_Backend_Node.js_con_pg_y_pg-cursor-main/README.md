# Evaluación Final Módulo 7 — API REST con pg-cursor: Países y PIB

Backend Node.js con pg y pg-cursor para consultar países con sus datos de PIB, usando transacciones para agregar y eliminar registros.

## ¿Qué hace este ejercicio?

Administra tres tablas relacionadas con transacciones BEGIN/COMMIT/ROLLBACK:

- `paises` → nombre (PK), continente, poblacion
- `paises_pib` → nombre (FK), pib_2019, pib_2020
- `paises_data_web` → nombre_pais (PK), accion (1=INSERT, 0=DELETE)

**Concepto nuevo — pg-cursor:**
En vez de traer todos los registros de una vez, `pg-cursor` abre un cursor en la BD y lee los registros en **bloques** del tamaño que se indique. Esto es más eficiente para tablas grandes.

```js
const cursor = client.query(new Cursor('SELECT * FROM paises JOIN ...'));
cursor.read(5, (err, rows) => { /* primeros 5 registros */ });
cursor.read(5, (err, rows) => { /* siguientes 5 registros */ });
```

## ⚙️ Configuración

### 1. Ejecutar el script SQL en pgAdmin
Abre el archivo `scripts/complemento_evaluacion_final_modulo7.sql` en pgAdmin (**Herramienta de consultas**) y ejecuta con **F5**.
Este es el archivo original del curso (`complemento evaluacion final módulo 7 JS.sql`) que crea y pobla las tres tablas con los 13 países iniciales.

### 2. Editar el archivo `.env`
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_contraseña_de_PostgreSQL
DB_NAME=modulo7
```

**¿Dónde encuentro estos datos?**
- `DB_PASSWORD` → es la contraseña que pusiste cuando instalaste PostgreSQL en tu equipo
- `DB_NAME` → para este ejercicio: `modulo7`
- El resto de valores (`localhost`, `5432`, `postgres`) generalmente no cambian en una instalación local

## 📥 Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/nombre-del-repositorio.git
cd evaluacion-final-m7
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
| GET | `/paises?limite=5&offset=0` | Lista países con PIB en bloques (pg-cursor) |
| POST | `/paises` | Agrega país + PIB + registro en data_web (accion=1) |
| DELETE | `/paises?nombre=X` | Elimina país + PIB + registro en data_web (accion=0) |

## Estructura

```
evaluacion-final-m7/
├── server.js           # 3 endpoints con pg-cursor y transacciones
├── .env                # Credenciales (editar antes de iniciar)
├── package.json        # Dependencias del proyecto
├── README.md           # Instrucciones de instalación y uso
├── db/
│   └── pool.js         # Conexión a PostgreSQL
├── scripts/
│   └── complemento_evaluacion_final_modulo7.sql  # Script original del curso
└── public/
    ├── style.css       # Tema azul marino con tabla paginada
    └── index.html      # Lista paginada, formulario agregar y eliminar
```

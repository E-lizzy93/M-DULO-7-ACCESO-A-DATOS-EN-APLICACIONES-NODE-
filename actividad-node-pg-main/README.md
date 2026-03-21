# Actividad — Node.js + pg (Módulo 7, Lección 1)

Servidor Node.js que se conecta a PostgreSQL usando el paquete `pg` con dos enfoques de conexión mediante pool.

## Tecnologías
- **Node.js + Express** — Servidor y API REST
- **pg** — Cliente PostgreSQL para Node.js
- **dotenv** — Variables de entorno para credenciales

## ⚙️ Configuración antes de iniciar

Abre el archivo `.env` que está en la carpeta del proyecto y reemplaza los valores:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=aquí_va_tu_contraseña_de_PostgreSQL
DB_NAME=aquí_va_el_nombre_de_tu_base_de_datos
```

**¿Dónde encuentro estos datos?**
- `DB_PASSWORD` → es la contraseña que pusiste cuando instalaste PostgreSQL en tu equipo
- `DB_NAME` → es el nombre de la base de datos que creaste en pgAdmin (ej: `modulo7`)
- El resto de valores (`localhost`, `5432`, `postgres`) generalmente no cambian en una instalación local
 
> ⚠️ Si no tienes la base de datos creada, ábrela en pgAdmin → click derecho en **Bases de datos** → **Crear** → **Base de datos** → escribe el nombre → **Guardar**
 
## 📦 Origen de los datos
 
La tabla `finanzas_personales` utilizada en esta actividad fue creada originalmente en el **Módulo 5, Lección 2, Ejercicio 3 — Finanzas Personales**. El script SQL original Con la solución de ese ejercicio, se está incluido en la carpeta `scripts/` para que puedas revisarlo, ejecutarlo o compararlo con lo que ya tienes en tu base de datos. En caso contrario, el servidor la creará y poblará con los datos originales del ejercicio.

## 🗄️ Crear las tablas en PostgreSQL

Las tablas se crean automáticamente al iniciar el servidor si no existen.

Si prefieres crearlas manualmente, abre el archivo `scripts/tablas.sql` en pgAdmin (**Herramienta de consultas**) y ejecuta con **F5**.

## 🚀 Instalación y uso

```bash
npm install
npm start
```

Abre http://localhost:3000 en tu navegador.

Para desarrollo con reinicio automático:
```bash
npm run dev
```

## Enfoques de conexión

### Enfoque 1 — Pool por configuración (`db/poolConfig.js`)
```js
const pool = new Pool({ host, port, user, password, database });
```
- Endpoint: `GET /finanzas`
- Tabla: `finanzas_personales`
- Vista: tabla HTML

### Enfoque 2 — Pool por connection string (`db/poolString.js`)
```js
const pool = new Pool({ connectionString: 'postgresql://user:pass@host:port/db' });
```
- Endpoint: `GET /clientes`
- Tabla: `clientes`
- Vista: lista HTML

## Estructura del proyecto

```
actividad-node-pg/
├── server.js           # Servidor principal y endpoints
├── .env                # ← Edita este archivo con tus credenciales
├── package.json
├── README.md
├── db/
│   ├── poolConfig.js   # Conexión por configuración
│   └── poolString.js   # Conexión por connection string
├── public/
│   ├── style.css
│   ├── index.html      # Menú principal
│   ├── finanzas.html   # Vista tabla (GET /finanzas)
│   └── clientes.html   # Vista lista (GET /clientes)
└── scripts/
    └── tablas.sql      # Script SQL para crear las tablas manualmente
```

## Endpoints

| Método | Ruta | Pool usado | Descripción |
|--------|------|------------|-------------|
| GET | `/finanzas` | poolConfig | Retorna todos los registros de finanzas_personales |
| GET | `/clientes` | poolString | Retorna todos los registros de clientes |

## Códigos HTTP

| Código | Situación |
|--------|-----------|
| 200 | Consulta exitosa |
| 500 | Error al conectar o consultar la base de datos |

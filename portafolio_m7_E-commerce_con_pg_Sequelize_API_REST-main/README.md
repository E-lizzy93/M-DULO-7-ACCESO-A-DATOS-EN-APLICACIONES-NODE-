# Portafolio Módulo 7 — E-commerce con pg + Sequelize + API REST

Aplicación full stack de e-commerce que combina **pg** (consultas parametrizadas) y **Sequelize** (ORM) sobre PostgreSQL, con transacciones TCL para el registro de ventas.

## ¿Qué hace este proyecto?

Implementa una tienda online completa que cubre todos los requerimientos del Portafolio M7:

1. **pg** → consultas DML y transacciones para ventas (`POST /venta`)
2. **Sequelize** → ORM para gestión de productos, inventario y ventas (`GET /productos`, CRUD)
3. **API RESTful** → 7 endpoints completos
4. **Transacciones TCL** → `BEGIN/COMMIT/ROLLBACK` en `POST /venta` con validación de stock
5. **Manejo de errores** → try/catch en todos los endpoints
6. **Códigos HTTP** → 200, 201, 400, 404, 409, 500
7. **Frontend** → catálogo, carrito, confirmación y historial de ventas

## ⚙️ Configuración

### 1. Crear la base de datos en pgAdmin
- Click derecho en **Bases de datos** → **Crear** → **Base de datos**
- Nombre: `portafolio_m7` → **Guardar**

### 2. Ejecutar el script SQL del Módulo 5
Abre el archivo `scripts/solucion.sql` en pgAdmin (**Herramienta de consultas**) y ejecuta con **F5**.
Este es el script original del Portafolio M5 que crea las tablas `usuarios`, `productos`, `inventario`, `ordenes` y `orden_items` con datos de prueba.

> Las tablas se pueden ver en pgAdmin: **portafolio_m7 → Schemas → public → Tables**

### 3. Editar el archivo `.env`
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_contraseña_de_PostgreSQL
DB_NAME=portafolio_m7
```

**¿Dónde encuentro estos datos?**
- `DB_PASSWORD` → es la contraseña que pusiste cuando instalaste PostgreSQL en tu equipo
- `DB_NAME` → para este ejercicio: `portafolio_m7`
- El resto de valores (`localhost`, `5432`, `postgres`) generalmente no cambian en una instalación local

## 📥 Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/nombre-del-repositorio.git
cd portafolio-m7
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

| Método | Ruta | Tecnología | Descripción |
|--------|------|------------|-------------|
| GET | `/` | — | Sirve el frontend |
| GET | `/productos` | Sequelize | Lista productos con stock |
| GET | `/productos/raw` | pg | Lista productos (prepared statement) |
| POST | `/productos` | Sequelize | Crea un producto |
| PUT | `/productos` | Sequelize | Actualiza un producto |
| DELETE | `/productos` | Sequelize | Elimina un producto (soft delete) |
| POST | `/ventas` | pg + TCL | Registra una venta con transacción |
| GET | `/ventas` | Sequelize | Lista el historial de ventas |

## Estructura

```
portafolio-m7/
├── src/
│   ├── server.js          # Servidor principal, rutas y arranque
│   ├── db/
│   │   ├── pool.js        # pg Pool — consultas parametrizadas
│   │   └── sequelize.js   # Instancia Sequelize — ORM
│   ├── models/
│   │   └── index.js       # Modelos: Producto, Inventario, Venta, VentaItem
│   └── routes/
│       ├── productos.js   # GET, POST, PUT, DELETE /productos
│       └── ventas.js      # GET, POST /ventas (transacción TCL)
├── public/
│   ├── style.css          # Estilos — tema azul marino
│   └── index.html         # Catálogo, carrito, ventas y administración
├──scripts/
│   ├── solucion.sql      # Script adaptado para el M7 (usar este)
│   └── solucion_m5.sql   # Script original del Portafolio M5 (referencia)
├── .env                   # Credenciales (editar antes de iniciar)
├── .env.example           # Plantilla de variables de entorno
├── package.json
└── README.md
```
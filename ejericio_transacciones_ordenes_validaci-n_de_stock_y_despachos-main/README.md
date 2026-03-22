# Ejercicio — Transacciones con Node + pg: Órdenes de compra y stock

Sistema de órdenes de compra con transacciones PostgreSQL (BEGIN/COMMIT/ROLLBACK), validación de stock y despachos.

## ¿Qué hace este ejercicio?

Implementa un sistema de ventas con 6 tablas relacionadas y una transacción central que garantiza consistencia:

1. **Inserta la orden** con cliente y dirección
2. **Inserta el despacho** asociado a la orden
3. **Inserta los productos** en lista_productos
4. **Descuenta el stock** de cada producto
5. Si algún producto no tiene stock suficiente → **ROLLBACK** (nada se guarda)
6. Si todo es correcto → **COMMIT** (todo se guarda)

## ⚙️ Configuración

Edita el archivo `.env` con tus credenciales:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_contraseña_de_PostgreSQL
DB_NAME=Nombre_de_tu_BD
```

**¿Dónde encuentro estos datos?**
- `DB_PASSWORD` → es la contraseña que pusiste cuando instalaste PostgreSQL en tu equipo
- `DB_NAME` → es el nombre de la base de datos que creaste en pgAdmin, para este ejercicio: `modulo7`
- El resto de valores (`localhost`, `5432`, `postgres`) generalmente no cambian en una instalación local

## 📥 Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/nombre-del-repositorio.git
cd transacciones-ordenes
npm install
```

Luego edita el archivo `.env` con tus credenciales de PostgreSQL y ejecuta `npm start`.

## 🚀 Instalación y uso

```bash
npm install
npm start
```

Abre http://localhost:3000

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api?filtro=productos` | Lista todos los productos |
| GET | `/api?filtro=productos&id=X` | Producto por id |
| GET | `/api?filtro=productos&orden=X` | Productos de una orden |
| GET | `/api?filtro=ordenes&rut=X` | Órdenes por RUT de cliente |
| GET | `/api?filtro=clientes` | Lista todos los clientes |
| GET | `/api?filtro=clientes&rut=X` | Cliente por RUT |
| GET | `/api?filtro=direcciones&rut=X` | Direcciones por RUT |
| GET | `/api?filtro=despachos&orden=X` | Despacho por id de orden |
| POST | `/orden` | Crear orden (transacción completa) |

## Estructura

```
transacciones-ordenes/
├── server.js              # 9 endpoints + transacción POST /orden
├── .env                   # Credenciales (editar antes de iniciar)
├── package.json           # Dependencias del proyecto
├── README.md              # Instrucciones de instalación y uso
├── db/
│   └── pool.js            # Conexión a PostgreSQL
├── scripts/
│   └── tablas.sql         # Script SQL para crear tablas manualmente
└── public/
    ├── style.css          # Estilos compartidos
    ├── index.html         # Menú principal + tabla de endpoints
    ├── productos.html     # Lista de productos con stock en tiempo real
    ├── ordenes.html       # Órdenes por RUT con detalle de productos
    └── nueva-orden.html   # Crear orden con carrito y transacción
```

## Tablas

```
clientes       → rut (PK), nombre
direcciones    → id_direccion (PK), rut (FK), direccion
productos      → id_producto (PK), nombre, precio, existencias
orden          → id_orden (PK), rut (FK), id_direccion (FK), precio_total
lista_productos → id_lista (PK), id_orden (FK), id_producto (FK), cantidad_producto
despachos      → id_despacho (PK), id_orden (FK), id_direccion (FK)
```


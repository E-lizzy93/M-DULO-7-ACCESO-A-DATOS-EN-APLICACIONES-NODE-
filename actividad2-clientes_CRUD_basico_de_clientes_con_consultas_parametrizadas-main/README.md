# Actividad 2 — Consultas Parametrizadas (Módulo 7)

CRUD básico de clientes con consultas parametrizadas usando Node.js + pg + PostgreSQL.

## ⚙️ Configuración

Edita el archivo `.env` con tus credenciales:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_contraseña_de_PostgreSQL
DB_NAME=modulo7
```

**¿Dónde encuentro estos datos?**
- `DB_PASSWORD` → es la contraseña que pusiste cuando instalaste PostgreSQL en tu equipo
- `DB_NAME` → es el nombre de la base de datos que creaste en pgAdmin, para este ejercicio: `modulo7`
- El resto de valores (`localhost`, `5432`, `postgres`) generalmente no cambian en una instalación local

## 🚀 Instalación y uso

```bash
npm install
npm start
```

Abre http://localhost:3000

## Páginas

| Página | Descripción |
|--------|-------------|
| `/` | Menú principal |
| `/clientes.html` | Ver todos los clientes |
| `/crear.html` | Crear nuevo cliente |
| `/editar.html` | Modificar nombre de un cliente |
| `/eliminar.html` | Eliminar cliente por RUT |

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/clientes` | Retorna todos los clientes |
| POST | `/clientes` | Crear cliente (rut, nombre, edad obligatorios) |
| PUT | `/clientes/:rut` | Modificar nombre del cliente |
| DELETE | `/clientes/:rut` | Eliminar cliente por RUT |

## Estructura

```
actividad2-clientes/
├── server.js           # 4 endpoints: GET, POST, PUT, DELETE por RUT
├── .env                # Credenciales (editar antes de iniciar)
├── package.json        # Dependencias del proyecto
├── README.md           # Instrucciones de instalación y uso
├── db/
│   └── pool.js         # Conexión a PostgreSQL
└── public/
    ├── style.css       # Estilos compartidos
    ├── index.html      # Menú principal + tabla de endpoints
    ├── clientes.html   # GET → listado completo de clientes
    ├── crear.html      # POST → formulario con validaciones
    ├── editar.html     # PUT → modificar nombre por RUT
    └── eliminar.html   # DELETE → buscar por RUT, confirmar y eliminar
```
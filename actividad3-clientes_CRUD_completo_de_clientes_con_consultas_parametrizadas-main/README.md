# Actividad 3 — Consultas Parametrizadas (Módulo 7)

CRUD completo de clientes con consultas parametrizadas usando Node.js + pg + PostgreSQL.

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
| `/` | Menú principal con resumen de endpoints |
| `/ver.html` | Consultar clientes con filtros |
| `/crear.html` | Crear nuevo cliente |
| `/editar.html` | Modificar nombre de un cliente |
| `/eliminar.html` | Eliminar por RUT, edad o rango |

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/clientes` | Todos los clientes |
| GET | `/clientes?rut=X` | Buscar por RUT |
| GET | `/clientes?nombre=X` | Buscar por nombre (parcial) |
| GET | `/clientes?edad=X` | Buscar por edad exacta |
| GET | `/clientes?edadMin=X&edadMax=Y` | Buscar por rango de edad |
| POST | `/clientes` | Crear cliente (rut, nombre, edad) |
| PUT | `/clientes/:rut` | Modificar nombre |
| DELETE | `/clientes/:rut` | Eliminar por RUT |

## Estructura

```
actividad3-clientes/
├── server.js           # 8 endpoints: 5 GET con filtros, POST, PUT, DELETE por RUT
├── .env                # Credenciales (editar antes de iniciar)
├── package.json        # Dependencias del proyecto
├── README.md           # Instrucciones de instalación y uso
├── db/
│   └── pool.js         # Conexión a PostgreSQL
└── public/
    ├── style.css       # Estilos compartidos
    ├── index.html      # Menú principal + tabla de endpoints
    ├── ver.html        # GET → filtros por RUT, nombre, edad y rango
    ├── crear.html      # POST → formulario con validaciones
    ├── editar.html     # PUT → modificar nombre por RUT
    └── eliminar.html   # DELETE → buscar por RUT, confirmar y eliminar
```
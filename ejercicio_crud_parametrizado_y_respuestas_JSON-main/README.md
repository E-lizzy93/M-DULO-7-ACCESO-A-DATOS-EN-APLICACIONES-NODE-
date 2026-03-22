# Ejercicio — CRUD Parametrizado con Node + pg

CRUD completo de clientes usando Query Objects, respuestas JSON estandarizadas y validaciones.

## ¿Qué hace este ejercicio?

Este ejercicio implementa un CRUD de clientes con tres características principales:

**1. Query Objects obligatorios**
Todas las consultas SQL usan el formato recomendado por `pg`:
```js
{ text: 'SELECT * FROM clientes WHERE rut = $1', values: [rut] }
```
Esto previene inyección SQL y es más seguro que concatenar strings.

**2. Respuestas JSON estandarizadas**
Todas las respuestas siguen siempre el mismo formato:
- `{ ok: true, data: [...] }` → consultas exitosas
- `{ ok: true, rowCount: 1, mensaje: "..." }` → PUT y DELETE exitosos
- `{ ok: true, data: { rut, nombre, edad } }` → POST exitoso con HTTP 201
- `{ ok: false, mensaje: "..." }` → errores y sin resultados

**3. DELETE inteligente**
- Por RUT → elimina directo (el RUT es único)
- Por nombre o edad → verifica cuántos hay primero. Si hay más de 1 **rechaza** y pide refinar con el RUT. Solo elimina si hay exactamente 1 resultado.

## ⚙️ Configuración

Edita el archivo `.env` con tus credenciales:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_contraseña_de_PostgreSQL
DB_NAME=nombre_de_tu_bd

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

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/clientes` | Todos los clientes |
| GET | `/clientes?rut=X` | Por RUT |
| GET | `/clientes?nombre=X` | Por nombre (prefijo) |
| GET | `/clientes?edad=N` | Por edad |
| POST | `/clientes` | Crear cliente (rut, nombre, edad) |
| PUT | `/clientes/:rut` | Modificar nombre |
| DELETE | `/clientes?rut=X` | Eliminar por RUT |
| DELETE | `/clientes?nombre=X` | Eliminar por nombre (solo si hay 1) |
| DELETE | `/clientes?edad=N` | Eliminar por edad (solo si hay 1) |

## Estructura

```
ejercicio-crud-parametrizado/
├── server.js           # 9 endpoints con Query Objects y respuestas estandarizadas
├── .env                # Credenciales (editar antes de iniciar)
├── package.json        # Dependencias del proyecto
├── README.md           # Instrucciones de instalación y uso
├── db/
│   └── pool.js         # Conexión a PostgreSQL
└── public/
    ├── style.css       # Estilos compartidos
    ├── index.html      # Menú principal + tabla de endpoints
    ├── consultar.html  # GET → filtros por RUT, nombre y edad
    ├── crear.html      # POST → formulario con validaciones y respuesta 201
    ├── editar.html     # PUT → modificar nombre, muestra rowCount
    └── eliminar.html   # DELETE → por RUT, nombre o edad, muestra rowCount
```
## 📥 Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/nombre-del-repositorio.git
cd nombre-del-repositorio
npm install
```

Luego edita el archivo `.env` con tus credenciales de PostgreSQL y ejecuta `npm start`.

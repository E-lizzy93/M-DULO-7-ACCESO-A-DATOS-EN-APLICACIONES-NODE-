# Ejercicio — Aplicación Full Stack con Sequelize ORM

API REST con Node.js + Express + Sequelize conectada a PostgreSQL.

## ¿Qué hace este ejercicio?

Introduce **Sequelize**, un ORM (Object-Relational Mapper) que permite trabajar con la base de datos usando objetos JavaScript en vez de escribir SQL manual.

Diferencias clave respecto a los ejercicios anteriores con `pg`:
- No se escriben queries SQL — Sequelize las genera automáticamente
- Se define un **modelo** (`Cliente`) y Sequelize crea la tabla sola con `sync()`
- Usa `import/export` (ES Modules) en vez de `require`
- Incluye `cors` para permitir peticiones desde otros orígenes

## ⚙️ Configuración

### 1. Crear la base de datos en pgAdmin

- Abre pgAdmin → click derecho en **Bases de datos** → **Crear** → **Base de datos**
- Nombre: `clientes_db` → **Guardar**

> No es necesario crear tablas — Sequelize las crea automáticamente al iniciar.

### 2. Editar el archivo `.env`

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_contraseña_de_PostgreSQL
DB_NAME=clientes_db
```

**¿Dónde encuentro estos datos?**
- `DB_PASSWORD` → es la contraseña que pusiste cuando instalaste PostgreSQL en tu equipo
- `DB_NAME` → para este ejercicio: `clientes_db`
- El resto de valores (`localhost`, `5432`, `postgres`) generalmente no cambian en una instalación local

## 📥 Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/nombre-del-repositorio.git
cd sequelize-clientes
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
| GET | `/clientes` | Retorna todos los clientes |
| POST | `/clientes` | Crea un nuevo cliente (nombre, email) |

## 🔤 Función auxiliar: normalizar texto para emails

Los correos electrónicos no admiten acentos (á, é, í, ó, ú) ni la letra ñ en la parte local (antes del @). Por ejemplo, si el cliente se llama **Álvaro Núñez**, su email no puede ser `álvaro.núñez@email.com` — debe escribirse `alvaro.nunez@email.com`.

Para resolver esto se incluye la función `normalizarTexto()` en el frontend, que transforma automáticamente el nombre del cliente en un email válido como sugerencia.

**¿Cómo funciona paso a paso?**

```js
function normalizarTexto(texto) {
  return texto
    .normalize("NFD")                    // 1. Separa cada letra de su acento: á → a + ´
    .replace(/[\u0300-\u036f]/g, "")   // 2. Elimina los acentos sueltos
    .replace(/ñ/gi, "n")                 // 3. Reemplaza ñ y Ñ por n
    .toLowerCase()                       // 4. Convierte todo a minúsculas
    .trim();                             // 5. Elimina espacios al inicio y al final
}
```

**Ejemplo:**
```
"Álvaro Núñez"
  → normalize("NFD")        → "Álvaro Nũñez"
  → eliminar acentos        → "Alvaro Nunez"
  → reemplazar ñ            → "Alvaro Nunez"
  → toLowerCase()           → "alvaro nunez"
  → split + join con punto  → "alvaro.nunez@email.com"
```

Esta función usa métodos nativos de JavaScript (`normalize`, `replace`, `toLowerCase`) que no requieren ninguna librería externa.

## Estructura

```
sequelize-clientes/
├── server.js          # Servidor, modelo Sequelize y endpoints
├── .env               # Credenciales (editar antes de iniciar)
├── package.json       # Dependencias — incluye "type": "module" para ES Modules
├── README.md          # Instrucciones de instalación y uso
└── public/
    ├── style.css      # Estilos — tema verde minimalista
    └── index.html     # Formulario agregar + listado de clientes
```
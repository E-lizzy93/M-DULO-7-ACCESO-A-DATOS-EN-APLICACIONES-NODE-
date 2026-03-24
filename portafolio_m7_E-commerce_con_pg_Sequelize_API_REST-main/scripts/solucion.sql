-- =========================================================
-- Portafolio Módulo 7 — E-commerce
-- Solo tablas y datos necesarios para la API REST
-- Motor: PostgreSQL
-- =========================================================

-- ---------------------------------------------------------
-- Limpieza previa
-- ---------------------------------------------------------
DROP TABLE IF EXISTS orden_items CASCADE;
DROP TABLE IF EXISTS ordenes     CASCADE;
DROP TABLE IF EXISTS inventario  CASCADE;
DROP TABLE IF EXISTS productos   CASCADE;
DROP TABLE IF EXISTS usuarios    CASCADE;

-- ---------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------
CREATE TABLE usuarios (
    id_usuario  SERIAL PRIMARY KEY,
    nombre      TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    creado_en   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE productos (
    id_producto SERIAL PRIMARY KEY,
    nombre      TEXT NOT NULL,
    precio      NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
    activo      BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE inventario (
    id_producto INT PRIMARY KEY,
    stock       INT NOT NULL CHECK (stock >= 0),
    CONSTRAINT fk_inventario_producto
        FOREIGN KEY (id_producto)
        REFERENCES productos(id_producto)
        ON DELETE CASCADE
);

CREATE TABLE ordenes (
    id_orden    SERIAL PRIMARY KEY,
    id_usuario  INT NOT NULL,
    fecha       TIMESTAMP NOT NULL DEFAULT NOW(),
    total       NUMERIC(12,2) DEFAULT 0,
    CONSTRAINT fk_orden_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
);

CREATE TABLE orden_items (
    id_item          SERIAL PRIMARY KEY,
    id_orden         INT NOT NULL,
    id_producto      INT NOT NULL,
    cantidad         INT NOT NULL CHECK (cantidad > 0),
    precio_unitario  NUMERIC(10,2) NOT NULL,
    CONSTRAINT fk_item_orden
        FOREIGN KEY (id_orden)
        REFERENCES ordenes(id_orden)
        ON DELETE CASCADE,
    CONSTRAINT fk_item_producto
        FOREIGN KEY (id_producto)
        REFERENCES productos(id_producto)
);

-- ---------------------------------------------------------
-- Datos iniciales
-- ---------------------------------------------------------
INSERT INTO usuarios (nombre, email) VALUES
    ('Ana García',    'ana@demo.cl'),
    ('Luis Pérez',    'luis@demo.cl'),
    ('María Soto',    'maria@demo.cl'),
    ('Carlos Ruiz',   'carlos@demo.cl'),
    ('Elena Torres',  'elena@demo.cl');

INSERT INTO productos (nombre, precio, activo) VALUES
    ('Teclado mecánico',    45990, TRUE),
    ('Mouse gamer',         19990, TRUE),
    ('Monitor 24 pulgadas', 139990, TRUE),
    ('Audífonos bluetooth', 29990, TRUE),
    ('Webcam HD',           24990, TRUE),
    ('Hub USB-C',           17990, TRUE);

INSERT INTO inventario (id_producto, stock) VALUES
    (1, 12),
    (2, 4),
    (3, 6),
    (4, 3),
    (5, 10),
    (6, 5);

-- ---------------------------------------------------------
-- Órdenes de prueba
-- ---------------------------------------------------------
INSERT INTO ordenes (id_usuario, fecha, total) VALUES
    (1, '2024-11-10 10:30:00', 65980),
    (2, '2024-11-15 14:20:00', 139990),
    (3, '2024-12-01 09:15:00', 75970);

INSERT INTO orden_items (id_orden, id_producto, cantidad, precio_unitario) VALUES
    (1, 1, 1, 45990),
    (1, 2, 1, 19990),
    (2, 3, 1, 139990),
    (3, 2, 1, 19990),
    (3, 4, 1, 29990),
    (3, 6, 1, 17990),
    (3, 5, 1, 24990);

SELECT * FROM productos;
SELECT * FROM inventario;
SELECT * FROM ordenes;
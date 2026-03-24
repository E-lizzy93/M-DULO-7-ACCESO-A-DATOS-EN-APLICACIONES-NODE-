-- =========================================================
-- Ejercicio 08
-- Portafolio Módulo 5: Modelado y Consultas SQL (ER/DDL/DML)
-- Dominio: e-commerce
-- Motor objetivo: PostgreSQL
-- =========================================================

-- ---------------------------------------------------------
-- Limpieza previa
-- ---------------------------------------------------------
DROP TABLE IF EXISTS orden_items;
DROP TABLE IF EXISTS ordenes;
DROP TABLE IF EXISTS inventario;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS usuarios;

-- ---------------------------------------------------------
-- A) DDL — Creación de tablas
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
        ON UPDATE CASCADE
);

CREATE TABLE ordenes (
    id_orden    SERIAL PRIMARY KEY,
    id_usuario  INT NOT NULL,
    fecha       DATE NOT NULL,
    total       NUMERIC(12,2) DEFAULT 0 CHECK (total >= 0),
    CONSTRAINT fk_orden_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE orden_items (
    id_item          SERIAL PRIMARY KEY,
    id_orden         INT NOT NULL,
    id_producto      INT NOT NULL,
    cantidad         INT NOT NULL CHECK (cantidad > 0),
    precio_unitario  NUMERIC(10,2) NOT NULL CHECK (precio_unitario >= 0),
    CONSTRAINT fk_item_orden
        FOREIGN KEY (id_orden)
        REFERENCES ordenes(id_orden)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_item_producto
        FOREIGN KEY (id_producto)
        REFERENCES productos(id_producto)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- Índices mínimos sugeridos
CREATE INDEX idx_ordenes_fecha ON ordenes(fecha);
CREATE INDEX idx_ordenes_id_usuario ON ordenes(id_usuario);
CREATE INDEX idx_orden_items_id_orden ON orden_items(id_orden);
CREATE INDEX idx_orden_items_id_producto ON orden_items(id_producto);

-- ---------------------------------------------------------
-- B) DML — Poblamiento inicial
-- ---------------------------------------------------------
/* usuarios */
INSERT INTO usuarios (nombre, email, creado_en) VALUES
('Ana García', 'ana@demo.cl', '2022-01-10 09:15:00'),
('Luis Pérez', 'luis@demo.cl', '2022-03-02 11:20:00'),
('María Soto', 'maria@demo.cl', '2022-06-18 16:45:00'),
('Carlos Ruiz', 'carlos@demo.cl', '2022-09-01 08:05:00'),
('Elena Torres', 'elena@demo.cl', '2022-11-21 13:30:00');

/* productos */
INSERT INTO productos (nombre, precio, activo) VALUES
('Teclado mecánico', 45990.00, TRUE),
('Mouse gamer', 19990.00, TRUE),
('Monitor 24 pulgadas', 139990.00, TRUE),
('Audífonos bluetooth', 29990.00, TRUE),
('Webcam HD', 24990.00, TRUE),
('Hub USB-C', 17990.00, TRUE);

/* inventario */
INSERT INTO inventario (id_producto, stock) VALUES
(1, 12),
(2, 4),
(3, 6),
(4, 3),
(5, 10),
(6, 5);

/* ordenes */
INSERT INTO ordenes (id_usuario, fecha, total) VALUES
(1, '2022-12-05', 0),
(2, '2022-12-10', 0),
(1, '2022-12-15', 0),
(3, '2022-11-28', 0),
(4, '2022-07-19', 0),
(2, '2022-08-03', 0);

/* orden_items */
INSERT INTO orden_items (id_orden, id_producto, cantidad, precio_unitario) VALUES
(1, 1, 1, 45990.00),
(1, 2, 2, 19990.00),
(2, 3, 1, 139990.00),
(2, 5, 1, 24990.00),
(3, 2, 1, 19990.00),
(3, 4, 1, 29990.00),
(3, 6, 2, 17990.00),
(4, 5, 2, 24990.00),
(5, 1, 1, 45990.00),
(5, 3, 1, 139990.00),
(6, 6, 1, 17990.00),
(6, 2, 1, 19990.00);

-- Recalcular totales de órdenes a partir de sus ítems
UPDATE ordenes o
SET total = resumen.total_orden
FROM (
    SELECT id_orden, SUM(cantidad * precio_unitario) AS total_orden
    FROM orden_items
    GROUP BY id_orden
) AS resumen
WHERE o.id_orden = resumen.id_orden;

-- ---------------------------------------------------------
-- C) Consultas requeridas
-- ---------------------------------------------------------

-- 1. Oferta verano: actualizar precio -20%
UPDATE productos
SET precio = ROUND(precio * 0.80, 2);

-- 2. Stock crítico (<= 5 unidades)
SELECT p.id_producto, p.nombre, i.stock
FROM inventario i
JOIN productos p USING (id_producto)
WHERE i.stock <= 5
ORDER BY i.stock ASC, p.nombre;

-- 3. Simular compra (al menos 3 productos)
-- 3.1 Crear la orden
INSERT INTO ordenes (id_usuario, fecha, total)
VALUES (5, '2022-12-20', 0);

-- 3.2 Insertar ítems para la orden recién creada
-- Usamos currval porque estamos en la misma sesión después del INSERT anterior.
INSERT INTO orden_items (id_orden, id_producto, cantidad, precio_unitario)
VALUES
(currval(pg_get_serial_sequence('ordenes','id_orden')), 1, 1, (SELECT precio FROM productos WHERE id_producto = 1)),
(currval(pg_get_serial_sequence('ordenes','id_orden')), 4, 1, (SELECT precio FROM productos WHERE id_producto = 4)),
(currval(pg_get_serial_sequence('ordenes','id_orden')), 5, 2, (SELECT precio FROM productos WHERE id_producto = 5));

-- 3.3 Mostrar subtotal, IVA 19% y total con IVA de la orden recién creada
SELECT
    oi.id_orden,
    SUM(oi.cantidad * oi.precio_unitario) AS subtotal,
    ROUND(SUM(oi.cantidad * oi.precio_unitario) * 0.19, 2) AS iva,
    ROUND(SUM(oi.cantidad * oi.precio_unitario) * 1.19, 2) AS total_con_iva
FROM orden_items oi
WHERE oi.id_orden = currval(pg_get_serial_sequence('ordenes','id_orden'))
GROUP BY oi.id_orden;

-- 3.4 Actualizar total neto de la orden recién creada
UPDATE ordenes o
SET total = resumen.total_orden
FROM (
    SELECT id_orden, SUM(cantidad * precio_unitario) AS total_orden
    FROM orden_items
    WHERE id_orden = currval(pg_get_serial_sequence('ordenes','id_orden'))
    GROUP BY id_orden
) AS resumen
WHERE o.id_orden = resumen.id_orden;

-- 4. Total de ventas diciembre 2022 (neto)
SELECT SUM(oi.cantidad * oi.precio_unitario) AS total_neto
FROM ordenes o
JOIN orden_items oi ON oi.id_orden = o.id_orden
WHERE o.fecha BETWEEN '2022-12-01' AND '2022-12-31';

-- 5. Usuario con más compras en 2022 (por cantidad de órdenes)
WITH por_usuario AS (
    SELECT u.id_usuario, u.nombre, COUNT(*) AS cantidad_ordenes
    FROM ordenes o
    JOIN usuarios u ON u.id_usuario = o.id_usuario
    WHERE o.fecha BETWEEN '2022-01-01' AND '2022-12-31'
    GROUP BY u.id_usuario, u.nombre
)
SELECT *
FROM por_usuario
ORDER BY cantidad_ordenes DESC, nombre ASC
LIMIT 1;

-- 5.1 Opcional: detalle de órdenes del usuario con más compras en 2022
WITH top_usuario AS (
    SELECT o.id_usuario
    FROM ordenes o
    WHERE o.fecha BETWEEN '2022-01-01' AND '2022-12-31'
    GROUP BY o.id_usuario
    ORDER BY COUNT(*) DESC, o.id_usuario ASC
    LIMIT 1
)
SELECT
    u.nombre AS usuario,
    o.id_orden,
    o.fecha,
    p.nombre AS producto,
    oi.cantidad,
    oi.precio_unitario,
    (oi.cantidad * oi.precio_unitario) AS subtotal_linea
FROM top_usuario tu
JOIN usuarios u ON u.id_usuario = tu.id_usuario
JOIN ordenes o ON o.id_usuario = u.id_usuario
JOIN orden_items oi ON oi.id_orden = o.id_orden
JOIN productos p ON p.id_producto = oi.id_producto
WHERE o.fecha BETWEEN '2022-01-01' AND '2022-12-31'
ORDER BY o.fecha, o.id_orden, p.nombre;

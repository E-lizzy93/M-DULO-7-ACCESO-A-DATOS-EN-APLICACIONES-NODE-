-- =====================================================
-- Script SQL — Transacciones con Node + pg
-- Tablas: clientes_ordenes, direcciones, productos,
--         orden, lista_productos, despachos
-- =====================================================

DROP TABLE IF EXISTS despachos      CASCADE;
DROP TABLE IF EXISTS lista_productos CASCADE;
DROP TABLE IF EXISTS orden           CASCADE;
DROP TABLE IF EXISTS direcciones     CASCADE;
DROP TABLE IF EXISTS clientes_ordenes        CASCADE;
DROP TABLE IF EXISTS productos       CASCADE;

-- Clientes
CREATE TABLE clientes_ordenes (
  rut    VARCHAR(10)  PRIMARY KEY,
  nombre VARCHAR(50)  NOT NULL
);

-- Direcciones (un cliente puede tener varias)
CREATE TABLE direcciones (
  id_direccion SERIAL       PRIMARY KEY,
  rut          VARCHAR(10)  NOT NULL REFERENCES clientes_ordenes(rut),
  direccion    VARCHAR(200) NOT NULL
);

-- Productos
CREATE TABLE productos (
  id_producto  SERIAL       PRIMARY KEY,
  nombre       VARCHAR(200) NOT NULL,
  precio       INTEGER      NOT NULL,
  existencias  INTEGER      NOT NULL DEFAULT 0
);

-- Orden
CREATE TABLE orden (
  id_orden     SERIAL      PRIMARY KEY,
  rut          VARCHAR(10) NOT NULL REFERENCES clientes_ordenes(rut),
  id_direccion INTEGER     NOT NULL REFERENCES direcciones(id_direccion),
  precio_total INTEGER     NOT NULL DEFAULT 0
);

-- Lista de productos por orden
CREATE TABLE lista_productos (
  id_lista          SERIAL  PRIMARY KEY,
  id_orden          INTEGER NOT NULL REFERENCES orden(id_orden),
  id_producto       INTEGER NOT NULL REFERENCES productos(id_producto),
  cantidad_producto INTEGER NOT NULL
);

-- Despachos
CREATE TABLE despachos (
  id_despacho  SERIAL  PRIMARY KEY,
  id_orden     INTEGER NOT NULL REFERENCES orden(id_orden),
  id_direccion INTEGER NOT NULL REFERENCES direcciones(id_direccion)
);

-- =====================================================
-- Datos de prueba
-- =====================================================

INSERT INTO clientes_ordenes (rut, nombre) VALUES
  ('12345678-9', 'Ana González'),
  ('98765432-1', 'Luis Martínez'),
  ('11111111-1', 'Carmen López');

INSERT INTO direcciones (rut, direccion) VALUES
  ('12345678-9', 'Av. Providencia 1234, Santiago'),
  ('12345678-9', 'Calle Los Leones 567, Providencia'),
  ('98765432-1', 'Av. Las Condes 890, Las Condes'),
  ('11111111-1', 'Pasaje El Sol 123, Maipú');

INSERT INTO productos (nombre, precio, existencias) VALUES
  ('Notebook Lenovo IdeaPad',  450000, 10),
  ('Mouse Inalámbrico Logitech', 25000, 50),
  ('Teclado Mecánico Redragon',  45000, 30),
  ('Monitor Samsung 24"',       180000,  8),
  ('Audífonos Sony WH-1000XM4', 220000, 15),
  ('Webcam Logitech HD',         35000, 25),
  ('Disco SSD 1TB Samsung',      75000, 20),
  ('Hub USB-C 7 puertos',        18000, 40);

SELECT * FROM clientes_ordenes;
SELECT * FROM direcciones;
SELECT * FROM productos;
-- =====================================================
-- Script de creación y población de tablas
-- Actividad Node + pg — Módulo 7
-- =====================================================

-- Tabla finanzas_personales (usada por poolConfig / GET /finanzas)
DROP TABLE IF EXISTS finanzas_personales;
CREATE TABLE finanzas_personales (
  nombre         VARCHAR(50) PRIMARY KEY,
  me_debe        INTEGER DEFAULT 0,
  cuotas_cobrar  INTEGER DEFAULT 0,
  le_debo        INTEGER DEFAULT 0,
  cuotas_pagar   INTEGER DEFAULT 0
);

INSERT INTO finanzas_personales (nombre, me_debe, cuotas_cobrar, le_debo, cuotas_pagar) VALUES
  ('tía carmen',        0,     0, 5000,  1),
  ('papá',              0,     0, 15000, 3),
  ('nacho',             10000, 2, 7000,  1),
  ('almacén esquina',   0,     0, 13000, 2),
  ('vicios varios',     0,     0, 35000, 35),
  ('compañero trabajo', 50000, 5, 0,     0);

-- Tabla clientes (usada por poolString / GET /clientes)
DROP TABLE IF EXISTS clientes;
CREATE TABLE clientes (
  id       SERIAL PRIMARY KEY,
  nombre   VARCHAR(80)  NOT NULL,
  email    VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  ciudad   VARCHAR(50)
);

INSERT INTO clientes (nombre, email, telefono, ciudad) VALUES
  ('Ana González',    'ana.gonzalez@email.com',    '+56912345678', 'Santiago'),
  ('Luis Martínez',   'luis.martinez@email.com',   '+56923456789', 'Valparaíso'),
  ('Carmen López',    'carmen.lopez@email.com',    '+56934567890', 'Concepción'),
  ('Pedro Ramírez',   'pedro.ramirez@email.com',   '+56945678901', 'Santiago'),
  ('María Fernández', 'maria.fernandez@email.com', '+56956789012', 'La Serena');

SELECT * FROM finanzas_personales;
SELECT * FROM clientes;

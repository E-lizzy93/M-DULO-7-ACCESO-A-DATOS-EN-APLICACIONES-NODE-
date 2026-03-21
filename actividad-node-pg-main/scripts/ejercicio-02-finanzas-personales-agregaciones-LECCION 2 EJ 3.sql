-- =====================================================
-- Ejercicio 02 - Finanzas personales
-- Tema: funciones de agregación, subconsultas, updates e inserts
-- Motor pensado: PostgreSQL
-- =====================================================

-- -----------------------------------------------------
-- Datos base de la actividad
-- -----------------------------------------------------
DROP TABLE IF EXISTS finanzas_personales;

CREATE TABLE finanzas_personales (
    nombre VARCHAR(20) PRIMARY KEY,
    me_debe INTEGER,
    cuotas_cobrar INTEGER,
    le_debo INTEGER,
    cuotas_pagar INTEGER
);

INSERT INTO finanzas_personales (nombre, me_debe, cuotas_cobrar, le_debo, cuotas_pagar)
VALUES ('tía carmen', 0, 0, 5000, 1);

INSERT INTO finanzas_personales (nombre, me_debe, cuotas_cobrar, le_debo, cuotas_pagar)
VALUES ('papá', 0, 0, 15000, 3);

INSERT INTO finanzas_personales (nombre, me_debe, cuotas_cobrar, le_debo, cuotas_pagar)
VALUES ('nacho', 10000, 2, 7000, 1);

INSERT INTO finanzas_personales (nombre, me_debe, cuotas_cobrar, le_debo, cuotas_pagar)
VALUES ('almacén esquina', 0, 0, 13000, 2);

INSERT INTO finanzas_personales (nombre, me_debe, cuotas_cobrar, le_debo, cuotas_pagar)
VALUES ('vicios varios', 0, 0, 35000, 35);

INSERT INTO finanzas_personales (nombre, me_debe, cuotas_cobrar, le_debo, cuotas_pagar)
VALUES ('compañero trabajo', 50000, 5, 0, 0);

SELECT * FROM finanzas_personales;

-- =====================================================
-- 1) ¿A quién(es) le debe más dinero y cuánto?
-- =====================================================
SELECT nombre, le_debo
FROM finanzas_personales
WHERE le_debo = (
    SELECT MAX(le_debo)
    FROM finanzas_personales
);

-- Resultado esperado con estos datos:
-- vicios varios | 35000

-- =====================================================
-- 2) ¿Quién(es) le debe más dinero a usted y cuánto?
-- =====================================================
SELECT nombre, me_debe
FROM finanzas_personales
WHERE me_debe = (
    SELECT MAX(me_debe)
    FROM finanzas_personales
);

-- Resultado esperado:
-- compañero trabajo | 50000

-- =====================================================
-- 3) ¿Cuánto dinero debe en total?
-- =====================================================
SELECT SUM(le_debo) AS total_deuda
FROM finanzas_personales;

-- Resultado esperado:
-- 75000

-- =====================================================
-- 4) ¿Cuánto dinero debe en promedio?
-- =====================================================
SELECT AVG(le_debo) AS promedio_deuda
FROM finanzas_personales;

-- Resultado esperado:
-- 12500

-- Nota:
-- AVG considera todos los registros.
-- Como hay una fila con le_debo = 0, ese 0 participa en el promedio.

-- =====================================================
-- 5) Si no puede pagar más de una cuota al mes,
--    ¿cuántos meses demoraría en saldar su deuda?
-- =====================================================

-- Respuesta estándar:
-- sumar todas las cuotas pendientes
SELECT SUM(cuotas_pagar) AS meses_para_saldar
FROM finanzas_personales;

-- Resultado esperado:
-- 42

-- Respuesta experta:
-- si quieres contar solo registros donde realmente hay deuda
SELECT SUM(cuotas_pagar) AS meses_para_saldar
FROM finanzas_personales
WHERE le_debo > 0;

-- En estos datos da el mismo resultado: 42

-- =====================================================
-- 6) Si logra cobrar todo lo que le deben en un día y usa todo eso
--    para reducir su deuda:
--    a) ¿A cuánto ascendería la nueva deuda reducida?
--    b) ¿Cuánto tendría que pagar mensualmente para pagar lo que resta
--       en las cuotas ya acordadas?
-- =====================================================

-- a) Nueva deuda reducida = total que debe - total que le deben
SELECT
    SUM(le_debo) - SUM(me_debe) AS nueva_deuda_reducida
FROM finanzas_personales;

-- Resultado esperado:
-- 15000

-- b) Pago mensual promedio manteniendo la cantidad total de cuotas ya acordadas
SELECT
    ROUND((SUM(le_debo) - SUM(me_debe))::numeric / NULLIF(SUM(cuotas_pagar), 0), 2) AS pago_mensual_estimado
FROM finanzas_personales;

-- Resultado esperado aproximado:
-- 357.14

-- =====================================================
-- 7) Insertar el nuevo registro de la pareja
--    "Le debes 50 lucas y no te acordabas"
-- =====================================================
-- Para esta guía asumiremos que esa deuda queda pactada en 1 cuota.
INSERT INTO finanzas_personales (nombre, me_debe, cuotas_cobrar, le_debo, cuotas_pagar)
VALUES ('pareja', 0, 0, 50000, 1);

SELECT *
FROM finanzas_personales
ORDER BY nombre;

-- =====================================================
-- 8) Con este cambio, ¿de cuánto será la cuota a pagar este mes?
-- =====================================================
-- Cuota mensual actual = suma de (le_debo / cuotas_pagar)
-- solo para registros donde cuotas_pagar > 0
SELECT ROUND(SUM(le_debo::numeric / cuotas_pagar), 2) AS cuota_mes
FROM finanzas_personales
WHERE cuotas_pagar > 0;

-- Resultado esperado luego del INSERT de pareja:
-- 74500.00

-- Cálculo manual:
-- tía carmen      5000 / 1  = 5000
-- papá           15000 / 3  = 5000
-- nacho           7000 / 1  = 7000
-- almacén esquina13000 / 2  = 6500
-- vicios varios  35000 / 35 = 1000
-- pareja         50000 / 1  = 50000
-- Total = 74500

-- =====================================================
-- 9) Update: el almacén ahora permite pagar en 13 cuotas
-- =====================================================
UPDATE finanzas_personales
SET cuotas_pagar = 13
WHERE nombre = 'almacén esquina';

SELECT *
FROM finanzas_personales
WHERE nombre = 'almacén esquina';

-- =====================================================
-- 10) Ahora, ¿de cuánto será la cuota a pagar este mes?
-- =====================================================
SELECT ROUND(SUM(le_debo::numeric / cuotas_pagar), 2) AS cuota_mes
FROM finanzas_personales
WHERE cuotas_pagar > 0;

-- Resultado esperado luego del UPDATE:
-- 69000.00

-- Explicación del cambio:
-- antes el almacén aportaba 13000 / 2  = 6500 al mes
-- ahora aporta       13000 / 13 = 1000 al mes
-- la cuota mensual total baja en 5500

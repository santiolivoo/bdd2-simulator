# Niveles Implementados - Simulador BDD2

## Resumen
Se han implementado **14 niveles** organizados en **5 categorías (A-E)** extraídos de parciales reales de BDD2.

---

## CATEGORÍA A: CONSULTAS SQL DE AGREGACIÓN (GROUP BY & HAVING)

### Nivel A1: Control de Saldos
**Consigna:** Controle que la suma de movimientos de una caja coincida con su saldo. Muestre: Descripción, Suma Movimientos, Saldo y una columna 'Estado' que diga "COINCIDE" o "NO COINCIDE".

**Solución Cátedra:**
```sql
SELECT 
    C.Descripcion,
    SUM(M.Monto) AS SumaMovimientos,
    C.Saldo,
    CASE 
        WHEN SUM(M.Monto) = C.Saldo THEN 'COINCIDE'
        ELSE 'NO COINCIDE'
    END AS Estado
FROM CAJAS C
LEFT JOIN MOVIMIENTOS M ON C.CajaID = M.CajaID
GROUP BY C.CajaID, C.Descripcion, C.Saldo
```

**Elementos clave:**
- SUM() para sumar movimientos por caja
- GROUP BY con CajaID, Descripcion y Saldo
- CASE WHEN para generar la columna Estado
- LEFT JOIN para incluir cajas sin movimientos

---

### Nivel A2: Filtro Agregado por Provincia
**Consigna:** Obtenga para cada Provincia y Paciente, la cantidad de dispensas, siempre que la cantidad sea mayor a 2. Si no tiene provincia, mostrar "".

**Solución Cátedra:**
```sql
SELECT 
    COALESCE(PR.ProvinciaDesc, '') AS Provincia,
    P.Nombre,
    P.Apellido,
    COUNT(*) AS CantidadDispensas
FROM DISPENSAS D
INNER JOIN PACIENTES P ON D.PacienteID = P.PacienteID
LEFT JOIN PROVINCIAS PR ON P.ProvinciaID = PR.ProvinciaID
GROUP BY PR.ProvinciaDesc, P.PacienteID, P.Nombre, P.Apellido
HAVING COUNT(*) > 2
```

**Elementos clave:**
- COUNT(*) para contar dispensas
- GROUP BY por Provincia y Paciente
- HAVING COUNT(*) > 2 para filtrar agregados
- COALESCE para manejar provincias nulas

---

## CATEGORÍA B: DIVISIÓN EN SQL (UNIVERSALIDAD)

### Nivel B1: Conceptos en Todas las Cajas
**Consigna:** Consultar los Conceptos que tienen movimientos en todas las Cajas.

**Solución Cátedra:** Doble NOT EXISTS
```sql
SELECT * FROM CONCEPTOS C
WHERE NOT EXISTS (
    SELECT * FROM CAJAS B
    WHERE NOT EXISTS (
        SELECT * FROM MOVIMIENTOS M
        WHERE M.CajaID = B.CajaID AND M.ConceptoID = C.ConceptoID
    )
)
```

---

### Nivel B2: Clínicas Federales
**Consigna:** Obtener los nombres de las clínicas que han atendido a pacientes de todas las provincias (Salta y CABA).

**Solución Cátedra:** Doble NOT EXISTS
```sql
SELECT DISTINCT CL.ClinicaDesc
FROM CLINICAS CL
WHERE NOT EXISTS (
    SELECT * FROM PROVINCIAS PR
    WHERE PR.ProvinciaDesc IN ('Salta', 'CABA')
    AND NOT EXISTS (
        SELECT * FROM DISPENSAS D
        INNER JOIN PACIENTES P ON D.PacienteID = P.PacienteID
        WHERE D.ClinicaID = CL.ClinicaID
        AND P.ProvinciaID = PR.ProvinciaID
    )
)
```

**Dato de prueba:** Clínica Federal atiende pacientes de Salta (ID=3) y CABA (ID=4) ✓

---

### Nivel B3: Pacientes Completos
**Consigna:** Obtener nombres y apellidos de pacientes que han recibido dispensas de todas las monodrogas.

**Solución Cátedra:** Doble NOT EXISTS
```sql
SELECT P.Nombre, P.Apellido
FROM PACIENTES P
WHERE NOT EXISTS (
    SELECT DISTINCT MedMonodroga FROM MEDICAMENTOS M1
    WHERE NOT EXISTS (
        SELECT * FROM DISPENSAS D
        INNER JOIN MEDICAMENTOS M2 ON D.MedID = M2.MedID
        WHERE D.PacienteID = P.PacienteID
        AND M2.MedMonodroga = M1.MedMonodroga
    )
)
```

**Dato de prueba:** Paciente Juan (ID=1) recibe las 4 monodrogas: Ibuprofeno, Paracetamol, Amoxicilina, Ácido Acetilsalicílico ✓

---

## CATEGORÍA C: ÁLGEBRA RELACIONAL (MULTIPLE CHOICE)

### Nivel C1: División Simple (Álgebra)
**Consigna:** Indique el álgebra relacional para obtener los Pacientes que recibieron todas las Monodrogas.

**Opción Correcta:**
```
X1 = π PacienteID (Dispensas)
X2 = π PacienteID ((X1 × Monodrogas) - Dispensas)
R = X1 - X2
```

**Método de los 3 Pasos:**
1. Candidatos: Pacientes con al menos una dispensa
2. Descalificados: Pacientes que les falta alguna monodroga
3. Resultado: Candidatos - Descalificados

---

### Nivel C2: División de Clínicas (Álgebra)
**Consigna:** Álgebra relacional para obtener las Clínicas que atendieron pacientes de todas las provincias (Salta y CABA).

**Opción Correcta:** Método de 3 pasos con producto cartesiano, diferencia y resta final.

---

### Nivel C3: Consulta Compleja (Álgebra)
**Consigna:** Álgebra para: Nombres de pacientes, nombre de sus titulares (si no son titulares mostrar ""), y clínica donde se dispensó en Septiembre 2023.

**Elementos Clave:**
- **Renombramiento (ρ)** para self-join de Pacientes con Titulares
- **Selección (σ)** por rango de fechas (>= 01/09 AND <= 30/09)
- **LEFT JOIN** para titular opcional
- **Proyección (π)** con COALESCE para NULLs

---

## CATEGORÍA D: TRIGGERS (AUDITORÍA AVANZADA)

### Nivel D1: Update Simple (Trigger)
**Consigna:** Trigger para auditar UPDATE en Pacientes. Guardar PacienteID y operación 'UPD PACIENTE' en LOG.

**Solución Cátedra:**
```sql
CREATE TRIGGER trg_AuditoriaPacientes ON PACIENTES
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO LOG (ObjetoId, Operacion, FechaHora)
    SELECT PacienteID, 'UPD PACIENTE', GETDATE()
    FROM inserted;
END
```

**Validación Estricta:**
- ✓ SET NOCOUNT ON (obligatorio)
- ✓ FROM inserted (obligatorio)
- ✗ NO usar variables escalares (SELECT @id = ...)
- ✓ Operaciones de conjunto

---

### Nivel D2: Update con Valores Viejos/Nuevos
**Consigna:** Trigger al actualizar CONCEPTO: Guardar ConceptoID, "Texto Anterior" (viejo), "Texto Nuevo" (nuevo) y Fecha.

**Solución Cátedra:**
```sql
CREATE TRIGGER trg_AuditoriaConceptos ON CONCEPTOS
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO LOG_CONCEPTOS (ConceptoID, TextoAnterior, TextoNuevo, Fecha)
    SELECT 
        i.ConceptoID, 
        d.ConceptoDesc AS TextoAnterior,
        i.ConceptoDesc AS TextoNuevo,
        GETDATE()
    FROM inserted i
    INNER JOIN deleted d ON i.ConceptoID = d.ConceptoID;
END
```

**Validación Estricta:**
- ✓ SET NOCOUNT ON
- ✓ JOIN entre inserted (i) y deleted (d)
- ✓ d.ConceptoDesc (valor viejo de deleted)
- ✓ i.ConceptoDesc (valor nuevo de inserted)

---

## CATEGORÍA E: TEORÍA DE TRANSACCIONES

### Nivel E1: Lectura Fantasma
**Consigna:** Si debo obtener el MAX(ID) + 1 para insertar un nuevo registro y asegurar que nadie más use ese ID concurrentemente, ¿qué nivel de aislamiento usar?

**Respuesta Correcta:** **SERIALIZABLE**

**Justificación:**
- READ COMMITTED y REPEATABLE READ NO evitan lecturas fantasma
- SERIALIZABLE coloca **Range Locks** que impiden inserciones en el rango afectado

---

### Nivel E2: Integridad Maestro-Detalle
**Consigna:** Al insertar un REMITO y sus DETALLES, ¿qué mecanismo asegura que se graben todos o ninguno?

**Respuesta Correcta:** **Transacción Explícita (BEGIN TRANSACTION / COMMIT / ROLLBACK)**

**Justificación:**
```sql
BEGIN TRANSACTION
    INSERT INTO REMITOS (RemitoID, ...) VALUES (...)
    INSERT INTO DETALLES_REMITO (RemitoID, ...) VALUES (...)
    
    IF @@ERROR <> 0
        ROLLBACK
    ELSE
        COMMIT
```

- **Atomicidad:** Todo o nada
- Locks controlan concurrencia, NO atomicidad
- SERIALIZABLE controla aislamiento, NO atomicidad

---

## Datos de Prueba (Mock Data)

### Tablas principales:
- **PROVINCIAS:** Buenos Aires, Córdoba, Salta, CABA
- **CLÍNICAS:** Clínica Federal (atiende TODAS las provincias ✓), Sanatorio Allende, Hospital de Salta, Clínica CABA
- **MEDICAMENTOS/MONODROGAS:** Ibuprofeno, Paracetamol, Amoxicilina, Ácido Acetilsalicílico
- **PACIENTES:** Juan, María, Carlos, Ana, Pedro
- **DISPENSAS:** 
  - Clínica Federal atiende pacientes de Salta y CABA ✓
  - Paciente Juan recibe TODAS las 4 monodrogas ✓
  - Paciente Pedro tiene >2 dispensas ✓
- **CAJAS:** Caja Principal, Caja Chica, Caja Ahorro (todas con saldo 350)
- **CONCEPTOS:** Pago Proveedores (aparece en TODAS las cajas ✓), Cobro Clientes, Gastos Varios, Sueldos
- **LOG:** Para auditoría de triggers
- **LOG_CONCEPTOS:** Para auditoría con valores viejos/nuevos

---

## Interfaz de Usuario

### Sidebar con Acordeón:
- **Categoría A** (Agregación): 2 niveles
- **Categoría B** (División SQL): 3 niveles
- **Categoría C** (Álgebra Relacional): 3 niveles
- **Categoría D** (Triggers): 2 niveles
- **Categoría E** (Transacciones): 2 niveles

**Total: 14 niveles**

### Características:
- Categorías colapsables/expandibles
- Indicador visual del nivel activo (borde azul)
- Contador de niveles totales en footer (v2.0.0 - 14 Niveles)
- Estados expandidos por defecto para todas las categorías

---

## Validación Estricta

Todos los niveles implementan la **Solución de Cátedra** con validación estricta:

### SQL:
- ✓ Doble NOT EXISTS para división (NO COUNT)
- ✓ Comparación exacta de resultados (JSON stringified)
- ✓ Ordenamiento para comparación consistente

### Triggers:
- ✓ SET NOCOUNT ON obligatorio
- ✓ Uso de tablas virtuales (inserted/deleted)
- ✓ Operaciones de conjunto (NO variables escalares)
- ✓ JOIN entre inserted y deleted para valores viejos/nuevos

### Álgebra Relacional:
- ✓ Método de los 3 Pasos (Candidatos, Descalificados, Resultado)
- ✓ Uso correcto de operadores: π (proyección), σ (selección), × (producto), - (diferencia), ⋈ (join), ⟕ (left join), ρ (renombramiento)

### Transacciones:
- ✓ SERIALIZABLE para lecturas fantasma (Range Locks)
- ✓ BEGIN/COMMIT/ROLLBACK para atomicidad (NO locks, NO aislamiento)

---

## Próximos pasos sugeridos

1. ✅ **Implementar sistema de progreso:** Marcar niveles completados con CheckCircle
2. ✅ **Agregar timer:** Cronómetro por nivel (simulación de parcial real)
3. ✅ **Modo examen:** Bloquear explicaciones hasta finalizar
4. ✅ **Exportar resultados:** PDF con respuestas y correcciones
5. ✅ **Temas visuales:** Modo claro/oscuro

---

**Versión:** 2.0.0  
**Autor:** Cátedra BDD2  
**Fecha:** 2025-11-28

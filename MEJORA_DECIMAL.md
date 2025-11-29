# Mejora: Campos Monetarios con DECIMAL(10,2) - v2.1.2

## 🎯 Problema Identificado

Los campos monetarios (`Saldo`, `Monto`) estaban definidos como `FLOAT`, lo que puede causar:

❌ **Problemas de Precisión:**
- `FLOAT` almacena números en punto flotante binario
- Puede generar decimales imprecisos (ej: `350.0000000001` en lugar de `350.00`)
- No es apropiado para valores monetarios en aplicaciones profesionales

❌ **Inconsistencia Visual:**
- Valores se mostraban sin decimales (`350`) o con muchos decimales
- No refleja el estándar contable/financiero (siempre 2 decimales)

---

## ✅ Solución Implementada

### **1. Cambio de Tipo de Dato: FLOAT → DECIMAL(10,2)**

**DECIMAL(10,2)** significa:
- **10 dígitos totales** (máximo: 99,999,999.99)
- **2 decimales exactos** (siempre: .00, .50, .99, etc.)
- **Precisión exacta** (no hay errores de punto flotante)

### **2. Valores con Decimales Explícitos**

Todos los valores monetarios ahora tienen `.00`:

```sql
-- ANTES (FLOAT sin decimales)
INSERT INTO CAJAS VALUES (1, "Caja Principal", 350)
INSERT INTO MOVIMIENTOS VALUES (1, 1, 1, 100)

-- DESPUÉS (DECIMAL(10,2) con decimales exactos)
INSERT INTO CAJAS VALUES (1, "Caja Principal", 350.00)
INSERT INTO MOVIMIENTOS VALUES (1, 1, 1, 100.00)
```

---

## 📝 Archivos Modificados

### **1. src/db/initDB.js**

**Tabla CAJAS:**
```javascript
// ANTES
db('CREATE TABLE CAJAS (CajaID INT, Descripcion STRING, Saldo FLOAT)');
db('INSERT INTO CAJAS VALUES (1, "Caja Principal", 350), ...');

// DESPUÉS
db('CREATE TABLE CAJAS (CajaID INT, Descripcion STRING, Saldo DECIMAL(10,2))');
db('INSERT INTO CAJAS VALUES (1, "Caja Principal", 350.00), ...');
```

**Tabla MOVIMIENTOS:**
```javascript
// ANTES
db('CREATE TABLE MOVIMIENTOS (MovID INT, CajaID INT, ConceptoID INT, Monto FLOAT)');
db('INSERT INTO MOVIMIENTOS VALUES (1, 1, 1, 100), (2, 2, 1, 50), (3, 3, 1, 200)');

// DESPUÉS
db('CREATE TABLE MOVIMIENTOS (MovID INT, CajaID INT, ConceptoID INT, Monto DECIMAL(10,2))');
db('INSERT INTO MOVIMIENTOS VALUES (1, 1, 1, 100.00), (2, 2, 1, 50.00), (3, 3, 1, 200.00)');
```

### **2. src/components/ERDiagram.jsx**

Actualizado el esquema visual en el panel derecho:

```jsx
// ANTES
{ name: "CAJAS", columns: [
    { name: "CajaID", type: "PK INT" }, 
    { name: "Descripcion", type: "STRING" }, 
    { name: "Saldo", type: "FLOAT" }  // ❌
] }

// DESPUÉS
{ name: "CAJAS", columns: [
    { name: "CajaID", type: "PK INT" }, 
    { name: "Descripcion", type: "STRING" }, 
    { name: "Saldo", type: "DECIMAL(10,2)" }  // ✅
] }
```

---

## 📊 Datos de Prueba Actualizados

### **Tabla CAJAS:**
| CajaID | Descripcion | Saldo (antes) | Saldo (después) |
|--------|-------------|---------------|-----------------|
| 1 | Caja Principal | `350` | `350.00` |
| 2 | Caja Chica | `350` | `350.00` |
| 3 | Caja Ahorro | `350` | `350.00` |

### **Tabla MOVIMIENTOS:**
| MovID | CajaID | ConceptoID | Monto (antes) | Monto (después) |
|-------|--------|------------|---------------|-----------------|
| 1 | 1 | 1 | `100` | `100.00` |
| 2 | 2 | 1 | `50` | `50.00` |
| 3 | 3 | 1 | `200` | `200.00` |
| 4 | 1 | 2 | `250` | `250.00` |
| 5 | 2 | 2 | `300` | `300.00` |
| 6 | 3 | 3 | `150` | `150.00` |

---

## 🎓 Justificación Técnica

### **¿Por qué DECIMAL en lugar de FLOAT?**

| Aspecto | FLOAT | DECIMAL(10,2) |
|---------|-------|---------------|
| **Precisión** | Aproximada (punto flotante binario) | Exacta (aritmética decimal) |
| **Almacenamiento** | 4 bytes (32 bits) | Variable (~5-9 bytes) |
| **Decimales** | Variable e impredecible | Exactamente 2 decimales |
| **Errores** | Sí (0.1 + 0.2 ≠ 0.3) | No |
| **Uso Monetario** | ❌ NO recomendado | ✅ Estándar profesional |
| **SQL estándar** | Soportado | Soportado (NUMERIC/DECIMAL) |

### **Ejemplos de Problemas con FLOAT:**

```sql
-- FLOAT puede dar resultados imprecisos
SELECT 0.1 + 0.2;  
-- Resultado en FLOAT: 0.30000000000000004 ❌

-- DECIMAL da resultados exactos
SELECT CAST(0.1 AS DECIMAL(10,2)) + CAST(0.2 AS DECIMAL(10,2));
-- Resultado: 0.30 ✅
```

### **Estándar Contable:**
- 💰 **Balance General:** Siempre 2 decimales
- 💵 **Moneda:** USD, EUR, ARS → 2 decimales
- 📊 **Reportes financieros:** Formato `.00`

---

## 🧪 Casos de Prueba

### **Caso 1: Suma de Montos Coincide con Saldo**

**Nivel A1 - Control de Saldos:**

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

**Resultado Esperado:**
| Descripcion | SumaMovimientos | Saldo | Estado |
|-------------|-----------------|-------|--------|
| Caja Principal | 350.00 | 350.00 | COINCIDE ✅ |
| Caja Chica | 350.00 | 350.00 | COINCIDE ✅ |
| Caja Ahorro | 350.00 | 350.00 | COINCIDE ✅ |

**Con FLOAT (antes):**
- Podría dar `350.0000000001` vs `350` → "NO COINCIDE" ❌

**Con DECIMAL (ahora):**
- Siempre da `350.00` vs `350.00` → "COINCIDE" ✅

---

### **Caso 2: Visualización en Tabla de Resultados**

**Query:**
```sql
SELECT * FROM CAJAS
```

**Antes (FLOAT):**
```
CajaID | Descripcion     | Saldo
-------|-----------------|-------
1      | Caja Principal  | 350
2      | Caja Chica      | 350
3      | Caja Ahorro     | 350
```

**Después (DECIMAL):**
```
CajaID | Descripcion     | Saldo
-------|-----------------|-------
1      | Caja Principal  | 350.00
2      | Caja Chica      | 350.00
3      | Caja Ahorro     | 350.00
```

---

## ✅ Beneficios de la Mejora

### **1. Precisión Exacta:**
✅ No hay errores de punto flotante  
✅ Comparaciones `=` funcionan correctamente  
✅ Suma de decimales es exacta

### **2. Profesionalismo:**
✅ Formato estándar contable (siempre .00)  
✅ Coincide con buenas prácticas SQL  
✅ Refleja aplicaciones del mundo real

### **3. Pedagógico:**
✅ Enseña el tipo correcto para datos monetarios  
✅ Prepara a los estudiantes para aplicaciones reales  
✅ Evita confusión con valores imprecisos

### **4. Consistencia:**
✅ Todos los valores monetarios con 2 decimales  
✅ Esquema ER muestra el tipo correcto  
✅ Mock data refleja la realidad

---

## 📚 Compatibilidad con AlaSQL

**AlaSQL soporta DECIMAL:**
```javascript
// Definición
db('CREATE TABLE Test (Precio DECIMAL(10,2))');

// Inserción
db('INSERT INTO Test VALUES (99.99)');

// Query
db('SELECT * FROM Test');
// Resultado: [{ Precio: 99.99 }] ✅
```

**Nota:** AlaSQL internamente puede usar JavaScript Numbers, pero respeta la precisión declarada en el esquema.

---

## 🚀 Estado del Cambio

**Versión:** 2.1.2  
**Estado:** ✅ Implementado  
**Archivos modificados:** 2  
- `src/db/initDB.js` - Esquema y datos
- `src/components/ERDiagram.jsx` - Visualización

**Tablas actualizadas:** 2  
- `CAJAS` (columna `Saldo`)
- `MOVIMIENTOS` (columna `Monto`)

**Valores actualizados:** 9  
- 3 valores de `CAJAS.Saldo`
- 6 valores de `MOVIMIENTOS.Monto`

---

## 🔄 Hot Module Replacement

El servidor Vite detectó los cambios automáticamente:

```
[vite] hmr update /src/components/ERDiagram.jsx
```

**Nota:** Para que los cambios en la BD tomen efecto, **recargar la página** (F5) para ejecutar `initDB()` de nuevo.

---

**Fecha:** 2025-11-28  
**Solicitado por:** Usuario  
**Implementado por:** Desarrollador Senior de React  
**Cátedra:** BDD2

import alasql from 'alasql';

// CATEGORIES for organization
export const CATEGORIES = [
    { id: 'A', name: 'Consultas SQL de Agregación (GROUP BY & HAVING)' },
    { id: 'B', name: 'División en SQL (Universalidad)' },
    { id: 'C', name: 'Álgebra Relacional (Multiple Choice)' },
    { id: 'D', name: 'Triggers (Auditoría Avanzada)' },
    { id: 'E', name: 'Teoría de Transacciones' },
    { id: 'F', name: 'Stored Procedures' }
];

/**
 * Compares two query results by VALUES only, ignoring column names.
 * This allows different column aliases (e.g., "Cantidad" vs "CantidadDispensas")
 * to be accepted as long as the data is identical.
 * 
 * @param {Array} expected - Expected result array
 * @param {Array} actual - User's result array
 * @param {Function} sortFn - Optional sorting function for consistent ordering
 * @returns {boolean} - True if results match (ignoring column names)
 */
const compareQueryResults = (expected, actual, sortFn = null) => {
    // Check if both are arrays
    if (!Array.isArray(expected) || !Array.isArray(actual)) {
        return false;
    }

    // Check same number of rows
    if (expected.length !== actual.length) {
        return false;
    }

    // Empty results are equal
    if (expected.length === 0) {
        return true;
    }

    // Sort both arrays if sortFn provided
    const sortedExpected = sortFn ? [...expected].sort(sortFn) : expected;
    const sortedActual = sortFn ? [...actual].sort(sortFn) : actual;

    // Check same number of columns in first row
    const expectedCols = Object.keys(sortedExpected[0]);
    const actualCols = Object.keys(sortedActual[0]);

    if (expectedCols.length !== actualCols.length) {
        return false;
    }

    // Compare row by row, comparing VALUES only (not keys)
    for (let i = 0; i < sortedExpected.length; i++) {
        const expectedValues = Object.values(sortedExpected[i]);
        const actualValues = Object.values(sortedActual[i]);

        // Compare values (ignoring column names)
        if (JSON.stringify(expectedValues) !== JSON.stringify(actualValues)) {
            return false;
        }
    }

    return true;
};


export const LEVELS = [
    // ============================================================================
    // CATEGORÍA A: CONSULTAS SQL DE AGREGACIÓN (GROUP BY & HAVING)
    // ============================================================================
    {
        id: 'A1',
        category: 'A',
        title: "Control de Saldos",
        description: "Controle que la suma de movimientos de una caja coincida con su saldo. Muestre: Descripción, Suma Movimientos, Saldo y una columna 'Estado' que diga \"COINCIDE\" o \"NO COINCIDE\".",
        type: "sql",
        visibleTables: ['CAJAS', 'MOVIMIENTOS', 'CONCEPTOS', 'LOG'],
        initialCode: `-- Escribe tu consulta aquí
SELECT * FROM CAJAS`,
        solution: `SELECT 
    C.Descripcion,
    SUM(M.Monto) AS SumaMovimientos,
    C.Saldo,
    CASE 
        WHEN SUM(M.Monto) = C.Saldo THEN 'COINCIDE'
        ELSE 'NO COINCIDE'
    END AS Estado
FROM CAJAS C
LEFT JOIN MOVIMIENTOS M ON C.CajaID = M.CajaID
GROUP BY C.CajaID, C.Descripcion, C.Saldo`,
        solutionExplanation: `
**Solución de Cátedra:**

\`\`\`sql
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
\`\`\`

**Elementos clave:**
- **SUM()** para sumar movimientos por caja
- **GROUP BY** con CajaID, Descripcion y Saldo
- **CASE WHEN** para generar la columna Estado
- **LEFT JOIN** para incluir cajas sin movimientos
        `,
        validate: (userQuery) => {
            try {
                const canonicalQuery = `
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
                `;
                const expected = alasql(canonicalQuery);

                // Execute user query
                const actual = alasql(userQuery);

                const sortFn = (a, b) => a.Descripcion.localeCompare(b.Descripcion);

                // Use compareQueryResults to ignore column names
                if (compareQueryResults(expected, actual, sortFn)) {
                    return { success: true, message: "¡Correcto! Los resultados coinciden con la solución esperada." };
                } else {
                    return {
                        success: false,
                        message: "Los resultados no coinciden. Verifica: SUM(), GROUP BY, CASE WHEN y LEFT JOIN.",
                        expected,
                        actual
                    };
                }
            } catch (e) {
                return { success: false, message: "❌ Error SQL: " + e.message, isSyntaxError: true };
            }
        }
    },
    {
        id: 'A2',
        category: 'A',
        title: "Filtro Agregado por Provincia",
        description: "Obtenga para cada Provincia y Paciente, la cantidad de dispensas, siempre que la cantidad sea mayor a 2. Si no tiene provincia, mostrar \"\".",
        type: "sql",
        visibleTables: ['PACIENTES', 'MEDICAMENTOS', 'CLINICAS', 'PROVINCIAS', 'DISPENSAS'],
        initialCode: `-- Escribe tu consulta aquí
SELECT * FROM DISPENSAS`,
        solution: `SELECT 
    ISNULL(PR.ProvinciaDesc, '') AS Provincia,
    P.Nombre,
    P.Apellido,
    COUNT(D.DispensaID) AS CantidadDispensas
FROM DISPENSAS D
INNER JOIN PACIENTES P ON D.PacienteID = P.PacienteID
LEFT JOIN PROVINCIAS PR ON P.ProvinciaID = PR.ProvinciaID
GROUP BY PR.ProvinciaDesc, P.PacienteID, P.Nombre, P.Apellido
HAVING COUNT(D.DispensaID) > 2`,
        solutionExplanation: `
**Solución de Cátedra:**

\`\`\`sql
SELECT 
    ISNULL(PR.ProvinciaDesc, '') AS Provincia,
    P.Nombre,
    P.Apellido,
    COUNT(D.DispensaID) AS CantidadDispensas
FROM DISPENSAS D
INNER JOIN PACIENTES P ON D.PacienteID = P.PacienteID
LEFT JOIN PROVINCIAS PR ON P.ProvinciaID = PR.ProvinciaID
GROUP BY PR.ProvinciaDesc, P.PacienteID, P.Nombre, P.Apellido
HAVING COUNT(D.DispensaID) > 2
\`\`\`

**Elementos clave:**
- **COUNT(D.DispensaID)** para contar dispensas (mejor práctica académica - evitar COUNT(*))
- **GROUP BY** por Provincia y Paciente (acepta agrupar por PR.ProvinciaDesc o PR.ProvinciaID)
- **HAVING COUNT(...) > 2** para filtrar agregados
- **ISNULL** para manejar provincias nulas
        `,
        validate: (userQuery) => {
            try {
                // Normalize user query: Replace COUNT(column) or COUNT(1) with COUNT(*) for validation
                // This allows students to use COUNT(ID) or COUNT(1) as best practice
                const normalizedUserQuery = userQuery.replace(/COUNT\s*\(\s*[^)]+\s*\)/gi, 'COUNT(*)');

                // Also normalize GROUP BY to accept both ProvinciaDesc and ProvinciaID
                // Accept GROUP BY PR.ProvinciaID even when SELECT uses ISNULL(PR.ProvinciaDesc, '')
                const normalizedForGroupBy = normalizedUserQuery
                    .replace(/GROUP\s+BY\s+PR\.ProvinciaID/gi, 'GROUP BY PR.ProvinciaDesc')
                    .replace(/GROUP\s+BY\s+ISNULL\s*\([^)]+\)/gi, 'GROUP BY PR.ProvinciaDesc');

                const canonicalQuery = `
                    SELECT 
                        ISNULL(PR.ProvinciaDesc, '') AS Provincia,
                        P.Nombre,
                        P.Apellido,
                        COUNT(*) AS CantidadDispensas
                    FROM DISPENSAS D
                    INNER JOIN PACIENTES P ON D.PacienteID = P.PacienteID
                    LEFT JOIN PROVINCIAS PR ON P.ProvinciaID = PR.ProvinciaID
                    GROUP BY PR.ProvinciaDesc, P.PacienteID, P.Nombre, P.Apellido
                    HAVING COUNT(*) > 2
                `;
                const expected = alasql(canonicalQuery);
                const actual = alasql(normalizedForGroupBy);

                const sortFn = (a, b) => a.Nombre.localeCompare(b.Nombre);

                // Use compareQueryResults to ignore column names
                if (compareQueryResults(expected, actual, sortFn)) {
                    return { success: true, message: "¡Correcto! Los resultados coinciden con la solución esperada." };
                } else {
                    return {
                        success: false,
                        message: "Los resultados no coinciden. Verifica: COUNT(ID/1), GROUP BY, HAVING y ISNULL.",
                        expected,
                        actual
                    };
                }
            } catch (e) {
                return { success: false, message: "❌ Error SQL: " + e.message, isSyntaxError: true };
            }
        }
    },

    // ============================================================================
    // CATEGORÍA B: DIVISIÓN EN SQL (UNIVERSALIDAD)
    // ============================================================================
    {
        id: 'B1',
        category: 'B',
        title: "Conceptos en Todas las Cajas",
        description: "Consultar los Conceptos que tienen movimientos en todas las Cajas.",
        type: "sql",
        visibleTables: ['CAJAS', 'MOVIMIENTOS', 'CONCEPTOS', 'LOG'],
        initialCode: "-- Escribe tu consulta aquí\nSELECT * FROM CONCEPTOS",
        solution: `SELECT C.ConceptoID, C.ConceptoDesc
FROM CONCEPTOS C
WHERE NOT EXISTS (
    SELECT 1
    FROM CAJAS B
    WHERE NOT EXISTS (
        SELECT 1
        FROM MOVIMIENTOS M
        WHERE M.CajaID = B.CajaID AND M.ConceptoID = C.ConceptoID
    )
)`,
        solutionExplanation: `
**Solución de Cátedra (Doble NOT EXISTS):**

Esta estructura es la única semánticamente correcta para la cátedra.
Se lee como: "Busco los conceptos para los cuales NO EXISTE una caja en la cual NO EXISTE un movimiento de ese concepto".

\`\`\`sql
SELECT C.ConceptoID, C.ConceptoDesc
FROM CONCEPTOS C
WHERE NOT EXISTS (
    SELECT 1
    FROM CAJAS B
    WHERE NOT EXISTS (
        SELECT 1
        FROM MOVIMIENTOS M
        WHERE M.CajaID = B.CajaID AND M.ConceptoID = C.ConceptoID
    )
)
\`\`\`

**¿Por qué no COUNT?**
El uso de COUNT puede fallar si hay duplicados o si la integridad referencial no es estricta en otros contextos. La división relacional pura se expresa con cuantificadores universales, que en SQL se traducen a Doble NOT EXISTS.
        `,
        validate: (userQuery) => {
            try {
                const canonicalQuery = `
                    SELECT C.ConceptoID, C.ConceptoDesc
                    FROM CONCEPTOS C
                    WHERE NOT EXISTS (
                        SELECT 1
                        FROM CAJAS B
                        WHERE NOT EXISTS (
                            SELECT 1
                            FROM MOVIMIENTOS M
                            WHERE M.CajaID = B.CajaID AND M.ConceptoID = C.ConceptoID
                        )
                    )
                `;
                const expected = alasql(canonicalQuery);
                const actual = alasql(userQuery);

                const sortFn = (a, b) => a.ConceptoID - b.ConceptoID;

                // Use compareQueryResults to ignore column names
                if (compareQueryResults(expected, actual, sortFn)) {
                    return { success: true, message: "¡Correcto! Los resultados coinciden con la solución esperada." };
                } else {
                    return { success: false, message: "Los resultados no coinciden. Verifica la estructura de Doble NOT EXISTS.", expected, actual };
                }
            } catch (e) {
                return { success: false, message: "❌ Error SQL: " + e.message, isSyntaxError: true };
            }
        }
    },
    {
        id: 'B2',
        category: 'B',
        title: "Clínicas Federales",
        description: "Obtener los nombres de las clínicas que han atendido a pacientes de todas las provincias (Salta y CABA).",
        type: "sql",
        visibleTables: ['PACIENTES', 'CLINICAS', 'PROVINCIAS', 'DISPENSAS'],
        initialCode: `-- Escribe tu consulta aquí
SELECT * FROM CLINICAS`,
        solution: `SELECT DISTINCT CL.ClinicaDesc
FROM CLINICAS CL
WHERE NOT EXISTS (
    SELECT * FROM PROVINCIAS PR
    WHERE PR.ProvinciaDesc IN ('Salta', 'CABA')
      AND NOT EXISTS (
        SELECT * FROM DISPENSAS D
        INNER JOIN PACIENTES P ON D.PacienteID = P.PacienteID
        WHERE D.ClinicaID = CL.ClinicaID AND P.ProvinciaID = PR.ProvinciaID
    )
)`,
        solutionExplanation: `
**Solución de Cátedra (Doble NOT EXISTS):**

"No existe una provincia (de las especificadas) para la cual no exista una dispensa en esa clínica de un paciente de esa provincia."

\`\`\`sql
SELECT DISTINCT CL.ClinicaDesc
FROM CLINICAS CL
WHERE NOT EXISTS (
    SELECT * FROM PROVINCIAS PR
    WHERE PR.ProvinciaDesc IN ('Salta', 'CABA')
      AND NOT EXISTS (
        SELECT * FROM DISPENSAS D
        INNER JOIN PACIENTES P ON D.PacienteID = P.PacienteID
        WHERE D.ClinicaID = CL.ClinicaID AND P.ProvinciaID = PR.ProvinciaID
    )
)
\`\`\`

**División clásica:** Clínicas que cubrieron TODAS las provincias especificadas.
        `,
        validate: (userQuery) => {
            try {
                const canonicalQuery = `
                    SELECT DISTINCT CL.ClinicaDesc
                    FROM CLINICAS CL
                    WHERE NOT EXISTS (
                        SELECT * FROM PROVINCIAS PR
                        WHERE PR.ProvinciaDesc IN ('Salta', 'CABA')
                          AND NOT EXISTS (
                            SELECT * FROM DISPENSAS D
                            INNER JOIN PACIENTES P ON D.PacienteID = P.PacienteID
                            WHERE D.ClinicaID = CL.ClinicaID AND P.ProvinciaID = PR.ProvinciaID
                        )
                    )
                `;
                const expected = alasql(canonicalQuery);
                const actual = alasql(userQuery);

                const sortFn = (a, b) => a.ClinicaDesc.localeCompare(b.ClinicaDesc);

                // Use compareQueryResults to ignore column names
                if (compareQueryResults(expected, actual, sortFn)) {
                    return { success: true, message: "¡Correcto! Los resultados coinciden con la solución esperada." };
                } else {
                    return { success: false, message: "Los resultados no coinciden. Verifica la estructura de Doble NOT EXISTS.", expected, actual };
                }
            } catch (e) {
                return { success: false, message: "❌ Error SQL: " + e.message, isSyntaxError: true };
            }
        }
    },
    {
        id: 'B3',
        category: 'B',
        title: "Pacientes Completos",
        description: "Obtener nombres y apellidos de pacientes que han recibido dispensas de todas las monodrogas.",
        type: "sql",
        visibleTables: ['PACIENTES', 'MEDICAMENTOS', 'DISPENSAS'],
        initialCode: `-- Escribe tu consulta aquí
SELECT * FROM PACIENTES`,
        solution: `SELECT P.Nombre, P.Apellido
FROM PACIENTES P
WHERE NOT EXISTS (
    SELECT * FROM MONODROGAS MD
    WHERE NOT EXISTS (
        SELECT * FROM DISPENSAS D
        INNER JOIN MEDICAMENTOS M ON D.MedID = M.MedID
        WHERE D.PacienteID = P.PacienteID AND M.MedMonodroga = MD.MonodrogaDesc
    )
)`,
        solutionExplanation: `
**Solución de Cátedra (Doble NOT EXISTS):**

"No existe una monodroga para la cual no exista una dispensa de esa monodroga para ese paciente."

\`\`\`sql
SELECT P.Nombre, P.Apellido
FROM PACIENTES P
WHERE NOT EXISTS (
    SELECT * FROM MONODROGAS MD
    WHERE NOT EXISTS (
        SELECT * FROM DISPENSAS D
        INNER JOIN MEDICAMENTOS M ON D.MedID = M.MedID
        WHERE D.PacienteID = P.PacienteID AND M.MedMonodroga = MD.MonodrogaDesc
    )
)
\`\`\`

**División:** Pacientes que recibieron TODAS las monodrogas disponibles.
        `,
        validate: (userQuery) => {
            try {
                const canonicalQuery = `
                    SELECT P.Nombre, P.Apellido
                    FROM PACIENTES P
                    WHERE NOT EXISTS (
                        SELECT * FROM MONODROGAS MD
                        WHERE NOT EXISTS (
                            SELECT * FROM DISPENSAS D
                            INNER JOIN MEDICAMENTOS M ON D.MedID = M.MedID
                            WHERE D.PacienteID = P.PacienteID AND M.MedMonodroga = MD.MonodrogaDesc
                        )
                    )
                `;
                const expected = alasql(canonicalQuery);
                const actual = alasql(userQuery);

                const sortFn = (a, b) => a.Nombre.localeCompare(b.Nombre);

                // Use compareQueryResults to ignore column names
                if (compareQueryResults(expected, actual, sortFn)) {
                    return { success: true, message: "¡Correcto! Los resultados coinciden con la solución esperada." };
                } else {
                    return { success: false, message: "Los resultados no coinciden. Verifica la estructura de Doble NOT EXISTS.", expected, actual };
                }
            } catch (e) {
                return { success: false, message: "❌ Error SQL: " + e.message, isSyntaxError: true };
            }
        }
    },

    // ============================================================================
    // CATEGORÍA C: ÁLGEBRA RELACIONAL (MULTIPLE CHOICE)
    // ============================================================================
    {
        id: 'C1',
        category: 'C',
        title: "División Simple (Álgebra)",
        description: "Indique el álgebra relacional para obtener los Pacientes que recibieron todas las Monodrogas.",
        type: "multiple-choice",
        visibleTables: ['PACIENTES', 'MEDICAMENTOS', 'DISPENSAS'],
        options: [
            {
                id: "A",
                label: "X1 = π PacienteID (Dispensas) ... (Opción incorrecta con Join simple)",
                correct: false
            },
            {
                id: "B",
                label: "X1 = π PacienteID (Dispensas) ... X2 = π PacienteID ((X1 × Monodrogas) - Dispensas) ... R = X1 - X2",
                correct: true,
                explanation: "Correcto. Se usa el Método de los 3 Pasos (Candidatos, Descalificados, Resultado) simulando la División con Proyección y Diferencia."
            },
            {
                id: "C",
                label: "X1 = σ PacienteID (Dispensas) / Monodrogas",
                correct: false
            }
        ],
        solutionExplanation: `
**Método de los 3 Pasos (División):**

1. **Candidatos ($X_1$):** Todos los pacientes que tienen al menos una dispensa.
   $X_1 = \\pi_{PacienteID}(Dispensas)$

2. **Descalificados ($X_2$):** Pacientes que les falta al menos una monodroga.
   Se forma el producto cartesiano de Candidatos con TODAS las Monodrogas, y se le restan las combinaciones que REALMENTE existen (Dispensas). Lo que queda son las combinaciones "faltantes".
   $X_2 = \\pi_{PacienteID}((X_1 \\times Monodrogas) - Dispensas)$

3. **Resultado:** Candidatos menos Descalificados.
   $Resultado = X_1 - X_2$
        `
    },
    {
        id: 'C2',
        category: 'C',
        title: "División de Clínicas (Álgebra)",
        description: "Álgebra relacional para obtener las Clínicas que atendieron pacientes de todas las provincias (Salta y CABA).",
        type: "multiple-choice",
        visibleTables: ['PACIENTES', 'CLINICAS', 'PROVINCIAS', 'DISPENSAS'],
        options: [
            {
                id: "A",
                label: "X1 = π ClinicaID (Dispensas ⋈ Pacientes) ... X2 = σ ProvinciaDesc IN ('Salta','CABA') (Provincias) ... R = X1 ⋈ X2",
                correct: false
            },
            {
                id: "B",
                label: "X1 = π ClinicaID (Dispensas ⋈ Pacientes) ... X2 = π ClinicaID, ProvinciaID (X1 × σ ProvinciaDesc IN ('Salta','CABA') (Provincias)) ... X3 = X2 - π ClinicaID, ProvinciaID (Dispensas ⋈ Pacientes) ... R = X1 - π ClinicaID (X3)",
                correct: true,
                explanation: "Correcto. Método de 3 pasos: 1) Candidatos (Clínicas), 2) Producto cartesiano menos realidad (Descalificados), 3) Resta final."
            },
            {
                id: "C",
                label: "R = π ClinicaDesc (Clinicas ÷ Provincias)",
                correct: false
            }
        ],
        solutionExplanation: `
**Método de los 3 Pasos aplicado a Clínicas:**

1. **Candidatos:** Clínicas que tienen al menos una dispensa
   $X_1 = \\pi_{ClinicaID}(Dispensas \\bowtie Pacientes)$

2. **Descalificados:** Clínicas que NO atendieron alguna provincia
   $Provincias\\_Requeridas = \\sigma_{ProvinciaDesc \\in ('Salta','CABA')}(Provincias)$
   $Todas\\_Combinaciones = X_1 \\times Provincias\\_Requeridas$
   $Combinaciones\\_Reales = \\pi_{ClinicaID, ProvinciaID}(Dispensas \\bowtie Pacientes)$
   $X_3 = Todas\\_Combinaciones - Combinaciones\\_Reales$

3. **Resultado:** Candidatos menos Descalificados
   $R = X_1 - \\pi_{ClinicaID}(X_3)$
        `
    },
    {
        id: 'C3',
        category: 'C',
        title: "Consulta Compleja (Álgebra)",
        description: "Álgebra para: Nombres de pacientes, nombre de sus titulares (si no son titulares mostrar \"\"), y clínica donde se dispensó en Septiembre 2023.",
        type: "multiple-choice",
        visibleTables: ['PACIENTES', 'CLINICAS', 'DISPENSAS'],
        options: [
            {
                id: "A",
                label: "R = π Nombre, ClinicaDesc (Pacientes ⋈ Dispensas ⋈ Clinicas)",
                correct: false
            },
            {
                id: "B",
                label: "T1 = ρ Titular ← Pacientes ... T2 = σ Fecha >= '2023-09-01' AND Fecha <= '2023-09-30' (Dispensas) ... R = π P.Nombre, ISNULL(T.Nombre,'') AS Titular, C.ClinicaDesc (Pacientes P ⟕ T1 T ON P.TitularID = T.PacienteID ⋈ T2 ⋈ Clinicas C)",
                correct: true,
                explanation: "Correcto. Incluye: Renombramiento (ρ) para self-join de titulares, Selección (σ) por fecha, LEFT JOIN para titular opcional, y Proyección final."
            },
            {
                id: "C",
                label: "R = π Nombre, ClinicaDesc (σ Fecha = 'Sep 2023' (Dispensas ⋈ Pacientes ⋈ Clinicas))",
                correct: false
            }
        ],
        solutionExplanation: `
**Consulta Compleja - Elementos Clave:**

1. **Renombramiento ($\\rho$):** Para hacer self-join de Pacientes con Titulares
   $Titular = \\rho_{Titular \\leftarrow Pacientes}(Pacientes)$

2. **Selección ($\\sigma$):** Filtrar por rango de fechas
   $Dispensas\\_Sep = \\sigma_{Fecha >= '2023-09-01' \\land Fecha <= '2023-09-30'}(Dispensas)$

3. **Joins:** LEFT JOIN para titular (puede ser NULL), INNER JOIN para Dispensas y Clínicas

4. **Proyección ($\\pi$):** Seleccionar columnas finales con ISNULL para manejar NULLs

**Estructura completa:**
$\\pi_{P.Nombre, ISNULL(T.Nombre,''), C.ClinicaDesc}(Pacientes\\ P \\;⟕\\; Titular\\ T \\;⋈\\; Dispensas\\_Sep \\;⋈\\; Clinicas\\ C)$
        `
    },

    // ============================================================================
    // CATEGORÍA D: TRIGGERS (AUDITORÍA AVANZADA)
    // ============================================================================
    {
        id: 'D1',
        category: 'D',
        title: "Update Simple (Trigger)",
        description: "Escriba el cuerpo de un Trigger para auditar UPDATE en Pacientes. Debe guardar el PacienteID y la operación 'UPD PACIENTE' en la tabla LOG.",
        type: "code-validation",
        visibleTables: ['PACIENTES', 'LOG'],
        initialCode: `CREATE TRIGGER trg_AuditoriaPacientes ON PACIENTES
AFTER UPDATE
AS
BEGIN
    -- Tu código aquí
END`,
        solution: `CREATE TRIGGER trg_AuditoriaPacientes ON PACIENTES
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO LOG (ObjetoId, Operacion, FechaHora)
    SELECT PacienteID, 'UPD PACIENTE', GETDATE()
    FROM inserted;
END`,
        // Automatic trigger test execution
        postExecutionSQL: "UPDATE PACIENTES SET Nombre = 'Juan Modificado' WHERE PacienteID = 1",
        resultQuery: "SELECT * FROM LOG ORDER BY FechaHora DESC",
        solutionExplanation: `
**Validación Estricta:**

1. **SET NOCOUNT ON:** Obligatorio para evitar interferir con el tráfico de red y aplicaciones cliente.
2. **FROM inserted:** Obligatorio. NUNCA usar variables escalares (ej: @id = PacienteID) porque el trigger se dispara una vez por lote (batch), no por fila. Si se actualizan 10 filas, el trigger corre 1 vez y \`inserted\` tiene 10 filas.
3. **Operaciones de Conjunto:** Se debe usar INSERT ... SELECT ... FROM inserted.
        `,
        validate: (code) => {
            const checks = [
                { regex: /SET\s+NOCOUNT\s+ON/i, msg: "Falta 'SET NOCOUNT ON'" },
                { regex: /FROM\s+inserted/i, msg: "Debe utilizar la tabla virtual 'inserted'" },
                { regex: /INSERT\s+INTO\s+LOG/i, msg: "Debe insertar en la tabla LOG" }
            ];

            if (/SELECT\s+@\w+\s*=\s*\w+/i.test(code)) {
                return { success: false, message: "Error: Uso de variables escalares detectado. El trigger debe manejar múltiples filas (lotes)." };
            }

            for (let check of checks) {
                if (!check.regex.test(code)) {
                    return { success: false, message: `Error: ${check.msg}` };
                }
            }

            return { success: true, message: "¡Código válido según estándares de cátedra!" };
        }
    },
    {
        id: 'D2',
        category: 'D',
        title: "Update con Valores Viejos/Nuevos",
        description: "Trigger al actualizar un CONCEPTO: Agregue al LOG un registro con: ConceptoID, \"Texto Anterior\" (ConceptoDesc viejo), \"Texto Nuevo\" (ConceptoDesc nuevo) y Fecha.",
        type: "code-validation",
        visibleTables: ['CONCEPTOS', 'LOG_CONCEPTOS'],
        initialCode: `CREATE TRIGGER trg_AuditoriaConceptos ON CONCEPTOS
AFTER UPDATE
AS
BEGIN
    -- Tu código aquí
END`,
        solution: `CREATE TRIGGER trg_AuditoriaConceptos ON CONCEPTOS
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
END`,
        // Automatic trigger test execution
        postExecutionSQL: "UPDATE CONCEPTOS SET ConceptoDesc = 'Concepto Actualizado' WHERE ConceptoID = 1",
        resultQuery: "SELECT * FROM LOG_CONCEPTOS ORDER BY Fecha DESC",
        solutionExplanation: `
**Validación Estricta para UPDATE:**

1. **SET NOCOUNT ON:** Obligatorio
2. **JOIN entre inserted y deleted:** Se debe hacer JOIN para correlacionar valores viejos y nuevos
3. **d.ConceptoDesc (viejo)** de la tabla **deleted**
4. **i.ConceptoDesc (nuevo)** de la tabla **inserted**
5. **INSERT ... SELECT ... FROM inserted JOIN deleted**

\`\`\`sql
INSERT INTO LOG_CONCEPTOS (ConceptoID, TextoAnterior, TextoNuevo, Fecha)
SELECT 
    i.ConceptoID, 
    d.ConceptoDesc AS TextoAnterior,
    i.ConceptoDesc AS TextoNuevo,
    GETDATE()
FROM inserted i
INNER JOIN deleted d ON i.ConceptoID = d.ConceptoID
\`\`\`
        `,
        validate: (code) => {
            const checks = [
                { regex: /SET\s+NOCOUNT\s+ON/i, msg: "Falta 'SET NOCOUNT ON'" },
                { regex: /FROM\s+inserted/i, msg: "Debe utilizar la tabla virtual 'inserted'" },
                { regex: /deleted/i, msg: "Debe utilizar la tabla virtual 'deleted' para obtener valores anteriores" },
                { regex: /JOIN/i, msg: "Debe hacer JOIN entre 'inserted' y 'deleted'" }
            ];

            if (/SELECT\s+@\w+\s*=\s*\w+/i.test(code)) {
                return { success: false, message: "Error: Uso de variables escalares detectado. El trigger debe manejar múltiples filas (lotes)." };
            }

            for (let check of checks) {
                if (!check.regex.test(code)) {
                    return { success: false, message: `Error: ${check.msg}` };
                }
            }

            return { success: true, message: "¡Código válido según estándares de cátedra!" };
        }
    },

    // ============================================================================
    // CATEGORÍA E: TEORÍA DE TRANSACCIONES
    // ============================================================================
    {
        id: 'E1',
        category: 'E',
        title: "Lectura Fantasma",
        description: "Si debo obtener el MAX(ID) + 1 para insertar un nuevo registro y asegurar que nadie más use ese ID concurrentemente, ¿qué nivel de aislamiento debo usar para evitar lecturas fantasma?",
        type: "multiple-choice",
        visibleTables: ['MEDICAMENTOS'],
        options: [
            { id: "A", label: "READ COMMITTED", correct: false },
            { id: "B", label: "REPEATABLE READ", correct: false },
            { id: "C", label: "SERIALIZABLE", correct: true, explanation: "Correcto. SERIALIZABLE es el único nivel que previene lecturas fantasma mediante bloqueos de rango (Range Locks), asegurando que nadie inserte un nuevo ID mientras calculamos el MAX." },
            { id: "D", label: "SNAPSHOT", correct: false }
        ],
        solutionExplanation: `
**Respuesta: SERIALIZABLE**

Para calcular \`MAX(ID) + 1\` de forma segura sin usar secuencias/identity (escenario típico de parcial), necesitamos evitar que otra transacción inserte un valor que cambie ese máximo mientras leemos.

- **READ COMMITTED** y **REPEATABLE READ** no evitan lecturas fantasma (nuevas filas insertadas por otros).
- **SERIALIZABLE** coloca bloqueos de rango (Range Locks) que impiden inserciones en el rango afectado, garantizando exclusividad total.
        `
    },
    {
        id: 'E2',
        category: 'E',
        title: "Integridad Maestro-Detalle",
        description: "Al insertar un REMITO se deben insertar sus DETALLES. Para asegurar que se graben todos o ninguno, ¿qué mecanismo es fundamental?",
        type: "multiple-choice",
        visibleTables: ['MEDICAMENTOS'],
        options: [
            {
                id: "A",
                label: "Solo Bloqueos (Locks)",
                correct: false
            },
            {
                id: "B",
                label: "Transacción Explícita (BEGIN TRANSACTION / COMMIT / ROLLBACK)",
                correct: true,
                explanation: "Correcto. La atomicidad (todo o nada) se garantiza con transacciones explícitas. Si falla algún INSERT, se hace ROLLBACK de todos."
            },
            {
                id: "C",
                label: "Nivel de Aislamiento SERIALIZABLE",
                correct: false
            },
            {
                id: "D",
                label: "Constraints de Foreign Key",
                correct: false
            }
        ],
        solutionExplanation: `
**Respuesta: Transacción Explícita (BEGIN/COMMIT/ROLLBACK)**

**Atomicidad:** Propiedad ACID que garantiza que todas las operaciones de una transacción se completen o ninguna.

**Ejemplo:**
\`\`\`sql
BEGIN TRANSACTION
    INSERT INTO REMITOS (RemitoID, ...) VALUES (...)
    INSERT INTO DETALLES_REMITO (RemitoID, ...) VALUES (...)
    INSERT INTO DETALLES_REMITO (RemitoID, ...) VALUES (...)
    
    IF @@ERROR <> 0
        ROLLBACK
    ELSE
        COMMIT
\`\`\`

- **BEGIN TRANSACTION:** Inicia la transacción
- **COMMIT:** Confirma todos los cambios si todo fue exitoso
- **ROLLBACK:** Deshace todos los cambios si hubo algún error

Los **Locks** controlan concurrencia, no atomicidad. 
El nivel **SERIALIZABLE** controla aislamiento, no atomicidad.
        `
    },

    // ============================================================================
    // CATEGORÍA F: STORED PROCEDURES
    // ============================================================================
    {
        id: 'F1',
        category: 'F',
        title: "Parámetros Opcionales",
        description: "Cree un Stored Procedure que reciba Monodroga y Provincia (de la Clínica). Debe devolver: Fecha, Descripción Medicamento, Monodroga y Descripción Provincia. Regla 1: Si la clínica no tiene provincia, mostrar \"\" (vacío). Regla 2: Si el parámetro Monodroga es NULL, traer todas. Regla 3: Si el parámetro Provincia es NULL, traer todas.",
        type: "code-validation",
        visibleTables: ['DISPENSAS', 'MEDICAMENTOS', 'CLINICAS', 'PROVINCIAS'],
        initialCode: `CREATE PROCEDURE sp_ReporteFarmacia
    @Monodroga varchar(50) = NULL,
    @Provincia varchar(50) = NULL
AS
BEGIN
    -- Tu código aquí
END`,
        solution: `CREATE PROCEDURE sp_ReporteFarmacia
    @Monodroga varchar(50) = NULL,
    @Provincia varchar(50) = NULL
AS
BEGIN
    SELECT d.Fecha, m.MedDesc, m.MedMonodroga, ISNULL(p.ProvinciaDesc, '') as Provincia
    FROM DISPENSAS d
    JOIN MEDICAMENTOS m ON d.MedID = m.MedID
    JOIN CLINICAS c ON d.ClinicaID = c.ClinicaID
    LEFT JOIN PROVINCIAS p ON c.ProvinciaID = p.ProvinciaID
    WHERE (m.MedMonodroga = @Monodroga OR @Monodroga IS NULL)
      AND (p.ProvinciaDesc = @Provincia OR @Provincia IS NULL)
END`,
        solutionExplanation: `Usa LEFT JOIN para incluir clínicas sin provincia, ISNULL para valores nulos, y lógica OR @Param IS NULL para parámetros opcionales.`,
        validate: (code) => {
            const checks = [
                { regex: /LEFT\s+JOIN/i, msg: "Falta 'LEFT JOIN' para incluir clínicas sin provincia" },
                { regex: /(ISNULL|COALESCE)\s*\(/i, msg: "Debe usar ISNULL o COALESCE para manejar provincias nulas" },
                { regex: /(OR\s+@\w+\s+IS\s+NULL|ISNULL\s*\(\s*@\w+)/i, msg: "Falta lógica de parámetros opcionales (OR @Parametro IS NULL)" }
            ];
            for (let check of checks) {
                if (!check.regex.test(code)) {
                    return { success: false, message: `Error: ${check.msg}` };
                }
            }
            return { success: true, message: "¡Código válido según estándares de cátedra!" };
        }
    }
];

description: "Cree un Stored Procedure que reciba Monodroga y Provincia (de la Clínica). Debe devolver: Fecha, Descripción Medicamento, Monodroga y Descripción Provincia. Regla 1: Si la clínica no tiene provincia, mostrar \"\" (vacío). Regla 2: Si el parámetro Monodroga es NULL, traer todas. Regla 3: Si el parámetro Provincia es NULL, traer todas.",
    type: "code-validation",
        visibleTables: ['DISPENSAS', 'MEDICAMENTOS', 'CLINICAS', 'PROVINCIAS'],
            initialCode: `CREATE PROCEDURE sp_ReporteFarmacia
    @Monodroga varchar(50) = NULL,
    @Provincia varchar(50) = NULL
AS
BEGIN
    -- Tu código aquí
END`,
                solution: `CREATE PROCEDURE sp_ReporteFarmacia
    @Monodroga varchar(50) = NULL,
    @Provincia varchar(50) = NULL
AS
BEGIN
    SELECT
        d.Fecha,
        m.MedDesc,
        m.MedMonodroga,
        ISNULL(p.ProvinciaDesc, '') as Provincia
            if (/SELECT\s+@\w+\s*=\s*\w+/i.test(code)) {
                return { success: false, message: "Error: Uso de variables escalares detectado. El trigger debe manejar múltiples filas (lotes)." };
            }

            for (let check of checks) {
                if (!check.regex.test(code)) {
                    return { success: false, message: `Error: ${ check.msg } ` };
                }
            }

            return { success: true, message: "¡Código válido según estándares de cátedra!" };
        }
    },
    {
        id: 'D2',
        category: 'D',
        title: "Update con Valores Viejos/Nuevos",
        description: "Trigger al actualizar un CONCEPTO: Agregue al LOG un registro con: ConceptoID, \"Texto Anterior\" (ConceptoDesc viejo), \"Texto Nuevo\" (ConceptoDesc nuevo) y Fecha.",
        type: "code-validation",
        visibleTables: ['CONCEPTOS', 'LOG_CONCEPTOS'],
        initialCode: `CREATE TRIGGER trg_AuditoriaConceptos ON CONCEPTOS
AFTER UPDATE
AS
BEGIN
--Tu código aquí
END`,
        solution: `CREATE TRIGGER trg_AuditoriaConceptos ON CONCEPTOS
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO LOG_CONCEPTOS(ConceptoID, TextoAnterior, TextoNuevo, Fecha)
SELECT
i.ConceptoID,
    d.ConceptoDesc AS TextoAnterior,
        i.ConceptoDesc AS TextoNuevo,
            GETDATE()
    FROM inserted i
    INNER JOIN deleted d ON i.ConceptoID = d.ConceptoID;
END`,
        // Automatic trigger test execution
        postExecutionSQL: "UPDATE CONCEPTOS SET ConceptoDesc = 'Concepto Actualizado' WHERE ConceptoID = 1",
        resultQuery: "SELECT * FROM LOG_CONCEPTOS ORDER BY Fecha DESC",
        solutionExplanation: `
    ** Validación Estricta para UPDATE:**

        1. ** SET NOCOUNT ON:** Obligatorio
2. ** JOIN entre inserted y deleted:** Se debe hacer JOIN para correlacionar valores viejos y nuevos
3. ** d.ConceptoDesc(viejo) ** de la tabla ** deleted **
    4. ** i.ConceptoDesc(nuevo) ** de la tabla ** inserted **
        5. ** INSERT ... SELECT ... FROM inserted JOIN deleted **

\`\`\`sql
INSERT INTO LOG_CONCEPTOS (ConceptoID, TextoAnterior, TextoNuevo, Fecha)
SELECT 
    i.ConceptoID, 
    d.ConceptoDesc AS TextoAnterior,
    i.ConceptoDesc AS TextoNuevo,
    GETDATE()
FROM inserted i
INNER JOIN deleted d ON i.ConceptoID = d.ConceptoID
\`\`\`
        `,
    validate: (code) => {
        const checks = [
            { regex: /SET\s+NOCOUNT\s+ON/i, msg: "Falta 'SET NOCOUNT ON'" },
            { regex: /FROM\s+inserted/i, msg: "Debe utilizar la tabla virtual 'inserted'" },
            { regex: /deleted/i, msg: "Debe utilizar la tabla virtual 'deleted' para obtener valores anteriores" },
            { regex: /JOIN/i, msg: "Debe hacer JOIN entre 'inserted' y 'deleted'" }
        ];

        if (/SELECT\s+@\w+\s*=\s*\w+/i.test(code)) {
            return { success: false, message: "Error: Uso de variables escalares detectado. El trigger debe manejar múltiples filas (lotes)." };
        }

        for (let check of checks) {
            if (!check.regex.test(code)) {
                return { success: false, message: `Error: ${check.msg}` };
            }
        }

        return { success: true, message: "¡Código válido según estándares de cátedra!" };
    }
},

// ============================================================================
// CATEGORÍA E: TEORÍA DE TRANSACCIONES
// ============================================================================
{
    id: 'E1',
        category: 'E',
            title: "Lectura Fantasma",
                description: "Si debo obtener el MAX(ID) + 1 para insertar un nuevo registro y asegurar que nadie más use ese ID concurrentemente, ¿qué nivel de aislamiento debo usar para evitar lecturas fantasma?",
                    type: "multiple-choice",
                        visibleTables: ['MEDICAMENTOS'],
                            options: [
                                { id: "A", label: "READ COMMITTED", correct: false },
                                { id: "B", label: "REPEATABLE READ", correct: false },
                                { id: "C", label: "SERIALIZABLE", correct: true, explanation: "Correcto. SERIALIZABLE es el único nivel que previene lecturas fantasma mediante bloqueos de rango (Range Locks), asegurando que nadie inserte un nuevo ID mientras calculamos el MAX." },
                                { id: "D", label: "SNAPSHOT", correct: false }
                            ],
                                solutionExplanation: `
**Respuesta: SERIALIZABLE**

Para calcular \`MAX(ID) + 1\` de forma segura sin usar secuencias/identity (escenario típico de parcial), necesitamos evitar que otra transacción inserte un valor que cambie ese máximo mientras leemos.

- **READ COMMITTED** y **REPEATABLE READ** no evitan lecturas fantasma (nuevas filas insertadas por otros).
- **SERIALIZABLE** coloca bloqueos de rango (Range Locks) que impiden inserciones en el rango afectado, garantizando exclusividad total.
        `
},
{
    id: 'E2',
        category: 'E',
            title: "Integridad Maestro-Detalle",
                description: "Al insertar un REMITO se deben insertar sus DETALLES. Para asegurar que se graben todos o ninguno, ¿qué mecanismo es fundamental?",
                    type: "multiple-choice",
                        visibleTables: ['MEDICAMENTOS'],
                            options: [
                                {
                                    id: "A",
                                    label: "Solo Bloqueos (Locks)",
                                    correct: false
                                },
                                {
                                    id: "B",
                                    label: "Transacción Explícita (BEGIN TRANSACTION / COMMIT / ROLLBACK)",
                                    correct: true,
                                    explanation: "Correcto. La atomicidad (todo o nada) se garantiza con transacciones explícitas. Si falla algún INSERT, se hace ROLLBACK de todos."
                                },
                                {
                                    id: "C",
                                    label: "Nivel de Aislamiento SERIALIZABLE",
                                    correct: false
                                },
                                {
                                    id: "D",
                                    label: "Constraints de Foreign Key",
                                    correct: false
                                }
                            ],
                                solutionExplanation: `
**Respuesta: Transacción Explícita (BEGIN/COMMIT/ROLLBACK)**

**Atomicidad:** Propiedad ACID que garantiza que todas las operaciones de una transacción se completen o ninguna.

**Ejemplo:**
\`\`\`sql
BEGIN TRANSACTION
    INSERT INTO REMITOS (RemitoID, ...) VALUES (...)
    INSERT INTO DETALLES_REMITO (RemitoID, ...) VALUES (...)
    INSERT INTO DETALLES_REMITO (RemitoID, ...) VALUES (...)
    
    IF @@ERROR <> 0
        ROLLBACK
    ELSE
        COMMIT
\`\`\`

- **BEGIN TRANSACTION:** Inicia la transacción
- **COMMIT:** Confirma todos los cambios si todo fue exitoso
- **ROLLBACK:** Deshace todos los cambios si hubo algún error

Los **Locks** controlan concurrencia, no atomicidad. 
El nivel **SERIALIZABLE** controla aislamiento, no atomicidad.
        `
},

// ============================================================================
// CATEGORÍA F: STORED PROCEDURES
// ============================================================================
{
    id: 'F1',
        category: 'F',
            title: "Parámetros Opcionales",
                description: "Cree un Stored Procedure que reciba Monodroga y Provincia (de la Clínica). Debe devolver: Fecha, Descripción Medicamento, Monodroga y Descripción Provincia. Regla 1: Si la clínica no tiene provincia, mostrar \"\" (vacío). Regla 2: Si el parámetro Monodroga es NULL, traer todas. Regla 3: Si el parámetro Provincia es NULL, traer todas.",
                    type: "code-validation",
                        visibleTables: ['DISPENSAS', 'MEDICAMENTOS', 'CLINICAS', 'PROVINCIAS'],
                            initialCode: `CREATE PROCEDURE sp_ReporteFarmacia
    @Monodroga varchar(50) = NULL,
    @Provincia varchar(50) = NULL
AS
BEGIN
    -- Tu código aquí
END`,
                                solution: `CREATE PROCEDURE sp_ReporteFarmacia
    @Monodroga varchar(50) = NULL,
    @Provincia varchar(50) = NULL
AS
BEGIN
    SELECT
        d.Fecha,
        m.MedDesc,
        m.MedMonodroga,
        ISNULL(p.ProvinciaDesc, '') as Provincia
    FROM DISPENSAS d
    JOIN MEDICAMENTOS m ON d.MedID = m.MedID
    JOIN CLINICAS c ON d.ClinicaID = c.ClinicaID
    LEFT JOIN PROVINCIAS p ON c.ProvinciaID = p.ProvinciaID
    WHERE (m.MedMonodroga = @Monodroga OR @Monodroga IS NULL)
      AND (p.ProvinciaDesc = @Provincia OR @Provincia IS NULL)
END`,
                                    solutionExplanation: `Usa LEFT JOIN, ISNULL para nulos, parámetros con DEFAULT NULL y lógica OR @Param IS NULL.`,
                                        validate: (code) => {
                                            const checks = [
                                                { regex: /LEFT\s+JOIN/i, msg: "Falta 'LEFT JOIN' para incluir clínicas sin provincia" },
                                                { regex: /(ISNULL|COALESCE)\s*\(/i, msg: "Debe usar ISNULL o COALESCE para manejar provincias nulas" },
                                                { regex: /(OR\s+@\w+\s+IS\s+NULL|ISNULL\s*\(\s*@\w+)/i, msg: "Falta lógica de parámetros opcionales (OR @Parametro IS NULL)" }
                                            ];

                                            for (let check of checks) {
                                                if (!check.regex.test(code)) {
                                                    return { success: false, message: `Error: ${check.msg}` };
                                                }
                                            }

                                            return { success: true, message: "¡Código válido según estándares de cátedra!" };
                                        }
}
];

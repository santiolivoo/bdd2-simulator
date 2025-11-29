import alasql from 'alasql';

// CATEGORIES for organization
export const CATEGORIES = [
    { id: 'A', name: 'Consultas SQL de Agregación (GROUP BY & HAVING)' },
    { id: 'B', name: 'División en SQL (Universalidad)' },
    { id: 'C', name: 'Álgebra Relacional (Multiple Choice)' },
    { id: 'D', name: 'Triggers (Auditoría Avanzada)' },
    { id: 'E', name: 'Teoría de Transacciones' }
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
SELECT C.CajaID, C.Descripcion FROM CAJAS C`,
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
SELECT D.DispensaID FROM DISPENSAS D`,
        solution: `SELECT 
    ISNULL(PR.ProvinciaDesc, '') AS Provincia,
    P.Nombre,
    P.Apellido,
    COUNT(*) AS CantidadDispensas
FROM DISPENSAS D
INNER JOIN PACIENTES P ON D.PacienteID = P.PacienteID
LEFT JOIN PROVINCIAS PR ON P.ProvinciaID = PR.ProvinciaID
GROUP BY PR.ProvinciaDesc, P.PacienteID, P.Nombre, P.Apellido
HAVING COUNT(*) > 2`,
        solutionExplanation: `
**Solución de Cátedra:**

\`\`\`sql
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
\`\`\`

**Elementos clave:**
- **COUNT(*)** para contar dispensas
- **GROUP BY** por Provincia y Paciente
- **HAVING COUNT(*) > 2** para filtrar agregados
- **ISNULL** para manejar provincias nulas
        `,
        validate: (userQuery) => {
            try {
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
                const actual = alasql(userQuery);

                const sortFn = (a, b) => a.Nombre.localeCompare(b.Nombre);

                // Use compareQueryResults to ignore column names
                if (compareQueryResults(expected, actual, sortFn)) {
                    return { success: true, message: "¡Correcto! Los resultados coinciden con la solución esperada." };
                } else {
                    return {
                        success: false,
                        message: "Los resultados no coinciden. Verifica: COUNT(*), GROUP BY, HAVING y ISNULL.",
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
        initialCode: "-- Escribe tu consulta aquí\nSELECT C.ConceptoID, C.ConceptoDesc FROM CONCEPTOS C",
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

**Nota:** En los subconsultas usamos \`SELECT 1\` en lugar de \`SELECT *\` por eficiencia, ya que solo nos importa la existencia.
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
SELECT CL.ClinicaID, CL.ClinicaDesc FROM CLINICAS CL`,
        solution: `SELECT DISTINCT CL.ClinicaDesc
FROM CLINICAS CL
WHERE NOT EXISTS (
    SELECT 1
    FROM PROVINCIAS PR
    WHERE PR.ProvinciaDesc IN ('Salta', 'CABA')
      AND NOT EXISTS (
        SELECT 1
        FROM DISPENSAS D
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
    SELECT 1
    FROM PROVINCIAS PR
    WHERE PR.ProvinciaDesc IN ('Salta', 'CABA')
      AND NOT EXISTS (
        SELECT 1
        FROM DISPENSAS D
        INNER JOIN PACIENTES P ON D.PacienteID = P.PacienteID
        WHERE D.ClinicaID = CL.ClinicaID AND P.ProvinciaID = PR.ProvinciaID
    )
)
\`\`\`

**División clásica:** Clínicas que cubrieron TODAS las provincias especificadas.

**Nota:** Usamos \`SELECT 1\` en lugar de \`SELECT *\` en los EXISTS por eficiencia.
        `,
        validate: (userQuery) => {
            try {
                const canonicalQuery = `
                    SELECT DISTINCT CL.ClinicaDesc
                    FROM CLINICAS CL
                    WHERE NOT EXISTS (
                        SELECT 1
                        FROM PROVINCIAS PR
                        WHERE PR.ProvinciaDesc IN ('Salta', 'CABA')
                          AND NOT EXISTS (
                            SELECT 1
                            FROM DISPENSAS D
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
SELECT P.PacienteID, P.Nombre, P.Apellido FROM PACIENTES P`,
        solution: `SELECT P.Nombre, P.Apellido
FROM PACIENTES P
WHERE NOT EXISTS (
    SELECT 1
    FROM MONODROGAS MD
    WHERE NOT EXISTS (
        SELECT 1
        FROM DISPENSAS D
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
    SELECT 1
    FROM MONODROGAS MD
    WHERE NOT EXISTS (
        SELECT 1
        FROM DISPENSAS D
        INNER JOIN MEDICAMENTOS M ON D.MedID = M.MedID
        WHERE D.PacienteID = P.PacienteID AND M.MedMonodroga = MD.MonodrogaDesc
    )
)
\`\`\`

**División:** Pacientes que recibieron TODAS las monodrogas disponibles.

**Nota:** Usamos \`SELECT 1\` en lugar de \`SELECT *\` en los EXISTS por eficiencia.
        `,
        validate: (userQuery) => {
            try {
                const canonicalQuery = `
                    SELECT P.Nombre, P.Apellido
                    FROM PACIENTES P
                    WHERE NOT EXISTS (
                        SELECT 1
                        FROM MONODROGAS MD
                        WHERE NOT EXISTS (
                            SELECT 1
                            FROM DISPENSAS D
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

    // ======= CONTINÚA EN EL SIGUIENTE ARCHIVO (parte 2) =======
];

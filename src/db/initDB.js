import alasql from 'alasql';

export const initDB = () => {
    try {
        // Handle potential import quirks (Vite/Rollup sometimes wraps CommonJS)
        const db = alasql.default || alasql;

        // Reset database on reload to ensure clean state and avoid "already exists" errors
        db('DROP DATABASE IF EXISTS bdd2_sim');
        db('CREATE DATABASE bdd2_sim');
        db('USE bdd2_sim');

        // 1. PROVINCIAS (including Salta and CABA for "all provinces" exercises)
        db('CREATE TABLE PROVINCIAS (ProvinciaID INT, ProvinciaDesc STRING)');
        db('INSERT INTO PROVINCIAS VALUES (1, "Buenos Aires"), (2, "Cordoba"), (3, "Salta"), (4, "CABA")');

        // 2. CLINICAS
        db('CREATE TABLE CLINICAS (ClinicaID INT, ClinicaDesc STRING, ProvinciaID INT)');
        db('INSERT INTO CLINICAS VALUES (1, "Clinica Federal", 1), (2, "Sanatorio Allende", 2), (3, "Hospital de Salta", 3), (4, "Clinica CABA", 4)');

        // 3. MEDICAMENTOS
        db('CREATE TABLE MEDICAMENTOS (MedID INT, MedDesc STRING, MedMonodroga STRING)');
        db('INSERT INTO MEDICAMENTOS VALUES (1, "Ibuprofeno 600", "Ibuprofeno"), (2, "Paracetamol 500", "Paracetamol"), (3, "Amoxidal", "Amoxicilina"), (4, "Aspirina", "Acido Acetilsalicilico")');

        // 3b. MONODROGAS (for division exercises - distinct table)
        db('CREATE TABLE MONODROGAS (MonodrogaID INT, MonodrogaDesc STRING)');
        db('INSERT INTO MONODROGAS VALUES (1, "Ibuprofeno"), (2, "Paracetamol"), (3, "Amoxicilina"), (4, "Acido Acetilsalicilico")');

        // 4. PACIENTES (covering all provinces)
        db('CREATE TABLE PACIENTES (PacienteID INT, Nombre STRING, Apellido STRING, ProvinciaID INT, TitularID INT)');
        db('INSERT INTO PACIENTES VALUES (1, "Juan", "Perez", 1, 1), (2, "Maria", "Gomez", 2, 2), (3, "Carlos", "Lopez", 3, 3), (4, "Ana", "Martinez", 4, 4), (5, "Pedro", "Garcia", 1, 5)');

        // 5. DISPENSAS
        // CLAVE: Clinica Federal (ID=1) atiende pacientes de TODAS las provincias incluyendo Salta (3) y CABA (4)
        // Paciente Juan (ID=1) recibe TODAS las 4 monodrogas
        db('CREATE TABLE DISPENSAS (DispensaID INT, PacienteID INT, MedID INT, ClinicaID INT, Fecha DATE)');

        // Clinica Federal atiende pacientes de TODAS las provincias (BA=1, Cordoba=2, Salta=3, CABA=4)
        db('INSERT INTO DISPENSAS VALUES (1, 1, 1, 1, "2023-09-10")'); // Juan (BA) - Ibuprofeno - Clinica Federal
        db('INSERT INTO DISPENSAS VALUES (2, 2, 2, 1, "2023-09-15")'); // Maria (Cordoba) - Paracetamol - Clinica Federal
        db('INSERT INTO DISPENSAS VALUES (3, 3, 3, 1, "2023-09-20")'); // Carlos (Salta) - Amoxicilina - Clinica Federal ✓ SALTA
        db('INSERT INTO DISPENSAS VALUES (4, 4, 4, 1, "2023-09-25")'); // Ana (CABA) - Aspirina - Clinica Federal ✓ CABA

        // Paciente Juan (ID=1) recibe TODAS las 4 monodrogas (para ejercicio B3: Pacientes Completos)
        db('INSERT INTO DISPENSAS VALUES (5, 1, 2, 1, "2023-09-12")'); // Juan - Paracetamol
        db('INSERT INTO DISPENSAS VALUES (6, 1, 3, 1, "2023-09-14")'); // Juan - Amoxicilina
        db('INSERT INTO DISPENSAS VALUES (7, 1, 4, 1, "2023-09-16")'); // Juan - Aspirina

        // Paciente Pedro (ID=5) tiene >2 dispensas (para ejercicio A2: Filtro Agregado)
        db('INSERT INTO DISPENSAS VALUES (8, 5, 1, 2, "2023-01-10")');
        db('INSERT INTO DISPENSAS VALUES (9, 5, 2, 2, "2023-02-15")');
        db('INSERT INTO DISPENSAS VALUES (10, 5, 3, 2, "2023-03-20")');

        // 6. CAJAS, MOVIMIENTOS, CONCEPTOS (For division and aggregation exercises)
        // Using NUMBER type and integer values to avoid floating-point comparison issues
        db('CREATE TABLE CAJAS (CajaID INT, Descripcion STRING, Saldo NUMBER)');
        db('INSERT INTO CAJAS VALUES (1, "Caja Principal", 350), (2, "Caja Chica", 350), (3, "Caja Ahorro", 350)');

        db('CREATE TABLE CONCEPTOS (ConceptoID INT, ConceptoDesc STRING)');
        db('INSERT INTO CONCEPTOS VALUES (1, "Pago Proveedores"), (2, "Cobro Clientes"), (3, "Gastos Varios"), (4, "Sueldos")');

        db('CREATE TABLE MOVIMIENTOS (MovID INT, CajaID INT, ConceptoID INT, Monto NUMBER)');
        // Concepto 1 appears in ALL boxes (1, 2, 3) -> Should be returned by division. Sum = 350
        db('INSERT INTO MOVIMIENTOS VALUES (1, 1, 1, 100), (2, 2, 1, 50), (3, 3, 1, 200)');
        // Concepto 2 appears only in box 1 and 2. Total box 1 = 250 more, box 2 = 300 more
        db('INSERT INTO MOVIMIENTOS VALUES (4, 1, 2, 250), (5, 2, 2, 300)');
        // Concepto 3 appears only in box 3. Total box 3 = 150 more
        db('INSERT INTO MOVIMIENTOS VALUES (6, 3, 3, 150)');

        // 7. LOG (for trigger D1)
        db('CREATE TABLE LOG (ObjetoId INT, Operacion STRING, FechaHora DATETIME)');

        // 8. LOG_CONCEPTOS (for trigger D2 - old/new values)
        db('CREATE TABLE LOG_CONCEPTOS (ConceptoID INT, TextoAnterior STRING, TextoNuevo STRING, Fecha DATETIME)');

        console.log("Database initialized successfully with expanded mock data");
    } catch (e) {
        console.error("Error initializing database:", e);
        throw e;
    }
};

export const runQuery = (query) => {
    try {
        const db = alasql.default || alasql;
        const result = db(query);
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

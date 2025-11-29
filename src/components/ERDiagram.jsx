import React from 'react';
import { Table } from 'lucide-react';

const TableSchema = ({ name, columns }) => (
    <div className="mb-6 bg-gray-900 rounded-lg border border-gray-700 overflow-hidden shadow-sm">
        <div className="bg-gray-800 px-3 py-2 border-b border-gray-700 flex items-center gap-2">
            <Table size={14} className="text-blue-400" />
            <span className="font-mono text-sm font-bold text-gray-200">{name}</span>
        </div>
        <div className="p-2">
            {columns.map((col, idx) => (
                <div key={idx} className="flex justify-between items-center py-1 border-b border-gray-800 last:border-0">
                    <span className="text-xs font-mono text-gray-400">{col.name}</span>
                    <span className="text-[10px] text-gray-600 uppercase">{col.type}</span>
                </div>
            ))}
        </div>
    </div>
);

export const ERDiagram = ({ currentLevel }) => {
    // Define all available tables
    const allTables = [
        { name: "PROVINCIAS", columns: [{ name: "ProvinciaID", type: "PK INT" }, { name: "ProvinciaDesc", type: "STRING" }] },
        { name: "CLINICAS", columns: [{ name: "ClinicaID", type: "PK INT" }, { name: "ClinicaDesc", type: "STRING" }, { name: "ProvinciaID", type: "FK INT" }] },
        { name: "MEDICAMENTOS", columns: [{ name: "MedID", type: "PK INT" }, { name: "MedDesc", type: "STRING" }, { name: "MedMonodroga", type: "STRING" }] },
        { name: "PACIENTES", columns: [{ name: "PacienteID", type: "PK INT" }, { name: "Nombre", type: "STRING" }, { name: "Apellido", type: "STRING" }, { name: "ProvinciaID", type: "FK INT" }, { name: "TitularID", type: "FK INT" }] },
        { name: "DISPENSAS", columns: [{ name: "DispensaID", type: "PK INT" }, { name: "PacienteID", type: "FK INT" }, { name: "MedID", type: "FK INT" }, { name: "ClinicaID", type: "FK INT" }, { name: "Fecha", type: "DATE" }] },
        { name: "CAJAS", columns: [{ name: "CajaID", type: "PK INT" }, { name: "Descripcion", type: "STRING" }, { name: "Saldo", type: "NUMBER" }] },
        { name: "CONCEPTOS", columns: [{ name: "ConceptoID", type: "PK INT" }, { name: "ConceptoDesc", type: "STRING" }] },
        { name: "MOVIMIENTOS", columns: [{ name: "MovID", type: "PK INT" }, { name: "CajaID", type: "FK INT" }, { name: "ConceptoID", type: "FK INT" }, { name: "Monto", type: "NUMBER" }] },
        { name: "LOG", columns: [{ name: "ObjetoId", type: "INT" }, { name: "Operacion", type: "STRING" }, { name: "FechaHora", type: "DATETIME" }] },
        { name: "LOG_CONCEPTOS", columns: [{ name: "ConceptoID", type: "INT" }, { name: "TextoAnterior", type: "STRING" }, { name: "TextoNuevo", type: "STRING" }, { name: "Fecha", type: "DATETIME" }] },
    ];

    // Filter tables based on current level's visibleTables property
    const visibleTableNames = currentLevel?.visibleTables || [];
    const filteredTables = allTables.filter(table => visibleTableNames.includes(table.name));

    // Fallback: if no visibleTables defined, show all (backwards compatibility)
    const tablesToShow = filteredTables.length > 0 ? filteredTables : allTables;

    return (
        <div className="space-y-2">
            {tablesToShow.length > 0 ? (
                tablesToShow.map(t => <TableSchema key={t.name} {...t} />)
            ) : (
                <div className="text-gray-500 text-sm p-4 text-center">
                    No hay tablas configuradas para este nivel.
                </div>
            )}
        </div>
    );
};

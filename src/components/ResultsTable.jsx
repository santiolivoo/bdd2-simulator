import React from 'react';

export const ResultsTable = ({ data, error }) => {
    if (error) {
        return (
            <div className="p-4 text-red-400 bg-red-900/20 border border-red-900/50 rounded-md font-mono text-sm">
                Error: {error}
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="p-4 text-gray-500 italic text-center">
                Sin resultados para mostrar.
            </div>
        );
    }

    const columns = Object.keys(data[0]);

    return (
        <div className="overflow-x-auto border border-gray-700 rounded-md">
            <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-800">
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col}
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                            >
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-800">
                    {data.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-800/50 transition-colors">
                            {columns.map((col) => (
                                <td key={col} className="px-4 py-2 whitespace-nowrap text-sm text-gray-300 font-mono">
                                    {row[col] !== null ? String(row[col]) : <span className="text-gray-600">NULL</span>}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

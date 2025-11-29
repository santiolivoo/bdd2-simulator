import React, { useRef } from 'react';

export const AlgebraBuilder = ({ value, onChange }) => {
    const textareaRef = useRef(null);

    // Mathematical symbols for relational algebra
    const symbols = [
        { symbol: 'σ', name: 'Selección', description: 'Selección (sigma)' },
        { symbol: 'π', name: 'Proyección', description: 'Proyección (pi)' },
        { symbol: '×', name: 'Producto Cartesiano', description: 'Producto Cartesiano' },
        { symbol: '⨝', name: 'Join', description: 'Join Natural' },
        { symbol: '⟕', name: 'Left Join', description: 'Left Outer Join' },
        { symbol: 'ρ', name: 'Renombre', description: 'Renombre (rho)' },
        { symbol: '∪', name: 'Unión', description: 'Unión' },
        { symbol: '∩', name: 'Intersección', description: 'Intersección' },
        { symbol: '−', name: 'Diferencia', description: 'Diferencia' },
        { symbol: '÷', name: 'División', description: 'División' },
        { symbol: '(', name: 'Abrir', description: 'Paréntesis izquierdo' },
        { symbol: ')', name: 'Cerrar', description: 'Paréntesis derecho' },
        { symbol: '[', name: 'Abrir Corchete', description: 'Corchete izquierdo' },
        { symbol: ']', name: 'Cerrar Corchete', description: 'Corchete derecho' },
    ];

    const insertSymbol = (symbol) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newValue = value.substring(0, start) + symbol + value.substring(end);

        onChange(newValue);

        // Set cursor position after the inserted symbol
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + symbol.length, start + symbol.length);
        }, 0);
    };

    return (
        <div className="flex flex-col gap-2 h-full">
            {/* Symbol Toolbar */}
            <div className="bg-gray-800 border border-gray-700 rounded-md p-3">
                <div className="flex flex-wrap gap-2">
                    {symbols.map((item) => (
                        <button
                            key={item.symbol}
                            onClick={() => insertSymbol(item.symbol)}
                            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded text-white font-mono text-lg transition-colors"
                            title={item.description}
                        >
                            {item.symbol}
                        </button>
                    ))}
                </div>
                <div className="mt-2 text-xs text-gray-400">
                    💡 Haz clic en los símbolos para insertarlos en tu expresión
                </div>
            </div>

            {/* Text Input Area */}
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 bg-gray-900 text-white font-mono text-sm p-4 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Escribe tu expresión de álgebra relacional aquí..."
                spellCheck={false}
            />
        </div>
    );
};

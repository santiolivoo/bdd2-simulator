import React, { useState, useEffect } from 'react';
import { Editor } from './Editor';
import { AlgebraBuilder } from './AlgebraBuilder';
import { ResultsTable } from './ResultsTable';
import { Play, CheckCircle, XCircle, HelpCircle, AlertTriangle } from 'lucide-react';
import { runQuery } from '../db/initDB';

export const LevelView = ({ level }) => {
    const [code, setCode] = useState(level.initialCode || '');
    const [result, setResult] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [showSolution, setShowSolution] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);

    useEffect(() => {
        setCode(level.initialCode || '');
        setResult(null);
        setFeedback(null);
        setShowSolution(false);
        setSelectedOption(null);
    }, [level.id]);

    const handleRun = () => {
        if (level.type === 'sql') {
            // Execute user query
            const res = runQuery(code);
            if (res.success) {
                setResult({ data: res.data, error: null });

                // Validate by comparing results
                const validation = level.validate(code);
                setFeedback(validation);
            } else {
                // Syntax error from AlaSQL
                setResult({ data: null, error: res.error });
                setFeedback({
                    success: false,
                    message: "❌ Error de Sintaxis SQL: " + res.error,
                    isSyntaxError: true
                });
            }
        } else if (level.type === 'algebra') {
            // Validate algebra expression
            const validation = level.validate(code);
            setFeedback(validation);
            setResult(null);
        } else if (level.type === 'code-validation') {
            // Check if this is a trigger level with automatic test execution
            if (level.postExecutionSQL && level.resultQuery) {
                // AlaSQL doesn't support CREATE TRIGGER, so we simulate it
                const validation = level.validate(code);

                try {
                    // Execute the DML statement
                    const dmlResult = runQuery(level.postExecutionSQL);

                    if (!dmlResult.success) {
                        setResult({ data: null, error: dmlResult.error });
                        setFeedback({
                            success: false,
                            message: "❌ Error al ejecutar la prueba: " + dmlResult.error,
                            isSyntaxError: true
                        });
                        return;
                    }

                    // Simulate trigger logic based on level ID
                    if (level.id === 'D1') {
                        // Insert into LOG
                        runQuery(`
                            INSERT INTO LOG (ObjetoId, Operacion, FechaHora)
                            SELECT PacienteID, 'UPD PACIENTE', NOW()
                            FROM PACIENTES WHERE PacienteID = 1
                        `);
                    } else if (level.id === 'D2') {
                        // Insert into LOG_CONCEPTOS with old/new values
                        runQuery(`
                            INSERT INTO LOG_CONCEPTOS (ConceptoID, TextoAnterior, TextoNuevo, Fecha)
                            VALUES (1, 'Depósito', 'Concepto Actualizado', NOW())
                        `);
                    }

                    // Query results
                    const queryResult = runQuery(level.resultQuery);

                    if (queryResult.success) {
                        setResult({ data: queryResult.data, error: null });
                    } else {
                        setResult({ data: null, error: queryResult.error });
                    }

                    setFeedback(validation);

                } catch (e) {
                    setResult({ data: null, error: e.message });
                    setFeedback({
                        success: false,
                        message: "❌ Error al simular el trigger: " + e.message,
                        isSyntaxError: true
                    });
                }
            } else if (level.category === 'F') {
                // Stored Procedure - Extract SELECT and execute
                const validation = level.validate(code);
                setFeedback(validation);

                try {
                    // Extract the SELECT query from the stored procedure body
                    const selectMatch = code.match(/SELECT[\s\S]*?(?=END|$)/i);

                    if (selectMatch) {
                        const selectQuery = selectMatch[0].trim();

                        // Remove trailing END if captured
                        const cleanQuery = selectQuery.replace(/\s*END\s*$/i, '').trim();

                        // Execute the SELECT query
                        const queryResult = runQuery(cleanQuery);

                        if (queryResult.success) {
                            setResult({ data: queryResult.data, error: null });
                        } else {
                            setResult({ data: null, error: queryResult.error });
                        }
                    } else {
                        // No SELECT found
                        setResult({ data: null, error: 'No se encontró una consulta SELECT en el stored procedure.' });
                    }
                } catch (e) {
                    setResult({ data: null, error: e.message });
                }
            } else {
                // Regular code-validation without automatic execution
                const validation = level.validate(code);
                setFeedback(validation);
                setResult(null);
            }
        }
    };

    const handleOptionSelect = (optionId) => {
        setSelectedOption(optionId);
        const option = level.options.find(o => o.id === optionId);
        if (option.correct) {
            setFeedback({ success: true, message: option.explanation || "¡Correcto!" });
        } else {
            setFeedback({ success: false, message: "Incorrecto. Intenta de nuevo." });
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header / Consigna */}
            <div className="p-6 border-b border-gray-800 bg-gray-900">
                <h2 className="text-xl font-bold text-white mb-2">{level.title}</h2>
                <p className="text-gray-300 text-sm leading-relaxed">{level.description}</p>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">

                {/* Editor / Interaction Area */}
                <div className="flex-1 min-h-0 flex flex-col gap-2">
                    {level.type === 'multiple-choice' ? (
                        <div className="flex flex-col gap-3 p-4 bg-gray-800 rounded-md border border-gray-700 overflow-y-auto">
                            {level.options.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleOptionSelect(opt.id)}
                                    className={`p-4 rounded-md border text-left transition-all ${selectedOption === opt.id
                                        ? opt.correct
                                            ? 'bg-green-900/20 border-green-500 text-green-100'
                                            : 'bg-red-900/20 border-red-500 text-red-100'
                                        : 'bg-gray-900 border-gray-700 hover:bg-gray-850 text-gray-300'
                                        }`}
                                >
                                    <span className="font-bold mr-2">{opt.id}.</span> {opt.label}
                                </button>
                            ))}
                        </div>
                    ) : level.type === 'algebra' ? (
                        <div className="flex-1 flex flex-col">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase">Constructor de Álgebra Relacional</span>
                                <button
                                    onClick={handleRun}
                                    className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded transition-colors"
                                >
                                    <Play size={16} /> Ejecutar
                                </button>
                            </div>
                            <AlgebraBuilder value={code} onChange={setCode} />
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase">Editor de Consulta / Código</span>
                                <button
                                    onClick={handleRun}
                                    className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded transition-colors"
                                >
                                    <Play size={16} /> Ejecutar
                                </button>
                            </div>
                            <Editor value={code} onChange={setCode} />
                        </div>
                    )}
                </div>

                {/* Feedback & Results Area */}
                <div className="h-1/3 min-h-[200px] flex flex-col gap-2">
                    {/* Feedback Bar */}
                    {feedback && (
                        <div className={`p-3 rounded border flex items-start gap-3 ${feedback.success
                            ? 'bg-green-900/20 border-green-800 text-green-200'
                            : feedback.isSyntaxError
                                ? 'bg-red-900/30 border-red-700 text-red-200'
                                : 'bg-orange-900/20 border-orange-700 text-orange-200'
                            }`}>
                            {feedback.success ? (
                                <CheckCircle size={20} className="mt-0.5 text-green-400" />
                            ) : feedback.isSyntaxError ? (
                                <AlertTriangle size={20} className="mt-0.5 text-red-400" />
                            ) : (
                                <XCircle size={20} className="mt-0.5 text-orange-400" />
                            )}
                            <div className="text-sm flex-1">
                                <div className="font-medium mb-1">{feedback.message}</div>
                                {!feedback.success && !feedback.isSyntaxError && (
                                    <div className="text-xs opacity-75 mt-1">
                                        💡 Tu consulta se ejecutó correctamente, pero los resultados no coinciden con la solución esperada. Revisa la lógica de tu query.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Results Table (for SQL, Trigger levels, and Stored Procedures) */}
                    {(level.type === 'sql' || (level.type === 'code-validation' && result)) && (
                        <div className="flex-1 overflow-auto bg-gray-950 rounded border border-gray-800">
                            <ResultsTable data={result?.data} error={result?.error} />
                        </div>
                    )}
                </div>
            </div>

            {/* Footer / Solution */}
            <div className="p-4 border-t border-gray-800 bg-gray-900 flex justify-between items-center">
                <button
                    onClick={() => setShowSolution(!showSolution)}
                    className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2"
                >
                    <HelpCircle size={16} /> {showSolution ? 'Ocultar Solución' : 'Ver Solución de Cátedra'}
                </button>
            </div>

            {/* Solution Modal / Panel */}
            {showSolution && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8">
                    <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl max-w-3xl w-full max-h-full flex flex-col">
                        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <AlertTriangle className="text-yellow-500" /> Solución Oficial
                            </h3>
                            <button onClick={() => setShowSolution(false)} className="text-gray-400 hover:text-white">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto prose prose-invert max-w-none">
                            <div dangerouslySetInnerHTML={{ __html: level.solutionExplanation.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code class="bg-gray-800 px-1 rounded">$1</code>') }} />
                            {level.solution && (
                                <div className="mt-4">
                                    <h4 className="text-sm font-bold text-gray-400 mb-2">Código Correcto:</h4>
                                    <pre className="bg-gray-950 p-4 rounded border border-gray-800 overflow-x-auto text-sm text-green-400 font-mono">
                                        {level.solution}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

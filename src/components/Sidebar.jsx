import React, { useState } from 'react';
import { CheckCircle, Circle, Database, ChevronDown, ChevronRight } from 'lucide-react';
import { CATEGORIES } from '../logic/levels';

export const Sidebar = ({ levels, currentLevelId, onSelectLevel }) => {
    const [expandedCategories, setExpandedCategories] = useState(['A', 'B', 'C', 'D', 'E']);

    const toggleCategory = (categoryId) => {
        setExpandedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const levelsByCategory = CATEGORIES.map(category => ({
        ...category,
        levels: levels.filter(level => level.category === category.id)
    }));

    return (
        <div className="w-64 bg-gray-950 border-r border-gray-800 flex flex-col">
            <div className="p-4 border-b border-gray-800 flex items-center gap-2">
                <Database className="text-blue-500" size={24} />
                <h1 className="font-bold text-lg text-white tracking-tight">Simulador BDD2</h1>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                <div className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Ejercicios por Categoría
                </div>
                <nav className="space-y-2 px-2">
                    {levelsByCategory.map((category) => (
                        <div key={category.id} className="space-y-1">
                            {/* Category Header */}
                            <button
                                onClick={() => toggleCategory(category.id)}
                                className="w-full flex items-center gap-2 px-2 py-2 text-xs font-bold text-gray-300 hover:text-white hover:bg-gray-900 rounded-md transition-colors"
                            >
                                {expandedCategories.includes(category.id) ? (
                                    <ChevronDown size={14} />
                                ) : (
                                    <ChevronRight size={14} />
                                )}
                                <span className="flex-1 text-left truncate">
                                    {category.id}: {category.name}
                                </span>
                            </button>

                            {/* Category Levels */}
                            {expandedCategories.includes(category.id) && (
                                <div className="ml-4 space-y-1">
                                    {category.levels.map((level) => (
                                        <button
                                            key={level.id}
                                            onClick={() => onSelectLevel(level.id)}
                                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${currentLevelId === level.id
                                                    ? 'bg-blue-900/30 text-blue-400 border-l-2 border-blue-500'
                                                    : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'
                                                }`}
                                        >
                                            <Circle
                                                size={14}
                                                className={currentLevelId === level.id ? "text-blue-500" : "text-gray-600"}
                                            />
                                            <span className="truncate text-left text-xs">{level.title}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>
            </div>

            <div className="p-4 border-t border-gray-800 text-xs text-gray-600">
                v2.0.0 - Cátedra BDD2 - {levels.length} Niveles
            </div>
        </div>
    );
};

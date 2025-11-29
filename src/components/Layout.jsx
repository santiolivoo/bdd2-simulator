import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { ERDiagram } from './ERDiagram';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';

export const Layout = ({ children, currentLevelId, onSelectLevel, levels }) => {
    const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

    // Get current level object
    const currentLevel = levels.find(l => l.id === currentLevelId);

    return (
        <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden font-sans">
            {/* Left Sidebar */}
            <Sidebar
                levels={levels}
                currentLevelId={currentLevelId}
                onSelectLevel={onSelectLevel}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {children}
            </div>

            {/* Right Panel (ER Diagram) */}
            <div className={`border-l border-gray-700 bg-gray-800 transition-all duration-300 flex flex-col ${isRightPanelOpen ? 'w-80' : 'w-12'}`}>
                <div className="p-2 border-b border-gray-700 flex justify-between items-center bg-gray-850">
                    {isRightPanelOpen && <span className="font-semibold text-sm text-gray-300">Diagrama ER</span>}
                    <button
                        onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
                        className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                        title={isRightPanelOpen ? "Cerrar Panel" : "Abrir Panel"}
                    >
                        {isRightPanelOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
                    </button>
                </div>

                {isRightPanelOpen && (
                    <div className="flex-1 overflow-y-auto p-4">
                        <ERDiagram currentLevel={currentLevel} />
                    </div>
                )}
            </div>
        </div>
    );
};

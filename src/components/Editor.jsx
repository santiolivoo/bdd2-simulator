import React from 'react';

export const Editor = ({ value, onChange, placeholder, readOnly = false }) => {
    return (
        <div className="w-full h-full flex flex-col bg-gray-950 border border-gray-700 rounded-md overflow-hidden">
            <div className="bg-gray-800 px-4 py-2 text-xs text-gray-400 border-b border-gray-700 flex justify-between">
                <span>SQL / Code Editor</span>
                <span>{readOnly ? 'Read Only' : 'Editable'}</span>
            </div>
            <textarea
                className="flex-1 w-full h-full bg-gray-900 text-gray-200 p-4 font-mono text-sm focus:outline-none resize-none"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                spellCheck={false}
                readOnly={readOnly}
            />
        </div>
    );
};

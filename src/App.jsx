import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { LevelView } from './components/LevelView';
import { LEVELS } from './logic/levels';
import { initDB } from './db/initDB';

function App() {
  const [currentLevelId, setCurrentLevelId] = useState('A1');
  const [dbInitialized, setDbInitialized] = useState(false);

  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      initDB();
      setDbInitialized(true);
    } catch (e) {
      console.error("Failed to initialize DB:", e);
      setError(e.message);
    }
  }, []);

  const currentLevel = LEVELS.find(l => l.id === currentLevelId) || LEVELS[0];

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-red-950 text-red-200 p-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold mb-2">Error de Inicialización</h1>
          <p>{error}</p>
          <p className="text-sm mt-4 text-red-400">Por favor recarga la página o verifica la consola.</p>
        </div>
      </div>
    );
  }

  if (!dbInitialized) {
    return <div className="flex h-screen items-center justify-center bg-gray-900 text-white">Cargando base de datos...</div>;
  }

  return (
    <Layout
      levels={LEVELS}
      currentLevelId={currentLevelId}
      onSelectLevel={setCurrentLevelId}
    >
      <LevelView level={currentLevel} />
    </Layout>
  );
}

export default App;

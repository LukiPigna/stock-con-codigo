import React, { useState, useEffect } from 'react';
import * as DB from './services/database';
import { Household } from './types';
import LoginView from './views/LoginView';
import PantryView from './views/PantryView';

const App: React.FC = () => {
  const [appState, setAppState] = useState<'login' | 'pantry'>('login');
  const [household, setHousehold] = useState<Household | null>(null);
  const [isNewHousehold, setIsNewHousehold] = useState(false);

  useEffect(() => {
    // Inicializa la conexión con la base de datos una sola vez
    try {
      DB.initDB();
    } catch (error) {
      // Si initDB falla (p. ej., por config), no hacemos nada más.
      // El usuario se quedará en la pantalla de login con una alerta ya mostrada.
      console.error(error);
      return;
    }
  }, []);

  const handleLogin = async (pin: string): Promise<boolean> => {
    const loggedInHousehold = await DB.loginWithPin(pin);
    if (loggedInHousehold) {
      setHousehold(loggedInHousehold);
      setAppState('pantry');
      return true;
    }
    return false;
  };

  const handleCreateHousehold = async (name: string): Promise<boolean> => {
    try {
      const newHousehold = await DB.createHousehold(name);
      setHousehold(newHousehold);
      setIsNewHousehold(true);
      setAppState('pantry');
      return true;
    } catch (error) {
      console.error("Error al crear la casa:", error);
      alert("No se pudo crear la casa. Verifica que tu configuración de Firebase sea correcta y que tus reglas de Firestore permitan la escritura.");
      return false;
    }
  };

  const handleLogout = () => {
    // Ya no es necesario llamar a DB.logout() porque no hay sesión que cerrar
    setHousehold(null);
    setAppState('login');
  };

  const renderContent = () => {
    if (appState === 'pantry' && household) {
        return <PantryView 
                  household={household} 
                  onLogout={handleLogout} 
                  isNew={isNewHousehold}
                  onAcknowledgeNew={() => setIsNewHousehold(false)}
                />;
    }
    
    return <LoginView onLogin={handleLogin} onCreateHousehold={handleCreateHousehold} />;
  };

  return renderContent();
};

export default App;
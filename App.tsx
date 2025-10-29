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
    DB.initDB();
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

  const handleCreateHousehold = async (name: string) => {
    const newHousehold = await DB.createHousehold(name);
    setHousehold(newHousehold);
    setIsNewHousehold(true);
    setAppState('pantry');
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
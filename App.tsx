import React, { useState, useEffect } from 'react';
import * as DB from './services/database';
import { Household } from './types';
import LoginView from './views/LoginView';
import PantryView from './views/PantryView';

const App: React.FC = () => {
  const [appState, setAppState] = useState<'loading' | 'login' | 'pantry'>('loading');
  const [household, setHousehold] = useState<Household | null>(null);
  const [isNewHousehold, setIsNewHousehold] = useState(false);

  useEffect(() => {
    DB.initDB();
    const currentHousehold = DB.getCurrentHousehold();
    if (currentHousehold) {
      setHousehold(currentHousehold);
      setAppState('pantry');
    } else {
      setAppState('login');
    }
  }, []);

  const handleLogin = (pin: string): boolean => {
    const loggedInHousehold = DB.loginWithPin(pin);
    if (loggedInHousehold) {
      setHousehold(loggedInHousehold);
      setAppState('pantry');
      return true;
    }
    return false;
  };

  const handleCreateHousehold = (name: string) => {
    const newHousehold = DB.createHousehold(name);
    DB.setCurrentHousehold(newHousehold.id);
    setHousehold(newHousehold);
    setIsNewHousehold(true);
    setAppState('pantry');
  };

  const handleLogout = () => {
    DB.logout();
    setHousehold(null);
    setAppState('login');
  };

  const renderContent = () => {
    switch (appState) {
      case 'loading':
        return <div className="h-screen w-screen flex items-center justify-center bg-slate-100"><p className="text-gray-500">Cargando...</p></div>;
      
      case 'pantry':
        if (household) {
          return <PantryView 
                    household={household} 
                    onLogout={handleLogout} 
                    isNew={isNewHousehold}
                    onAcknowledgeNew={() => setIsNewHousehold(false)}
                 />;
        }
        // Fallback to login if household is null
        setAppState('login');
        return null;

      case 'login':
      default:
        return <LoginView onLogin={handleLogin} onCreateHousehold={handleCreateHousehold} />;
    }
  };

  return renderContent();
};

export default App;

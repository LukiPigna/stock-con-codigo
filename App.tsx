import React, { useState, useEffect, useCallback } from 'react';
import * as DB from './services/database';
import { Household, FirebaseUser } from './types';
import AuthView from './views/LoginView';
import PantryView from './views/PantryView';
import WelcomeView from './views/WelcomeView';
import LandingView from './views/LandingView';

type AuthAction = 'landing' | 'login' | 'signup';

const LoadingSpinner: React.FC = () => (
    <div className="min-h-screen flex justify-center items-center bg-slate-100">
        <div className="text-center">
            <svg className="animate-spin h-10 w-10 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-lg text-gray-600">Cargando...</p>
        </div>
    </div>
);

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [isNewHousehold, setIsNewHousehold] = useState(false);
  const [authAction, setAuthAction] = useState<AuthAction>('landing');

  useEffect(() => {
    try {
      DB.initDB();
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      return;
    }

    const unsubscribe = DB.onAuthStateChanged(async (firebaseUser) => {
      setIsLoading(true);
      if (firebaseUser) {
        const appUser: FirebaseUser = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email
        };
        setUser(appUser);
        
        const urlParams = new URLSearchParams(window.location.search);
        const joinId = urlParams.get('join');
        
        if (joinId) {
            await DB.joinHousehold(joinId, appUser.uid);
            window.history.replaceState({}, document.title, "/"); // Limpiar URL
        }

        const userHousehold = await DB.getHouseholdForUser(appUser.uid);
        setHousehold(userHousehold);
        setAuthAction('landing'); // Reset auth action on login
      } else {
        setUser(null);
        setHousehold(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreateHousehold = useCallback(async (name: string): Promise<void> => {
    if (!user) return;
    const newHousehold = await DB.createHousehold(name, user);
    setHousehold(newHousehold);
    setIsNewHousehold(true);
  }, [user]);
  
  const handleLogout = useCallback(() => {
    DB.signOut();
  }, []);

  const onLogin = useCallback(() => setAuthAction('login'), []);
  const onSignUp = useCallback(() => setAuthAction('signup'), []);
  const onBackToLanding = useCallback(() => setAuthAction('landing'), []);
  const onAcknowledgeNew = useCallback(() => setIsNewHousehold(false), []);

  const renderContent = () => {
    if (isLoading) {
      return <LoadingSpinner />;
    }

    if (!user) {
        switch (authAction) {
            case 'login':
                return <AuthView isLoginInitial={true} onBackToLanding={onBackToLanding} />;
            case 'signup':
                return <AuthView isLoginInitial={false} onBackToLanding={onBackToLanding} />;
            case 'landing':
            default:
                return <LandingView onLogin={onLogin} onSignUp={onSignUp} />;
        }
    }

    if (household) {
      return <PantryView
                user={user}
                household={household}
                onLogout={handleLogout}
                isNew={isNewHousehold}
                onAcknowledgeNew={onAcknowledgeNew}
             />;
    }

    return <WelcomeView user={user} onCreateHousehold={handleCreateHousehold} onLogout={handleLogout} />;
  };

  return renderContent();
};

export default App;
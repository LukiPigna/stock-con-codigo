import React, { useState, useEffect } from 'react';
import * as DB from './services/database';
import { Household, User } from './types';
import LoginView from './views/LoginView';
import PantryView from './views/PantryView';
import LandingView from './views/LandingView';
import JoinOrCreateHouseholdView from './views/HouseholdView';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [initialView, setInitialView] = useState<'landing' | 'app'>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    try {
      DB.initDB();
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      return;
    }

    const unsubscribe = DB.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const householdId = currentUser.householdId;
        if (householdId) {
          const hhData = await DB.getHousehold(householdId);
          setHousehold(hhData);
        } else {
          setHousehold(null);
        }
      } else {
        setHousehold(null);
      }
      setIsLoading(false);
    });
    
    // Check for invite link on load
    const urlParams = new URLSearchParams(window.location.search);
    const inviteId = urlParams.get('invite');
    if (inviteId) {
      localStorage.setItem('inviteId', inviteId);
      setInitialView('app'); // Go directly to app if there's an invite
    }

    return () => unsubscribe();
  }, []);

  const handleNavigateToApp = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setInitialView('app');
  };

  const handleLogout = async () => {
    await DB.signOut();
    setUser(null);
    setHousehold(null);
  };
  
  const handleHouseholdCreated = (newHousehold: Household) => {
      setHousehold(newHousehold);
  }

  const renderContent = () => {
    if (initialView === 'landing' && !user) {
        return <LandingView onNavigateToApp={handleNavigateToApp} />;
    }
    
    if (isLoading) {
      return (
        <div className="min-h-screen flex justify-center items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#84A98C]"></div>
        </div>
      );
    }

    if (!user) {
      return <LoginView initialMode={authMode} />;
    }

    if (!household) {
      return <JoinOrCreateHouseholdView user={user} onHouseholdCreated={handleHouseholdCreated} />;
    }
    
    return <PantryView user={user} household={household} onLogout={handleLogout} />;
  };

  return renderContent();
};

export default App;
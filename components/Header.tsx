import React, { memo } from 'react';
import { View, FirebaseUser } from '../types';

interface HeaderProps {
  activeView: View;
  setActiveView: (view: View) => void;
  householdName: string;
  user: FirebaseUser;
  onShowSettings: () => void;
  onLogout: () => void;
}

const UserAvatar: React.FC<{ user: FirebaseUser }> = memo(({ user }) => {
    const getInitials = () => {
        if (user.displayName) {
            return user.displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        }
        if (user.email) {
            return user.email.substring(0, 2).toUpperCase();
        }
        return '??';
    }

    return (
        <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm">
            {getInitials()}
        </div>
    );
});


const Header: React.FC<HeaderProps> = memo(({ activeView, setActiveView, householdName, user, onShowSettings, onLogout }) => {
  const getTabClass = (view: View) => {
    const mainViews = [View.All, View.Summary, View.Shopping];
    if (mainViews.includes(activeView) && mainViews.includes(view)) {
         return activeView === view
            ? 'bg-indigo-600 text-white'
            : 'text-gray-600 hover:bg-indigo-100 hover:text-indigo-600';
    }
    // Handle case where activeView is SupermarketList but we want to highlight 'Shopping'
    if (activeView === View.SupermarketList && view === View.Shopping) {
        return 'bg-indigo-600 text-white';
    }
    return 'text-gray-600 hover:bg-indigo-100 hover:text-indigo-600';
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-30">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <h1 className="text-xl font-bold text-gray-800">{householdName}</h1>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={onShowSettings} className="p-2 rounded-full hover:bg-gray-200 transition-colors" aria-label="Configuración de la casa">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-1a6 6 0 00-1.78-4.125a4 4 0 00-6.44 0A6 6 0 003 20v1h12z" />
               </svg>
            </button>
            <UserAvatar user={user} />
            <button onClick={onLogout} className="p-2 rounded-full hover:bg-gray-200 transition-colors" aria-label="Cerrar sesión">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
            </button>
          </div>
        </div>
        <div className="flex justify-center bg-slate-200 p-1 rounded-lg">
          <button
            onClick={() => setActiveView(View.All)}
            className={`w-1/3 py-2 px-4 rounded-md font-semibold transition-colors duration-300 ${getTabClass(View.All)}`}
          >
            Despensa
          </button>
           <button
            onClick={() => setActiveView(View.Summary)}
            className={`w-1/3 py-2 px-4 rounded-md font-semibold transition-colors duration-300 ${getTabClass(View.Summary)}`}
          >
            Resumen
          </button>
          <button
            onClick={() => setActiveView(View.Shopping)}
            className={`w-1/3 py-2 px-4 rounded-md font-semibold transition-colors duration-300 ${getTabClass(View.Shopping)}`}
          >
            Comprar
          </button>
        </div>
      </div>
    </header>
  );
});

export default Header;
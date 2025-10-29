import React, { useState, useEffect } from 'react';

interface LoginViewProps {
  onLogin: (pin: string) => Promise<boolean>;
  onCreateHousehold: (name: string) => Promise<void>;
}

const CreateHouseholdModal: React.FC<{onClose: () => void, onCreate: (name: string) => Promise<void>}> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(name.trim() && !isLoading) {
      setIsLoading(true);
      await onCreate(name.trim());
      // No es necesario cerrar el modal, App.tsx cambiará de vista
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Crear Nueva Casa</h2>
        <form onSubmit={handleSubmit}>
           <p className="text-sm text-gray-600 mb-4">Dale un nombre a tu casa para empezar a gestionar la despensa en equipo.</p>
          <div className="mb-4">
            <label htmlFor="householdName" className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Casa</label>
            <input
              id="householdName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ej: Casa del Centro"
              autoFocus
              required
              disabled={isLoading}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold" disabled={isLoading}>Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-semibold" disabled={isLoading}>
              {isLoading ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const LoginView: React.FC<LoginViewProps> = ({ onLogin, onCreateHousehold }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const attemptLogin = async () => {
        if (pin.length === 4) {
          setIsLoading(true);
          const success = await onLogin(pin);
          if (!success) {
            setError('PIN incorrecto');
            if (navigator.vibrate) {
              navigator.vibrate(200);
            }
            setTimeout(() => {
              setPin('');
              setError('');
              setIsLoading(false);
            }, 800);
          }
          // Si tiene éxito, App.tsx se encargará de cambiar la vista
        }
    };
    attemptLogin();
  }, [pin, onLogin]);

  const handleKeyPress = (key: string) => {
    if (pin.length < 4 && !isLoading) {
      setError('');
      setPin(pin + key);
    }
  };

  const handleBackspace = () => {
    if (!isLoading) {
      setPin(pin.slice(0, -1));
    }
  };

  const PinDisplay = () => (
    <div className="flex justify-center items-center gap-4 mb-8">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className={`w-8 h-8 rounded-full transition-all duration-200 ${
            error ? 'bg-red-500' : 
            isLoading ? 'bg-yellow-400 animate-pulse' :
            pin.length > i ? 'bg-indigo-600' : 'bg-gray-300'
          }`}
        />
      ))}
    </div>
  );

  const NumpadButton: React.FC<{ value: string, onClick: (v: string) => void, children?: React.ReactNode, className?: string }> = ({ value, onClick, children, className }) => (
    <button onClick={() => onClick(value)} className={`w-20 h-20 bg-white/50 rounded-full text-3xl font-light text-gray-800 flex items-center justify-center transition-transform active:scale-90 disabled:opacity-50`} disabled={isLoading}>
      {children || value}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-100 p-4">
      {showCreateModal && <CreateHouseholdModal onClose={() => setShowCreateModal(false)} onCreate={onCreateHousehold} />}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Control de Despensa</h1>
        <p className="text-lg text-gray-600 mt-2">Ingresa el PIN de tu casa</p>
      </div>

      <div className="w-full max-w-xs flex flex-col items-center">
        <PinDisplay />
        <div className="grid grid-cols-3 gap-5">
          <NumpadButton value="1" onClick={handleKeyPress} />
          <NumpadButton value="2" onClick={handleKeyPress} />
          <NumpadButton value="3" onClick={handleKeyPress} />
          <NumpadButton value="4" onClick={handleKeyPress} />
          <NumpadButton value="5" onClick={handleKeyPress} />
          <NumpadButton value="6" onClick={handleKeyPress} />
          <NumpadButton value="7" onClick={handleKeyPress} />
          <NumpadButton value="8" onClick={handleKeyPress} />
          <NumpadButton value="9" onClick={handleKeyPress} />
          <div/>
          <NumpadButton value="0" onClick={handleKeyPress} />
          <NumpadButton value="backspace" onClick={handleBackspace} className="text-2xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 002.828 0L21 12M3 12l6.414-6.414a2 2 0 012.828 0L21 12" />
            </svg>
          </NumpadButton>
        </div>
      </div>
       <div className="mt-12 text-center">
        <button 
          onClick={() => setShowCreateModal(true)} 
          className="text-indigo-600 hover:text-indigo-800 font-semibold disabled:opacity-50"
          disabled={isLoading}
        >
          Crear nueva casa
        </button>
      </div>
    </div>
  );
};

export default LoginView;
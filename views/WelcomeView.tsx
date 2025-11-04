import React, { useState } from 'react';
import { FirebaseUser } from '../types';

interface WelcomeViewProps {
    user: FirebaseUser;
    onCreateHousehold: (name: string) => Promise<void>;
    onLogout: () => void;
}

const WelcomeView: React.FC<WelcomeViewProps> = ({ user, onCreateHousehold, onLogout }) => {
    const [householdName, setHouseholdName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (householdName.trim() && !isLoading) {
            setIsLoading(true);
            await onCreateHousehold(householdName.trim());
            // El componente App se encargará de cambiar la vista
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-slate-100 p-4">
            <div className="w-full max-w-md text-center">
                <div className="bg-white rounded-lg shadow-xl p-8">
                    <h1 className="text-3xl font-bold text-gray-800">
                        ¡Hola, {user.displayName || user.email}!
                    </h1>
                    <p className="text-lg text-gray-600 mt-3">
                        Bienvenido al Control de Despensa.
                    </p>
                    <p className="text-gray-500 mt-2">
                        Parece que todavía no estás en ninguna casa. Crea una para empezar a añadir productos.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-8">
                        <div className="mb-4 text-left">
                            <label htmlFor="householdName" className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre de tu casa
                            </label>
                            <input
                                id="householdName"
                                type="text"
                                value={householdName}
                                onChange={(e) => setHouseholdName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Ej: Casa del Centro"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading || !householdName.trim()}
                            className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
                        >
                            {isLoading ? 'Creando...' : 'Crear mi casa'}
                        </button>
                    </form>

                     <p className="text-xs text-gray-400 mt-6">
                        Si te han invitado a una casa, usa el enlace de invitación para unirte.
                    </p>
                </div>
                <button onClick={onLogout} className="mt-6 text-sm text-gray-500 hover:text-gray-700">
                    Cerrar sesión
                </button>
            </div>
        </div>
    );
};

export default WelcomeView;
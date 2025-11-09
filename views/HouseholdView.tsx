import React, { useState, useEffect } from 'react';
import { User, Household } from '../types';
import * as DB from '../services/database';

interface JoinOrCreateHouseholdViewProps {
    user: User;
    onHouseholdCreated: (household: Household) => void;
}

const JoinOrCreateHouseholdView: React.FC<JoinOrCreateHouseholdViewProps> = ({ user, onHouseholdCreated }) => {
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isJoining, setIsJoining] = useState(false);

    useEffect(() => {
        const joinByInvite = async () => {
            const inviteId = localStorage.getItem('inviteId');
            if (inviteId) {
                setIsJoining(true);
                try {
                    await DB.addUserToHousehold(inviteId, user);
                    const newHousehold = await DB.getHousehold(inviteId);
                    if (newHousehold) {
                        onHouseholdCreated(newHousehold);
                    }
                } catch (error) {
                    console.error("Failed to join household by invite:", error);
                    alert("No se pudo unir a la casa. El link de invitación podría ser inválido o haber expirado.");
                    setIsJoining(false);
                } finally {
                    localStorage.removeItem('inviteId');
                }
            }
        };
        joinByInvite();
    }, [user, onHouseholdCreated]);
    
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && !isLoading) {
            setIsLoading(true);
            try {
                const newHousehold = await DB.createHousehold(name.trim(), user);
                onHouseholdCreated(newHousehold);
            } catch (error) {
                console.error("Error creating household:", error);
                alert("No se pudo crear la casa.");
                setIsLoading(false);
            }
        }
    }

    if(isJoining) {
         return (
            <div className="min-h-screen flex flex-col justify-center items-center bg-[#fcfaf5] p-4 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#84A98C] mb-4"></div>
                <h1 className="text-2xl font-bold text-gray-800">Uniéndote a la casa...</h1>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-[#fcfaf5] p-4">
            <div className="w-full max-w-sm text-center">
                <h1 className="text-3xl font-bold text-gray-800">¡Bienvenido, {user.displayName || user.email || 'Invitado'}!</h1>
                <p className="text-lg text-gray-600 mt-2 mb-8">Parece que no estás en ninguna casa todavía.</p>
                
                <div className="bg-white rounded-lg shadow-xl p-6">
                     <h2 className="text-xl font-bold mb-4 text-gray-800">Crear Nueva Casa</h2>
                    <form onSubmit={handleCreate}>
                        <p className="text-sm text-gray-600 mb-4">Dale un nombre a tu casa para empezar a organizar tu despensa.</p>
                        <div className="mb-4">
                            <label htmlFor="householdName" className="sr-only">Nombre de la Casa</label>
                            <input
                            id="householdName"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#84A98C] focus:border-[#84A98C] bg-white text-gray-900"
                            placeholder="Ej: Casa del Centro"
                            autoFocus
                            required
                            disabled={isLoading}
                            />
                        </div>
                        <button type="submit" className="w-full py-2 px-4 bg-[#84A98C] text-white rounded-md hover:bg-[#73957a] font-semibold disabled:bg-gray-400" disabled={isLoading}>
                            {isLoading ? 'Creando...' : 'Crear Casa'}
                        </button>
                    </form>
                </div>
                <p className="text-sm text-gray-500 mt-6">Si tienes un link de invitación, simplemente ábrelo en tu navegador para unirte a una casa existente.</p>
            </div>
        </div>
    );
};

export default JoinOrCreateHouseholdView;
import React, { useState, useEffect } from 'react';
import { Household, User } from '../types';
import * as DB from '../services/database';

interface HouseholdSettingsModalProps {
    currentUser: User;
    household: Household;
    onClose: () => void;
    onLogout: () => void;
    onRestartTour: () => void;
}

const HouseholdSettingsModal: React.FC<HouseholdSettingsModalProps> = ({ currentUser, household, onClose, onLogout, onRestartTour }) => {
    const [copied, setCopied] = useState(false);
    const [categories, setCategories] = useState(household.categories || []);
    const [newCategory, setNewCategory] = useState('');
    const [locations, setLocations] = useState(household.locations || []);
    const [newLocation, setNewLocation] = useState('');
    const [members, setMembers] = useState<User[]>([]);

    const isOwner = currentUser.uid === household.ownerUid;

    useEffect(() => {
        const fetchMembers = async () => {
            const memberData = await Promise.all(
                household.members.map(uid => DB.getUserData(uid))
            );
            setMembers(memberData.filter((m): m is User => m !== null));
        };
        fetchMembers();
    }, [household.members]);

    const handleCopyInviteLink = () => {
        const inviteLink = `${window.location.origin}?invite=${household.id}`;
        navigator.clipboard.writeText(inviteLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }
    
    const handleRemoveMember = async (uidToRemove: string) => {
        const memberToRemove = members.find(m => m.uid === uidToRemove);
        if (window.confirm(`¿Seguro que quieres eliminar a ${memberToRemove?.email || 'este miembro'} de la casa?`)) {
            try {
                await DB.removeUserFromHousehold(household.id, uidToRemove);
            } catch (error) {
                console.error("Error removing member:", error);
                alert("No se pudo eliminar al miembro.");
            }
        }
    }

    // Category Handlers
    const handleCategoryChange = (index: number, value: string) => {
        const updatedCategories = [...categories];
        updatedCategories[index] = value;
        setCategories(updatedCategories);
    };
    const handleDeleteCategory = (index: number) => {
        if (window.confirm(`¿Seguro que quieres eliminar la categoría "${categories[index]}"?`)) {
            const updatedCategories = categories.filter((_, i) => i !== index);
            setCategories(updatedCategories);
        }
    };
    const handleAddNewCategory = () => {
        if (newCategory.trim() && !categories.includes(newCategory.trim())) {
            setCategories([...categories, newCategory.trim()]);
            setNewCategory('');
        }
    };

    // Location Handlers
    const handleLocationChange = (index: number, value: string) => {
        const updatedLocations = [...locations];
        updatedLocations[index] = value;
        setLocations(updatedLocations);
    };
    const handleDeleteLocation = (index: number) => {
        if (window.confirm(`¿Seguro que quieres eliminar la ubicación "${locations[index]}"?`)) {
            const updatedLocations = locations.filter((_, i) => i !== index);
            setLocations(updatedLocations);
        }
    };
    const handleAddNewLocation = () => {
        if (newLocation.trim() && !locations.includes(newLocation.trim())) {
            setLocations([...locations, newLocation.trim()]);
            setNewLocation('');
        }
    };

    const handleSaveChanges = () => {
        const cleanedCategories = categories.map(c => c.trim()).filter(c => c !== '');
        const uniqueCategories = Array.from(new Set<string>(cleanedCategories));
        
        const cleanedLocations = locations.map(l => l.trim()).filter(l => l !== '');
        const uniqueLocations = Array.from(new Set<string>(cleanedLocations));

        DB.updateHousehold(household.id, { 
            categories: uniqueCategories,
            locations: uniqueLocations 
        });
        onClose();
    };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-800 text-left">{household.name}</h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {isOwner && (
                <div className="bg-slate-50 p-4 rounded-lg text-center">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Invitar a esta casa</label>
                    <button 
                        onClick={handleCopyInviteLink}
                        className={`w-full px-4 py-3 rounded-md font-semibold text-white transition-colors ${copied ? 'bg-green-500' : 'bg-[#84A98C] hover:bg-[#73957a]'}`}
                        data-tour-id="step-2-invite-button"
                    >
                        {copied ? '¡Link Copiado!' : 'Copiar Link de Invitación'}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">Cualquiera con este link podrá unirse a tu casa.</p>
                </div>
            )}

            <div className="text-left">
                <h3 className="text-lg font-bold text-gray-800 mb-3">Miembros</h3>
                <div className="space-y-2">
                    {members.map((member) => (
                        <div key={member.uid} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                            <span className="text-gray-700 truncate">{member.displayName || member.email || 'Invitado'}</span>
                            {isOwner && member.uid !== currentUser.uid && (
                                <button onClick={() => handleRemoveMember(member.uid)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            )}
                            {member.uid === household.ownerUid && (
                                <span className="text-xs font-semibold bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">Owner</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div>
              <div className="border-t pt-4 text-left" data-tour-id="step-3-manage-locations">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">Gestionar Ubicaciones</h3>
                  <div className="space-y-2 mb-4">
                      {locations.map((loc, index) => (
                          <div key={index} className="flex items-center space-x-2">
                          <input 
                              type="text"
                              value={loc}
                              onChange={(e) => handleLocationChange(index, e.target.value)}
                              className="flex-grow w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#84A98C] focus:border-[#84A98C] bg-white text-gray-900"
                          />
                          <button onClick={() => handleDeleteLocation(index)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                          </button>
                          </div>
                      ))}
                  </div>
                  <div className="flex items-center space-x-2">
                      <input
                          type="text"
                          placeholder="Nueva ubicación"
                          value={newLocation}
                          onChange={(e) => setNewLocation(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddNewLocation()}
                          className="flex-grow w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#84A98C] focus:border-[#84A98C] bg-white text-gray-900"
                      />
                      <button onClick={handleAddNewLocation} className="px-4 py-2 bg-[#84A98C] text-white rounded-md hover:bg-[#73957a] font-semibold">Añadir</button>
                  </div>
              </div>

              <div className="border-t pt-4 text-left mt-6" data-tour-id="step-4-manage-categories">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">Gestionar Categorías</h3>
                  <div className="space-y-2 mb-4">
                      {categories.map((cat, index) => (
                          <div key={index} className="flex items-center space-x-2">
                          <input 
                              type="text"
                              value={cat}
                              onChange={(e) => handleCategoryChange(index, e.target.value)}
                              className="flex-grow w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#84A98C] focus:border-[#84A98C] bg-white text-gray-900"
                          />
                          <button onClick={() => handleDeleteCategory(index)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                          </button>
                          </div>
                      ))}
                  </div>
                  <div className="flex items-center space-x-2">
                      <input
                          type="text"
                          placeholder="Nueva categoría"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddNewCategory()}
                          className="flex-grow w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#84A98C] focus:border-[#84A98C] bg-white text-gray-900"
                      />
                      <button onClick={handleAddNewCategory} className="px-4 py-2 bg-[#84A98C] text-white rounded-md hover:bg-[#73957a] font-semibold">Añadir</button>
                  </div>
              </div>
            </div>
        </div>
        
        <div className="flex justify-between items-center p-6 border-t">
            <div className="flex items-center space-x-3">
                <button
                  onClick={onLogout}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold"
                >
                  Salir de la casa
                </button>
                 <button
                  onClick={onRestartTour}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold"
                  title="Ver la guía de inicio de nuevo"
                >
                    Ver Tutorial
                </button>
            </div>
            <button
              type="button"
              onClick={handleSaveChanges}
              className="px-4 py-2 bg-[#84A98C] text-white rounded-md hover:bg-[#73957a] font-semibold"
            >
              Guardar Cambios
            </button>
          </div>
      </div>
    </div>
  );
};

export default HouseholdSettingsModal;
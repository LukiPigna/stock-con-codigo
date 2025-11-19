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

    // Advanced scroll lock logic
    useEffect(() => {
        const scrollY = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        return () => {
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            window.scrollTo(0, scrollY);
        };
    }, []);

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
        if(navigator.vibrate) navigator.vibrate(10);
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

    // Generic list handlers
    const updateList = (setter: Function, list: string[], index: number, value: string) => {
        const updated = [...list];
        updated[index] = value;
        setter(updated);
    };

    const deleteFromList = (setter: Function, list: string[], index: number) => {
        if (window.confirm(`¿Eliminar "${list[index]}"?`)) {
            setter(list.filter((_, i) => i !== index));
        }
    };

    const addToList = (setter: Function, list: string[], newItem: string, clearInput: Function) => {
        if (newItem.trim() && !list.includes(newItem.trim())) {
            setter([...list, newItem.trim()]);
            clearInput('');
        }
    };
    
    const handleSaveChanges = () => {
        const clean = (list: string[]) => Array.from(new Set(list.map(i => i.trim()).filter(i => i !== '')));
        
        DB.updateHousehold(household.id, { 
            categories: clean(categories),
            locations: clean(locations) 
        });
        onClose();
    };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden z-10 flex flex-col animate-fade-in">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-white sticky top-0 z-20">
            <h2 className="text-xl font-bold text-gray-800 truncate pr-4">Ajustes: {household.name}</h2>
            <button onClick={onClose} className="p-2 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors">
                 <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        
        <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar overscroll-contain pb-20">
            
            {/* Invite Section */}
            {isOwner && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-5 rounded-xl border border-emerald-100 shadow-sm">
                    <h3 className="text-xs font-bold text-emerald-800 mb-3 uppercase tracking-wider flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
                        Invitar Familiares
                    </h3>
                    <button 
                        onClick={handleCopyInviteLink}
                        className={`w-full py-3 rounded-lg font-bold text-sm text-white transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${copied ? 'bg-emerald-600' : 'bg-[#84A98C] hover:bg-[#73957a]'}`}
                        data-tour-id="step-2-invite-button"
                    >
                        {copied ? (
                            <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            Link Copiado
                            </>
                        ) : (
                            <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                            Copiar Link de Invitación
                            </>
                        )}
                    </button>
                    <p className="text-xs text-emerald-700 mt-2 text-center">Toca para copiar y envía por WhatsApp.</p>
                </div>
            )}

            {/* Members Section */}
            <div>
                <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Miembros</h3>
                <ul className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                    {members.map((member) => (
                        <li key={member.uid} className="flex items-center justify-between bg-white p-3">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-bold text-sm shadow-inner">
                                    {member.displayName ? member.displayName[0].toUpperCase() : '@'}
                                </div>
                                <div className="flex flex-col truncate">
                                     <span className="text-sm font-semibold text-gray-800 truncate">{member.displayName || 'Usuario sin nombre'}</span>
                                     <span className="text-xs text-gray-500 truncate">{member.email}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {member.uid === household.ownerUid && (
                                    <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">ADMIN</span>
                                )}
                                {isOwner && member.uid !== currentUser.uid && (
                                    <button onClick={() => handleRemoveMember(member.uid)} className="text-gray-300 hover:text-red-500 p-2 transition-colors">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Locations */}
            <div data-tour-id="step-3-manage-locations">
                  <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Ubicaciones</h3>
                  <div className="space-y-2 mb-3">
                      {locations.map((loc, index) => (
                          <div key={index} className="flex items-center gap-2 group">
                            <input 
                                type="text"
                                value={loc}
                                onChange={(e) => updateList(setLocations, locations, index, e.target.value)}
                                className="flex-grow w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                            />
                            <button onClick={() => deleteFromList(setLocations, locations, index)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                      ))}
                  </div>
                  <div className="flex items-center gap-2">
                      <input
                          type="text"
                          placeholder="Nueva ubicación (ej: Sótano)..."
                          value={newLocation}
                          onChange={(e) => setNewLocation(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addToList(setLocations, locations, newLocation, setNewLocation)}
                          className="flex-grow px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm focus:ring-2 focus:ring-sky-500"
                      />
                      <button onClick={() => addToList(setLocations, locations, newLocation, setNewLocation)} className="p-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 shadow-sm active:scale-95 transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                      </button>
                  </div>
            </div>

            {/* Categories */}
            <div data-tour-id="step-4-manage-categories">
                  <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Categorías</h3>
                  <div className="space-y-2 mb-3">
                      {categories.map((cat, index) => (
                          <div key={index} className="flex items-center gap-2 group">
                            <input 
                                type="text"
                                value={cat}
                                onChange={(e) => updateList(setCategories, categories, index, e.target.value)}
                                className="flex-grow w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#84A98C] focus:border-[#84A98C] transition-all"
                            />
                            <button onClick={() => deleteFromList(setCategories, categories, index)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                      ))}
                  </div>
                  <div className="flex items-center gap-2">
                      <input
                          type="text"
                          placeholder="Nueva categoría..."
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addToList(setCategories, categories, newCategory, setNewCategory)}
                          className="flex-grow px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm focus:ring-2 focus:ring-[#84A98C]"
                      />
                       <button onClick={() => addToList(setCategories, categories, newCategory, setNewCategory)} className="p-2 bg-[#84A98C] text-white rounded-lg hover:bg-[#73957a] shadow-sm active:scale-95 transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                      </button>
                  </div>
            </div>
        </div>
        
        <div className="p-5 border-t border-gray-100 bg-gray-50 sticky bottom-0 z-20 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleSaveChanges}
              className="w-full px-4 py-3.5 bg-[#84A98C] text-white rounded-xl hover:bg-[#73957a] font-bold shadow-lg shadow-green-900/10 active:scale-[0.98] transition-all text-sm tracking-wide"
            >
              GUARDAR CAMBIOS
            </button>
            
            <div className="flex justify-between items-center pt-1">
                 <button
                  onClick={onRestartTour}
                  className="px-3 py-2 text-xs text-[#84A98C] hover:bg-green-50 rounded-lg font-bold uppercase tracking-wide transition-colors"
                >
                    Reiniciar Tutorial
                </button>
                <button
                  onClick={onLogout}
                  className="px-3 py-2 text-xs text-red-500 hover:bg-red-50 rounded-lg font-bold uppercase tracking-wide transition-colors"
                >
                  Cerrar Sesión
                </button>
            </div>
          </div>
      </div>
    </div>
  );
};

export default HouseholdSettingsModal;
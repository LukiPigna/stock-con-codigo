import React, { useState } from 'react';
import { Household } from '../types';
import * as DB from '../services/database';

// Fix: Define props interface for type safety.
interface HouseholdSettingsModalProps {
    household: Household;
    onClose: () => void;
    onLogout: () => void;
}

const HouseholdSettingsModal: React.FC<HouseholdSettingsModalProps> = ({ household, onClose, onLogout }) => {
    const [copied, setCopied] = useState(false);
    const [categories, setCategories] = useState(household.categories || []);
    const [newCategory, setNewCategory] = useState('');

    const handleCopy = () => {
        navigator.clipboard.writeText(household.pin).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    const handleCategoryChange = (index: number, value: string) => {
        const updatedCategories = [...categories];
        updatedCategories[index] = value;
        setCategories(updatedCategories);
    };

    const handleDeleteCategory = (index: number) => {
        if (window.confirm(`¿Seguro que quieres eliminar la categoría "${categories[index]}"? Los productos existentes en esta categoría no se borrarán pero deberás re-categorizarlos.`)) {
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

    const handleSaveChanges = () => {
        const cleanedCategories = categories.map(c => c.trim()).filter(c => c !== '');
        // Fix: Explicitly provide the type to `new Set<string>()` to ensure `uniqueCategories` is correctly inferred as `string[]` instead of `unknown[]`.
        const uniqueCategories = Array.from(new Set<string>(cleanedCategories));
        DB.updateHousehold(household.id, { categories: uniqueCategories });
        onClose();
    };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800 text-left">{household.name}</h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        
        <div className="mb-6 bg-slate-50 p-4 rounded-lg text-center">
            <label className="block text-sm font-medium text-gray-700 mb-2">PIN para entrar a esta casa</label>
            <div className="flex items-center justify-center space-x-2">
                <input 
                    type="text" 
                    readOnly 
                    value={household.pin}
                    className="w-40 flex-grow px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm font-mono text-4xl tracking-widest text-center"
                />
                <button 
                    onClick={handleCopy}
                    className={`px-4 py-2 h-14 rounded-md font-semibold text-white transition-colors ${copied ? 'bg-green-500' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                    {copied ? '¡Copiado!' : 'Copiar'}
                </button>
            </div>
             <p className="text-xs text-gray-500 mt-2">Comparte este PIN con tus compañeros de casa.</p>
        </div>

        <div className="border-t pt-4 text-left">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Gestionar Categorías</h3>
            <div className="space-y-2 mb-4 max-h-40 overflow-y-auto pr-2">
                {categories.map((cat, index) => (
                    <div key={index} className="flex items-center space-x-2">
                    <input 
                        type="text"
                        value={cat}
                        onChange={(e) => handleCategoryChange(index, e.target.value)}
                        className="flex-grow w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
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
                    className="flex-grow w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button onClick={handleAddNewCategory} className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 font-semibold">Añadir</button>
            </div>
        </div>
        
        <div className="flex justify-between items-center mt-8">
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold"
            >
              Salir de la casa
            </button>
            <button
              type="button"
              onClick={handleSaveChanges}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-semibold"
            >
              Guardar Cambios
            </button>
          </div>
      </div>
    </div>
  );
};

export default HouseholdSettingsModal;
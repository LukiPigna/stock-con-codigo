import React, { useState } from 'react';
import { Household } from '../types';

interface HouseholdSettingsModalProps {
  household: Household;
  onClose: () => void;
  onLogout: () => void;
}

const HouseholdSettingsModal: React.FC<HouseholdSettingsModalProps> = ({ household, onClose, onLogout }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(household.pin).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement("textarea");
            textArea.value = household.pin;
            textArea.style.position = "fixed";  // Avoid scrolling to bottom
            textArea.style.top = "0";
            textArea.style.left = "0";
            textArea.style.width = "2em";
            textArea.style.height = "2em";
            textArea.style.padding = "0";
            textArea.style.border = "none";
            textArea.style.outline = "none";
            textArea.style.boxShadow = "none";
            textArea.style.background = "transparent";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                }
            } catch (err) {
                console.error('Fallback: Oops, unable to copy', err);
            }
            document.body.removeChild(textArea);
        }
    }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md text-center">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800 text-left">{household.name}</h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        
        <div className="mb-6 bg-slate-50 p-4 rounded-lg">
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
        
        <div className="flex justify-between items-center mt-8">
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold"
            >
              Salir de la casa
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-semibold"
            >
              Cerrar
            </button>
          </div>
      </div>
    </div>
  );
};

export default HouseholdSettingsModal;
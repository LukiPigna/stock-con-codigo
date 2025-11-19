import React, { useState, useEffect, useRef } from 'react';
import { ProductUnit } from '../types';

interface AddProductModalProps {
  onAdd: (name: string, category: string, unit: ProductUnit, note: string, quantity: number, minimumStock: number, location: string, expirationDate: string) => void;
  onClose: () => void;
  categories: string[];
  locations: string[];
}

// Type definition for Web Speech API
declare global {
    interface Window {
        webkitSpeechRecognition: any;
        SpeechRecognition: any;
    }
}

const AddProductModal: React.FC<AddProductModalProps> = ({ onAdd, onClose, categories, locations }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(categories[0] || '');
  const [location, setLocation] = useState<string>('');
  const [unit, setUnit] = useState<ProductUnit>(ProductUnit.Units);
  const [note, setNote] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [minimumStock, setMinimumStock] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [isListening, setIsListening] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Lock body scroll to prevent background scrolling on mobile
  useEffect(() => {
    // Save current scroll position
    const scrollY = window.scrollY;
    // Lock
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    return () => {
        // Unlock
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
    };
  }, []);

  // Voice Recognition Logic
  const handleVoiceInput = () => {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
          alert("Tu navegador no soporta reconocimiento de voz.");
          return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'es-ES';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
          setIsListening(true);
          if (navigator.vibrate) navigator.vibrate(50);
      };
      
      recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          // Capitalize first letter
          const formatted = transcript.charAt(0).toUpperCase() + transcript.slice(1);
          setName(formatted);
          setIsListening(false);
          if (navigator.vibrate) navigator.vibrate([50, 50]);
      };

      recognition.onerror = (event: any) => {
          console.error("Speech error", event.error);
          setIsListening(false);
      };

      recognition.onend = () => setIsListening(false);

      recognition.start();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(navigator.vibrate) navigator.vibrate(15); // Success vibration

    const numQuantity = parseFloat(quantity);
    const numMinimumStock = minimumStock ? parseFloat(minimumStock) : 0;

    if (name.trim() && category && !isNaN(numQuantity) && numQuantity >= 0) {
      onAdd(name.trim(), category, unit, note.trim(), numQuantity, numMinimumStock, location, expirationDate);
    } else if (!category) {
      alert('Por favor, crea una categoría primero.');
    }
  };
  
  const unitOptions = Object.values(ProductUnit);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6">
       {/* Backdrop with glass effect */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in" onClick={onClose}></div>

      {/* Modal Content - Bottom sheet on mobile, centered on desktop */}
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden z-10 flex flex-col relative animate-fade-in transform transition-transform">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur-md z-20 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Nuevo Producto</h2>
            <button onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-500 p-2 rounded-full transition-colors">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar overscroll-contain">
            <form id="add-product-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Name with Voice Input */}
            <div data-tour-id="tour-add-name">
                <label htmlFor="productName" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Nombre del producto *</label>
                <div className="relative">
                    <input
                        id="productName"
                        ref={nameInputRef}
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-4 pr-12 py-3.5 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-[#84A98C] focus:border-[#84A98C] bg-gray-50 text-gray-900 text-lg transition-all"
                        placeholder="Ej: Leche Descremada"
                        autoFocus
                        required
                        autoComplete="off"
                        enterKeyHint="next"
                    />
                    <button
                        type="button"
                        onClick={handleVoiceInput}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all ${isListening ? 'bg-red-100 text-red-600 animate-pulse shadow-red-100 ring-2 ring-red-200' : 'text-gray-400 hover:text-[#84A98C] hover:bg-green-50'}`}
                        title="Dictar nombre"
                    >
                        {isListening ? (
                            <span className="w-5 h-5 block bg-red-500 rounded-full animate-ping"></span>
                        ) : (
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        )}
                    </button>
                </div>
                {isListening && <p className="text-xs text-red-500 mt-1.5 font-medium flex items-center"><span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>Escuchando...</p>}
            </div>

            {/* Quantity & Unit */}
            <div data-tour-id="tour-add-quantity">
                <label htmlFor="productQuantity" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Cantidad Inicial *</label>
                <div className="flex items-stretch space-x-2">
                    <input
                        id="productQuantity"
                        type="number"
                        inputMode="decimal"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-28 px-4 py-2 text-center border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-[#84A98C] bg-gray-50 text-gray-900 text-xl font-mono font-bold"
                        placeholder="1"
                        step={unit === ProductUnit.Units ? "1" : "any"}
                        min="0"
                        required
                    />
                    <div className="flex-grow flex bg-gray-100 rounded-xl p-1 border border-gray-200">
                        {unitOptions.map((u) => (
                            <button
                                type="button"
                                key={u}
                                onClick={() => setUnit(u)}
                                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 focus:outline-none
                                    ${unit === u ? 'bg-white text-[#84A98C] shadow-md ring-1 ring-black/5 transform scale-105' : 'text-gray-500 hover:text-gray-700'}
                                `}
                            >
                                {u}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Categories (Chips) */}
            <div data-tour-id="tour-add-categories">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Categoría *</label>
                {categories.length > 0 ? (
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setCategory(cat)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 border active:scale-95 ${
                            category === cat
                                ? 'bg-[#84A98C] text-white border-[#84A98C] shadow-md shadow-green-900/10'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                    </div>
                ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center text-amber-800 text-sm">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        Configura categorías en el menú de casa.
                    </div>
                )}
            </div>

            {/* Advanced Options Section */}
            <div className="border-t border-gray-100 pt-6">
                <div className="mb-6" data-tour-id="tour-add-location">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Ubicación</label>
                    <div className="flex flex-wrap gap-2">
                        {locations.map((loc) => (
                            <button
                                key={loc}
                                type="button"
                                onClick={() => setLocation(loc === location ? '' : loc)}
                                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 border ${
                                location === loc
                                    ? 'bg-sky-500 text-white border-sky-500 shadow-sm'
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                {loc}
                            </button>
                        ))}
                        {locations.length === 0 && <span className="text-sm text-gray-400 italic">Sin ubicaciones definidas</span>}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div data-tour-id="tour-add-min-stock">
                        <label htmlFor="minimumStock" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                            Alerta Stock Bajo
                        </label>
                        <input
                            id="minimumStock"
                            type="number"
                            inputMode="decimal"
                            value={minimumStock}
                            onChange={(e) => setMinimumStock(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-[#84A98C] focus:border-[#84A98C] bg-gray-50"
                            placeholder="Opcional"
                        />
                    </div>
                    <div data-tour-id="tour-add-expiration">
                        <label htmlFor="expirationDate" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                            Vencimiento
                        </label>
                        <input
                            id="expirationDate"
                            type="date"
                            value={expirationDate}
                            onChange={(e) => setExpirationDate(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-[#84A98C] focus:border-[#84A98C] bg-gray-50"
                        />
                    </div>
                </div>
                
                 <div data-tour-id="tour-add-note">
                    <label htmlFor="productNote" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Notas adicionales</label>
                    <textarea
                        id="productNote"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-[#84A98C] focus:border-[#84A98C] resize-none bg-gray-50"
                        placeholder="Ej: Sin TACC, Comprar marca X..."
                        rows={2}
                    />
                </div>
            </div>
            </form>
        </div>

        <div className="p-4 border-t border-gray-100 bg-white sticky bottom-0 z-20 flex justify-end space-x-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 font-bold text-sm shadow-sm transition-all active:scale-95"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="add-product-form"
              className="px-6 py-3 bg-[#84A98C] text-white rounded-xl hover:bg-[#73957a] font-bold text-sm shadow-lg shadow-green-900/20 transition-all transform active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
              disabled={!category || !name.trim()}
              data-tour-id="tour-add-button"
            >
              Guardar Producto
            </button>
        </div>
      </div>
    </div>
  );
};

export default AddProductModal;
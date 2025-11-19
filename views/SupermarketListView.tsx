import React, { useState, useMemo, useRef } from 'react';
import { Product, ProductUnit } from '../types';
import * as DB from '../services/database';

interface SupermarketListViewProps {
  allProducts: Product[];
  householdId: string;
  onBack: () => void;
  categories: string[];
  isTourActive?: boolean;
  tourState?: 'initial' | 'confirmed' | null;
}

const SupermarketListView: React.FC<SupermarketListViewProps> = ({ 
    allProducts, 
    householdId, 
    onBack, 
    categories, 
    isTourActive, 
    tourState, 
}) => {
  const [productToUpdate, setProductToUpdate] = useState<Product | null>(null);
  const [quantityBought, setQuantityBought] = useState('1');

  const initialShoppingListIds = useRef(new Set(allProducts.filter(p => p.onShoppingList).map(p => p.id)));

  const handleConfirmPurchase = async () => {
    if (!productToUpdate) return;
    if(navigator.vibrate) navigator.vibrate([10, 50, 10]); // Success pattern
    
    const numQuantity = parseFloat(quantityBought);
    if (isNaN(numQuantity) || numQuantity < 0) {
        alert("Por favor, ingresa una cantidad válida.");
        return;
    }

    const newTotal = productToUpdate.quantity + numQuantity;
    await DB.updateProduct(householdId, productToUpdate.id, { quantity: newTotal, onShoppingList: false });
    
    setProductToUpdate(null);
    setQuantityBought('1');
  };

  const handleCheckboxChange = (product: Product) => {
    if (product.id.startsWith('DUMMY_PRODUCT')) return;
    if (!product.onShoppingList) return; 
    if(navigator.vibrate) navigator.vibrate(10);
    setProductToUpdate(product);
  };
  
  const groupedAndSortedProducts = useMemo(() => {
    const listProducts = allProducts.filter(p => initialShoppingListIds.current.has(p.id) || p.id.startsWith('DUMMY_PRODUCT'));
    const grouped: Record<string, { toBuy: Product[], inCart: Product[] }> = {};
    const categoryList = [...categories, 'Sin Categoría'];

    categoryList.forEach(category => {
        const productsInCategory = listProducts.filter(p => (p.category || 'Sin Categoría') === category);
        if (productsInCategory.length === 0) return;

        grouped[category] = {
            toBuy: productsInCategory.filter(p => {
                if (isTourActive && p.id.startsWith('DUMMY_PRODUCT')) return tourState !== 'confirmed';
                return p.onShoppingList;
            }).sort((a,b) => a.name.localeCompare(b.name)),
            inCart: productsInCategory.filter(p => {
                 if (isTourActive && p.id.startsWith('DUMMY_PRODUCT')) return tourState === 'confirmed';
                return !p.onShoppingList;
            }).sort((a,b) => a.name.localeCompare(b.name))
        };
    });

    return grouped;
  }, [allProducts, categories, isTourActive, tourState]);

  const productForModal = productToUpdate;

  return (
    <div className="min-h-screen bg-[#fcfaf5]">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md shadow-sm z-30 border-b border-gray-100" data-tour-id="supermarket-list-header">
        <div className="container mx-auto px-4 py-3 flex items-center">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors" data-tour-id="tour-supermarket-back-button">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-800 ml-2">Carrito de Compras</h1>
        </div>
      </header>

      <main className="container mx-auto p-4 pb-32 animate-fade-in">
        {Object.keys(groupedAndSortedProducts).length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-24 px-6 text-center">
                <div className="bg-emerald-100 p-6 rounded-full mb-6 shadow-inner">
                    <svg className="w-16 h-16 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h2 className="text-2xl text-gray-800 font-bold mb-2">¡Misión Cumplida!</h2>
                <p className="text-gray-500 mb-8 leading-relaxed">Has comprado todo lo que necesitabas. Tu despensa está a salvo.</p>
                <button onClick={onBack} className="px-8 py-3 bg-gray-800 text-white rounded-xl font-bold shadow-lg hover:bg-gray-700 active:scale-95 transition-all">Volver al inicio</button>
            </div>
        ) : (
            Object.keys(groupedAndSortedProducts).map((category) => {
              const items = groupedAndSortedProducts[category];
              if (items.toBuy.length === 0 && items.inCart.length === 0) return null;
              return (
                <div key={category} className="mb-6 bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                  <div className="bg-gray-50 px-5 py-2 border-b border-gray-100 sticky top-0">
                      <h2 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">{category}</h2>
                  </div>
                  <ul className="divide-y divide-gray-50">
                    {items.toBuy.map(product => (
                      <li key={product.id} 
                          className="flex items-center p-4 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors group touch-manipulation"
                          onClick={() => handleCheckboxChange(product)}
                      >
                        <div className="relative flex items-center h-6 pr-2">
                             <div className="h-6 w-6 rounded-full border-2 border-gray-300 group-hover:border-[#84A98C] transition-colors flex items-center justify-center bg-white">
                                 {/* Empty circle for unchecked */}
                             </div>
                        </div>
                        <div className="ml-3 flex-grow">
                            <span className="text-gray-800 font-semibold text-lg leading-tight block">{product.name}</span>
                            {product.note && <p className="text-xs text-gray-500 italic mt-0.5">{product.note}</p>}
                        </div>
                        {/* Quantity Badge */}
                        <div className="flex items-center justify-center bg-gray-100 px-3 py-1.5 rounded-lg ml-2">
                             <span className="text-sm font-bold text-gray-700">{product.quantity}</span>
                             <span className="text-xs font-semibold text-gray-400 ml-1">{product.unit}</span>
                        </div>
                      </li>
                    ))}
                    
                    {/* Items already bought */}
                    {items.inCart.map(product => (
                      <li key={product.id} className="flex items-center p-4 bg-gray-50/50 grayscale transition-all" data-tour-id={product.id.startsWith('DUMMY_PRODUCT') ? 'tour-supermarket-bought-item' : undefined}>
                        <div className="h-6 w-6 flex items-center justify-center bg-emerald-100 rounded-full border border-emerald-200">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                         <div className="ml-4">
                            <span className="text-gray-400 font-medium line-through">{product.name}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
        )}
      </main>

      {/* Quantity Confirm Modal */}
      {productForModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" data-tour-id="tour-supermarket-quantity-modal">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-fade-in">
            <h2 className="text-xl font-bold mb-1 text-gray-800">¿Cuánto compraste?</h2>
            <p className="text-gray-500 mb-6 text-sm">Actualiza el stock de <span className="font-bold text-gray-800">{productForModal.name}</span></p>
            
            <div className="mb-8">
                <div className="flex items-center justify-center bg-gray-50 rounded-2xl px-4 py-4 border border-gray-200 focus-within:ring-2 focus-within:ring-[#84A98C] focus-within:border-[#84A98C] focus-within:bg-white transition-all">
                    <input
                        id="quantity"
                        type="number"
                        inputMode="decimal" // NUMERIC KEYPAD
                        value={quantityBought}
                        onChange={(e) => setQuantityBought(e.target.value)}
                        className="w-full bg-transparent border-none p-0 text-4xl font-bold text-gray-900 focus:ring-0 text-center font-mono"
                        autoFocus
                        onKeyPress={(e) => e.key === 'Enter' && handleConfirmPurchase()}
                        step="any"
                        min="0"
                    />
                    <span className="text-xl font-bold text-gray-400 ml-2 absolute right-10">{productForModal.unit}</span>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setProductToUpdate(null)}
                className="px-4 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-bold text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmPurchase}
                className="px-4 py-3.5 bg-[#84A98C] text-white rounded-xl hover:bg-[#73957a] font-bold text-sm shadow-lg shadow-green-900/20 transition-all active:scale-95"
                data-tour-id="tour-supermarket-confirm"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupermarketListView;
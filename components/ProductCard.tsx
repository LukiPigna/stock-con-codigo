import React, { useState, useRef, useEffect, memo } from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onQuantityChange: (productId: string, delta: number) => void;
  onAddToShoppingList: (productId: string) => void;
  onRemoveFromShoppingList: (productId: string) => void;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onManageBatches: (product: Product) => void;
  isLowStock: boolean;
  isExpiringSoon: boolean;
}

export const categoryColorPalette = [
    { bg: 'bg-blue-100', text: 'text-blue-800' },
    { bg: 'bg-green-100', text: 'text-green-800' },
    { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    { bg: 'bg-purple-100', text: 'text-purple-800' },
    { bg: 'bg-pink-100', text: 'text-pink-800' },
    { bg: 'bg-red-100', text: 'text-red-800' },
    { bg: 'bg-cyan-100', text: 'text-cyan-800' },
    { bg: 'bg-gray-200', text: 'text-gray-800' },
];

export const getCategoryStyle = (categoryName: string) => {
    if (!categoryName) return categoryColorPalette[categoryColorPalette.length - 1];
    let hash = 0;
    for (let i = 0; i < categoryName.length; i++) {
        hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = hash & hash;
    const index = Math.abs(hash % categoryColorPalette.length);
    return categoryColorPalette[index];
};

const ProductCard: React.FC<ProductCardProps> = memo(({ product, onQuantityChange, onAddToShoppingList, onRemoveFromShoppingList, onEdit, onDelete, onManageBatches, isLowStock, isExpiringSoon }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayQuantity = product.unit === 'un.' ? Math.round(product.quantity) : product.quantity;
  const isOutOfStock = displayQuantity <= 0;
  
  const cardStyle = isOutOfStock ? 'opacity-60 border-red-300' : 'border-transparent';
  const categoryStyle = getCategoryStyle(product.category);

  return (
    <div className={`bg-white rounded-xl shadow-lg p-4 flex flex-col justify-between transition-all duration-300 border-2 ${cardStyle} relative`}>
      <div className="absolute top-2 right-2" ref={menuRef}>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
        </button>
        {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl z-20 origin-top-right ring-1 ring-black ring-opacity-5">
                <div className="py-1">
                    <button onClick={() => { onManageBatches(product); setIsMenuOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        Gestionar Stock
                    </button>
                    <button onClick={() => { onEdit(product); setIsMenuOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                        Editar
                    </button>
                    <button onClick={() => { onDelete(product.id); setIsMenuOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        Eliminar
                    </button>
                </div>
            </div>
        )}
      </div>

      <div>
        <div className="flex justify-between items-start mb-1 pr-8">
            <h2 className="text-lg font-bold text-gray-800 break-words flex-1">{product.name}</h2>
            <div className="flex flex-col items-end space-y-1.5 flex-shrink-0 ml-2">
                 <span className={`px-2 py-1 text-xs font-semibold rounded-full ${categoryStyle.bg} ${categoryStyle.text}`}>
                    {product.category}
                </span>
                {(isLowStock || isExpiringSoon) && (
                    <div className="flex items-center space-x-1.5">
                        {isLowStock && !isOutOfStock && (
                            <div title={`Stock bajo (mínimo: ${product.minimumStock})`} className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                        {isExpiringSoon && !isOutOfStock &&(
                            <div title="A punto de vencer" className="w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
         {product.note && <p className="text-sm text-gray-500 italic break-words">{product.note}</p>}
         {isOutOfStock && <p className="text-red-500 text-sm font-semibold mt-1">Sin stock</p>}
      </div>
      <div className="flex flex-col items-center justify-center mt-4">
        <div className="flex items-center justify-center space-x-4 w-full">
            <button
                onClick={() => onQuantityChange(product.id, -1)}
                disabled={isOutOfStock}
                className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-red-500 text-white rounded-full text-3xl font-bold transition-transform duration-150 active:scale-90 disabled:bg-gray-300 disabled:cursor-not-allowed pb-1"
            >
            −
            </button>
            
            <div className="flex items-baseline justify-center text-center w-24">
                <span className="text-4xl font-mono font-bold text-gray-900">{displayQuantity}</span>
                <span className="text-lg font-semibold text-gray-500 ml-1.5">{product.unit}</span>
            </div>
            
            <button
                onClick={() => onQuantityChange(product.id, 1)}
                className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-green-500 text-white rounded-full text-3xl font-bold transition-transform duration-150 active:scale-90 pb-1"
            >
            +
            </button>
        </div>
      </div>
       {!isOutOfStock && (
         product.onShoppingList ? (
            <button onClick={() => onRemoveFromShoppingList(product.id)} className="mt-4 w-full flex items-center justify-center px-3 py-2 bg-orange-100 text-orange-800 rounded-md hover:bg-orange-200 font-semibold transition-colors text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Sacar de la lista
            </button>
         ) : (
            <button onClick={() => onAddToShoppingList(product.id)} className="mt-4 w-full flex items-center justify-center px-3 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 font-semibold transition-colors text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                Anotar para comprar
            </button>
         )
      )}
    </div>
  );
});

export default ProductCard;
import React from 'react';
import { Product, ProductUnit } from '../types';

interface ProductCardProps {
  product: Product;
  onQuantityChange: (productId: string, newQuantity: number) => void;
  onAddToShoppingList: (productId: string) => void;
  onRemoveFromShoppingList: (productId: string) => void;
  tourIdCard?: string;
  tourIdControls?: string;
  tourIdButton?: string;
  tourIdExpiration?: string;
}

export const categoryColorPalette = [
    { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
    { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
    { bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-200' },
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

const getLocationIcon = (locationName?: string): string => {
    if (!locationName) return '';
    const lower = locationName.toLowerCase();
    if (lower.includes('heladera') || lower.includes('refrigerador')) return '❄️';
    if (lower.includes('freezer') || lower.includes('congelador')) return '🧊';
    if (lower.includes('alacena') || lower.includes('despensa')) return '🥫';
    if (lower.includes('baño') || lower.includes('limpieza')) return '🧼';
    if (lower.includes('fruta')) return '🍎';
    return '📍';
};

// FIX: Parse date manually to avoid UTC conversion issues (Off-by-one error)
const getExpirationStatus = (dateString?: string): { status: 'none' | 'expired' | 'nearing' | 'ok'; daysLeft: number } => {
    if (!dateString) return { status: 'none', daysLeft: Infinity };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Correctly parse YYYY-MM-DD to local midnight
    const [year, month, day] = dateString.split('-').map(Number);
    const expirationDate = new Date(year, month - 1, day); 

    const diffTime = expirationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: 'expired', daysLeft: diffDays };
    if (diffDays <= 7) return { status: 'nearing', daysLeft: diffDays };
    return { status: 'ok', daysLeft: diffDays };
};

// Haptic Feedback Utility
const vibrate = (pattern: number | number[] = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
};

const ProductCard: React.FC<ProductCardProps> = ({ product, onQuantityChange, onAddToShoppingList, onRemoveFromShoppingList, tourIdCard, tourIdControls, tourIdButton, tourIdExpiration }) => {
  
  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string for better typing experience
    if (value === '') {
        onQuantityChange(product.id, 0); 
        return;
    }
    const newQuantity = parseFloat(value);
    if (!isNaN(newQuantity) && newQuantity >= 0) {
      onQuantityChange(product.id, newQuantity);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === '' || parseFloat(e.target.value) < 0) {
        onQuantityChange(product.id, 0);
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click if we add that later
    vibrate();
    let newQuantity = product.quantity - 1;
    
    // Smart logic for small units
    if (product.unit !== ProductUnit.Units && product.quantity < 1 && product.quantity > 0) {
        newQuantity = 0;
    }
    // Prevent negative
    onQuantityChange(product.id, Math.max(0, newQuantity));
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    vibrate();
    const newQuantity = product.quantity + 1;
    onQuantityChange(product.id, newQuantity);
  };

  const isOutOfStock = product.quantity === 0;
  const expirationInfo = getExpirationStatus(product.expirationDate);

  const getCardStyle = () => {
    if (isOutOfStock) return 'opacity-75 border-gray-200 bg-gray-50 grayscale-[0.8]';
    if (expirationInfo.status === 'expired') return 'border-red-200 bg-red-50 shadow-sm shadow-red-100 ring-1 ring-red-100';
    if (expirationInfo.status === 'nearing') return 'border-orange-200 bg-orange-50 shadow-sm shadow-orange-100';
    return 'border-transparent bg-white shadow-sm hover:shadow-md border border-gray-100';
  };
  
  const cardStyle = getCardStyle();
  const categoryStyle = getCategoryStyle(product.category);

  // Intelligent slider logic (hidden for now to keep UI cleaner as per request for "perfection", but code remains if needed)
  // Keeping inputs as primary interaction for accuracy
  const showSlider = false; 

  const renderExpirationInfo = () => {
    if (isOutOfStock || expirationInfo.status === 'none' || expirationInfo.status === 'ok') {
        return null;
    }
    
    let text = '';
    let style = '';
    let iconPath = "";

    switch (expirationInfo.status) {
        case 'expired':
            text = `Venció hace ${Math.abs(expirationInfo.daysLeft)} días`;
            style = 'text-red-700 bg-red-100 border border-red-200';
            iconPath = "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z";
            break;
        case 'nearing':
            text = expirationInfo.daysLeft === 0 ? 'Vence hoy' : `Vence en ${expirationInfo.daysLeft} días`;
            style = 'text-orange-700 bg-orange-100 border border-orange-200';
            iconPath = "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z";
            break;
    }

    return (
        <div className={`flex items-center text-[10px] font-bold mt-2 px-2 py-1 rounded-md w-fit ${style}`} data-tour-id={tourIdExpiration}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
            </svg>
            <span>{text}</span>
        </div>
    );
  };

  return (
    <div 
      className={`rounded-2xl p-3 sm:p-4 flex flex-col justify-between transition-all duration-300 ${cardStyle} relative h-full animate-fade-in group touch-manipulation`}
      data-tour-id={tourIdCard}
    >
      <div className="flex-grow">
        <div className="flex justify-between items-start mb-1 gap-2">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 break-words leading-tight">{product.name}</h2>
            <span className={`flex-shrink-0 px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-full border ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}>
                {product.category ? product.category.substring(0, 10) : 'Sin cat.'}
            </span>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-2">
            {product.location && (
                <div className="flex items-center bg-gray-100/80 px-1.5 py-0.5 rounded text-[10px] text-gray-600 border border-gray-200">
                    <span className="mr-1 text-xs">{getLocationIcon(product.location)}</span>
                    <span className="font-medium">{product.location}</span>
                </div>
            )}
        </div>

         {renderExpirationInfo()}
         
         {product.note && (
            <p className="text-xs text-gray-500 italic mt-2 line-clamp-2 leading-relaxed bg-gray-50 p-1.5 rounded border border-gray-100">
                "{product.note}"
            </p>
        )}
        
        {isOutOfStock && (
            <p className="text-red-500 text-xs font-bold mt-2 flex items-center animate-pulse">
                <span className="block w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span>
                Sin stock
            </p>
        )}
      </div>

      <div className="flex flex-col items-center justify-center mt-4">
        <div 
          className="flex items-center justify-center space-x-1 w-full select-none"
          data-tour-id={tourIdControls}
        >
            <button
                onClick={handleDecrement}
                disabled={isOutOfStock}
                className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-white text-red-500 border border-red-100 hover:bg-red-50 rounded-xl text-xl font-bold transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                aria-label="Disminuir cantidad"
            >
                −
            </button>
            
            <div className="flex items-baseline justify-center text-center px-1 flex-grow relative group-focus-within:scale-105 transition-transform">
                <input
                    type="number"
                    inputMode="decimal" // CRITICAL: Shows numeric keypad with dot on iOS/Android
                    enterKeyHint="done"
                    value={product.quantity === 0 ? '' : product.quantity}
                    placeholder="0"
                    onChange={handleQuantityInputChange}
                    onBlur={handleBlur}
                    className="w-16 text-center bg-transparent p-0 text-3xl font-mono font-bold text-gray-800 focus:outline-none focus:text-[#84A98C] transition-colors"
                    step={product.unit === ProductUnit.Grams || product.unit === ProductUnit.Kilograms ? "0.1" : "1"}
                    min="0"
                />
                <span className="text-[10px] font-bold text-gray-400 absolute -bottom-3 left-1/2 transform -translate-x-1/2 uppercase tracking-wide whitespace-nowrap">{product.unit}</span>
            </div>

            <button
                onClick={handleIncrement}
                className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-[#84A98C] text-white hover:bg-[#6f9477] rounded-xl text-xl font-bold transition-all active:scale-90 shadow-md shadow-green-900/10 active:shadow-none"
                aria-label="Aumentar cantidad"
            >
                +
            </button>
        </div>
      </div>
       {!isOutOfStock && (
         product.onShoppingList ? (
            <button
                onClick={() => { vibrate(); onRemoveFromShoppingList(product.id); }}
                className="mt-5 w-full flex items-center justify-center px-3 py-2 bg-orange-50 text-orange-700 border border-orange-200 rounded-xl hover:bg-orange-100 font-bold text-xs transition-all active:scale-[0.98]"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Sacar de lista
            </button>
         ) : (
            <button
                onClick={() => { vibrate(); onAddToShoppingList(product.id); }}
                className="mt-5 w-full flex items-center justify-center px-3 py-2 bg-gray-50 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-100 font-bold text-xs transition-all active:scale-[0.98]"
                data-tour-id={tourIdButton}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                A comprar
            </button>
         )
      )}
    </div>
  );
};

export default ProductCard;
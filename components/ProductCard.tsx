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
    hash = hash & hash; // Ensure 32-bit integer
    const index = Math.abs(hash % categoryColorPalette.length);
    return categoryColorPalette[index];
};

const getLocationIcon = (locationName?: string): string => {
    if (!locationName) return '';
    const lowerCaseName = locationName.toLowerCase();
    if (lowerCaseName.includes('heladera') || lowerCaseName.includes('refrigerador')) return '❄️';
    if (lowerCaseName.includes('freezer') || lowerCaseName.includes('congelador')) return '🧊';
    if (lowerCaseName.includes('alacena') || lowerCaseName.includes('despensa')) return '🥫';
    return '📍';
};

const getExpirationStatus = (dateString?: string): { status: 'none' | 'expired' | 'nearing' | 'ok'; daysLeft: number } => {
    if (!dateString) return { status: 'none', daysLeft: Infinity };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expirationDate = new Date(dateString + 'T00:00:00'); // Handle timezone by setting time explicitly
    expirationDate.setHours(0, 0, 0, 0);

    const diffTime = expirationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: 'expired', daysLeft: diffDays };
    if (diffDays <= 7) return { status: 'nearing', daysLeft: diffDays };
    return { status: 'ok', daysLeft: diffDays };
};


const ProductCard: React.FC<ProductCardProps> = ({ product, onQuantityChange, onAddToShoppingList, onRemoveFromShoppingList, tourIdCard, tourIdControls, tourIdButton, tourIdExpiration }) => {
  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const newQuantity = value === '' ? 0 : parseFloat(value);
    if (!isNaN(newQuantity) && newQuantity >= 0) {
      onQuantityChange(product.id, newQuantity);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === '') {
        onQuantityChange(product.id, 0);
    }
  };

  const handleDecrement = () => {
    const isSliderCondition = product.quantity > 0 && product.quantity <= 1 && product.unit === ProductUnit.Units;
    const newQuantity = isSliderCondition ? 0 : Math.max(0, product.quantity - 1);
    onQuantityChange(product.id, newQuantity);
  };

  const handleIncrement = () => {
    const newQuantity = product.quantity + 1;
    // If incrementing a product counted in units, ensure the result is a whole number.
    // This prevents getting `1.5` when incrementing from `0.5` (from the slider).
    if (product.unit === ProductUnit.Units) {
        onQuantityChange(product.id, Math.ceil(newQuantity));
    } else {
        onQuantityChange(product.id, newQuantity); // Allow decimals for gr/kg
    }
  };

  const isOutOfStock = product.quantity === 0;
  const expirationInfo = getExpirationStatus(product.expirationDate);

  const getCardStyle = () => {
    if (isOutOfStock) return 'opacity-60 border-red-300';
    if (expirationInfo.status === 'expired') return 'border-red-500 bg-red-50';
    if (expirationInfo.status === 'nearing') return 'border-orange-400 bg-orange-50';
    return 'border-transparent bg-white';
  };
  const cardStyle = getCardStyle();
  const categoryStyle = getCategoryStyle(product.category);

  // Expanded slider logic for units, kilograms, and grams
  const showSliderForUnits = product.unit === ProductUnit.Units && product.quantity > 0 && product.quantity <= 1;
  const showSliderForKg = product.unit === ProductUnit.Kilograms && product.quantity > 0 && product.quantity <= 1;
  const showSliderForGr = product.unit === ProductUnit.Grams && product.quantity > 0 && product.quantity < 1000;
  const showSlider = showSliderForUnits || showSliderForKg || showSliderForGr;
  
  let sliderProps = { min: 0, max: 1, step: 0.01 }; // Default for units
  if (product.unit === ProductUnit.Grams) {
      sliderProps = { min: 0, max: 1000, step: 10 };
  } else if (product.unit === ProductUnit.Kilograms) {
      sliderProps = { min: 0, max: 1, step: 0.01 }; // Explicitly for kg
  }

  const renderExpirationInfo = () => {
    if (isOutOfStock || expirationInfo.status === 'none' || expirationInfo.status === 'ok') {
        return null;
    }
    
    let text = '';
    let style = '';
    let icon = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
    );

    switch (expirationInfo.status) {
        case 'expired':
            text = `Venció hace ${Math.abs(expirationInfo.daysLeft)} ${Math.abs(expirationInfo.daysLeft) === 1 ? 'día' : 'días'}`;
            style = 'text-red-700';
            break;
        case 'nearing':
            if (expirationInfo.daysLeft === 0) {
                text = 'Vence hoy';
            } else {
                text = `Vence en ${expirationInfo.daysLeft} ${expirationInfo.daysLeft === 1 ? 'día' : 'días'}`;
            }
            style = 'text-orange-700';
            break;
    }

    return (
        <div className={`flex items-center text-sm font-semibold mt-2 ${style}`} data-tour-id={tourIdExpiration}>
            {icon}
            <span>{text}</span>
        </div>
    );
  };


  return (
    <div 
      className={`rounded-xl shadow-lg p-4 flex flex-col justify-between transition-all duration-300 border-2 ${cardStyle} relative`}
      data-tour-id={tourIdCard}
    >
      <div>
        <div className="flex justify-between items-start mb-2">
            <h2 className="text-lg font-bold text-gray-800 break-words w-4/5">{product.name}</h2>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${categoryStyle.bg} ${categoryStyle.text}`}>
                {product.category}
            </span>
        </div>
        {product.location && (
            <div className="flex items-center space-x-1.5 mb-2">
                <span className="text-sm">{getLocationIcon(product.location)}</span>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">{product.location}</span>
            </div>
        )}
         {renderExpirationInfo()}
         {product.note && (
            <p className="text-sm text-gray-500 italic break-words mt-2">{product.note}</p>
        )}
        {isOutOfStock && <p className="text-red-500 text-sm font-semibold mt-1">Sin stock</p>}
      </div>
      <div className="flex flex-col items-center justify-center mt-4">
        {showSlider && (
             <div className="w-full text-center mb-1">
                {product.unit === ProductUnit.Units ? (
                    <span className="text-sm font-semibold text-gray-600">Última unidad</span>
                ) : (
                    <span className="text-sm font-semibold text-gray-600">
                        ~{Math.round(product.unit === ProductUnit.Kilograms ? product.quantity * 1000 : product.quantity)} gr
                    </span>
                )}
            </div>
        )}
        <div 
          className="flex items-center justify-center space-x-2 w-full"
          data-tour-id={tourIdControls}
        >
            <button
            onClick={handleDecrement}
            disabled={isOutOfStock}
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-red-500 text-white rounded-full text-2xl font-bold transition-transform duration-150 active:scale-90 disabled:bg-gray-300 disabled:cursor-not-allowed pb-0.5"
            >
            −
            </button>
            
            {showSlider ? (
                <div className="flex-grow flex items-center justify-center mx-1">
                    <input
                        type="range"
                        min={sliderProps.min}
                        max={sliderProps.max}
                        step={sliderProps.step}
                        value={product.quantity}
                        onChange={(e) => onQuantityChange(product.id, parseFloat(e.target.value))}
                        className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#84A98C]"
                    />
                </div>
            ) : (
                <div className="flex items-baseline justify-center text-center">
                    <input
                        type="number"
                        value={product.quantity}
                        onChange={handleQuantityInputChange}
                        onBlur={handleBlur}
                        className="w-20 text-center bg-transparent rounded-md p-1 text-3xl font-mono font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#84A98C]"
                        step={product.unit === ProductUnit.Grams || product.unit === ProductUnit.Kilograms ? "0.1" : "1"}
                        min="0"
                    />
                    <span className="text-lg font-semibold text-gray-500 ml-1">{product.unit}</span>
                </div>
            )}

            <button
            onClick={handleIncrement}
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-[#84A98C] text-white rounded-full text-2xl font-bold transition-transform duration-150 active:scale-90 pb-0.5"
            >
            +
            </button>
        </div>
      </div>
       {!isOutOfStock && (
         product.onShoppingList ? (
            <button
                onClick={() => onRemoveFromShoppingList(product.id)}
                className="mt-3 w-full flex items-center justify-center px-3 py-2 bg-orange-100 text-orange-800 rounded-md hover:bg-orange-200 font-semibold transition-colors text-sm"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Sacar de la lista
            </button>
         ) : (
            <button
                onClick={() => onAddToShoppingList(product.id)}
                className="mt-3 w-full flex items-center justify-center px-3 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 font-semibold transition-colors text-sm"
                data-tour-id={tourIdButton}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Anotar para comprar
            </button>
         )
      )}
    </div>
  );
};

export default ProductCard;
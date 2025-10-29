import React from 'react';
import { Product, ProductUnit } from '../types';

interface ProductCardProps {
  product: Product;
  onQuantityChange: (productId: string, newQuantity: number) => void;
  onDelete: (productId: string) => void;
  showDeleteButton: boolean;
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


const ProductCard: React.FC<ProductCardProps> = ({ product, onQuantityChange, onDelete, showDeleteButton }) => {
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
    const newQuantity = Math.max(0, product.quantity - 1);
    onQuantityChange(product.id, newQuantity);
  };

  const handleIncrement = () => {
    onQuantityChange(product.id, product.quantity + 1);
  };

  const isOutOfStock = product.quantity === 0;
  const cardStyle = isOutOfStock ? 'opacity-60 border-red-300' : 'border-transparent';
  const categoryStyle = getCategoryStyle(product.category);

  return (
    <div className={`bg-white rounded-xl shadow-lg p-4 flex flex-col justify-between transition-all duration-300 border-2 ${cardStyle} relative`}>
      {showDeleteButton && (
        <button
          onClick={() => onDelete(product.id)}
          className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors z-20"
          aria-label={`Eliminar ${product.name}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      <div>
        <div className="flex justify-between items-start mb-1">
            <h2 className="text-lg font-bold text-gray-800 break-words w-4/5">{product.name}</h2>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${categoryStyle.bg} ${categoryStyle.text}`}>
                {product.category}
            </span>
        </div>
         {product.note && (
            <p className="text-sm text-gray-500 italic break-words">{product.note}</p>
        )}
        {isOutOfStock && <p className="text-red-500 text-sm font-semibold mt-1">Sin stock</p>}
      </div>
      <div className="flex items-center justify-center mt-4 space-x-2">
        <button
          onClick={handleDecrement}
          disabled={isOutOfStock}
          className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-red-500 text-white rounded-full text-2xl font-bold transition-transform duration-150 active:scale-90 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          -
        </button>
        <div className="flex items-baseline justify-center text-center">
             <input
                type="number"
                value={product.quantity}
                onChange={handleQuantityInputChange}
                onBlur={handleBlur}
                className="w-20 text-center bg-gray-50 rounded-md p-1 text-3xl font-mono font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                step={product.unit === ProductUnit.Grams || product.unit === ProductUnit.Kilograms ? "0.1" : "1"}
                min="0"
            />
            <span className="text-lg font-semibold text-gray-500 ml-1">{product.unit}</span>
        </div>
        <button
          onClick={handleIncrement}
          className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-green-500 text-white rounded-full text-2xl font-bold transition-transform duration-150 active:scale-90"
        >
          +
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
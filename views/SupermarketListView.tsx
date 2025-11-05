import React, { useMemo, useRef } from 'react';
import { Product } from '../types';
import * as DB from '../services/database';

interface SupermarketListViewProps {
  allProducts: Product[];
  householdId: string;
  onBack: () => void;
  categories: string[];
}

const SupermarketListView: React.FC<SupermarketListViewProps> = ({ allProducts, householdId, onBack, categories }) => {
  const initialShoppingListIds = useRef(new Set(allProducts.filter(p => p.onShoppingList).map(p => p.id)));

  const handleCheckboxChange = (product: Product, isChecked: boolean) => {
    DB.updateProduct(householdId, product.id, { onShoppingList: !isChecked });
  };
  
  const shoppingListProducts = useMemo(() => {
     return allProducts.filter(p => initialShoppingListIds.current.has(p.id));
  }, [allProducts]);

  const groupedAndSortedProducts = useMemo(() => {
    const grouped: Record<string, { toBuy: Product[], inCart: Product[] }> = {};
    const categoryOrderSet = new Set([...categories, ...shoppingListProducts.map(p => p.category)]);
    const categoryOrder = Array.from(categoryOrderSet);

    for (const category of categoryOrder) {
        const productsInCategory = shoppingListProducts.filter(p => p.category === category);
        if (productsInCategory.length === 0) continue;

        const toBuy = productsInCategory.filter(p => p.onShoppingList).sort((a,b) => a.name.localeCompare(b.name));
        const inCart = productsInCategory.filter(p => !p.onShoppingList).sort((a,b) => a.name.localeCompare(b.name));

        if (toBuy.length > 0 || inCart.length > 0) {
            grouped[category] = { toBuy, inCart };
        }
    }
    return grouped;
  }, [shoppingListProducts, categories]);

  const allItemsInCart = useMemo(() => {
    return shoppingListProducts.length > 0 && shoppingListProducts.every(p => !p.onShoppingList);
  }, [shoppingListProducts]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 bg-white shadow-md z-10">
        <div className="container mx-auto px-4 py-3 flex items-center">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-xl font-bold text-gray-800 ml-2">Lista del Supermercado</h1>
        </div>
      </header>
      <main className="container mx-auto p-4 pb-20">
        {Object.keys(groupedAndSortedProducts).length === 0 && !allItemsInCart ? (
            <div className="text-center mt-20 px-4">
                <h2 className="text-xl text-gray-500 font-semibold">¡Lista vacía!</h2>
                <p className="text-gray-400 mt-2">Añade productos a la lista desde la pantalla principal.</p>
            </div>
        ) : (
            Object.keys(groupedAndSortedProducts).map((category) => {
              const items = groupedAndSortedProducts[category];
              if (items.toBuy.length === 0 && items.inCart.length === 0) return null;
              
              return (
                <div key={category} className="mb-6">
                  <h2 className="text-lg font-bold text-indigo-700 pb-2 border-b-2 border-indigo-200 mb-3">{category}</h2>
                  <ul className="space-y-3">
                    {items.toBuy.map(product => (
                      <li key={product.id} className="flex items-center bg-white p-3 rounded-lg shadow-sm transition-all duration-300">
                        <input id={`item-${product.id}`} type="checkbox" checked={false} onChange={() => handleCheckboxChange(product, false)} className="h-6 w-6 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                        <label htmlFor={`item-${product.id}`} className="ml-3 cursor-pointer"><span className="text-gray-800 font-medium">{product.name}</span>{product.note && <p className="text-sm text-gray-500 italic">{product.note}</p>}</label>
                      </li>
                    ))}
                    {items.inCart.length > 0 && (
                        <div className="pt-4">
                            <div className="flex items-center text-sm text-gray-500">
                                <span className="flex-grow border-t border-gray-300"></span>
                                <span className="flex-shrink mx-4 font-semibold">En el carrito</span>
                                <span className="flex-grow border-t border-gray-300"></span>
                            </div>
                        </div>
                    )}
                    {items.inCart.map(product => (
                      <li key={product.id} className="flex items-center bg-green-50 p-3 rounded-lg opacity-80 fade-in">
                         <input id={`item-${product.id}`} type="checkbox" checked={true} onChange={() => handleCheckboxChange(product, true)} className="h-6 w-6 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                        <label htmlFor={`item-${product.id}`} className="ml-3 cursor-pointer w-full"><span className="text-gray-600 font-medium line-through">{product.name}</span>{product.note && <p className="text-sm text-gray-500 italic line-through">{product.note}</p>}</label>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
        )}
        {allItemsInCart && (
            <div className="text-center mt-12 p-8 bg-green-100 rounded-lg fade-in">
                <h2 className="text-2xl font-bold text-green-800">¡Felicitaciones!</h2>
                <p className="text-green-700 mt-2">Has completado tu lista de compras.</p>
            </div>
        )}
      </main>
    </div>
  );
};

export default SupermarketListView;
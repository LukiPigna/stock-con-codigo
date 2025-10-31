import React, { useState, useMemo, useRef } from 'react';
import { Product } from '../types';
import * as DB from '../services/database';

interface SupermarketListViewProps {
  allProducts: Product[];
  householdId: string;
  onBack: () => void;
  categories: string[];
}

const SupermarketListView: React.FC<SupermarketListViewProps> = ({ allProducts, householdId, onBack, categories }) => {
  const [productToUpdate, setProductToUpdate] = useState<Product | null>(null);
  const [quantityBought, setQuantityBought] = useState('1');

  // Use a ref to store the set of product IDs that were on the shopping list when the component was first rendered.
  // This ensures that even after a product is "bought" (onShoppingList=false), it still appears in the "in cart" section.
  const initialShoppingListIds = useRef(new Set(allProducts.filter(p => p.onShoppingList).map(p => p.id)));

  const handleConfirmPurchase = async () => {
    if (!productToUpdate) return;
    
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
    if (!product.onShoppingList) return; // Already bought
    setProductToUpdate(product);
  };

  const groupedAndSortedProducts = useMemo(() => {
    const listProducts = allProducts.filter(p => initialShoppingListIds.current.has(p.id));

    const grouped: Record<string, { toBuy: Product[], inCart: Product[] }> = {};

    const categoryList = [...categories, 'Sin Categoría'];

    categoryList.forEach(category => {
        const productsInCategory = listProducts.filter(p => (p.category || 'Sin Categoría') === category);
        if (productsInCategory.length === 0) return;

        grouped[category] = {
            toBuy: productsInCategory.filter(p => p.onShoppingList).sort((a,b) => a.name.localeCompare(b.name)),
            inCart: productsInCategory.filter(p => !p.onShoppingList).sort((a,b) => a.name.localeCompare(b.name))
        };
    });

    return grouped;
  }, [allProducts, categories]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 bg-white shadow-md z-10">
        <div className="container mx-auto px-4 py-3 flex items-center">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-800 ml-2">Lista del Supermercado</h1>
        </div>
      </header>

      <main className="container mx-auto p-4 pb-20">
        {Object.keys(groupedAndSortedProducts).length === 0 ? (
            <div className="text-center mt-20 px-4">
                <h2 className="text-xl text-gray-500 font-semibold">¡Todo listo!</h2>
                <p className="text-gray-400 mt-2">Ya has comprado todo lo de la lista.</p>
            </div>
        ) : (
            // Fix: Replaced `Object.entries` with `Object.keys` to ensure proper type inference for `items`.
            Object.keys(groupedAndSortedProducts).map((category) => {
              const items = groupedAndSortedProducts[category];
              return (
                <div key={category} className="mb-6">
                  <h2 className="text-lg font-bold text-indigo-700 pb-2 border-b-2 border-indigo-200 mb-3">{category}</h2>
                  <ul className="space-y-3">
                    {items.toBuy.map(product => (
                      <li key={product.id} className="flex items-center bg-white p-3 rounded-lg shadow-sm">
                        <input
                          type="checkbox"
                          checked={false}
                          onChange={() => handleCheckboxChange(product)}
                          className="h-6 w-6 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div className="ml-3">
                            <span className="text-gray-800 font-medium">{product.name}</span>
                            {product.note && <p className="text-sm text-gray-500 italic">{product.note}</p>}
                        </div>
                      </li>
                    ))}
                    {items.inCart.map(product => (
                      <li key={product.id} className="flex items-center bg-green-50 p-3 rounded-lg opacity-70">
                        <div className="h-6 w-6 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>
                         <div className="ml-3">
                            <span className="text-gray-600 font-medium line-through">{product.name}</span>
                            {product.note && <p className="text-sm text-gray-500 italic line-through">{product.note}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
        )}
      </main>

      {/* Modal for quantity */}
      {productToUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-2 text-gray-800">¿Cuánto compraste?</h2>
            <p className="text-gray-600 mb-4">Producto: <span className="font-semibold">{productToUpdate.name}</span></p>
            <div className="mb-4">
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                <div className="flex items-baseline">
                    <input
                        id="quantity"
                        type="number"
                        value={quantityBought}
                        onChange={(e) => setQuantityBought(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-xl"
                        autoFocus
                        onKeyPress={(e) => e.key === 'Enter' && handleConfirmPurchase()}
                        step="any"
                        min="0"
                    />
                    <span className="text-lg font-semibold text-gray-500 ml-2">{productToUpdate.unit}</span>
                </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setProductToUpdate(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmPurchase}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-semibold"
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

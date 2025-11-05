import React from 'react';
import { Product } from '../types';

interface SummaryViewProps {
  expiringSoonProducts: Product[];
  lowStockProducts: Product[];
  shoppingListProducts: Product[];
}

const SummaryCard: React.FC<{ product: Product, reason?: string }> = ({ product, reason }) => (
  <li className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
    <div>
      <p className="font-semibold text-gray-800">{product.name}</p>
      {reason && <p className="text-sm text-gray-500">{reason}</p>}
    </div>
    <div className="text-right">
      <p className="font-mono font-bold text-lg text-gray-900">{product.quantity} <span className="text-sm font-semibold text-gray-500">{product.unit}</span></p>
    </div>
  </li>
);

const SummaryView: React.FC<SummaryViewProps> = ({ expiringSoonProducts, lowStockProducts, shoppingListProducts }) => {

  return (
    <main className="container mx-auto p-4 space-y-8 fade-in">
      {(expiringSoonProducts.length === 0 && lowStockProducts.length === 0 && shoppingListProducts.length === 0) && (
         <div className="text-center mt-20 px-4">
            <h2 className="text-xl text-gray-500 font-semibold">¡Todo en orden!</h2>
            <p className="text-gray-400 mt-2">No hay alertas importantes en tu despensa en este momento.</p>
        </div>
      )}

      {expiringSoonProducts.length > 0 && (
        <section>
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 mr-3 bg-red-100 text-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
            </div>
            <div>
                 <h2 className="text-xl font-bold text-gray-800">A punto de vencer</h2>
                 <p className="text-sm text-gray-500">Estos productos vencen en los próximos 7 días.</p>
            </div>
          </div>
          <ul className="space-y-2">
            {expiringSoonProducts.map(p => (
              <SummaryCard key={p.id} product={p} />
            ))}
          </ul>
        </section>
      )}

      {lowStockProducts.length > 0 && (
        <section>
          <div className="flex items-center mb-4">
             <div className="w-8 h-8 mr-3 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-800">Stock bajo</h2>
                <p className="text-sm text-gray-500">Estos productos alcanzaron su stock mínimo.</p>
            </div>
          </div>
          <ul className="space-y-2">
            {lowStockProducts.map(p => (
              <SummaryCard key={p.id} product={p} reason={`Mínimo: ${p.minimumStock} ${p.unit}`} />
            ))}
          </ul>
        </section>
      )}

       {shoppingListProducts.length > 0 && (
        <section>
           <div className="flex items-center mb-4">
             <div className="w-8 h-8 mr-3 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-800">En la lista de compras</h2>
                <p className="text-sm text-gray-500">Productos que tienes anotado para comprar.</p>
            </div>
          </div>
          <ul className="space-y-2">
            {shoppingListProducts.map(p => (
              <SummaryCard key={p.id} product={p} reason={p.note} />
            ))}
          </ul>
        </section>
      )}

    </main>
  );
};

export default SummaryView;

import React, { useState, useEffect, useMemo } from 'react';
import { Product, View, ProductUnit, Household } from '../types';
import * as DB from '../services/database';
import Header from '../components/Header';
import ProductCard, { getCategoryStyle } from '../components/ProductCard';
import AddProductModal from '../components/AddProductModal';
import HouseholdSettingsModal from '../components/HouseholdSettingsModal';

interface PantryViewProps {
  household: Household;
  onLogout: () => void;
  isNew?: boolean;
  onAcknowledgeNew: () => void;
}

const PantryView: React.FC<PantryViewProps> = ({ household, onLogout, isNew, onAcknowledgeNew }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [householdData, setHouseholdData] = useState<Household>(household);
  const [activeView, setActiveView] = useState<View>(View.All);
  const [isAdding, setIsAdding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | 'All'>('All');

  useEffect(() => {
    // Suscribirse a actualizaciones de productos
    const unsubscribeProducts = DB.onProductsUpdate(household.id, (updatedProducts) => {
      setProducts(updatedProducts);
    });

    // Suscribirse a actualizaciones de la casa (para las categorías)
    const unsubscribeHousehold = DB.onHouseholdUpdate(household.id, (updatedHousehold) => {
      setHouseholdData(updatedHousehold);
    });

    // Limpiar las suscripciones al desmontar
    return () => {
      unsubscribeProducts();
      unsubscribeHousehold();
    };
  }, [household.id]);
  
  useEffect(() => {
    if (isNew) {
      setShowSettings(true);
      onAcknowledgeNew();
    }
  }, [isNew, onAcknowledgeNew]);

  useEffect(() => {
    // Reset category filter when switching views
    if (activeView === View.Missing) {
        setCategoryFilter('All');
    }
  }, [activeView]);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    DB.updateProductQuantity(household.id, productId, newQuantity);
  };

  const handleAddProduct = (name: string, category: string, unit: ProductUnit, note: string, quantity: number) => {
    DB.addProduct(household.id, name, category, unit, note, quantity);
    setIsAdding(false);
  };

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto permanentemente?')) {
      DB.deleteProduct(household.id, productId);
    }
  };

  const displayedProducts = useMemo(() => {
    const sortedProducts = [...products].sort((a, b) => a.name.localeCompare(b.name));
    
    if (activeView === View.Missing) {
      return sortedProducts.filter(p => p.quantity === 0);
    }

    if (categoryFilter === 'All') {
        return sortedProducts;
    }

    return sortedProducts.filter(p => p.category === categoryFilter);

  }, [products, activeView, categoryFilter]);

  return (
    <div className="min-h-screen pb-28">
      <Header 
        activeView={activeView} 
        setActiveView={setActiveView}
        householdName={householdData.name}
        onShowSettings={() => setShowSettings(true)}
        onLogout={onLogout}
      />

      <main className="container mx-auto">
        {activeView === View.All && (
            <div className="pl-4 pt-4 mb-2 overflow-x-auto no-scrollbar">
                <div className="flex items-center space-x-3 pb-2">
                    <button
                        onClick={() => setCategoryFilter('All')}
                        className={`px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                            categoryFilter === 'All'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                        }`}
                    >
                        Todas
                    </button>
                    {(householdData.categories || []).map(cat => {
                        const style = getCategoryStyle(cat);
                        const isActive = categoryFilter === cat;
                        const activeBg = style.bg.replace(/-\d+/, '-600');
                        
                        return (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={`px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap transition-colors duration-200 truncate max-w-[150px] focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                    isActive
                                    ? `${activeBg} text-white focus:ring-indigo-500`
                                    : `${style.bg} ${style.text} hover:opacity-80 focus:ring-indigo-400`
                                }`}
                            >
                                {cat}
                            </button>
                        );
                    })}
                </div>
            </div>
        )}

        <div className="p-4">
            {displayedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 -m-2">
                {displayedProducts.map(product => (
                <div key={product.id} className="p-2">
                    <ProductCard
                    product={product}
                    onQuantityChange={handleQuantityChange}
                    onDelete={handleDeleteProduct}
                    showDeleteButton={activeView === View.Missing}
                    />
                </div>
                ))}
            </div>
            ) : (
            <div className="text-center mt-20 px-4">
                <h2 className="text-xl text-gray-500 font-semibold">
                  {activeView === View.All ? 'No hay productos en esta categoría.' : '¡No falta nada!'}
                </h2>
                <p className="text-gray-400 mt-2">
                  {activeView === View.All ? 'Presiona el botón + para agregar uno nuevo.' : 'Todo tu stock está al día.'}
                </p>
            </div>
            )}
        </div>
      </main>

      {isAdding && (
        <AddProductModal
          onAdd={handleAddProduct}
          onClose={() => setIsAdding(false)}
          categories={householdData.categories || []}
        />
      )}

      {showSettings && (
          <HouseholdSettingsModal
            household={householdData}
            onClose={() => setShowSettings(false)}
            onLogout={onLogout}
          />
      )}

      <button
        onClick={() => setIsAdding(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center text-4xl hover:bg-indigo-700 transition-all duration-300 transform hover:scale-110 active:scale-100 z-20"
        aria-label="Agregar producto"
      >
        +
      </button>
    </div>
  );
};

export default PantryView;
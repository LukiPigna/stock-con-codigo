import React, { useState, useEffect, useMemo } from 'react';
import { Product, ProductCategory, View, ProductUnit, Household } from '../types';
import * as DB from '../services/database';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
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
  const [activeView, setActiveView] = useState<View>(View.All);
  const [isAdding, setIsAdding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Suscribirse a actualizaciones en tiempo real
    const unsubscribe = DB.onProductsUpdate(household.id, (updatedProducts) => {
      setProducts(updatedProducts);
    });

    // Limpiar la suscripción al desmontar el componente
    return () => unsubscribe();
  }, [household.id]);
  
  useEffect(() => {
    if (isNew) {
      setShowSettings(true);
      onAcknowledgeNew();
    }
  }, [isNew, onAcknowledgeNew]);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    DB.updateProductQuantity(household.id, productId, newQuantity);
    // No es necesario llamar a setProducts, Firestore se encarga
  };

  const handleAddProduct = (name: string, category: ProductCategory, unit: ProductUnit, note: string) => {
    DB.addProduct(household.id, name, category, unit, note);
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
    return sortedProducts;
  }, [products, activeView]);

  return (
    <div className="min-h-screen pb-28">
      <Header 
        activeView={activeView} 
        setActiveView={setActiveView}
        householdName={household.name}
        onShowSettings={() => setShowSettings(true)}
        onLogout={onLogout}
      />

      <main className="container mx-auto p-4">
        {displayedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {displayedProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onQuantityChange={handleQuantityChange}
                onDelete={handleDeleteProduct}
                showDeleteButton={activeView === View.Missing}
              />
            ))}
          </div>
        ) : (
          <div className="text-center mt-20">
            <h2 className="text-xl text-gray-500 font-semibold">
              {activeView === View.All ? 'No hay productos todavía.' : '¡No falta nada!'}
            </h2>
            <p className="text-gray-400 mt-2">
              {activeView === View.All ? 'Presiona el botón + para agregar uno.' : 'Todo tu stock está al día.'}
            </p>
          </div>
        )}
      </main>

      {isAdding && (
        <AddProductModal
          onAdd={handleAddProduct}
          onClose={() => setIsAdding(false)}
        />
      )}

      {showSettings && (
          <HouseholdSettingsModal
            household={household}
            onClose={() => setShowSettings(false)}
            onLogout={onLogout}
          />
      )}

      <button
        onClick={() => setIsAdding(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center text-4xl hover:bg-indigo-700 transition-all duration-300 transform hover:scale-110 active:scale-100"
        aria-label="Agregar producto"
      >
        +
      </button>
    </div>
  );
};

export default PantryView;
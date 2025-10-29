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

const ZeroQuantityModal: React.FC<{
  product: Product;
  onClose: () => void;
  onAddToShoppingList: () => void;
  onDelete: () => void;
}> = ({ product, onClose, onAddToShoppingList, onDelete }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-sm text-center">
        <h2 className="text-xl font-bold mb-2 text-gray-800">¡Se acabó!</h2>
        <p className="text-gray-600 mb-6">El producto <span className="font-semibold">{product.name}</span> llegó a cero. ¿Qué quieres hacer?</p>
        <div className="flex flex-col space-y-3">
          <button
            onClick={onAddToShoppingList}
            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-semibold"
          >
            Anotar en la lista de Comprar
          </button>
          <button
            onClick={onDelete}
            className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 font-semibold"
          >
            Eliminar producto
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-gray-700 hover:bg-gray-100 font-semibold"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

const MinimumStockModal: React.FC<{
    product: Product;
    onClose: () => void;
    onConfirm: () => void;
}> = ({ product, onClose, onConfirm }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-sm text-center">
                <h2 className="text-xl font-bold mb-2 text-gray-800">Stock Mínimo Alcanzado</h2>
                <p className="text-gray-600 mb-6">
                    Quedan <span className="font-semibold">{product.quantity} {product.unit}</span> de <span className="font-semibold">{product.name}</span>. ¿Quieres anotarlo en la lista para comprar?
                </p>
                <div className="flex flex-col space-y-3">
                    <button
                        onClick={onConfirm}
                        className="w-full px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-semibold"
                    >
                        Sí, anotar para comprar
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 text-gray-700 hover:bg-gray-100 font-semibold"
                    >
                        No, más tarde
                    </button>
                </div>
            </div>
        </div>
    );
};


const PantryView: React.FC<PantryViewProps> = ({ household, onLogout, isNew, onAcknowledgeNew }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [householdData, setHouseholdData] = useState<Household>(household);
  const [activeView, setActiveView] = useState<View>(View.All);
  const [isAdding, setIsAdding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | 'All'>('All');
  const [zeroQuantityProduct, setZeroQuantityProduct] = useState<Product | null>(null);
  const [minStockProduct, setMinStockProduct] = useState<Product | null>(null);

  useEffect(() => {
    const unsubscribeProducts = DB.onProductsUpdate(household.id, (updatedProducts) => {
      setProducts(updatedProducts);
    });

    const unsubscribeHousehold = DB.onHouseholdUpdate(household.id, (updatedHousehold) => {
      setHouseholdData(updatedHousehold);
    });

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

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Lógica de Stock Mínimo
    if (
        product.minimumStock !== undefined &&
        product.quantity > product.minimumStock && // La cantidad anterior era mayor
        newQuantity <= product.minimumStock &&   // La nueva cantidad es menor o igual
        newQuantity > 0 &&                       // Aún no es cero
        !product.onShoppingList                  // Y no está ya en la lista
    ) {
        setMinStockProduct({ ...product, quantity: newQuantity });
    }

    // Actualiza la cantidad en la BD y maneja el modal de stock cero
    if (newQuantity === 0) {
      setZeroQuantityProduct(product);
    } else {
      DB.updateProduct(household.id, productId, { quantity: newQuantity });
    }
  };
  
  const handleAddToShoppingList = (productId: string) => {
      DB.updateProduct(household.id, productId, { onShoppingList: true });
  };

  const handleRemoveFromShoppingList = (productId: string) => {
    DB.updateProduct(household.id, productId, { onShoppingList: false });
  };

  const handleConfirmAddToShoppingList = () => {
    if (zeroQuantityProduct) {
      DB.updateProduct(household.id, zeroQuantityProduct.id, { quantity: 0, onShoppingList: true });
      setZeroQuantityProduct(null);
    }
  };

  const handleConfirmDelete = () => {
    if (zeroQuantityProduct) {
        if (window.confirm(`¿Seguro que quieres eliminar "${zeroQuantityProduct.name}" permanentemente?`)) {
            DB.deleteProduct(household.id, zeroQuantityProduct.id);
            setZeroQuantityProduct(null);
        }
    }
  };

  const handleAddProduct = (name: string, category: string, unit: ProductUnit, note: string, quantity: number, minimumStock?: number) => {
    DB.addProduct(household.id, name, category, unit, note, quantity, minimumStock);
    setIsAdding(false);
  };

  const displayedProducts = useMemo(() => {
    const sortedProducts = [...products].sort((a, b) => a.name.localeCompare(b.name));
    
    let filteredList: Product[];

    if (activeView === View.Shopping) {
      filteredList = sortedProducts.filter(p => p.onShoppingList);
    } else {
      filteredList = sortedProducts;
    }

    if (categoryFilter === 'All') {
        return filteredList;
    }

    return filteredList.filter(p => p.category === categoryFilter);

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
        {(activeView === View.All || activeView === View.Shopping) && (
            <div className="pl-4 pt-4 mb-2 overflow-x-auto no-scrollbar">
                <div className="flex items-center space-x-3 pb-2">
                    <button
                        onClick={() => setCategoryFilter('All')}
                        className={`px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap flex-shrink-0 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
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
                                className={`px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap flex-shrink-0 transition-colors duration-200 truncate max-w-[150px] focus:outline-none focus:ring-2 focus:ring-offset-2 ${
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
                      onAddToShoppingList={handleAddToShoppingList}
                      onRemoveFromShoppingList={handleRemoveFromShoppingList}
                    />
                </div>
                ))}
            </div>
            ) : (
            <div className="text-center mt-20 px-4">
                <h2 className="text-xl text-gray-500 font-semibold">
                  {activeView === View.All ? 'No hay productos en esta categoría.' : '¡Tu lista de compras está vacía!'}
                </h2>
                <p className="text-gray-400 mt-2">
                  {activeView === View.All ? 'Presiona el botón + para agregar uno nuevo.' : 'Añade productos desde la vista principal.'}
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

      {zeroQuantityProduct && (
        <ZeroQuantityModal
            product={zeroQuantityProduct}
            onClose={() => setZeroQuantityProduct(null)}
            onAddToShoppingList={handleConfirmAddToShoppingList}
            onDelete={handleConfirmDelete}
        />
      )}

      {minStockProduct && (
        <MinimumStockModal
            product={minStockProduct}
            onClose={() => setMinStockProduct(null)}
            onConfirm={() => {
                handleAddToShoppingList(minStockProduct.id);
                setMinStockProduct(null);
            }}
        />
      )}

      <button
        onClick={() => setIsAdding(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center text-4xl hover:bg-indigo-700 transition-all duration-300 transform hover:scale-110 active:scale-100 z-20 pb-1"
        aria-label="Agregar producto"
      >
        +
      </button>
    </div>
  );
};

export default PantryView;
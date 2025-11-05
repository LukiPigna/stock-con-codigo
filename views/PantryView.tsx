import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { Product, View, Household, FirebaseUser, ProductBatch } from '../types';
import * as DB from '../services/database';
import Header from '../components/Header';
import ProductCard, { getCategoryStyle } from '../components/ProductCard';
import AddProductModal from '../components/AddProductModal';
import EditProductModal from '../components/EditProductModal';
import HouseholdSettingsModal from '../components/HouseholdSettingsModal';
import SupermarketListView from './SupermarketListView';
import ManageBatchesModal from '../components/ManageBatchesModal';
import BarcodeScannerModal from '../components/BarcodeScannerModal';
import SummaryView from './SummaryView';

interface PantryViewProps {
  household: Household;
  user: FirebaseUser;
  onLogout: () => void;
  isNew?: boolean;
  onAcknowledgeNew: () => void;
}

const MinimumStockModal: React.FC<{ product: Product; onClose: () => void; onConfirm: () => void; }> = memo(({ product, onClose, onConfirm }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-sm text-center">
            <h2 className="text-xl font-bold mb-2 text-gray-800">Stock Mínimo Alcanzado</h2>
            <p className="text-gray-600 mb-6">Quedan <span className="font-semibold">{product.quantity} {product.unit}</span> de <span className="font-semibold">{product.name}</span>. ¿Quieres anotarlo en la lista para comprar?</p>
            <div className="flex flex-col space-y-3">
                <button onClick={onConfirm} className="w-full px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-semibold">Sí, anotar para comprar</button>
                <button onClick={onClose} className="w-full px-4 py-2 text-gray-700 hover:bg-gray-100 font-semibold">No, más tarde</button>
            </div>
        </div>
    </div>
));

const ProductSkeletonCard: React.FC = memo(() => (
    <div className="p-2">
        <div className="bg-white rounded-xl shadow-lg p-4 w-full h-56 animate-shimmer"></div>
    </div>
));

const PantryView: React.FC<PantryViewProps> = ({ household, user, onLogout, isNew, onAcknowledgeNew }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [batchesByProductId, setBatchesByProductId] = useState<Record<string, ProductBatch[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [householdData, setHouseholdData] = useState<Household>(household);
  const [activeView, setActiveView] = useState<View>(View.All);
  const [isAdding, setIsAdding] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToManage, setProductToManage] = useState<Product | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | 'All'>('All');
  const [minStockProduct, setMinStockProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'quantity'>('name');
  const [showNewUserHint, setShowNewUserHint] = useState(isNew);
  const [isScanning, setIsScanning] = useState(false);
  const [addProductInitialData, setAddProductInitialData] = useState<Partial<Omit<Product, 'id' | 'quantity'>> | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'loading' | 'error'>('idle');

  const batchUnsubscribers = useRef<Record<string, () => void>>({});

  useEffect(() => {
    const unsubscribeHousehold = DB.onHouseholdUpdate(household.id, setHouseholdData);
    return () => {
      unsubscribeHousehold();
    };
  }, [household.id]);

  useEffect(() => {
    setIsLoading(true);

    const unsubscribeProducts = DB.onProductsUpdate(household.id, (newProducts) => {
        setProducts(newProducts);
        
        const currentProductIds = new Set(newProducts.map(p => p.id));
        const subscribedProductIds = new Set(Object.keys(batchUnsubscribers.current));

        // Unsubscribe from batches of deleted products
        subscribedProductIds.forEach(productId => {
            if (!currentProductIds.has(productId)) {
                const unsubscriber = batchUnsubscribers.current[productId];
                if (typeof unsubscriber === 'function') {
                    unsubscriber();
                }
                delete batchUnsubscribers.current[productId];
                setBatchesByProductId(prev => {
                    const newState = { ...prev };
                    delete newState[productId];
                    return newState;
                });
            }
        });

        // Subscribe to batches of new products
        newProducts.forEach(product => {
            if (!subscribedProductIds.has(product.id)) {
                batchUnsubscribers.current[product.id] = DB.onBatchesUpdate(
                    household.id,
                    product.id,
                    (batches) => {
                        setBatchesByProductId(prev => ({ ...prev, [product.id]: batches }));
                    }
                );
            }
        });

        setIsLoading(false);
    });

    // Cleanup on component unmount
    return () => {
        unsubscribeProducts();
        Object.values(batchUnsubscribers.current).forEach(unsub => {
            // Fix: Added a check to ensure the unsubscriber is a function before calling it.
            if (typeof unsub === 'function') {
                unsub();
            }
        });
        batchUnsubscribers.current = {};
    };
  }, [household.id]);
  
  useEffect(() => {
    if (isNew) onAcknowledgeNew();
  }, [isNew, onAcknowledgeNew]);
  
  const handleOpenAddModal = useCallback((initialData: Partial<Omit<Product, 'id'|'quantity'>> | null = null) => {
    setAddProductInitialData(initialData);
    setIsAdding(true);
  }, []);

  const handleScanSuccess = useCallback(async (barcode: string) => {
    setIsScanning(false);
    setScanStatus('loading');
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
      const data = await response.json();
      if (data.status === 1) {
        const productName = data.product.product_name || data.product.generic_name || '';
        handleOpenAddModal({ name: productName });
      } else {
        alert('Producto no encontrado. Por favor, introduce los datos manualmente.');
        handleOpenAddModal();
      }
    } catch (error) {
      console.error('Error fetching product data:', error);
      alert('Error al buscar el producto. Revisa tu conexión a internet.');
      handleOpenAddModal();
    } finally {
        setScanStatus('idle');
    }
  }, [handleOpenAddModal]);

  const handleQuantityChange = useCallback(async (productId: string, delta: number) => {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const newQuantity = product.quantity + delta;
      if (newQuantity < 0) return;

      if (delta < 0 && product.minimumStock && product.minimumStock > 0 && product.quantity > product.minimumStock && newQuantity <= product.minimumStock && !product.onShoppingList) {
        setMinStockProduct({ ...product, quantity: newQuantity });
      }
      
      await DB.updateProductQuantity(household.id, productId, delta);
  }, [household.id, products]);

  const handleAddToShoppingList = useCallback((productId: string) => DB.updateProduct(household.id, productId, { onShoppingList: true }), [household.id]);
  const handleRemoveFromShoppingList = useCallback((productId: string) => DB.updateProduct(household.id, productId, { onShoppingList: false }), [household.id]);

  const handleDeleteProduct = useCallback((productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product && window.confirm(`¿Seguro que quieres eliminar "${product.name}" permanentemente?`)) {
        DB.deleteProduct(household.id, productId);
    }
  }, [products, household.id]);

  const handleAddProduct = useCallback(async (productData: Omit<Product, 'id' | 'quantity'>, initialBatch: { quantity: number; expirationDate: string | null}) => {
    await DB.addProduct(household.id, productData, initialBatch);
    setIsAdding(false);
  }, [household.id]);
  
  const handleUpdateProduct = useCallback(async (updatedProduct: Product) => {
    const { id, ...dataToUpdate } = updatedProduct;
    await DB.updateProduct(household.id, id, dataToUpdate);
    setProductToEdit(null);
  }, [household.id]);
  
  const expiringProductIds = useMemo(() => {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const ids = new Set<string>();

    // Fix: Used Object.keys and direct property access to avoid TypeScript inferring 'batches' as 'unknown'.
    Object.keys(batchesByProductId).forEach((productId) => {
      const batches = batchesByProductId[productId];
      if (!batches) return;
      const hasExpiringBatch = batches.some(batch => 
        batch.expirationDate && batch.expirationDate.toDate() < sevenDaysFromNow
      );
      if (hasExpiringBatch) {
        ids.add(productId);
      }
    });
    return ids;
  }, [batchesByProductId]);

  const { lowStockProducts, shoppingListProducts, expiringSoonProducts, filteredProducts } = useMemo(() => {
    const lowStock = products.filter(p => p.minimumStock && p.quantity > 0 && p.quantity <= p.minimumStock);
    const shoppingList = products.filter(p => p.onShoppingList);
    const expiringSoon = products.filter(p => expiringProductIds.has(p.id));
    
    let processedList = [...products];
    if (activeView === View.Shopping) processedList = processedList.filter(p => p.onShoppingList);
    if (categoryFilter !== 'All') processedList = processedList.filter(p => p.category === categoryFilter);
    if (searchQuery) processedList = processedList.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    processedList.sort((a, b) => {
      if (activeView === View.All) {
        if (a.quantity > 0 && b.quantity === 0) return -1;
        if (a.quantity === 0 && b.quantity > 0) return 1;
      }
      if (sortBy === 'quantity') return a.quantity - b.quantity;
      return a.name.localeCompare(b.name);
    });

    return { lowStockProducts: lowStock, shoppingListProducts: shoppingList, expiringSoonProducts: expiringSoon, filteredProducts: processedList };
  }, [products, expiringProductIds, activeView, categoryFilter, searchQuery, sortBy]);

  if (activeView === View.SupermarketList) {
    return <SupermarketListView allProducts={products} householdId={household.id} onBack={() => setActiveView(View.Shopping)} categories={householdData.categories || []} />;
  }

  return (
    <div className="min-h-screen pb-28">
      <Header activeView={activeView} setActiveView={setActiveView} householdName={householdData.name} user={user} onShowSettings={() => setShowSettings(true)} onLogout={onLogout}/>
      
      {activeView === View.Summary ? (
          <SummaryView
            expiringSoonProducts={expiringSoonProducts}
            lowStockProducts={lowStockProducts}
            shoppingListProducts={shoppingListProducts}
          />
      ) : (
        <main className="container mx-auto">
            <div className="p-4 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-grow"><input type="text" placeholder="Buscar producto..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:ring-indigo-500 focus:border-indigo-500"/><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg></div></div>
                    <div className="relative"><select value={sortBy} onChange={e => setSortBy(e.target.value as 'name' | 'quantity')} className="w-full sm:w-auto appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-full bg-white focus:ring-indigo-500 focus:border-indigo-500"><option value="name">Ordenar por Nombre</option><option value="quantity">Ordenar por Cantidad</option></select><div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg></div></div>
                </div>
                <div className="overflow-x-auto no-scrollbar"><div className="flex items-center space-x-3 pb-2">
                    <button onClick={() => setCategoryFilter('All')} className={`px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap flex-shrink-0 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${categoryFilter === 'All' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`}>Todas</button>
                    {(householdData.categories || []).map(cat => {
                        const style = getCategoryStyle(cat); const isActive = categoryFilter === cat; const activeBg = style.bg.replace(/-\d+/, '-600');
                        return (<button key={cat} onClick={() => setCategoryFilter(cat)} className={`px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap flex-shrink-0 transition-colors duration-200 truncate max-w-[150px] focus:outline-none focus:ring-2 focus:ring-offset-2 ${isActive ? `${activeBg} text-white focus:ring-indigo-500` : `${style.bg} ${style.text} hover:opacity-80 focus:ring-indigo-400`}`}>{cat}</button>);
                    })}
                </div></div>
            </div>
            {activeView === View.Shopping && filteredProducts.length > 0 && <div className="px-4 mb-4"><button onClick={() => setActiveView(View.SupermarketList)} className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-green-500 text-white font-bold rounded-lg shadow-md hover:bg-green-600 transition-all"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>Lista completa para el super</button></div>}
            <div className="p-4">
                {isLoading ? (<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 -m-2">{Array.from({ length: 10 }).map((_, i) => <ProductSkeletonCard key={i} />)}</div>)
                : filteredProducts.length > 0 ? (<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 -m-2">{filteredProducts.map(product => (<div key={product.id} className="p-2 fade-in"><ProductCard product={product} onQuantityChange={handleQuantityChange} onAddToShoppingList={handleAddToShoppingList} onRemoveFromShoppingList={handleRemoveFromShoppingList} onEdit={setProductToEdit} onDelete={handleDeleteProduct} onManageBatches={setProductToManage} isLowStock={!!product.minimumStock && product.quantity > 0 && product.quantity <= product.minimumStock} isExpiringSoon={expiringProductIds.has(product.id)} /></div>))}</div>)
                : (<div className="text-center mt-20 px-4"><h2 className="text-xl text-gray-500 font-semibold">{searchQuery ? 'No se encontraron productos.' : 'No hay productos en esta categoría.'}</h2><p className="text-gray-400 mt-2">{searchQuery ? 'Intenta con otra búsqueda.' : 'Presiona el botón + para agregar uno nuevo.'}</p></div>)}
            </div>
        </main>
      )}
      
      {showNewUserHint && <div className="fixed inset-0 bg-black bg-opacity-60 z-30 flex items-end justify-end p-6 fade-in"><div className="relative"><div className="bg-white p-4 rounded-lg shadow-xl text-center"><p className="font-semibold text-gray-800">¡Bienvenido a tu casa!</p><p className="text-gray-600">Haz click aquí para añadir tu primer producto.</p><button onClick={() => setShowNewUserHint(false)} className="mt-2 text-sm text-indigo-600 font-semibold">Entendido</button></div><svg className="absolute text-white h-8 w-8 -bottom-4 right-10 transform -translate-x-1/2" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg></div></div>}

      {isAdding && <AddProductModal initialData={addProductInitialData} onAdd={handleAddProduct} onClose={() => setIsAdding(false)} categories={householdData.categories || []} />}
      {productToEdit && <EditProductModal product={productToEdit} onUpdate={handleUpdateProduct} onClose={() => setProductToEdit(null)} categories={householdData.categories || []} />}
      {showSettings && <HouseholdSettingsModal household={householdData} onClose={() => setShowSettings(false)} onLogout={onLogout} />}
      {minStockProduct && <MinimumStockModal product={minStockProduct} onClose={() => setMinStockProduct(null)} onConfirm={() => { handleAddToShoppingList(minStockProduct.id); setMinStockProduct(null); }} />}
      {productToManage && <ManageBatchesModal product={productToManage} householdId={household.id} onClose={() => setProductToManage(null)} />}
      {isScanning && <BarcodeScannerModal onScanSuccess={handleScanSuccess} onClose={() => setIsScanning(false)} />}
      {scanStatus === 'loading' && <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"><div className="bg-white rounded-lg p-6 text-center"><p className="font-semibold">Buscando producto...</p></div></div>}

      <div className="fixed bottom-6 right-6 flex items-center gap-4 z-40">
        <button onClick={() => setIsScanning(true)} className="w-16 h-16 bg-white text-indigo-600 rounded-full shadow-lg flex items-center justify-center hover:bg-slate-100 transition-all duration-300 transform hover:scale-110 active:scale-100" aria-label="Escanear código de barras">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 002-2v-2" />
          </svg>
        </button>
        <button onClick={() => handleOpenAddModal(null)} className="w-16 h-16 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center text-4xl hover:bg-indigo-700 transition-all duration-300 transform hover:scale-110 active:scale-100 pb-1" aria-label="Agregar producto">+</button>
      </div>
    </div>
  );
};

export default PantryView;
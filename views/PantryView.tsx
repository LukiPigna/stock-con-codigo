import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Product, View, ProductUnit, Household, User } from '../types';
import * as DB from '../services/database';
import Header from '../components/Header';
import ProductCard, { getCategoryStyle } from '../components/ProductCard';
import AddProductModal from '../components/AddProductModal';
import HouseholdSettingsModal from '../components/HouseholdSettingsModal';
import SupermarketListView from './SupermarketListView';
import OnboardingGuide, { TourStep } from '../components/OnboardingGuide';

interface PantryViewProps {
  user: User;
  household: Household;
  onLogout: () => void;
}

const DUMMY_PRODUCT: Product = {
  id: 'DUMMY_PRODUCT',
  name: 'Manzanas',
  quantity: 2,
  category: 'Frutas',
  unit: ProductUnit.Units,
  onShoppingList: false,
  note: 'Producto de ejemplo',
};

const DUMMY_HOUSEHOLD_DATA = {
    categories: ['Frutas', 'Verduras', 'Lácteos'],
    locations: ['Heladera', 'Alacena']
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
            className="w-full px-4 py-3 bg-[#84A98C] text-white rounded-md hover:bg-[#73957a] font-semibold"
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
                        className="w-full px-4 py-3 bg-[#84A98C] text-white rounded-md hover:bg-[#73957a] font-semibold"
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

const getLocationIcon = (locationName?: string): string => {
    if (!locationName) return '❖';
    const lowerCaseName = locationName.toLowerCase();
    if (lowerCaseName.includes('heladera') || lowerCaseName.includes('refrigerador')) return '❄️';
    if (lowerCaseName.includes('freezer') || lowerCaseName.includes('congelador')) return '🧊';
    if (lowerCaseName.includes('alacena') || lowerCaseName.includes('despensa')) return '🥫';
    return '📍';
};

const OnboardingPromptModal: React.FC<{ onStart: () => void; onSkip: () => void }> = ({ onStart, onSkip }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[1100] p-4">
        <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-sm text-center">
            <h2 className="text-xl font-bold mb-2 text-gray-800">¡Bienvenido a tu nueva casa!</h2>
            <p className="text-gray-600 mb-6">¿Te gustaría una guía rápida para aprender a usar la aplicación?</p>
            <div className="flex flex-col space-y-3">
                <button
                    onClick={onStart}
                    className="w-full px-4 py-3 bg-[#84A98C] text-white rounded-md hover:bg-[#73957a] font-semibold"
                >
                    Sí, mostrarme la guía
                </button>
                <button
                    onClick={onSkip}
                    className="w-full px-4 py-2 text-gray-700 hover:bg-gray-100 font-semibold"
                >
                    No, gracias
                </button>
            </div>
        </div>
    </div>
);


const PantryView: React.FC<PantryViewProps> = ({ user, household, onLogout }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [householdData, setHouseholdData] = useState<Household>(household);
  const [activeView, setActiveView] = useState<View>(View.All);
  const [isAdding, setIsAdding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | 'All'>('All');
  const [locationFilter, setLocationFilter] = useState<string | 'All'>('All');
  const [zeroQuantityProduct, setZeroQuantityProduct] = useState<Product | null>(null);
  const [minStockProduct, setMinStockProduct] = useState<Product | null>(null);
  
  // Onboarding tour state
  const [showTourPrompt, setShowTourPrompt] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [tourProducts, setTourProducts] = useState<Product[]>([]);
  const [tourSupermarketState, setTourSupermarketState] = useState<'initial' | 'confirmed'>('initial');

  useEffect(() => {
    if (householdData.tutorialCompleted === false) {
      setShowTourPrompt(true);
    }

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
  }, [household.id, householdData.tutorialCompleted]);
  
  const startTour = useCallback(() => {
      setShowTourPrompt(false);
      setTourProducts([DUMMY_PRODUCT]); // Add dummy product for the tour
      setHouseholdData(prev => ({...prev, ...DUMMY_HOUSEHOLD_DATA})); // Add dummy categories/locations
      setIsTourActive(true);
      setTourStep(0);
      setTourSupermarketState('initial');
  }, []);

  const endTour = useCallback(() => {
      setIsTourActive(false);
      setTourProducts([]); // Clean up dummy product
      // Reload fresh data from DB to remove dummy categories/locations
      DB.getHousehold(household.id).then(hh => hh && setHouseholdData(hh)); 
      DB.markTutorialAsCompleted(household.id);
  }, [household.id]);

  const handleRestartTour = useCallback(() => {
    setShowSettings(false);
    // Delay to allow settings modal to close before starting tour
    setTimeout(() => {
      startTour();
    }, 300);
  }, [startTour]);

  const TOUR_STEPS: TourStep[] = useMemo(() => [
    { // 1
      title: "Paso 1: Invita a miembros",
      content: "Puedes gestionar tu despensa con más gente. Haz clic aquí para abrir los ajustes y compartir tu casa.",
      selector: '[data-tour-id="step-1-settings-button"]',
    },
    { // 2
      title: "Paso 2: Comparte el link",
      content: "Copia y envía este link a quien quieras invitar. ¡Es así de fácil!",
      selector: '[data-tour-id="step-2-invite-button"]',
      before: () => setShowSettings(true),
    },
    { // 3
      title: "Paso 3: Crea Ubicaciones",
      content: "Primero, crea los lugares donde guardas tus cosas, como 'Heladera' o 'Alacena'. Esto te ayudará a encontrar todo más rápido.",
      selector: '[data-tour-id="step-3-manage-locations"]',
    },
    { // 4
      title: "Paso 4: Crea Categorías",
      content: "Ahora, organiza tus productos en categorías como 'Lácteos' o 'Limpieza'. ¡Así tu lista de compras será mucho más clara!",
      selector: '[data-tour-id="step-4-manage-categories"]',
      after: () => setShowSettings(false),
    },
    { // 5
      title: "Paso 5: Añade un producto",
      content: "Usa este botón para añadir nuevos productos. Vamos a ver cómo se hace.",
      selector: '[data-tour-id="step-5-add-button"]',
    },
    { // 6
      title: "Paso 6: Nombre del Producto",
      content: "Empieza por darle un nombre claro y descriptivo a tu producto.",
      selector: '[data-tour-id="tour-add-name"]',
      before: () => setIsAdding(true),
    },
    { // 7
      title: "Paso 7: Añade una Nota",
      content: "Si necesitas recordar algo específico, como 'sin TACC' o 'comprar en la verdulería', este es el lugar.",
      selector: '[data-tour-id="tour-add-note"]',
    },
    { // 8
      title: "Paso 8: Cantidad y Unidad",
      content: "Indica cuánto tienes ahora mismo. Puedes elegir entre unidades, gramos o kilos.",
      selector: '[data-tour-id="tour-add-quantity"]',
    },
    { // 9
      title: "Paso 9: Stock Mínimo",
      content: "Define una cantidad mínima para recibir un aviso cuando el stock esté bajo. ¡Así nunca te quedarás sin nada!",
      selector: '[data-tour-id="tour-add-min-stock"]',
    },
    { // 10
      title: "Paso 10: Elige una Ubicación",
      content: "Asigna el producto a una de las ubicaciones que creaste, como 'Heladera' o 'Alacena'.",
      selector: '[data-tour-id="tour-add-location"]',
    },
    { // 11
      title: "Paso 11: Elige una Categoría",
      content: "Finalmente, asígnale una categoría para que tu lista de compras esté siempre ordenada.",
      selector: '[data-tour-id="tour-add-categories"]',
    },
    { // 12
      title: "Paso 12: ¡Listo para añadir!",
      content: "Cuando termines, haz clic aquí. Para esta guía, he añadido un producto de ejemplo por ti.",
      selector: '[data-tour-id="tour-add-button"]',
      after: () => setIsAdding(false),
    },
    { // 13
      title: "Paso 13: Ajusta el stock",
      content: "Modificar la cantidad es muy sencillo. Usa los botones '+' y '−' para registrar lo que consumes o compras.",
      selector: '[data-tour-id="step-6-quantity-controls"]',
    },
    { // 14
      title: "Paso 14: A la lista de compras",
      content: "Cuando un producto se esté acabando, haz clic aquí para añadirlo directamente a tu lista de compras.",
      selector: '[data-tour-id="step-7-add-to-list-button"]',
      after: () => setTourProducts(prev => prev.map(p => p.id === 'DUMMY_PRODUCT' ? { ...p, onShoppingList: true } : p)),
    },
    { // 15
      title: "Paso 15: ¡Vamos al súper!",
      content: "Todos los productos que anotes aparecerán en la pestaña 'Comprar'. Vamos a ver cómo queda.",
      selector: '[data-tour-id="step-7-shopping-list-tab"]',
      after: () => setActiveView(View.Shopping),
    },
    { // 16
      title: "Paso 16: Lista para el super",
      content: "Para una vista más cómoda en el supermercado, presiona este botón y verás la lista agrupada por categorías.",
      selector: '[data-tour-id="supermarket-button"]',
      after: () => setActiveView(View.SupermarketList),
    },
    { // 17
      title: "Paso 17: Marca lo comprado",
      content: "Al marcar un producto, se actualiza tu stock. Para la guía, haremos clic en Siguiente para simular la compra.",
      selector: '[data-tour-id="tour-supermarket-checkbox"]',
      after: () => {
        setTourSupermarketState('confirmed');
        setTourProducts(prev => prev.map(p => p.id.startsWith('DUMMY_PRODUCT') ? { ...p, quantity: p.quantity + 2, onShoppingList: false } : p));
      },
    },
    { // 18
      title: "Paso 18: ¡Producto en el carrito!",
      content: "¡Perfecto! El producto ya está marcado como comprado. Ahora volvamos para ver cómo se actualizó tu stock.",
      selector: '[data-tour-id="tour-supermarket-bought-item"]'
    },
    { // 19
      title: "Paso 19: Vuelve a la despensa",
      content: "Usa este botón para volver a la vista principal de todos tus productos.",
      selector: '[data-tour-id="tour-supermarket-back-button"]',
      after: () => setActiveView(View.All)
    },
    { // 20
      title: "Paso 20: ¡Stock Actualizado!",
      content: "¡Mira! La cantidad se ha sumado automáticamente a tu inventario. ¡Ya sabes todo lo necesario para empezar!",
      selector: '[data-tour-id="tour-pantry-updated-item"]'
    }
  ], []);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (productId.startsWith('DUMMY_PRODUCT')) {
        setTourProducts(prev => prev.map(p => p.id === productId ? {...p, quantity: newQuantity} : p));
        return;
    }
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (
        product.minimumStock !== undefined &&
        product.minimumStock > 0 &&
        product.quantity > product.minimumStock &&
        newQuantity <= product.minimumStock &&
        newQuantity > 0 &&
        !product.onShoppingList
    ) {
        setMinStockProduct({ ...product, quantity: newQuantity });
    }

    if (newQuantity === 0) {
      setZeroQuantityProduct(product);
    } else {
      DB.updateProduct(household.id, productId, { quantity: newQuantity });
    }
  };
  
  const handleAddToShoppingList = (productId: string) => {
      if (productId.startsWith('DUMMY_PRODUCT')) {
        setTourProducts(prev => prev.map(p => p.id === productId ? {...p, onShoppingList: true} : p));
        return;
      }
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

  const handleAddProduct = async (name: string, category: string, unit: ProductUnit, note: string, quantity: number, minimumStock: number, location: string) => {
    try {
        await DB.addProduct(household.id, name, category, unit, note, quantity, minimumStock, location);
        setIsAdding(false);
    } catch (error) {
        console.error("Failed to add product:", error);
        alert("Error: No se pudo agregar el producto. Por favor, revisa tu conexión a internet y las reglas de seguridad de tu base de datos Firestore.");
    }
  };

  const displayedProducts = useMemo(() => {
    // Combine real products with the current state of tour products
    const currentTourProductState = tourProducts.length > 0 ? { ...tourProducts[0] } : null;
    let combinedProducts = isTourActive && currentTourProductState ? [...products, currentTourProductState] : [...products];

    // Give dummy product a unique ID for the shopping view to avoid key conflicts and simplify logic
    if (isTourActive && activeView === View.Shopping && currentTourProductState) {
        combinedProducts = combinedProducts.map(p => 
            p.id === 'DUMMY_PRODUCT' ? { ...p, id: 'DUMMY_PRODUCT_SHOPPING' } : p
        );
    }

    let processedList = [...combinedProducts];
    
    // Filter by view (Shopping list or All)
    if (activeView === View.Shopping) {
      processedList = processedList.filter(p => p.onShoppingList);
    }

    // Filter by location
    if (locationFilter !== 'All') {
        processedList = processedList.filter(p => p.location === locationFilter);
    }

    // Filter by category
    if (categoryFilter !== 'All') {
      processedList = processedList.filter(p => p.category === categoryFilter);
    }

    // Sort the list
    processedList.sort((a, b) => {
      // For the main view, keep out-of-stock items at the bottom
      if (activeView === View.All) {
        if (a.quantity > 0 && b.quantity === 0) return -1;
        if (a.quantity === 0 && b.quantity > 0) return 1;
      }
      // Default sort by name
      return a.name.localeCompare(b.name);
    });
    
    // During the tour, ensure the dummy product is always first for visibility
    if(isTourActive) {
        processedList.sort((a, b) => {
            if (a.id.startsWith('DUMMY_PRODUCT')) return -1;
            if (b.id.startsWith('DUMMY_PRODUCT')) return 1;
            return 0; // Keep original sort order for other items
        });
    }

    return processedList;
  }, [products, tourProducts, isTourActive, activeView, categoryFilter, locationFilter]);
  
  return (
    <div className="min-h-screen">
      {isTourActive && (
          <OnboardingGuide 
            steps={TOUR_STEPS}
            currentStepIndex={tourStep}
            setCurrentStepIndex={setTourStep}
            onComplete={endTour}
          />
      )}
      {showTourPrompt && (
          <OnboardingPromptModal
              onStart={startTour}
              onSkip={() => {
                  setShowTourPrompt(false);
                  endTour();
              }}
          />
      )}
      
      <div style={{ display: activeView === View.SupermarketList ? 'block' : 'none' }}>
        {activeView === View.SupermarketList && (
           <SupermarketListView
            allProducts={displayedProducts}
            householdId={household.id}
            onBack={() => setActiveView(View.Shopping)}
            categories={householdData.categories || []}
            isTourActive={isTourActive}
            tourState={tourSupermarketState}
          />
        )}
      </div>
      
      <div style={{ display: activeView !== View.SupermarketList ? 'block' : 'none' }}>
        <div className="pb-28">
          <Header 
            activeView={activeView} 
            setActiveView={setActiveView}
            householdName={householdData.name}
            onShowSettings={() => setShowSettings(true)}
            onLogout={onLogout}
          />
          <main className="container mx-auto">
            {(activeView === View.All || activeView === View.Shopping) && (
                <div>
                     <div className="pl-4 pt-4 mb-2 overflow-x-auto no-scrollbar">
                        <div className="flex items-center space-x-3 pb-2">
                            <button
                                onClick={() => setLocationFilter('All')}
                                className={`px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap flex-shrink-0 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center space-x-2 ${
                                    locationFilter === 'All'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0h10a2 2 0 012 2v2M5 7h10" />
                                </svg>
                                <span>Todo</span>
                            </button>
                            {(householdData.locations || []).map(loc => {
                                const isActive = locationFilter === loc;
                                return (
                                    <button
                                        key={loc}
                                        onClick={() => setLocationFilter(loc)}
                                        className={`px-3 py-2 text-sm font-semibold rounded-full whitespace-nowrap flex-shrink-0 transition-colors duration-200 truncate max-w-[150px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center space-x-2 ${
                                            isActive
                                            ? `bg-blue-500 text-white`
                                            : `bg-white hover:bg-gray-100 border border-gray-300 text-gray-700`
                                        }`}
                                    >
                                        <span>{getLocationIcon(loc)}</span>
                                        <span>{loc}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="pl-4 mb-2 overflow-x-auto no-scrollbar">
                        <div className="flex items-center space-x-3 pb-2">
                            <button
                                onClick={() => setCategoryFilter('All')}
                                className={`px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap flex-shrink-0 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#84A98C] ${
                                    categoryFilter === 'All'
                                    ? 'bg-[#84A98C] text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                }`}
                            >
                                Todas
                            </button>
                            {(householdData.categories || []).map(cat => {
                                const style = getCategoryStyle(cat);
                                const isActive = categoryFilter === cat;
                                const activeBg = style.bg.replace(/-\d+/, '-500');
                                
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => setCategoryFilter(cat)}
                                        className={`px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap flex-shrink-0 transition-colors duration-200 truncate max-w-[150px] focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                            isActive
                                            ? `${activeBg} text-white focus:ring-[#84A98C]`
                                            : `${style.bg} ${style.text} hover:opacity-80 focus:ring-[#84A98C]/80`
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {activeView === View.Shopping && displayedProducts.length > 0 && (
              <div className="px-4 mb-4">
                <button
                  onClick={() => setActiveView(View.SupermarketList)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#84A98C] text-white font-bold rounded-lg shadow-md hover:bg-[#73957a] transition-all"
                  data-tour-id="supermarket-button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Lista completa para el super
                </button>
              </div>
            )}

            <div className="p-4">
                {displayedProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 -m-2">
                    {displayedProducts.map(product => {
                        const isDummy = product.id.startsWith('DUMMY_PRODUCT');
                        let tourIdCardValue;
                        if (isDummy && isTourActive && activeView === View.All && tourStep === 19) {
                            tourIdCardValue = 'tour-pantry-updated-item';
                        }
                        
                        return (
                            <div key={product.id} className="p-2">
                                <ProductCard
                                  product={product}
                                  onQuantityChange={handleQuantityChange}
                                  onAddToShoppingList={handleAddToShoppingList}
                                  onRemoveFromShoppingList={handleRemoveFromShoppingList}
                                  tourIdControls={isDummy && activeView === View.All && tourStep === 12 ? 'step-6-quantity-controls' : undefined}
                                  tourIdButton={isDummy && activeView === View.All && tourStep === 13 ? 'step-7-add-to-list-button' : undefined}
                                  tourIdCard={tourIdCardValue}
                                />
                            </div>
                        );
                    })}
                </div>
                ) : (
                <div className="text-center mt-20 px-4">
                    <h2 className="text-xl text-gray-500 font-semibold">
                      {activeView === View.All ? 'No hay productos que coincidan con los filtros.' : '¡Tu lista de compras está vacía!'}
                    </h2>
                    <p className="text-gray-400 mt-2">
                      {activeView === View.All ? 'Prueba a cambiar los filtros o presiona el botón + para agregar uno nuevo.' : 'Añade productos desde la vista principal.'}
                    </p>
                </div>
                )}
            </div>
          </main>
           <button
            onClick={() => setIsAdding(true)}
            className="fixed bottom-6 right-6 w-16 h-16 bg-[#84A98C] text-white rounded-full shadow-lg flex items-center justify-center text-4xl hover:bg-[#73957a] transition-all duration-300 transform hover:scale-110 active:scale-100 z-20 pb-1"
            aria-label="Agregar producto"
            data-tour-id="step-5-add-button"
          >
            +
          </button>
        </div>
      </div>

      {isAdding && (
        <AddProductModal
          onAdd={handleAddProduct}
          onClose={() => setIsAdding(false)}
          categories={householdData.categories || []}
          locations={householdData.locations || []}
        />
      )}

      {showSettings && (
          <HouseholdSettingsModal
            currentUser={user}
            household={householdData}
            onClose={() => setShowSettings(false)}
            onLogout={onLogout}
            onRestartTour={handleRestartTour}
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
                DB.updateProduct(household.id, minStockProduct.id, { onShoppingList: true });
                setMinStockProduct(null);
            }}
        />
      )}
    </div>
  );
};

export default PantryView;
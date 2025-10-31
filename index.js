
// --- CONFIGURACIÓN DE FIREBASE ---
var firebaseConfig = {
    apiKey: "AIzaSyBiGOD4JTGeSCRV9coKn27M-f5bh_kR9sE",
    authDomain: "control-stock-5cd53.firebaseapp.com",
    projectId: "control-stock-5cd53",
    storageBucket: "control-stock-5cd53.appspot.com",
    messagingSenderId: "649466613337",
    appId: "1:649466613337:web:af6371ee769c6fdb1aeb48"
};

// --- ENUMS Y CONSTANTES ---
var ProductUnit = {
    Units: 'un.',
    Grams: 'gr',
    Kilograms: 'kg',
};

var View = {
    All: 'All',
    Shopping: 'Shopping',
    SupermarketList: 'SupermarketList',
};

var categoryColorPalette = [
    { bg: 'bg-blue-100', text: 'text-blue-800' },
    { bg: 'bg-green-100', text: 'text-green-800' },
    { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    { bg: 'bg-purple-100', text: 'text-purple-800' },
    { bg: 'bg-pink-100', text: 'text-pink-800' },
    { bg: 'bg-red-100', text: 'text-red-800' },
    { bg: 'bg-cyan-100', text: 'text-cyan-800' },
    { bg: 'bg-gray-200', text: 'text-gray-800' },
];

// --- ESTADO DE LA APLICACIÓN ---
var state = {
    appState: 'login', // 'login' | 'pantry'
    household: null,
    products: [],
    isNewHousehold: false,
    activeView: View.All,
    categoryFilter: 'All',
    pinInput: '',
    loginError: '',
    isLoading: false,
    // Referencias a las funciones de desuscripción de Firestore
    unsubscribeProducts: function() {},
    unsubscribeHousehold: function() {},
};

// --- SERVICIOS DE BASE DE DATOS (Módulo DB) ---
var DB = (function() {
    var db;
    var HOUSEHOLDS_COLLECTION = 'households';
    var PRODUCTS_SUBCOLLECTION = 'products';

    function initDB() {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
    }

    function generatePin() {
        return new Promise(function(resolve) {
            var pin;
            var isUnique = false;
            
            function checkPin() {
                if (isUnique) {
                    resolve(pin);
                    return;
                }
                pin = Math.floor(1000 + Math.random() * 9000).toString();
                db.collection(HOUSEHOLDS_COLLECTION).where('pin', '==', pin).get().then(function(q) {
                    if (q.empty) {
                        isUnique = true;
                    }
                    checkPin();
                });
            }
            checkPin();
        });
    }

    return {
        initDB: initDB,
        loginWithPin: function(pin) {
            return db.collection(HOUSEHOLDS_COLLECTION).where('pin', '==', pin).limit(1).get().then(function(querySnapshot) {
                if (querySnapshot.empty) return null;
                var doc = querySnapshot.docs[0];
                return { id: doc.id, ...doc.data() };
            });
        },
        createHousehold: function(name) {
            return generatePin().then(function(newPin) {
                var newHouseholdData = { name: name, pin: newPin, categories: ['Esenciales', 'Boludez'] };
                return db.collection(HOUSEHOLDS_COLLECTION).add(newHouseholdData).then(function(docRef) {
                    return { id: docRef.id, ...newHouseholdData };
                });
            });
        },
        onHouseholdUpdate: function(householdId, callback) {
            return db.collection(HOUSEHOLDS_COLLECTION).doc(householdId).onSnapshot(function(doc) {
                if (doc.exists) callback({ id: doc.id, ...doc.data() });
            });
        },
        updateHousehold: function(householdId, data) {
            return db.collection(HOUSEHOLDS_COLLECTION).doc(householdId).update(data);
        },
        onProductsUpdate: function(householdId, callback) {
            return db.collection(HOUSEHOLDS_COLLECTION).doc(householdId).collection(PRODUCTS_SUBCOLLECTION).onSnapshot(function(snapshot) {
                var products = snapshot.docs.map(function(doc) {
                    var data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        onShoppingList: data.onShoppingList || false,
                        minimumStock: data.minimumStock !== undefined ? data.minimumStock : 0,
                    };
                });
                callback(products);
            });
        },
        addProduct: function(householdId, name, category, unit, note, quantity, minimumStock) {
            var newProductData = { name: name, category: category, quantity: quantity, unit: unit, note: note, onShoppingList: false, minimumStock: minimumStock };
            return db.collection(HOUSEHOLDS_COLLECTION).doc(householdId).collection(PRODUCTS_SUBCOLLECTION).add(newProductData).then(function(docRef) {
                return { id: docRef.id, ...newProductData };
            });
        },
        updateProduct: function(householdId, productId, data) {
            return db.collection(HOUSEHOLDS_COLLECTION).doc(householdId).collection(PRODUCTS_SUBCOLLECTION).doc(productId).update(data);
        },
        deleteProduct: function(householdId, productId) {
            return db.collection(HOUSEHOLDS_COLLECTION).doc(householdId).collection(PRODUCTS_SUBCOLLECTION).doc(productId).delete();
        }
    };
})();

// --- FUNCIONES DE RENDERIZADO (Vistas y Componentes) ---
var root = document.getElementById('root');

function getCategoryStyle(categoryName) {
    if (!categoryName) return categoryColorPalette[categoryColorPalette.length - 1];
    var hash = 0;
    for (var i = 0; i < categoryName.length; i++) {
        hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = hash & hash;
    var index = Math.abs(hash % categoryColorPalette.length);
    return categoryColorPalette[index];
}

function renderLoginView() {
    var pinDotsHTML = Array.apply(null, Array(4)).map(function(_, i) {
        return (
            '<div class="w-8 h-8 rounded-full transition-all duration-200 ' +
            (state.loginError ? 'bg-red-500' : 
            state.isLoading ? 'bg-yellow-400 animate-pulse' :
            state.pinInput.length > i ? 'bg-indigo-600' : 'bg-gray-300') +
            '"></div>'
        );
    }).join('');

    return (
        '<div class="min-h-screen flex flex-col justify-center items-center bg-slate-100 p-4" id="login-view">' +
            '<div class="text-center mb-8">' +
                '<h1 class="text-3xl font-bold text-gray-800">Control de Despensa</h1>' +
                '<p class="text-lg text-gray-600 mt-2">Ingresa el PIN de tu casa</p>' +
            '</div>' +
            '<div class="w-full max-w-xs flex flex-col items-center">' +
                '<div class="flex justify-center items-center space-x-4 mb-8">' + pinDotsHTML + '</div>' +
                '<div class="flex flex-col items-center space-y-5" id="numpad">' +
                    [['1','2','3'], ['4','5','6'], ['7','8','9']].map(function(row) {
                        return (
                            '<div class="flex space-x-5">' +
                                row.map(function(key) {
                                    return '<button data-key="' + key + '" class="numpad-btn w-20 h-20 bg-white/50 rounded-full text-3xl font-light text-gray-800 flex items-center justify-center transition-transform active:scale-90">' + key + '</button>';
                                }).join('') +
                            '</div>'
                        );
                    }).join('') +
                    '<div class="flex space-x-5">' +
                        '<div class="w-20 h-20"></div>' +
                        '<button data-key="0" class="numpad-btn w-20 h-20 bg-white/50 rounded-full text-3xl font-light text-gray-800 flex items-center justify-center transition-transform active:scale-90">0</button>' +
                        '<button data-key="backspace" class="numpad-btn w-20 h-20 bg-white/50 rounded-full text-2xl text-gray-800 flex items-center justify-center transition-transform active:scale-90">' +
                            '<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">' +
                                '<path stroke-linecap="round" stroke-linejoin="round" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 002.828 0L21 12M3 12l6.414-6.414a2 2 0 012.828 0L21 12"></path>' +
                            '</svg>' +
                        '</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="mt-12 text-center">' +
                '<button id="show-create-modal" class="text-indigo-600 hover:text-indigo-800 font-semibold" ' + (state.isLoading ? 'disabled' : '') + '>' +
                    'Crear nueva casa' +
                '</button>' +
            '</div>' +
        '</div>'
    );
}

function renderPantryView() {
    // Lógica de productos a mostrar
    var displayedProducts = (function() {
        var list = state.products.slice(); // Use slice() for ES5 compatibility instead of spread operator
        if (state.activeView === View.Shopping) {
            list = list.filter(function(p) { return p.onShoppingList; });
        }
        if (state.categoryFilter !== 'All') {
            list = list.filter(function(p) { return p.category === state.categoryFilter; });
        }
        list.sort(function(a, b) {
            if (state.activeView === View.All) {
                if (a.quantity > 0 && b.quantity === 0) return -1;
                if (a.quantity === 0 && b.quantity > 0) return 1;
            }
            return a.name.localeCompare(b.name);
        });
        return list;
    })();

    var categories = state.household.categories || [];

    return (
        '<div class="min-h-screen pb-28">' +
            '<!-- Header -->' +
            '<header class="bg-white shadow-md sticky top-0 z-30">' +
                '<div class="container mx-auto px-4 py-4">' +
                    '<div class="flex justify-between items-center mb-4">' +
                        '<div class="flex items-center space-x-2">' +
                            '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>' +
                            '<h1 class="text-xl font-bold text-gray-800">' + state.household.name + '</h1>' +
                        '</div>' +
                        '<div class="flex items-center space-x-3">' +
                            '<button data-action="show-settings" class="p-2 rounded-full hover:bg-gray-200 transition-colors" aria-label="Configuración de la casa">' +
                                '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-600 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-1a6 6 0 00-1.78-4.125a4 4 0 00-6.44 0A6 6 0 003 20v1h12z"></path></svg>' +
                            '</button>' +
                            '<button data-action="logout" class="p-2 rounded-full hover:bg-gray-200 transition-colors" aria-label="Cerrar sesión">' +
                                '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-600 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>' +
                            '</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="flex justify-center bg-slate-200 p-1 rounded-lg">' +
                        '<button data-view="' + View.All + '" class="view-tab w-1/2 py-2 px-4 rounded-md font-semibold transition-colors duration-300 ' + (state.activeView === View.All ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-indigo-100 hover:text-indigo-600') + '">Todos</button>' +
                        '<button data-view="' + View.Shopping + '" class="view-tab w-1/2 py-2 px-4 rounded-md font-semibold transition-colors duration-300 ' + (state.activeView === View.Shopping ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-indigo-100 hover:text-indigo-600') + '">Comprar</button>' +
                    '</div>' +
                '</div>' +
            '</header>' +
            '<main class="container mx-auto" id="pantry-content">' +
                '<!-- Filtros de categoría -->' +
                '<div class="pl-4 pt-4 mb-2 overflow-x-auto no-scrollbar">' +
                    '<div class="flex items-center space-x-3 pb-2">' +
                        '<button data-category="All" class="category-filter px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap flex-shrink-0 transition-colors duration-200 ' + (state.categoryFilter === 'All' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300') + '">Todas</button>' +
                        categories.map(function(cat) {
                            var style = getCategoryStyle(cat);
                            var isActive = state.categoryFilter === cat;
                            var activeBg = style.bg.replace(/-\d+/, '-600');
                            return '<button data-category="' + cat + '" class="category-filter px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap flex-shrink-0 transition-colors duration-200 truncate max-w-[150px] ' + (isActive ? activeBg + ' text-white' : style.bg + ' ' + style.text + ' hover:opacity-80') + '">' + cat + '</button>';
                        }).join('') +
                    '</div>' +
                '</div>' +
                
                '<!-- Botón Lista Supermercado -->' +
                (state.activeView === View.Shopping && displayedProducts.length > 0 ? (
                    '<div class="px-4 mb-4">' +
                        '<button data-action="show-supermarket-list" class="w-full flex items-center justify-center gap-2 py-3 px-4 bg-green-500 text-white font-bold rounded-lg shadow-md hover:bg-green-600 transition-all">' +
                            '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>' +
                            'Lista completa para el super' +
                        '</button>' +
                    '</div>'
                ) : '') +

                '<!-- Grilla de productos -->' +
                '<div class="p-4">' +
                    (displayedProducts.length > 0 ? (
                        '<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 -m-2" id="product-grid">' +
                            displayedProducts.map(function(p) { return renderProductCard(p); }).join('') +
                        '</div>'
                    ) : (
                        '<div class="text-center mt-20 px-4">' +
                            '<h2 class="text-xl text-gray-500 font-semibold">' + (state.activeView === View.All ? 'No hay productos en esta categoría.' : '¡Tu lista de compras está vacía!') + '</h2>' +
                            '<p class="text-gray-400 mt-2">' + (state.activeView === View.All ? 'Presiona el botón + para agregar uno nuevo.' : 'Añade productos desde la vista principal.') + '</p>' +
                        '</div>'
                    )) +
                '</div>' +
            '</main>' +

            '<!-- Botón flotante para agregar producto -->' +
            '<button data-action="show-add-modal" class="fixed bottom-6 right-6 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center text-4xl hover:bg-indigo-700 transition-all duration-300 transform hover:scale-110 active:scale-100 z-20 pb-1" aria-label="Agregar producto">+</button>' +
        '</div>'
    );
}

function renderProductCard(product) {
    var isOutOfStock = product.quantity === 0;
    var cardStyle = isOutOfStock ? 'opacity-60 border-red-300' : 'border-transparent';
    var categoryStyle = getCategoryStyle(product.category);

    var showSliderForUnits = product.unit === ProductUnit.Units && product.quantity > 0 && product.quantity <= 1;
    var showSliderForKg = product.unit === ProductUnit.Kilograms && product.quantity > 0 && product.quantity <= 1;
    var showSliderForGr = product.unit === ProductUnit.Grams && product.quantity > 0 && product.quantity < 1000;
    var showSlider = showSliderForUnits || showSliderForKg || showSliderForGr;

    var sliderProps = { min: 0, max: 1, step: 0.01 };
    if (product.unit === ProductUnit.Grams) sliderProps = { min: 0, max: 1000, step: 10 };
    else if (product.unit === ProductUnit.Kilograms) sliderProps = { min: 0, max: 1, step: 0.01 };

    return (
        '<div class="p-2">' +
            '<div class="bg-white rounded-xl shadow-lg p-4 flex flex-col justify-between transition-all duration-300 border-2 ' + cardStyle + ' relative h-full">' +
                '<div>' +
                    '<div class="flex justify-between items-start mb-1">' +
                        '<h2 class="text-lg font-bold text-gray-800 break-words w-4/5">' + product.name + '</h2>' +
                        '<span class="px-2 py-1 text-xs font-semibold rounded-full ' + categoryStyle.bg + ' ' + categoryStyle.text + '">' + product.category + '</span>' +
                    '</div>' +
                    (product.note ? '<p class="text-sm text-gray-500 italic break-words">' + product.note + '</p>' : '') +
                    (isOutOfStock ? '<p class="text-red-500 text-sm font-semibold mt-1">Sin stock</p>' : '') +
                '</div>' +
                '<div class="flex flex-col items-center justify-center mt-4">' +
                    (showSlider ? (
                        '<div class="w-full text-center mb-1">' +
                            '<span class="text-sm font-semibold text-gray-600">' + (product.unit === ProductUnit.Units ? 'Última unidad' : '~' + Math.round(product.unit === ProductUnit.Kilograms ? product.quantity * 1000 : product.quantity) + ' gr') + '</span>' +
                        '</div>') : ''
                    ) +
                    '<div class="flex items-center justify-center space-x-2 w-full">' +
                        '<button data-action="decrement-quantity" data-product-id="' + product.id + '" ' + (isOutOfStock ? 'disabled' : '') + ' class="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-red-500 text-white rounded-full text-2xl font-bold transition-transform duration-150 active:scale-90 disabled:bg-gray-300 disabled:cursor-not-allowed pb-0.5">−</button>' +
                        (showSlider ? (
                            '<div class="flex-grow flex items-center justify-center mx-1">' +
                                '<input type="range" min="' + sliderProps.min + '" max="' + sliderProps.max + '" step="' + sliderProps.step + '" value="' + product.quantity + '" data-action="range-quantity" data-product-id="' + product.id + '" class="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600">' +
                            '</div>'
                        ) : (
                            '<div class="flex items-baseline justify-center text-center">' +
                                '<input type="number" value="' + product.quantity + '" data-action="input-quantity" data-product-id="' + product.id + '" class="w-20 text-center bg-gray-50 rounded-md p-1 text-3xl font-mono font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" step="' + (product.unit === ProductUnit.Units ? '1' : '0.1') + '" min="0">' +
                                '<span class="text-lg font-semibold text-gray-500 ml-1">' + product.unit + '</span>' +
                            '</div>'
                        )) +
                        '<button data-action="increment-quantity" data-product-id="' + product.id + '" class="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-green-500 text-white rounded-full text-2xl font-bold transition-transform duration-150 active:scale-90 pb-0.5">+</button>' +
                    '</div>' +
                '</div>' +
                (!isOutOfStock ? (
                    product.onShoppingList ? (
                        '<button data-action="remove-from-list" data-product-id="' + product.id + '" class="mt-3 w-full flex items-center justify-center px-3 py-2 bg-orange-100 text-orange-800 rounded-md hover:bg-orange-200 font-semibold transition-colors text-sm">' +
                            '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>' +
                            'Sacar de la lista' +
                        '</button>'
                    ) : (
                        '<button data-action="add-to-list" data-product-id="' + product.id + '" class="mt-3 w-full flex items-center justify-center px-3 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 font-semibold transition-colors text-sm">' +
                            '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>' +
                            'Anotar para comprar' +
                        '</button>'
                    )
                ) : '') +
            '</div>' +
        '</div>'
    );
}

function renderSupermarketListView() {
    var initialShoppingListIds = {};
    state.products.filter(function(p) { return p.onShoppingList; }).forEach(function(p) { initialShoppingListIds[p.id] = true; });
    var listProducts = state.products.filter(function(p) { return initialShoppingListIds[p.id]; });

    var grouped = {};
    var categoryList = (state.household.categories || []).concat(['Sin Categoría']);

    categoryList.forEach(function(category) {
        var productsInCategory = listProducts.filter(function(p) { return (p.category || 'Sin Categoría') === category; });
        if (productsInCategory.length === 0) return;

        grouped[category] = {
            toBuy: productsInCategory.filter(function(p) { return p.onShoppingList; }).sort(function(a,b) { return a.name.localeCompare(b.name); }),
            inCart: productsInCategory.filter(function(p) { return !p.onShoppingList; }).sort(function(a,b) { return a.name.localeCompare(b.name); })
        };
    });

    return (
        '<div class="min-h-screen bg-slate-50">' +
            '<header class="sticky top-0 bg-white shadow-md z-10">' +
                '<div class="container mx-auto px-4 py-3 flex items-center">' +
                    '<button data-action="back-to-pantry" class="p-2 -ml-2 rounded-full hover:bg-gray-200">' +
                        '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-700 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"></path></svg>' +
                    '</button>' +
                    '<h1 class="text-xl font-bold text-gray-800 ml-2">Lista del Supermercado</h1>' +
                '</div>' +
            '</header>' +
            '<main class="container mx-auto p-4 pb-20">' +
                (Object.keys(grouped).length === 0 ? (
                    '<div class="text-center mt-20 px-4">' +
                        '<h2 class="text-xl text-gray-500 font-semibold">¡Todo listo!</h2>' +
                        '<p class="text-gray-400 mt-2">Ya has comprado todo lo de la lista.</p>' +
                    '</div>'
                ) : Object.keys(grouped).map(function(category) {
                    return (
                    '<div class="mb-6">' +
                        '<h2 class="text-lg font-bold text-indigo-700 pb-2 border-b-2 border-indigo-200 mb-3">' + category + '</h2>' +
                        '<ul class="space-y-3">' +
                            grouped[category].toBuy.map(function(p) {
                                return (
                                '<li class="flex items-center bg-white p-3 rounded-lg shadow-sm">' +
                                    '<input type="checkbox" data-action="buy-item" data-product-id="' + p.id + '" class="h-6 w-6 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer">' +
                                    '<div class="ml-3">' +
                                        '<span class="text-gray-800 font-medium">' + p.name + '</span>' +
                                        (p.note ? '<p class="text-sm text-gray-500 italic">' + p.note + '</p>' : '') +
                                    '</div>' +
                                '</li>'
                                );
                            }).join('') +
                            grouped[category].inCart.map(function(p) {
                                return (
                                '<li class="flex items-center bg-green-50 p-3 rounded-lg opacity-70">' +
                                    '<div class="h-6 w-6 flex items-center justify-center">' +
                                        '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>' +
                                    '</div>' +
                                    '<div class="ml-3">' +
                                        '<span class="text-gray-600 font-medium line-through">' + p.name + '</span>' +
                                        (p.note ? '<p class="text-sm text-gray-500 italic line-through">' + p.note + '</p>' : '') +
                                    '</div>' +
                                '</li>'
                                );
                            }).join('') +
                        '</ul>' +
                    '</div>'
                    );
                }).join('')) +
            '</main>' +
        '</div>'
    );
}

// --- FUNCIONES DE RENDERIZADO DE MODALES ---
function renderModal(contentHTML) {
    var modalContainer = document.createElement('div');
    modalContainer.id = 'modal-container';
    modalContainer.className = 'fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4';
    modalContainer.innerHTML = contentHTML;
    document.body.appendChild(modalContainer);

    // Close modal if backdrop is clicked
    modalContainer.addEventListener('click', function(e) {
        if (e.target.id === 'modal-container') {
            closeModal();
        }
    });
}

function closeModal() {
    var modalContainer = document.getElementById('modal-container');
    if (modalContainer) {
        document.body.removeChild(modalContainer);
    }
}

function showCreateHouseholdModal() {
    renderModal(
        '<div class="bg-white rounded-lg shadow-2xl p-6 w-full max-w-sm">' +
            '<h2 class="text-2xl font-bold mb-4 text-gray-800">Crear Nueva Casa</h2>' +
            '<form id="create-household-form">' +
                '<p class="text-sm text-gray-600 mb-4">Dale un nombre a tu casa para empezar a gestionar la despensa en equipo.</p>' +
                '<div class="mb-4">' +
                    '<label for="householdName" class="block text-sm font-medium text-gray-700 mb-1">Nombre de la Casa</label>' +
                    '<input id="householdName" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Ej: Casa del Centro" required autofocus>' +
                '</div>' +
                '<div class="flex justify-end space-x-3">' +
                    '<button type="button" id="cancel-create" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold">Cancelar</button>' +
                    '<button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-semibold">Crear</button>' +
                '</div>' +
            '</form>' +
        '</div>'
    );
    document.getElementById('cancel-create').addEventListener('click', closeModal);
    document.getElementById('create-household-form').addEventListener('submit', function(e) {
        e.preventDefault();
        var name = document.getElementById('householdName').value;
        if (name.trim()) {
            e.target.querySelector('button[type="submit"]').textContent = 'Creando...';
            e.target.querySelector('button[type="submit"]').disabled = true;
            handleCreateHousehold(name.trim());
        }
    });
}

function showAddProductModal() {
    var categories = state.household.categories || [];
    var unitOptions = Object.values(ProductUnit);

    renderModal(
        '<div class="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md">' +
            '<h2 class="text-2xl font-bold mb-4 text-gray-800">Agregar Nuevo Producto</h2>' +
            '<form id="add-product-form">' +
                '<div class="mb-4">' +
                    '<label for="productName" class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>' +
                    '<input id="productName" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Ej: Leche" required autofocus>' +
                '</div>' +
                '<div class="mb-4">' +
                    '<label for="productNote" class="block text-sm font-medium text-gray-700 mb-1">Nota (Opcional)</label>' +
                    '<textarea id="productNote" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Ej: Comprar sin TACC" rows="2"></textarea>' +
                '</div>' +
                '<div class="mb-4">' +
                    '<label class="block text-sm font-medium text-gray-700 mb-1">Cantidad y Unidad</label>' +
                    '<div class="flex items-center space-x-2">' +
                        '<input id="productQuantity" type="number" value="1" class="flex-grow w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm" step="any" min="0" required>' +
                        '<div class="flex rounded-md shadow-sm" id="unit-selector">' +
                            unitOptions.map(function(u, index) {
                                return '<button type="button" data-unit="' + u + '" class="unit-option px-3 py-2 text-sm font-semibold transition-colors duration-200 ' + (u === ProductUnit.Units ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300') + ' ' + (index === 0 ? 'rounded-l-md' : '') + ' ' + (index === unitOptions.length - 1 ? 'rounded-r-md' : '') + '">' + u + '</button>';
                            }).join('') +
                        '</div>' +
                    '</div>' +
                '</div>' +
                 '<div class="mb-4">' +
                    '<label for="minimumStock" class="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo (Opcional)</label>' +
                    '<input id="minimumStock" type="number" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" placeholder="Ej: 2 (avisa cuando queden 2)" step="any" min="0">' +
                    '<p class="text-xs text-gray-500 mt-1">Recibirás un aviso para comprar cuando la cantidad llegue a este número.</p>' +
                '</div>' +
                '<div class="mb-6">' +
                    '<label class="block text-sm font-medium text-gray-700 mb-2">Categoría</label>' +
                    (categories.length > 0 ? (
                        '<div class="grid grid-cols-2 sm:grid-cols-3 gap-2" id="category-selector">' +
                            categories.map(function(cat) {
                                return '<button type="button" data-category="' + cat + '" class="category-option w-full px-3 py-2 text-sm font-semibold rounded-md transition-colors duration-200 truncate ' + (cat === categories[0] ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300') + '">' + cat + '</button>';
                            }).join('') +
                        '</div>') : '<p class="text-sm text-gray-600">No hay categorías. Ve a la configuración para crear una.</p>'
                    ) +
                '</div>' +
                '<div class="flex justify-end space-x-3">' +
                    '<button type="button" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold" id="cancel-add-product">Cancelar</button>' +
                    '<button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-semibold" ' + (categories.length === 0 ? 'disabled' : '') + '>Agregar</button>' +
                '</div>' +
            '</form>' +
        '</div>'
    );
    
    var selectedUnit = ProductUnit.Units;
    var selectedCategory = categories[0] || '';
    document.getElementById('cancel-add-product').addEventListener('click', closeModal);

    document.getElementById('unit-selector').addEventListener('click', function(e) {
        if(e.target.matches('.unit-option')) {
            selectedUnit = e.target.dataset.unit;
            document.querySelectorAll('.unit-option').forEach(function(btn) {
                btn.classList.remove('bg-indigo-600', 'text-white');
                btn.classList.add('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
            });
            e.target.classList.add('bg-indigo-600', 'text-white');
            e.target.classList.remove('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
        }
    });

    document.getElementById('category-selector').addEventListener('click', function(e) {
        if(e.target.matches('.category-option')) {
            selectedCategory = e.target.dataset.category;
            document.querySelectorAll('.category-option').forEach(function(btn) {
                btn.classList.remove('bg-indigo-600', 'text-white');
                btn.classList.add('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
            });
            e.target.classList.add('bg-indigo-600', 'text-white');
            e.target.classList.remove('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
        }
    });

    document.getElementById('add-product-form').addEventListener('submit', function(e) {
        e.preventDefault();
        var name = document.getElementById('productName').value;
        var note = document.getElementById('productNote').value;
        var quantity = parseFloat(document.getElementById('productQuantity').value);
        var minimumStock = parseFloat(document.getElementById('minimumStock').value) || 0;
        
        if(name.trim() && selectedCategory && !isNaN(quantity) && quantity >= 0) {
            DB.addProduct(state.household.id, name.trim(), selectedCategory, selectedUnit, note.trim(), quantity, minimumStock);
            closeModal();
        }
    });
}

function showZeroQuantityModal(product) {
    renderModal(
        '<div class="bg-white rounded-lg shadow-2xl p-6 w-full max-w-sm text-center">' +
            '<h2 class="text-xl font-bold mb-2 text-gray-800">¡Se acabó!</h2>' +
            '<p class="text-gray-600 mb-6">El producto <span class="font-semibold">' + product.name + '</span> llegó a cero. ¿Qué quieres hacer?</p>' +
            '<div class="flex flex-col space-y-3">' +
                '<button id="zero-add-to-list" class="w-full px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-semibold">Anotar en la lista de Comprar</button>' +
                '<button id="zero-delete" class="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 font-semibold">Eliminar producto</button>' +
                '<button id="zero-cancel" class="w-full px-4 py-2 text-gray-700 hover:bg-gray-100 font-semibold">Cancelar</button>' +
            '</div>' +
        '</div>'
    );
    document.getElementById('zero-add-to-list').onclick = function() {
        DB.updateProduct(state.household.id, product.id, { quantity: 0, onShoppingList: true });
        closeModal();
    };
    document.getElementById('zero-delete').onclick = function() {
        if (window.confirm('¿Seguro que quieres eliminar "' + product.name + '" permanentemente?')) {
            DB.deleteProduct(state.household.id, product.id);
        }
        closeModal();
    };
    document.getElementById('zero-cancel').onclick = closeModal;
}

function showMinStockModal(product) {
    renderModal(
         '<div class="bg-white rounded-lg shadow-2xl p-6 w-full max-w-sm text-center">' +
            '<h2 class="text-xl font-bold mb-2 text-gray-800">Stock Mínimo Alcanzado</h2>' +
            '<p class="text-gray-600 mb-6">Quedan <span class="font-semibold">' + product.quantity + ' ' + product.unit + '</span> de <span class="font-semibold">' + product.name + '</span>. ¿Quieres anotarlo en la lista para comprar?</p>' +
            '<div class="flex flex-col space-y-3">' +
                '<button id="min-stock-confirm" class="w-full px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-semibold">Sí, anotar para comprar</button>' +
                '<button id="min-stock-cancel" class="w-full px-4 py-2 text-gray-700 hover:bg-gray-100 font-semibold">No, más tarde</button>' +
            '</div>' +
        '</div>'
    );
    document.getElementById('min-stock-confirm').onclick = function() {
        DB.updateProduct(state.household.id, product.id, { onShoppingList: true });
        closeModal();
    };
    document.getElementById('min-stock-cancel').onclick = closeModal;
}

function showHouseholdSettingsModal() {
    var tempCategories = (state.household.categories || []).slice();

    var renderCategories = function() {
        return tempCategories.map(function(cat, index) {
            return (
            '<div class="flex items-center space-x-2">' +
                '<input type="text" value="' + cat + '" data-index="' + index + '" class="category-input flex-grow w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">' +
                '<button data-action="delete-category" data-index="' + index + '" class="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>' +
                '</button>' +
            '</div>'
            );
        }).join('');
    }

    renderModal(
        '<div class="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md">' +
            '<div class="flex justify-between items-center mb-4">' +
                '<h2 class="text-2xl font-bold text-gray-800 text-left">' + state.household.name + '</h2>' +
                '<button id="settings-close" class="p-1 rounded-full hover:bg-gray-200"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg></button>' +
            '</div>' +
            '<div class="mb-6 bg-slate-50 p-4 rounded-lg text-center">' +
                '<label class="block text-sm font-medium text-gray-700 mb-2">PIN para entrar a esta casa</label>' +
                '<div class="flex items-center justify-center space-x-2">' +
                    '<input type="text" readonly value="' + state.household.pin + '" class="w-40 flex-grow px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm font-mono text-4xl tracking-widest text-center">' +
                    '<button id="copy-pin" class="px-4 py-2 h-14 rounded-md font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">Copiar</button>' +
                '</div>' +
                '<p class="text-xs text-gray-500 mt-2">Comparte este PIN con tus compañeros de casa.</p>' +
            '</div>' +
            '<div class="border-t pt-4 text-left">' +
                '<h3 class="text-lg font-bold text-gray-800 mb-3">Gestionar Categorías</h3>' +
                '<div id="category-list" class="space-y-2 mb-4 max-h-40 overflow-y-auto pr-2">' + renderCategories() + '</div>' +
                '<div class="flex items-center space-x-2">' +
                    '<input id="new-category-input" type="text" placeholder="Nueva categoría" class="flex-grow w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">' +
                    '<button id="add-new-category" class="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 font-semibold">Añadir</button>' +
                '</div>' +
            '</div>' +
            '<div class="flex justify-between items-center mt-8">' +
                '<button id="settings-logout" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold">Salir de la casa</button>' +
                '<button id="save-settings" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-semibold">Guardar Cambios</button>' +
            '</div>' +
        '</div>'
    );

    var categoryListDiv = document.getElementById('category-list');

    var reRenderCategories = function() {
        categoryListDiv.innerHTML = renderCategories();
    };
    
    document.getElementById('settings-close').onclick = closeModal;
    document.getElementById('settings-logout').onclick = handleLogout;
    document.getElementById('copy-pin').onclick = function(e) {
        navigator.clipboard.writeText(state.household.pin);
        e.target.textContent = '¡Copiado!';
        e.target.classList.replace('bg-indigo-600', 'bg-green-500');
        setTimeout(function() {
            e.target.textContent = 'Copiar';
            e.target.classList.replace('bg-green-500', 'bg-indigo-600');
        }, 2000);
    };

    var addNewCategory = function() {
        var input = document.getElementById('new-category-input');
        var newCat = input.value.trim();
        if (newCat && tempCategories.indexOf(newCat) === -1) {
            tempCategories.push(newCat);
            input.value = '';
            reRenderCategories();
        }
    };
    document.getElementById('add-new-category').onclick = addNewCategory;
    document.getElementById('new-category-input').onkeypress = function(e) { if (e.key === 'Enter') addNewCategory(); };

    categoryListDiv.addEventListener('change', function(e) {
        if(e.target.matches('.category-input')) {
            var index = parseInt(e.target.dataset.index, 10);
            tempCategories[index] = e.target.value;
        }
    });

    categoryListDiv.addEventListener('click', function(e) {
        if(e.target.dataset.action === 'delete-category') {
            var index = parseInt(e.target.dataset.index, 10);
             if (window.confirm('¿Seguro que quieres eliminar la categoría "' + tempCategories[index] + '"?')) {
                tempCategories.splice(index, 1);
                reRenderCategories();
            }
        }
    });

    document.getElementById('save-settings').onclick = function() {
        var cleaned = tempCategories.map(function(c) { return c.trim(); }).filter(Boolean);
        var unique = [];
        cleaned.forEach(function(item) {
            if (unique.indexOf(item) < 0) {
                 unique.push(item);
            }
        });
        DB.updateHousehold(state.household.id, { categories: unique });
        closeModal();
    };
}

function showPurchaseModal(product, checkbox) {
    renderModal(
        '<div class="bg-white rounded-lg shadow-2xl p-6 w-full max-w-sm">' +
            '<h2 class="text-xl font-bold mb-2 text-gray-800">¿Cuánto compraste?</h2>' +
            '<p class="text-gray-600 mb-4">Producto: <span class="font-semibold">' + product.name + '</span></p>' +
            '<div class="mb-4">' +
                '<label for="quantity" class="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>' +
                '<div class="flex items-baseline">' +
                    '<input id="quantity" type="number" value="1" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-xl" autofocus step="any" min="0">' +
                    '<span class="text-lg font-semibold text-gray-500 ml-2">' + product.unit + '</span>' +
                '</div>' +
            '</div>' +
            '<div class="flex justify-end space-x-3">' +
                '<button type="button" id="purchase-cancel" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold">Cancelar</button>' +
                '<button type="button" id="purchase-confirm" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-semibold">Confirmar</button>' +
            '</div>' +
        '</div>'
    );
    var confirmBtn = document.getElementById('purchase-confirm');
    var qtyInput = document.getElementById('quantity');
    
    var handleConfirm = function() {
        var numQuantity = parseFloat(qtyInput.value);
        if (isNaN(numQuantity) || numQuantity < 0) return alert('Cantidad inválida.');
        var newTotal = product.quantity + numQuantity;
        DB.updateProduct(state.household.id, product.id, { quantity: newTotal, onShoppingList: false });
        closeModal();
    };

    confirmBtn.onclick = handleConfirm;
    qtyInput.onkeypress = function(e) { if (e.key === 'Enter') handleConfirm(); };
    document.getElementById('purchase-cancel').onclick = function() {
        if(checkbox) checkbox.checked = false; // Uncheck if cancelled
        closeModal();
    };
    
    // Also uncheck if modal is closed by clicking the backdrop
    document.getElementById('modal-container').addEventListener('click', function(e) {
        if (e.target.id === 'modal-container' && checkbox) {
            checkbox.checked = false;
        }
    });
}

// --- LÓGICA DE LA APLICACIÓN Y MANEJADORES DE EVENTOS ---
function handleLogin(pin) {
    state.isLoading = true;
    renderApp();
    DB.loginWithPin(pin).then(function(loggedInHousehold) {
        if (loggedInHousehold) {
            state.household = loggedInHousehold;
            state.appState = 'pantry';
            // Suscribirse a los cambios
            state.unsubscribeHousehold = DB.onHouseholdUpdate(state.household.id, function(household) {
                state.household = household;
                renderApp();
            });
            state.unsubscribeProducts = DB.onProductsUpdate(state.household.id, function(products) {
                state.products = products;
                renderApp();
            });
        } else {
            state.loginError = 'PIN incorrecto';
            if (navigator.vibrate) navigator.vibrate(200);
            setTimeout(function() {
                state.pinInput = '';
                state.loginError = '';
                state.isLoading = false;
                renderApp();
            }, 800);
        }
    });
}

function handleCreateHousehold(name) {
    DB.createHousehold(name).then(function(newHousehold) {
        state.household = newHousehold;
        state.isNewHousehold = true;
        state.appState = 'pantry';
        // Suscribirse a los cambios
        state.unsubscribeHousehold = DB.onHouseholdUpdate(state.household.id, function(household) {
            state.household = household;
            renderApp();
        });
        state.unsubscribeProducts = DB.onProductsUpdate(state.household.id, function(products) {
            state.products = products;
            renderApp();
        });
    });
}

function handleLogout() {
    // Desuscribirse para evitar fugas de memoria
    state.unsubscribeHousehold();
    state.unsubscribeProducts();
    state.household = null;
    state.products = [];
    state.appState = 'login';
    state.pinInput = '';
    state.isLoading = false;
    renderApp();
}

function handleQuantityChange(productId, newQuantity) {
    var product;
    for (var i = 0; i < state.products.length; i++) {
        if (state.products[i].id === productId) {
            product = state.products[i];
            break;
        }
    }
    if (!product) return;
    
    if (newQuantity === 0) {
        showZeroQuantityModal(product);
    } else {
        DB.updateProduct(state.household.id, productId, { quantity: newQuantity });
        // Lógica de Stock Mínimo
        if (
            product.minimumStock > 0 &&
            product.quantity > product.minimumStock && // old quantity
            newQuantity <= product.minimumStock && // new quantity
            !product.onShoppingList
        ) {
            var productCopy = Object.assign({}, product, { quantity: newQuantity });
            showMinStockModal(productCopy);
        }
    }
}

// --- MANEJADOR DE EVENTOS GLOBAL ---
function globalEventHandler(e) {
    var target = e.target;
    
    // Numpad in Login
    if(target.matches('.numpad-btn')) {
        var key = target.dataset.key;
        if (!key || state.isLoading) return;
        
        if (key === 'backspace') {
            state.pinInput = state.pinInput.slice(0, -1);
        } else if (state.pinInput.length < 4) {
            state.pinInput += key;
        }
        
        renderApp();

        if (state.pinInput.length === 4) {
            handleLogin(state.pinInput);
        }
        return;
    }
    
    // Buttons with data-action
    var actionButton = target.closest('[data-action]');
    if (actionButton) {
        var action = actionButton.dataset.action;
        switch (action) {
            case 'show-settings': showHouseholdSettingsModal(); break;
            case 'logout': handleLogout(); break;
            case 'show-add-modal': showAddProductModal(); break;
            case 'show-supermarket-list':
                state.activeView = View.SupermarketList;
                renderApp();
                break;
            case 'back-to-pantry':
                 state.activeView = View.Shopping;
                 renderApp();
                 break;
            case 'increment-quantity':
            case 'decrement-quantity':
                var productId = actionButton.dataset.productId;
                var product;
                for (var i = 0; i < state.products.length; i++) {
                    if (state.products[i].id === productId) {
                        product = state.products[i];
                        break;
                    }
                }
                if (!product) return;
                
                var change = action === 'increment-quantity' ? 1 : -1;
                var newQuantity;
                
                if (product.unit === ProductUnit.Units) {
                    if (change === -1 && product.quantity > 0 && product.quantity <= 1) {
                        newQuantity = 0;
                    } else {
                        newQuantity = Math.max(0, Math.ceil(product.quantity) + change);
                    }
                } else {
                    newQuantity = parseFloat((product.quantity + change).toFixed(2));
                }
                handleQuantityChange(productId, Math.max(0, newQuantity));
                break;
            case 'add-to-list':
                DB.updateProduct(state.household.id, actionButton.dataset.productId, { onShoppingList: true });
                break;
            case 'remove-from-list':
                DB.updateProduct(state.household.id, actionButton.dataset.productId, { onShoppingList: false });
                break;
        }
        return;
    }
    
    // View tabs & category filters
    if (target.matches('.view-tab')) {
        state.activeView = target.dataset.view;
        renderApp();
    } else if (target.matches('.category-filter')) {
        state.categoryFilter = target.dataset.category;
        renderApp();
    }
    
    // 'Create new household' button
    if (target.id === 'show-create-modal') {
        showCreateHouseholdModal();
    }

    // Buy item checkbox
    if (target.matches('[data-action="buy-item"]') && target.type === 'checkbox') {
        if(target.checked) {
            var productToBuy;
            for (var j = 0; j < state.products.length; j++) {
                if (state.products[j].id === target.dataset.productId) {
                    productToBuy = state.products[j];
                    break;
                }
            }
            if (productToBuy) showPurchaseModal(productToBuy, target);
        }
    }
}

function globalChangeHandler(e) {
    var target = e.target;
    var action = target.dataset.action;
    if (action === 'range-quantity' || action === 'input-quantity') {
        var productId = target.dataset.productId;
        var value = target.value;
        var newQuantity = value === '' ? 0 : parseFloat(value);
        if (!isNaN(newQuantity) && newQuantity >= 0) {
            handleQuantityChange(productId, newQuantity);
        }
     }
}

// --- FUNCIÓN PRINCIPAL DE RENDERIZADO ---
var isInitialRender = true;
function renderApp() {
    if (state.appState === 'login') {
        root.innerHTML = renderLoginView();
    } else if (state.appState === 'pantry' && state.household) {
        if (state.activeView === View.SupermarketList) {
            root.innerHTML = renderSupermarketListView();
        } else {
            root.innerHTML = renderPantryView();
        }

        if (state.isNewHousehold) {
            showHouseholdSettingsModal();
            state.isNewHousehold = false; // Marcar como visto
        }
    }
    
    if(isInitialRender) {
        document.body.addEventListener('click', globalEventHandler);
        document.body.addEventListener('change', globalChangeHandler);
        isInitialRender = false;
    }
}

// --- INICIALIZACIÓN DE LA APP ---
function main() {
    try {
        DB.initDB();
        renderApp();
    } catch (error) {
        console.error("Error initializing app:", error);
        root.innerHTML = '<div class="p-4 m-4 text-center text-red-700 bg-red-100 rounded-md">Error al inicializar la aplicación: ' + error.message + '</div>';
    }
}

main();

import React from 'react';

interface LandingViewProps {
  onNavigateToApp: (mode: 'login' | 'signup') => void;
}

const LandingLogo = () => (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-auto">
        <path d="M21.3333 4.66666C21.3333 4.66666 23.3333 -1.33334 31.3333 4.66666C19.3333 10.6667 31.3333 30.6667 31.3333 30.6667C31.3333 30.6667 27.3333 19.6667 21.3333 15.6667C15.3333 11.6667 21.3333 4.66666 21.3333 4.66666Z" fill="#84A98C"/>
        <path d="M21.3333 15.6667C21.3333 15.6667 15.3333 11.6667 11.3333 19.6667C7.33333 27.6667 19.3333 30.6667 19.3333 30.6667C19.3333 30.6667 23.3333 22.6667 21.3333 15.6667Z" fill="#A7C9AB"/>
    </svg>
);


const LandingHeader: React.FC<{ onLoginClick: () => void }> = ({ onLoginClick }) => (
    <header className="bg-transparent absolute top-0 left-0 right-0 z-10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
             <div className="flex items-center space-x-3">
                <LandingLogo />
                <span className="text-2xl font-bold text-gray-800">Prono</span>
            </div>
            <button
                onClick={onLoginClick}
                className="font-semibold text-gray-700 hover:text-[#84A98C] transition-colors"
            >
                Iniciar Sesión
            </button>
        </div>
    </header>
);

const MockProductCard: React.FC<{ name: string, category: string, quantity: number, unit: string, catColor: string, isOutOfStock?: boolean }> = ({ name, category, quantity, unit, catColor, isOutOfStock = false }) => (
    <div className={`bg-white rounded-xl shadow-lg p-4 flex flex-col justify-between transition-all duration-300 border-2 ${isOutOfStock ? 'opacity-60 border-red-300' : 'border-transparent'}`}>
        <div>
            <div className="flex justify-between items-start mb-2">
                <h2 className="text-lg font-bold text-gray-800 break-words w-4/5">{name}</h2>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${catColor}`}>
                    {category}
                </span>
            </div>
            {isOutOfStock && <p className="text-red-500 text-sm font-semibold mt-1">Sin stock</p>}
        </div>
        <div className="flex flex-col items-center justify-center mt-4">
            <div className="flex items-center justify-center space-x-2 w-full">
                <button
                disabled={isOutOfStock}
                className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-red-500 text-white rounded-full text-2xl font-bold transition-transform duration-150 active:scale-90 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                −
                </button>
                
                <div className="flex items-baseline justify-center text-center">
                    <span className="w-16 text-center text-3xl font-mono font-bold text-gray-900">{quantity}</span>
                    <span className="text-lg font-semibold text-gray-500 ml-1">{unit}</span>
                </div>

                <button
                className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-[#84A98C] text-white rounded-full text-2xl font-bold transition-transform duration-150 active:scale-90"
                >
                +
                </button>
            </div>
        </div>
        {!isOutOfStock && (
            <button
                className="mt-3 w-full flex items-center justify-center px-3 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 font-semibold transition-colors text-sm"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Anotar para comprar
            </button>
        )}
    </div>
);


const AppWindowMock = () => (
    <div className="bg-gray-100 rounded-xl shadow-2xl border border-gray-200/80 p-3 max-w-sm mx-auto w-full space-y-3 transform -rotate-1">
        <div className="flex space-x-1.5 p-2">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
        </div>
        <div className="space-y-3 px-1 pb-1">
          <MockProductCard name="Leche" category="Lácteos" quantity={2} unit="un." catColor="bg-blue-100 text-blue-800" />
          <MockProductCard name="Huevos" category="Lácteos" quantity={6} unit="un." catColor="bg-blue-100 text-blue-800" />
          <MockProductCard name="Harina" category="Despensa" quantity={0} unit="kg" catColor="bg-yellow-100 text-yellow-800" isOutOfStock={true} />
        </div>
    </div>
);


const LandingView: React.FC<LandingViewProps> = ({ onNavigateToApp }) => {
  return (
    <div className="bg-[#fcfaf5] text-[#333] font-sans">
      <LandingHeader onLoginClick={() => onNavigateToApp('login')} />
      <main className="container mx-auto px-6 pt-24 pb-12 md:pt-32 md:pb-24">
        {/* Hero Section */}
        <section className="grid md:grid-cols-2 gap-12 items-center">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-800 leading-tight mb-4">
              Controlá tu despensa sin esfuerzo
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Agregá productos, registrá consumos y recibí alertas cuando te estás quedando sin algo.
            </p>
            <button
              onClick={() => onNavigateToApp('signup')}
              className="bg-[#84A98C] text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-[#73957a] transition-colors duration-300"
            >
              Empezar ahora
            </button>
          </div>
          <div>
            <AppWindowMock />
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 md:py-32">
          <div className="grid md:grid-cols-3 gap-10 text-center">
            <div className="flex flex-col items-center">
              <div className="bg-white p-6 rounded-2xl mb-4 shadow-sm border border-gray-200/50">
                 <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12">
                    <rect x="16" y="14" width="32" height="38" rx="6" fill="#F8C9B9"/>
                    <rect x="14" y="10" width="36" height="8" rx="4" fill="#E0E0E0"/>
                    <circle cx="32" cy="34" r="10" fill="#EA7A5B"/>
                 </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Agregá tus productos</h3>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-[#f3f0e7] p-6 rounded-2xl mb-4">
                 <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12">
                    <path d="M12 48L24.5 32L36.5 42L52 20" stroke="#84A98C" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                 </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Controlá tu stock en tiempo real</h3>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-[#84A98C] p-6 rounded-2xl mb-4">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12">
                    <path d="M24 26L32 34L40 26" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M24 38L32 46L40 38" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Generá tu lista de compras automática</h3>
            </div>
          </div>
        </section>

        {/* Get Started Section */}
        <section className="text-center pb-20 md:pb-32">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-12">
            Empezá hoy a organizar tu despensa
          </h2>
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {/* Card 1: Vencimiento */}
            <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200/80">
                <div className="flex space-x-1.5 mb-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div>
                </div>
                <h4 className="font-bold text-gray-800 mb-4 text-left">Despensa</h4>
                <div className="space-y-2.5 text-left">
                    <div className="flex justify-between items-center"><div className="h-4 bg-gray-200 rounded w-2/3"></div><span className="text-sm font-bold text-gray-600">5</span></div>
                    <div className="flex justify-between items-center"><div className="h-4 bg-gray-200 rounded w-1/2"></div><span className="text-sm font-bold text-gray-600">1</span></div>
                    <div className="flex justify-between items-center"><div className="h-4 bg-gray-200 rounded w-3/4"></div><span className="text-sm font-bold text-gray-600">3</span></div>
                </div>
                <div className="mt-6 pt-3 border-t border-gray-200">
                    <p className="text-sm font-semibold text-orange-600">3 próximos a vencer</p>
                </div>
            </div>
             {/* Card 2: Lista de compras */}
            <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200/80">
                <h4 className="font-bold text-gray-800 mb-4 text-left">Lista de compras</h4>
                <div className="space-y-3 text-left">
                    <div className="flex items-center space-x-3">
                        <input type="checkbox" className="h-5 w-5 rounded border-gray-300 text-[#84A98C] focus:ring-[#84A98C] cursor-pointer" />
                        <span className="text-gray-700">Arroz</span>
                    </div>
                    <div className="flex items-center space-x-3">
                        <input type="checkbox" className="h-5 w-5 rounded border-gray-300 text-[#84A98C] focus:ring-[#84A98C] cursor-pointer" />
                        <span className="text-gray-700">Huevos</span>
                    </div>
                     <div className="flex items-center space-x-3">
                        <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-gray-300 text-[#84A98C] focus:ring-[#84A98C] cursor-pointer" />
                        <span className="text-gray-500 line-through">Leche</span>
                    </div>
                </div>
                 <div className="mt-6 flex justify-between items-center opacity-50">
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                 </div>
            </div>
            {/* Card 3: Detalle producto */}
            <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200/80 text-left">
                <h4 className="font-bold text-gray-800 mb-4">Agregar Producto</h4>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-medium text-gray-600">Nombre</label>
                        <div className="mt-1 w-full px-3 py-1.5 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-800">Aceite de Oliva</div>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600">Categoría</label>
                        <div className="mt-1 flex flex-wrap gap-2">
                            <button className="px-3 py-1 text-xs font-semibold rounded-md bg-[#84A98C] text-white">Despensa</button>
                            <button className="px-3 py-1 text-xs font-semibold rounded-md bg-gray-200 text-gray-700">Lácteos</button>
                            <button className="px-3 py-1 text-xs font-semibold rounded-md bg-gray-200 text-gray-700">Limpieza</button>
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                    <button className="px-4 py-2 text-sm bg-gray-200 rounded-md text-gray-800 font-semibold">Cancelar</button>
                    <button className="px-4 py-2 text-sm bg-[#84A98C] text-white rounded-md font-semibold">Agregar</button>
                </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white text-gray-600">
        <div className="container mx-auto px-6 py-6 flex justify-center space-x-8 text-sm">
          <a href="#" className="hover:text-gray-900">Contacto</a>
          <a href="#" className="hover:text-gray-900">Política de privacidad</a>
          <a href="#" className="hover:text-gray-900">Sobre el proyecto</a>
        </div>
      </footer>
    </div>
  );
};

export default LandingView;
import React from 'react';

interface LandingViewProps {
  onNavigateToApp: (mode: 'login' | 'signup') => void;
}

interface ProductIconProps {
  color: string;
  children: React.ReactNode;
}

const LandingHeader: React.FC<{ onLoginClick: () => void }> = ({ onLoginClick }) => (
    <header className="bg-transparent absolute top-0 left-0 right-0 z-10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
             <div className="flex items-center space-x-3">
                {/* Tomato Logo */}
                <svg className="h-8 w-8" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <g>
                        <path d="m81.25,43.25c0,16.29-14,29.5-31.25,29.5s-31.25-13.21-31.25-29.5c0-16.29,14-29.5,31.25-29.5s31.25,13.21,31.25,29.5z" fill="#dd2e44"/>
                        <path d="m50,13.75c-2.38,0-4.59,1.15-6,3-1.63-2.18-4.22-3.5-7-3.5-4.83,0-8.75,3.92-8.75,8.75,0,2.15.78,4.12,2.09,5.65-2.06,2.4-3.34,5.43-3.34,8.85,0,7.9,8.4,14.29,18.75,14.29s18.75-6.39,18.75-14.29c0-3.3-1.18-6.28-3.12-8.62,1.4-1.5,2.29-3.54,2.29-5.78,0-4.83-3.92-8.75-8.75-8.75z" fill="#84A98C"/>
                    </g>
                </svg>
                <span className="text-2xl font-bold text-gray-800">Luki</span>
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

const ProductIcon: React.FC<ProductIconProps> = ({ color, children }) => (
    <div className={`w-8 h-8 rounded-md flex items-center justify-center ${color}`}>
        {children}
    </div>
);

const AppWindowMock = () => (
    <div className="bg-white rounded-lg shadow-2xl border border-gray-200/80 p-4 max-w-sm mx-auto w-full">
        <div className="flex space-x-1.5 mb-4">
            <div className="w-3 h-3 rounded-full bg-gray-200"></div>
            <div className="w-3 h-3 rounded-full bg-gray-200"></div>
            <div className="w-3 h-3 rounded-full bg-gray-200"></div>
        </div>
        <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-800">Alacena</h3>
            <span className="text-sm text-gray-500">Cantidad</span>
        </div>
        <div className="space-y-2">
            {[
                { name: 'Arroz', quantity: 2, icon: '🍚', color: 'bg-blue-100' },
                { name: 'Lentejas', quantity: 1, icon: '🏺', color: 'bg-orange-100' },
                { name: 'Harina', quantity: 3, icon: '🥡', color: 'bg-red-100' },
                { name: 'Tomates en lata', quantity: 5, icon: '🥫', color: 'bg-green-100' },
                { name: 'Leche', quantity: 1, icon: '🥛', color: 'bg-slate-100' },
            ].map(item => (
                <div key={item.name} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                        <ProductIcon color={item.color}>
                            <span className="text-lg">{item.icon}</span>
                        </ProductIcon>
                        <span className="text-gray-700 font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                         <button className="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-red-500 text-white rounded-full text-lg font-bold transition-transform active:scale-90 pb-0.5">
                            −
                        </button>
                        <span className="font-mono font-bold text-gray-800 w-6 text-center">{item.quantity}</span>
                        <button className="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-[#84A98C] text-white rounded-full text-lg font-bold transition-transform active:scale-90 pb-0.5">
                            +
                        </button>
                    </div>
                </div>
            ))}
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
              Controlá tu alacena sin esfuerzo
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
                <h4 className="font-bold text-gray-800 mb-4 text-left">A ulacena</h4>
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
                    <div className="flex items-center space-x-2"><span className="text-green-500 font-bold">+</span><span>Arroz</span></div>
                    <div className="flex items-center space-x-2"><span className="text-green-500 font-bold">+</span><span>Huevos</span></div>
                    <div className="flex items-center space-x-2"><span className="text-green-500 font-bold">+</span><span>Leche</span></div>
                </div>
                 <div className="mt-6 flex justify-between items-center">
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                 </div>
            </div>
            {/* Card 3: Detalle producto */}
            <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200/80">
                <h4 className="font-bold text-gray-800 mb-4 text-center">Tomates lata</h4>
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-md flex items-center justify-center bg-red-100">
                         <span className="text-4xl">🥫</span>
                    </div>
                </div>
                <p className="text-gray-600 mb-4">5 ud</p>
                <div className="space-y-3">
                     <div className="flex justify-between items-center"><div className="h-2.5 bg-gray-200 rounded w-2/3"></div><span className="text-sm font-bold text-gray-600">5</span></div>
                     <div className="flex justify-between items-center"><div className="h-2.5 bg-gray-200 rounded w-1/3"></div><span className="text-sm font-bold text-gray-600">1</span></div>
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                    <button className="px-4 py-2 text-sm bg-gray-200 rounded-md">Cancelar</button>
                    <button className="px-4 py-2 text-sm bg-[#84A98C] text-white rounded-md">Guardar</button>
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
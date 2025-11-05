import React, { useEffect, useRef, useState, memo } from 'react';

interface LandingViewProps {
    onLogin: () => void;
    onSignUp: () => void;
}

// Custom hook for scroll animations
const useIntersectionObserver = (options: IntersectionObserverInit) => {
    const [isVisible, setIsVisible] = useState(false);
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                if (elementRef.current) {
                    observer.unobserve(elementRef.current);
                }
            }
        }, options);

        if (elementRef.current) {
            observer.observe(elementRef.current);
        }

        return () => {
            if (elementRef.current) {
                observer.unobserve(elementRef.current);
            }
        };
    }, [options]);

    return [elementRef, isVisible] as const;
};

const FeatureSection: React.FC<{
    title: string;
    description: string;
    imageUrl: string;
    imageAlt: string;
    reverse?: boolean;
}> = memo(({ title, description, imageUrl, imageAlt, reverse = false }) => {
    const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
    const flexDirection = reverse ? 'flex-row-reverse' : 'flex-row';

    return (
        <div ref={ref} className={`scroll-animate ${isVisible ? 'is-visible' : ''}`}>
            <div className={`container mx-auto px-4 py-16 flex flex-col md:${flexDirection} items-center gap-12`}>
                <div className="md:w-1/2 text-center md:text-left">
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">{title}</h3>
                    <p className="text-lg text-gray-600">{description}</p>
                </div>
                <div className="md:w-1/2">
                    <img src={imageUrl} alt={imageAlt} className="rounded-lg shadow-2xl w-full" />
                </div>
            </div>
        </div>
    );
});

const LandingView: React.FC<LandingViewProps> = ({ onLogin, onSignUp }) => {
    return (
        <div className="bg-white">
            <header className="sticky top-0 bg-white/80 backdrop-blur-md z-20 border-b border-gray-200">
                <div className="container mx-auto flex justify-between items-center p-4">
                    <div className="flex items-center space-x-2">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <h1 className="text-xl font-bold text-gray-800">Control de Despensa</h1>
                    </div>
                     <button onClick={onLogin} className="px-4 py-2 text-indigo-600 font-semibold rounded-md hover:bg-indigo-100 transition-colors">
                        Iniciar Sesión
                    </button>
                </div>
            </header>
            <main>
                <div className="bg-white">
                    <div className="container mx-auto px-4 py-20 md:py-28 text-center">
                        <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight">
                            La forma más fácil de organizar tu heladera y tu despensa.
                        </h2>
                        <p className="mt-4 text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
                            Deja de comprar lo que ya tienes. Anota lo que te falta con un solo click y lleva el control de tu stock sin esfuerzo, solo o en familia.
                        </p>
                        <div className="mt-8">
                            <button 
                                onClick={onSignUp}
                                className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-full text-lg hover:bg-indigo-700 transition-transform transform hover:scale-105"
                            >
                                Empieza gratis
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50">
                     <FeatureSection
                        title="1. Crea y personaliza tu casa"
                        description="Empieza en segundos. Dale un nombre a tu casa y crea categorías que se adapten a tu forma de organizar: 'Heladera', 'Congelador', 'Alacena', ¡lo que necesites!"
                        imageUrl="https://storage.googleapis.com/aistudio-hosting/transfer-learning-text/feature-1-create-house.png"
                        imageAlt="Creación de una casa en la aplicación"
                    />
                </div>
                
                <div className="bg-white">
                    <FeatureSection
                        title="2. Invita y colabora en tiempo real"
                        description="Comparte un simple enlace para invitar a tu familia o compañeros de piso. Todos verán el mismo stock y podrán añadir o quitar productos. ¡Se acabaron las compras duplicadas!"
                        imageUrl="https://storage.googleapis.com/aistudio-hosting/transfer-learning-text/feature-2-invite-members.png"
                        imageAlt="Invitando miembros a la casa"
                        reverse={true}
                    />
                </div>

                <div className="bg-slate-50">
                    <FeatureSection
                        title="3. Añade productos sin esfuerzo"
                        description="Con una interfaz clara e intuitiva, agregar un nuevo producto es cuestión de segundos. Define nombre, cantidad, unidad y hasta una nota para no olvidar nada."
                        imageUrl="https://storage.googleapis.com/aistudio-hosting/transfer-learning-text/feature-3-add-products.png"
                        imageAlt="Agregando un producto a la despensa"
                    />
                </div>

                <div className="bg-white">
                    <FeatureSection
                        title="4. Tu lista de compras inteligente"
                        description="Cuando un producto se acaba, anótalo para comprar con un solo toque. En el supermercado, abre la lista y ve marcando los productos. ¡Así de fácil!"
                        imageUrl="https://storage.googleapis.com/aistudio-hosting/transfer-learning-text/feature-4-shopping-list.gif"
                        imageAlt="Animación de la lista de compras"
                        reverse={true}
                    />
                </div>
            </main>
             <footer className="bg-slate-800 text-white p-8">
                 <div className="container mx-auto text-center">
                    <p>&copy; {new Date().getFullYear()} Control de Despensa. Todos los derechos reservados.</p>
                 </div>
            </footer>
        </div>
    );
};

export default LandingView;
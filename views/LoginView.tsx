import React, { useState } from 'react';
import * as DB from '../services/database';

const AuthView: React.FC = () => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAuthAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            if (isLoginView) {
                await DB.signInWithEmail(email, password);
            } else {
                await DB.signUpWithEmail(name, email, password);
            }
        } catch (err: any) {
            setError(getFriendlyErrorMessage(err.code));
            setIsLoading(false);
        }
        // El listener en App.tsx se encargará de la redirección
    };

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setError('');
        try {
            await DB.signInWithGoogle();
        } catch (err: any) {
            setError(getFriendlyErrorMessage(err.code));
            setIsLoading(false);
        }
    };

    const getFriendlyErrorMessage = (code: string) => {
        switch (code) {
            case 'auth/wrong-password':
                return 'La contraseña es incorrecta.';
            case 'auth/user-not-found':
                return 'No se encontró ningún usuario con este correo electrónico.';
            case 'auth/email-already-in-use':
                return 'Este correo electrónico ya está registrado.';
            case 'auth/weak-password':
                return 'La contraseña debe tener al menos 6 caracteres.';
            case 'auth/invalid-email':
                return 'El formato del correo electrónico no es válido.';
            default:
                return 'Ocurrió un error. Por favor, intenta de nuevo.';
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-slate-100 p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Control de Despensa</h1>
                    <p className="text-lg text-gray-600 mt-2">{isLoginView ? 'Inicia sesión en tu cuenta' : 'Crea una cuenta nueva'}</p>
                </div>

                <div className="bg-white rounded-lg shadow-xl p-6">
                    <form onSubmit={handleAuthAction}>
                        {!isLoginView && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">Nombre</label>
                                <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                        )}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Email</label>
                            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">Contraseña</label>
                            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>

                        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

                        <button type="submit" disabled={isLoading} className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors">
                            {isLoading ? 'Cargando...' : (isLoginView ? 'Iniciar Sesión' : 'Crear Cuenta')}
                        </button>
                    </form>
                    
                    <div className="mt-4 text-center text-sm">
                        <button onClick={() => { setIsLoginView(!isLoginView); setError(''); }} className="font-medium text-indigo-600 hover:text-indigo-500">
                            {isLoginView ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
                        </button>
                    </div>

                    <div className="my-6 flex items-center">
                        <div className="flex-grow border-t border-gray-300"></div>
                        <span className="flex-shrink mx-4 text-gray-400 text-sm">O</span>
                        <div className="flex-grow border-t border-gray-300"></div>
                    </div>

                    <button onClick={handleGoogleSignIn} disabled={isLoading} className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 font-medium hover:bg-gray-50 flex items-center justify-center gap-2 disabled:bg-gray-100">
                        <svg className="w-5 h-5" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                            <path fill="none" d="M0 0h48v48H0z"></path>
                        </svg>
                        <span>Continuar con Google</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthView;
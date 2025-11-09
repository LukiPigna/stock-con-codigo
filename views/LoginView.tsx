import React, { useState, useEffect } from 'react';
import * as DB from '../services/database';

interface AuthViewProps {
    initialMode?: 'login' | 'signup';
}

const AuthView: React.FC<AuthViewProps> = ({ initialMode = 'login' }) => {
    const [isLogin, setIsLogin] = useState(initialMode === 'login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // After a successful login, check if there's an invite ID to process
        const inviteId = localStorage.getItem('inviteId');
        if (inviteId) {
            // A listener in App.tsx will handle the household joining logic
            // once the user state is updated. We can remove the item now.
            localStorage.removeItem('inviteId');
        }
    }, []);


    const handleAuthAction = async (action: () => Promise<any>) => {
        setIsLoading(true);
        setError('');
        try {
            const userCredential = await action();
            // Create user data in Firestore after signup/login
            const { user } = userCredential;
            if(user) {
                const inviteId = localStorage.getItem('inviteId');
                await DB.createUserData(user.uid, user.email, user.displayName, inviteId || undefined);
                if (inviteId) localStorage.removeItem('inviteId');
            }
        } catch (err: any) {
            // Firebase often returns more specific error codes.
            // This logic provides clearer messages to the user.
            let friendlyMessage = 'Ocurrió un error. Por favor, intenta de nuevo.';
            if (err.code === 'auth/wrong-password') {
                friendlyMessage = 'La contraseña es incorrecta.';
            } else if (err.code === 'auth/user-not-found') {
                friendlyMessage = 'No se encontró una cuenta con este email.';
            } else if (err.code === 'auth/email-already-in-use') {
                friendlyMessage = 'Este email ya está registrado. Intenta iniciar sesión.';
            } else if (err.code === 'auth/invalid-email') {
                friendlyMessage = 'El formato del email no es válido.';
            }
            setError(friendlyMessage);
            setIsLoading(false);
        }
        // No need to setIsLoading(false) on success, as the component will unmount
    };

    const handleEmailAuth = (e: React.FormEvent) => {
        e.preventDefault();
        const action = isLogin 
            ? () => DB.signInWithEmail(email, password)
            : () => DB.signUpWithEmail(email, password);
        handleAuthAction(action);
    };
    
    const handleGoogleAuth = () => {
        handleAuthAction(DB.signInWithGoogle);
    };

    const handleAnonymousAuth = () => {
        handleAuthAction(DB.signInAnonymously);
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-[#fcfaf5] p-4">
            <div className="w-full max-w-sm">
                 <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Control de Despensa</h1>
                    <p className="text-lg text-gray-600 mt-2">{isLogin ? 'Inicia sesión para continuar' : 'Crea una cuenta para empezar'}</p>
                </div>

                <div className="bg-white rounded-lg shadow-xl p-6">
                    <form onSubmit={handleEmailAuth} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                                id="email"
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#84A98C] focus:border-[#84A98C] bg-white text-gray-900"
                                required
                                disabled={isLoading}
                            />
                        </div>
                         <div>
                            <label htmlFor="password"className="block text-sm font-medium text-gray-700">Contraseña</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#84A98C] focus:border-[#84A98C] bg-white text-gray-900"
                                required
                                minLength={6}
                                disabled={isLoading}
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        <button
                            type="submit"
                            className="w-full py-2 px-4 bg-[#84A98C] text-white rounded-md hover:bg-[#73957a] font-semibold disabled:bg-gray-400"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Cargando...' : (isLogin ? 'Iniciar Sesión' : 'Registrarse')}
                        </button>
                    </form>

                    <div className="my-4 flex items-center">
                        <div className="flex-grow border-t border-gray-300"></div>
                        <span className="mx-2 text-sm text-gray-500">o</span>
                        <div className="flex-grow border-t border-gray-300"></div>
                    </div>

                    <button
                        onClick={handleGoogleAuth}
                        className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-200"
                        disabled={isLoading}
                    >
                         <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48px" height="48px"><path fill="#fbc02d" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12	s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20	s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#e53935" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039	l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4caf50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36	c-5.223,0-9.651-3.358-11.303-8H6.306C9.656,39.663,16.318,44,24,44z"></path><path fill="#1565c0" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238	C42.022,35.244,44,30.036,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>
                        Continuar con Google
                    </button>
                     <button
                        onClick={handleAnonymousAuth}
                        className="w-full mt-3 flex items-center justify-center py-2 px-4 border border-dashed border-gray-400 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-200"
                        disabled={isLoading}
                    >
                        Entrar como invitado (para probar)
                    </button>
                </div>
                 <p className="mt-6 text-center text-sm text-gray-600">
                    {isLogin ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}
                    <button onClick={() => setIsLogin(!isLogin)} className="font-semibold text-[#84A98C] hover:text-[#73957a] ml-1">
                        {isLogin ? 'Regístrate' : 'Inicia Sesión'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default AuthView;
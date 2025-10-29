// services/firebaseConfig.ts

// TODO: Reemplaza esto con la configuración de tu propio proyecto de Firebase
// 1. Ve a la consola de Firebase: https://console.firebase.google.com/
// 2. Crea un nuevo proyecto o selecciona uno existente.
// 3. Ve a la configuración del proyecto (icono de engranaje).
// 4. En la sección "Tus apps", crea una nueva app web.
// 5. Copia el objeto de configuración que Firebase te proporciona aquí.

export const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};

// MUY IMPORTANTE: Seguridad de tus credenciales
// Nunca subas este archivo con tus credenciales reales a un repositorio público (como GitHub).
// Para producción, utiliza variables de entorno. Vercel, por ejemplo, tiene una sección
// para gestionar variables de entorno y mantener tus claves seguras.
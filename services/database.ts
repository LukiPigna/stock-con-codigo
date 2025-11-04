import { Household, Product, ProductUnit, FirebaseUser } from '../types';
import { firebaseConfig } from './firebaseConfig';

// Declarar firebase para que TypeScript lo reconozca
declare const firebase: any;

let db: any; // Instancia de Firestore
let auth: any; // Instancia de Auth

const HOUSEHOLDS_COLLECTION = 'households';
const PRODUCTS_SUBCOLLECTION = 'products';

// --- Inicialización ---
export const initDB = () => {
  if (firebaseConfig.apiKey === "TU_API_KEY" || firebaseConfig.projectId === "TU_PROJECT_ID") {
    const errorMsg = "Configuración de Firebase incompleta. Por favor, edita el archivo 'services/firebaseConfig.ts' con las credenciales de tu proyecto.";
    alert(errorMsg);
    throw new Error(errorMsg);
  }

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  db = firebase.firestore();
  auth = firebase.auth();
};


// --- Auth Management ---
export const onAuthStateChanged = (callback: (user: any) => void) => {
    return auth.onAuthStateChanged(callback);
};

export const signInWithGoogle = async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    await auth.signInWithPopup(provider);
};

export const signUpWithEmail = async (name: string, email: string, pass: string) => {
    const userCredential = await auth.createUserWithEmailAndPassword(email, pass);
    await userCredential.user.updateProfile({ displayName: name });
    return userCredential.user;
};

export const signInWithEmail = (email: string, pass: string) => {
    return auth.signInWithEmailAndPassword(email, pass);
}

export const signOut = () => {
    return auth.signOut();
};


// --- Household Management ---
export const getHouseholdForUser = async (userId: string): Promise<Household | null> => {
    const querySnapshot = await db.collection(HOUSEHOLDS_COLLECTION)
        .where('members', 'array-contains', userId)
        .limit(1)
        .get();

    if (querySnapshot.empty) {
        return null;
    }
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Household;
};

export const createHousehold = async (name: string, user: FirebaseUser): Promise<Household> => {
  const newHouseholdData = {
    name,
    owner: user.uid,
    members: [user.uid],
    categories: ['Esenciales', 'Lácteos', 'Carnes', 'Frutas y Verduras', 'Limpieza', 'Otros'],
  };
  const docRef = await db.collection(HOUSEHOLDS_COLLECTION).add(newHouseholdData);
  return { id: docRef.id, ...newHouseholdData };
};

export const joinHousehold = async (householdId: string, userId: string) => {
    const householdRef = db.collection(HOUSEHOLDS_COLLECTION).doc(householdId);
    // Usar `arrayUnion` para agregar el miembro de forma segura y evitar duplicados
    await householdRef.update({
        members: firebase.firestore.FieldValue.arrayUnion(userId)
    });
};


export const onHouseholdUpdate = (householdId: string, callback: (household: Household) => void): (() => void) => {
  const unsubscribe = db.collection(HOUSEHOLDS_COLLECTION).doc(householdId)
    .onSnapshot((doc: any) => {
      if (doc.exists) {
        const household = { id: doc.id, ...doc.data() } as Household;
        callback(household);
      }
    }, (error: any) => {
      console.error("Error en la suscripción de la casa:", error);
    });
  return unsubscribe;
};

export const updateHousehold = async (householdId: string, data: Partial<Omit<Household, 'id'>>) => {
    try {
        await db.collection(HOUSEHOLDS_COLLECTION).doc(householdId).update(data);
    } catch (error) {
        console.error("Error updating household:", error);
    }
};


// --- Product Management (Real-time) ---
export const onProductsUpdate = (householdId: string, callback: (products: Product[]) => void): (() => void) => {
  const unsubscribe = db.collection(HOUSEHOLDS_COLLECTION).doc(householdId).collection(PRODUCTS_SUBCOLLECTION)
    .onSnapshot((snapshot: any) => {
      const products = snapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          onShoppingList: data.onShoppingList || false,
          minimumStock: data.minimumStock !== undefined ? data.minimumStock : 0, // Default to 0 if missing
      }}) as Product[];
      callback(products);
    }, (error: any) => {
      console.error("Error en la suscripción de productos:", error);
    });

  return unsubscribe; // Retornamos la función para desuscribirse
};

export const addProduct = async (householdId: string, name: string, category: string, unit: ProductUnit, note: string, quantity: number, minimumStock: number): Promise<Product> => {
  const newProductData: Omit<Product, 'id'> = {
    name,
    category,
    quantity,
    unit,
    note,
    onShoppingList: false,
    minimumStock,
  };

  try {
    const docRef = await db.collection(HOUSEHOLDS_COLLECTION).doc(householdId).collection(PRODUCTS_SUBCOLLECTION).add(newProductData);
    return { id: docRef.id, ...newProductData, note: note || '' };
  } catch (error) {
    console.error("Error adding product to Firestore:", error);
    throw error; // Re-throw the error so the UI can catch it
  }
};

export const updateProduct = async (householdId:string, productId: string, data: Partial<Omit<Product, 'id'>>) => {
    try {
        await db.collection(HOUSEHOLDS_COLLECTION).doc(householdId).collection(PRODUCTS_SUBCOLLECTION).doc(productId).update(data);
    } catch (error) {
        console.error("Error updating product:", error);
    }
};

export const deleteProduct = async (householdId: string, productId: string) => {
    try {
        await db.collection(HOUSEHOLDS_COLLECTION).doc(householdId).collection(PRODUCTS_SUBCOLLECTION).doc(productId).delete();
    } catch (error) {
        console.error("Error deleting product:", error);
    }
};
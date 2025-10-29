import { Household, Product, ProductUnit } from '../types';
import { firebaseConfig } from './firebaseConfig';

// Declarar firebase para que TypeScript lo reconozca
declare const firebase: any;

let db: any; // Instancia de Firestore

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
};

const generatePin = async (): Promise<string> => {
  let pin: string;
  let isUnique = false;
  while (!isUnique) {
    pin = Math.floor(1000 + Math.random() * 9000).toString();
    const q = await db.collection(HOUSEHOLDS_COLLECTION).where('pin', '==', pin).get();
    if (q.empty) {
      isUnique = true;
    }
  }
  return pin!;
}


// --- Household Management ---
export const loginWithPin = async (pin: string): Promise<Household | null> => {
  const querySnapshot = await db.collection(HOUSEHOLDS_COLLECTION).where('pin', '==', pin).limit(1).get();
  if (querySnapshot.empty) {
    return null;
  }
  const doc = querySnapshot.docs[0];
  const household = { id: doc.id, ...doc.data() } as Household;
  return household;
};

export const createHousehold = async (name: string): Promise<Household> => {
  const newPin = await generatePin();
  const newHouseholdData = {
    name,
    pin: newPin,
    categories: ['Esenciales', 'Boludez'],
  };
  const docRef = await db.collection(HOUSEHOLDS_COLLECTION).add(newHouseholdData);
  return { id: docRef.id, ...newHouseholdData };
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
          minimumStock: data.minimumStock, // Será undefined si no existe
      }}) as Product[];
      callback(products);
    }, (error: any) => {
      console.error("Error en la suscripción de productos:", error);
    });

  return unsubscribe; // Retornamos la función para desuscribirse
};

export const addProduct = async (householdId: string, name: string, category: string, unit: ProductUnit, note: string, quantity: number, minimumStock?: number): Promise<Product> => {
  const newProductData: Partial<Product> = {
    name,
    category,
    quantity,
    unit,
    note,
    onShoppingList: false,
    minimumStock,
  };

  // Firestore omite las claves con valor 'undefined'
  const docRef = await db.collection(HOUSEHOLDS_COLLECTION).doc(householdId).collection(PRODUCTS_SUBCOLLECTION).add(newProductData);
  return { id: docRef.id, ...newProductData } as Product;
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
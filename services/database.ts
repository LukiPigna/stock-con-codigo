import { Household, Product, ProductCategory, ProductUnit } from '../types';
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
  // Ya no guardamos la sesión en localStorage
  return household;
};

export const createHousehold = async (name: string): Promise<Household> => {
  const newPin = await generatePin();
  const newHouseholdData = {
    name,
    pin: newPin,
  };
  const docRef = await db.collection(HOUSEHOLDS_COLLECTION).add(newHouseholdData);
  return { id: docRef.id, ...newHouseholdData };
};

// --- Product Management (Real-time) ---
export const onProductsUpdate = (householdId: string, callback: (products: Product[]) => void): (() => void) => {
  const unsubscribe = db.collection(HOUSEHOLDS_COLLECTION).doc(householdId).collection(PRODUCTS_SUBCOLLECTION)
    .onSnapshot((snapshot: any) => {
      const products = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];
      callback(products);
    }, (error: any) => {
      console.error("Error en la suscripción de productos:", error);
    });

  return unsubscribe; // Retornamos la función para desuscribirse
};

export const addProduct = async (householdId: string, name: string, category: ProductCategory, unit: ProductUnit, note: string): Promise<Product> => {
  const newProductData = {
    name,
    category,
    quantity: 1,
    unit,
    note,
  };
  const docRef = await db.collection(HOUSEHOLDS_COLLECTION).doc(householdId).collection(PRODUCTS_SUBCOLLECTION).add(newProductData);
  return { id: docRef.id, ...newProductData };
};

export const updateProductQuantity = async (householdId:string, productId: string, newQuantity: number) => {
    try {
        await db.collection(HOUSEHOLDS_COLLECTION).doc(householdId).collection(PRODUCTS_SUBCOLLECTION).doc(productId).update({
            quantity: newQuantity
        });
    } catch (error) {
        console.error("Error updating product quantity:", error);
    }
};

export const deleteProduct = async (householdId: string, productId: string) => {
    try {
        await db.collection(HOUSEHOLDS_COLLECTION).doc(householdId).collection(PRODUCTS_SUBCOLLECTION).doc(productId).delete();
    } catch (error) {
        console.error("Error deleting product:", error);
    }
};
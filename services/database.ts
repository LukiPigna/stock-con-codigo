import { Household, Product, ProductUnit, User } from '../types';
import { firebaseConfig } from './firebaseConfig';

// Declarar firebase para que TypeScript lo reconozca
declare const firebase: any;

let db: any;
let auth: any;

const HOUSEHOLDS_COLLECTION = 'households';
const PRODUCTS_SUBCOLLECTION = 'products';
const USERS_COLLECTION = 'users';


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

export const onAuthStateChanged = (callback: (user: User | null) => void): (() => void) => {
    return auth.onAuthStateChanged(async (firebaseUser: any) => {
        if (firebaseUser) {
            const userDoc = await db.collection(USERS_COLLECTION).doc(firebaseUser.uid).get();
            const userData = userDoc.data();
            callback({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                householdId: userData?.householdId,
            });
        } else {
            callback(null);
        }
    });
};

export const signUpWithEmail = (email: string, password: string): Promise<any> => {
    return auth.createUserWithEmailAndPassword(email, password);
}

export const signInWithEmail = (email: string, password: string): Promise<any> => {
    return auth.signInWithEmailAndPassword(email, password);
}

export const signInWithGoogle = (): Promise<any> => {
    const provider = new firebase.auth.GoogleAuthProvider();
    return auth.signInWithPopup(provider);
}

export const signInAnonymously = (): Promise<any> => {
    return auth.signInAnonymously();
}

export const signOut = (): Promise<void> => {
    return auth.signOut();
}

// --- User Management ---

export const createUserData = async (uid: string, email: string | null, displayName: string | null, householdId?: string) => {
    const userRef = db.collection(USERS_COLLECTION).doc(uid);
    const doc = await userRef.get();
    if (!doc.exists) { // Create user document only if it doesn't exist
        return userRef.set({
            email,
            displayName,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            householdId: householdId || null,
        });
    } else if (householdId) { // If user exists and is joining a household
        return userRef.update({ householdId });
    }
}

export const getUserData = async (uid: string): Promise<User | null> => {
    const doc = await db.collection(USERS_COLLECTION).doc(uid).get();
    if (doc.exists) {
        return { uid, ...doc.data() } as User;
    }
    return null;
}

// --- Household Management ---

export const createHousehold = async (name: string, owner: User): Promise<Household> => {
  const newHouseholdData = {
    name,
    ownerUid: owner.uid,
    members: [owner.uid],
    categories: [], // Start with no default categories
    locations: [], // Start with no default locations
    tutorialCompleted: false, // Flag for new user onboarding
  };
  const docRef = await db.collection(HOUSEHOLDS_COLLECTION).add(newHouseholdData);
  
  // Update user's document with the new householdId
  await db.collection(USERS_COLLECTION).doc(owner.uid).update({ householdId: docRef.id });

  return { id: docRef.id, ...newHouseholdData };
};


export const getHousehold = async (householdId: string): Promise<Household | null> => {
    const doc = await db.collection(HOUSEHOLDS_COLLECTION).doc(householdId).get();
    if(doc.exists) {
        return { id: doc.id, ...doc.data() } as Household;
    }
    return null;
}

export const addUserToHousehold = async (householdId: string, user: User) => {
    const householdRef = db.collection(HOUSEHOLDS_COLLECTION).doc(householdId);
    const userRef = db.collection(USERS_COLLECTION).doc(user.uid);

    await db.runTransaction(async (transaction: any) => {
        const householdDoc = await transaction.get(householdRef);
        if (!householdDoc.exists) {
            throw "Household does not exist!";
        }

        transaction.update(householdRef, {
            members: firebase.firestore.FieldValue.arrayUnion(user.uid)
        });
        transaction.update(userRef, { householdId: householdId });
    });
};

export const removeUserFromHousehold = async (householdId: string, uidToRemove: string) => {
    const householdRef = db.collection(HOUSEHOLDS_COLLECTION).doc(householdId);
    const userRef = db.collection(USERS_COLLECTION).doc(uidToRemove);
    
    await db.runTransaction(async (transaction: any) => {
         transaction.update(householdRef, {
            members: firebase.firestore.FieldValue.arrayRemove(uidToRemove)
        });
        transaction.update(userRef, { householdId: null });
    });
}


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

export const markTutorialAsCompleted = async (householdId: string) => {
    try {
        await db.collection(HOUSEHOLDS_COLLECTION).doc(householdId).update({ tutorialCompleted: true });
    } catch (error) {
        console.error("Error marking tutorial as completed:", error);
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
          minimumStock: data.minimumStock !== undefined ? data.minimumStock : 0,
          location: data.location || undefined,
          expirationDate: data.expirationDate || undefined,
      }}) as Product[];
      callback(products);
    }, (error: any) => {
      console.error("Error en la suscripción de productos:", error);
    });

  return unsubscribe;
};

export const addProduct = async (householdId: string, name: string, category: string, unit: ProductUnit, note: string, quantity: number, minimumStock: number, location: string, expirationDate: string): Promise<Product> => {
  const newProductData: Omit<Product, 'id'> = {
    name,
    category,
    quantity,
    unit,
    note,
    onShoppingList: false,
    minimumStock,
    location,
    expirationDate: expirationDate || undefined,
  };

  try {
    const docRef = await db.collection(HOUSEHOLDS_COLLECTION).doc(householdId).collection(PRODUCTS_SUBCOLLECTION).add(newProductData);
    return { id: docRef.id, ...newProductData, note: note || '' };
  } catch (error) {
    console.error("Error adding product to Firestore:", error);
    throw error;
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
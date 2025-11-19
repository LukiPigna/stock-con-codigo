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
    try {
        if (!firebaseConfig || !firebaseConfig.apiKey || firebaseConfig.apiKey === "TU_API_KEY") {
             console.error("Firebase config missing or invalid.");
             return; 
        }

        // Initialize only if not already initialized
        if (typeof firebase !== 'undefined' && !firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        
        if (typeof firebase !== 'undefined') {
            db = firebase.firestore();
            auth = firebase.auth();
            
            // Enable offline persistence with safeguards
            if(db) {
                db.enablePersistence({ synchronizeTabs: true })
                .catch((err: any) => {
                    if (err.code == 'failed-precondition') {
                        console.warn('Persistence failed: Multiple tabs open');
                    } else if (err.code == 'unimplemented') {
                        console.warn('Persistence not supported by browser');
                    }
                });
            }
        } else {
            throw new Error("Firebase SDK not loaded");
        }
    } catch (e) {
        console.error("Error initializing DB:", e);
        throw e;
    }
};

// --- Auth Management ---

export const onAuthStateChanged = (callback: (user: User | null) => void): (() => void) => {
    if(!auth) return () => {};
    return auth.onAuthStateChanged(async (firebaseUser: any) => {
        if (firebaseUser) {
            try {
                const userDoc = await db.collection(USERS_COLLECTION).doc(firebaseUser.uid).get();
                const userData = userDoc.data();
                callback({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName,
                    householdId: userData?.householdId,
                });
            } catch (error) {
                console.error("Error fetching user data:", error);
                // Fallback user object if DB fetch fails but Auth works
                callback({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName,
                    householdId: undefined
                });
            }
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
    try {
        const doc = await userRef.get();
        // Only merge if needed to preserve other fields
        return userRef.set({
            email,
            displayName,
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            householdId: householdId || (doc.exists ? doc.data().householdId : null),
        }, { merge: true });
    } catch (e) {
        console.error("Error creating user data", e);
        throw e;
    }
}

export const getUserData = async (uid: string): Promise<User | null> => {
    try {
        const doc = await db.collection(USERS_COLLECTION).doc(uid).get();
        if (doc.exists) {
            return { uid, ...doc.data() } as User;
        }
    } catch (e) {
        console.error("Error getting user data", e);
    }
    return null;
}

// --- Household Management ---

export const createHousehold = async (name: string, owner: User): Promise<Household> => {
  const newHouseholdData = {
    name,
    ownerUid: owner.uid,
    members: [owner.uid],
    categories: ['Despensa', 'Lácteos', 'Verduras', 'Carnes', 'Limpieza', 'Congelados', 'Bebidas'], 
    locations: ['Heladera', 'Alacena', 'Freezer', 'Bajo mesada'], 
    tutorialCompleted: false, 
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  const docRef = await db.collection(HOUSEHOLDS_COLLECTION).add(newHouseholdData);
  
  await db.collection(USERS_COLLECTION).doc(owner.uid).update({ householdId: docRef.id });

  return { id: docRef.id, ...newHouseholdData };
};


export const getHousehold = async (householdId: string): Promise<Household | null> => {
    try {
        const doc = await db.collection(HOUSEHOLDS_COLLECTION).doc(householdId).get();
        if(doc.exists) {
            return { id: doc.id, ...doc.data() } as Household;
        }
    } catch (e) {
        console.error("Error getting household", e);
    }
    return null;
}

export const addUserToHousehold = async (householdId: string, user: User) => {
    const householdRef = db.collection(HOUSEHOLDS_COLLECTION).doc(householdId);
    const userRef = db.collection(USERS_COLLECTION).doc(user.uid);

    try {
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
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw e;
    }
};

export const removeUserFromHousehold = async (householdId: string, uidToRemove: string) => {
    const householdRef = db.collection(HOUSEHOLDS_COLLECTION).doc(householdId);
    const userRef = db.collection(USERS_COLLECTION).doc(uidToRemove);
    
    try {
        await db.runTransaction(async (transaction: any) => {
            transaction.update(householdRef, {
                members: firebase.firestore.FieldValue.arrayRemove(uidToRemove)
            });
            transaction.update(userRef, { householdId: null });
        });
    } catch (e) {
        console.error("Remove transaction failed: ", e);
        throw e;
    }
}


export const onHouseholdUpdate = (householdId: string, callback: (household: Household) => void): (() => void) => {
  if(!db) return () => {};
  return db.collection(HOUSEHOLDS_COLLECTION).doc(householdId)
    .onSnapshot((doc: any) => {
      if (doc.exists) {
        callback({ id: doc.id, ...doc.data() } as Household);
      }
    }, (error: any) => {
      console.error("Household snapshot error:", error);
    });
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
        console.error("Error marking tutorial:", error);
    }
};


// --- Product Management (Real-time) ---
export const onProductsUpdate = (householdId: string, callback: (products: Product[]) => void): (() => void) => {
  if(!db) return () => {};
  return db.collection(HOUSEHOLDS_COLLECTION).doc(householdId).collection(PRODUCTS_SUBCOLLECTION)
    .onSnapshot((snapshot: any) => {
      const products = snapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          onShoppingList: data.onShoppingList || false,
          minimumStock: data.minimumStock !== undefined ? data.minimumStock : 0,
      }}) as Product[];
      callback(products);
    }, (error: any) => {
      console.error("Products snapshot error:", error);
    });
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
    console.error("Error adding product:", error);
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
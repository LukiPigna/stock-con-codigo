import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, onAuthStateChanged as firebaseOnAuthStateChanged, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword, signOut as firebaseSignOut, User, Auth } from "firebase/auth";
import { getFirestore, collection, doc, where, limit, getDocs, addDoc, updateDoc, arrayUnion, onSnapshot, runTransaction, getDoc, deleteDoc, serverTimestamp, increment, query, orderBy, Timestamp, Firestore } from "firebase/firestore";
import { Household, Product, FirebaseUser, ProductBatch } from '../types';
import { firebaseConfig } from './firebaseConfig';

let db: Firestore;
let auth: Auth;

const HOUSEHOLDS_COLLECTION = 'households';
const PRODUCTS_COLLECTION = 'products';
const BATCHES_COLLECTION = 'batches';

export const initDB = () => {
  if (firebaseConfig.apiKey === "TU_API_KEY" || firebaseConfig.projectId === "TU_PROJECT_ID") {
    const errorMsg = "Configuración de Firebase incompleta. Por favor, edita el archivo 'services/firebaseConfig.ts' con las credenciales de tu proyecto.";
    alert(errorMsg);
    throw new Error(errorMsg);
  }

  if (!getApps().length) {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } else {
    const app = getApp();
    db = getFirestore(app);
    auth = getAuth(app);
  }
};

// --- Auth Management ---
export const onAuthStateChanged = (callback: (user: User | null) => void) => firebaseOnAuthStateChanged(auth, callback);
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
};
export const signUpWithEmail = async (name: string, email: string, pass: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  if (userCredential.user) {
    await updateProfile(userCredential.user, { displayName: name });
  }
  return userCredential.user;
};
export const signInWithEmail = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);
export const signOut = () => firebaseSignOut(auth);

// --- Household Management ---
export const getHouseholdForUser = async (userId: string): Promise<Household | null> => {
  const householdsRef = collection(db, HOUSEHOLDS_COLLECTION);
  const q = query(householdsRef, where('members', 'array-contains', userId), limit(1));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  const doc = querySnapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Household;
};

export const createHousehold = async (name: string, user: FirebaseUser): Promise<Household> => {
  const newHouseholdData = { name, owner: user.uid, members: [user.uid], categories: ['Esenciales', 'Lácteos', 'Carnes', 'Frutas y Verduras', 'Limpieza', 'Otros'] };
  const docRef = await addDoc(collection(db, HOUSEHOLDS_COLLECTION), newHouseholdData);
  return { id: docRef.id, ...newHouseholdData };
};

export const joinHousehold = async (householdId: string, userId: string) => {
  const householdRef = doc(db, HOUSEHOLDS_COLLECTION, householdId);
  await updateDoc(householdRef, { members: arrayUnion(userId) });
};

export const onHouseholdUpdate = (householdId: string, callback: (household: Household) => void): (() => void) => {
  const householdRef = doc(db, HOUSEHOLDS_COLLECTION, householdId);
  return onSnapshot(householdRef, (doc) => {
    if (doc.exists()) callback({ id: doc.id, ...doc.data() } as Household);
  }, (error) => console.error("Error en la suscripción de la casa:", error));
};

export const updateHousehold = (householdId: string, data: Partial<Omit<Household, 'id'>>) => {
  return updateDoc(doc(db, HOUSEHOLDS_COLLECTION, householdId), data);
};

// --- Product Management ---
export const onProductsUpdate = (householdId: string, callback: (products: Product[]) => void): (() => void) => {
  const productsRef = collection(db, HOUSEHOLDS_COLLECTION, householdId, PRODUCTS_COLLECTION);
  return onSnapshot(productsRef, (snapshot) => {
    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
    callback(products);
  }, (error) => console.error("Error en la suscripción de productos:", error));
};

export const addProduct = (householdId: string, productData: Omit<Product, 'id' | 'quantity'>, initialBatch: { quantity: number; expirationDate: string | null}) => {
  const householdRef = doc(db, HOUSEHOLDS_COLLECTION, householdId);
  const productsCollectionRef = collection(householdRef, PRODUCTS_COLLECTION);
  const newProductRef = doc(productsCollectionRef);
  const newBatchRef = doc(collection(newProductRef, BATCHES_COLLECTION));

  return runTransaction(db, async (transaction) => {
    transaction.set(newProductRef, {
      ...productData,
      quantity: initialBatch.quantity,
    });
    transaction.set(newBatchRef, {
      quantity: initialBatch.quantity,
      expirationDate: initialBatch.expirationDate ? Timestamp.fromDate(new Date(initialBatch.expirationDate)) : null,
      addedDate: serverTimestamp(),
    });
  });
};

export const updateProduct = (householdId: string, productId: string, data: Partial<Omit<Product, 'id'>>) => {
  const productRef = doc(db, HOUSEHOLDS_COLLECTION, householdId, PRODUCTS_COLLECTION, productId);
  return updateDoc(productRef, data);
};

export const updateProductQuantity = (householdId: string, productId: string, delta: number) => {
    const productRef = doc(db, HOUSEHOLDS_COLLECTION, householdId, PRODUCTS_COLLECTION, productId);
    const batchesRef = collection(productRef, BATCHES_COLLECTION);

    return runTransaction(db, async (transaction) => {
        const productDoc = await transaction.get(productRef);
        if (!productDoc.exists()) throw new Error("Producto no encontrado.");
        
        const productData = productDoc.data();

        // This read is outside the transaction's atomic guarantees. It's a limitation of the Web SDK.
        const batchesSnapshot = await getDocs(query(batchesRef));
        const currentBatches = batchesSnapshot.docs.map(d => ({ id: d.id, ref: d.ref, ...d.data() })) as (ProductBatch & { ref: any })[];
        
        let totalFromBatches = currentBatches.reduce((sum, b) => sum + b.quantity, 0);
        let finalQuantity = totalFromBatches;

        // --- DATA REPAIR ---
        // If the product is unit-based and has a decimal quantity, we fix it now.
        if (productData.unit === 'un.' && totalFromBatches % 1 !== 0) {
            const roundedTotal = Math.round(totalFromBatches);
            const repairDelta = roundedTotal - totalFromBatches;

            if (currentBatches.length > 0) {
                // Apply the rounding difference to the newest batch
                currentBatches.sort((a, b) => (b.addedDate?.toMillis() || 0) - (a.addedDate?.toMillis() || 0));
                transaction.update(currentBatches[0].ref, { quantity: increment(repairDelta) });
            }
            // Update the total for subsequent calculations in this transaction
            finalQuantity = roundedTotal;
        }

        const newTotalQuantity = finalQuantity + delta;
        if (newTotalQuantity < 0) {
            // We can't fulfill the request, so we abort the transaction.
            return;
        }

        // --- APPLY USER ACTION ---
        if (delta > 0) {
            // Always create a new batch for additions. It's simpler and more transparent.
            const newBatchRef = doc(batchesRef);
            transaction.set(newBatchRef, {
                quantity: delta,
                expirationDate: null,
                addedDate: serverTimestamp()
            });
        } else if (delta < 0) {
            let amountToConsume = Math.abs(delta);
            
            // Sort batches to consume expiring ones first, then oldest.
            const sortedBatches = currentBatches.sort((a, b) => {
                if (a.expirationDate && b.expirationDate) return a.expirationDate.toMillis() - b.expirationDate.toMillis();
                if (a.expirationDate) return -1;
                if (b.expirationDate) return 1;
                return (a.addedDate?.toMillis() || 0) - (b.addedDate?.toMillis() || 0);
            });

            for (const batch of sortedBatches) {
                if (amountToConsume === 0) break;
                
                const batchQuantity = batch.quantity;
                if (batchQuantity > amountToConsume) {
                    transaction.update(batch.ref, { quantity: increment(-amountToConsume) });
                    amountToConsume = 0;
                } else {
                    transaction.delete(batch.ref);
                    amountToConsume -= batchQuantity;
                }
            }
        }
        
        // Finally, update the product's total quantity. This is the source of truth for the UI.
        transaction.update(productRef, { quantity: newTotalQuantity });
    });
};

export const deleteProduct = async (householdId: string, productId: string) => {
    const productRef = doc(db, HOUSEHOLDS_COLLECTION, householdId, PRODUCTS_COLLECTION, productId);
    const batchesRef = collection(productRef, BATCHES_COLLECTION);

    // First, delete all batches in the subcollection
    const batchesSnapshot = await getDocs(batchesRef);
    const deletePromises = batchesSnapshot.docs.map(batchDoc => deleteDoc(batchDoc.ref));
    await Promise.all(deletePromises);

    // Then, delete the product document itself
    await deleteDoc(productRef);
};


// --- Batch Management ---
export const onBatchesUpdate = (householdId: string, productId: string, callback: (batches: ProductBatch[]) => void): (() => void) => {
    const batchesRef = collection(db, HOUSEHOLDS_COLLECTION, householdId, PRODUCTS_COLLECTION, productId, BATCHES_COLLECTION);
    return onSnapshot(batchesRef, (snapshot) => {
        const batches = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        })) as ProductBatch[];
        callback(batches);
    }, (error) => console.error("Error en la suscripción de lotes:", error));
};

export const addProductBatch = (householdId: string, productId: string, batchData: Omit<ProductBatch, 'id' | 'addedDate'>) => {
    const productRef = doc(db, HOUSEHOLDS_COLLECTION, householdId, PRODUCTS_COLLECTION, productId);
    const newBatchRef = doc(collection(productRef, BATCHES_COLLECTION));

    return runTransaction(db, async (transaction) => {
        transaction.set(newBatchRef, {
            ...batchData,
            addedDate: serverTimestamp()
        });
        transaction.update(productRef, { quantity: increment(batchData.quantity) });
    });
};

export const updateBatch = (householdId: string, productId: string, batchId: string, newData: Partial<ProductBatch>) => {
    const productRef = doc(db, HOUSEHOLDS_COLLECTION, householdId, PRODUCTS_COLLECTION, productId);
    const batchRef = doc(productRef, BATCHES_COLLECTION, batchId);

    return runTransaction(db, async (transaction) => {
        const batchDoc = await transaction.get(batchRef);
        if (!batchDoc.exists()) throw new Error("¡El lote no existe!");
        
        const oldQuantity = batchDoc.data()?.quantity || 0;
        const newQuantity = newData.quantity !== undefined ? newData.quantity : oldQuantity;
        const quantityDelta = newQuantity - oldQuantity;

        transaction.update(batchRef, newData);
        
        if (quantityDelta !== 0) {
            transaction.update(productRef, { quantity: increment(quantityDelta) });
        }
    });
};

export const deleteBatch = (householdId: string, productId: string, batchId: string) => {
    const productRef = doc(db, HOUSEHOLDS_COLLECTION, householdId, PRODUCTS_COLLECTION, productId);
    const batchRef = doc(productRef, BATCHES_COLLECTION, batchId);
    
    return runTransaction(db, async (transaction) => {
        const batchDoc = await transaction.get(batchRef);
        if (!batchDoc.exists()) throw new Error("¡El lote no existe!");
        
        const quantityToDecrement = batchDoc.data()?.quantity || 0;
        transaction.delete(batchRef);
        transaction.update(productRef, { quantity: increment(-quantityToDecrement) });
    });
};
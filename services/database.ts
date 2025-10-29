import { Household, Product, ProductCategory, ProductUnit } from '../types';

interface PantryData {
  households: Household[];
  products: Record<string, Product[]>; // Household ID -> Product[]
  currentHousehold: string | null; // Household ID
}

const DB_KEY = 'pantryAppDB';

let db: PantryData = {
  households: [],
  products: {},
  currentHousehold: null,
};

const saveDB = () => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch (error) {
    console.error("Error saving to database", error);
  }
};

const loadDB = () => {
  try {
    const data = localStorage.getItem(DB_KEY);
    if (data) {
       const parsedData = JSON.parse(data);
       // Breaking change: Reset DB if it's the old user-based format
       if (parsedData.users || parsedData.currentUser) {
           console.warn("Old database structure detected. Resetting for new PIN system.");
           db = { households: [], products: {}, currentHousehold: null };
           saveDB();
       } else {
           db = parsedData;
       }
    }
  } catch (error) {
    console.error("Error loading from database", error);
    db = { households: [], products: {}, currentHousehold: null };
  }
};

const generatePin = (): string => {
  let pin: string;
  do {
    pin = Math.floor(1000 + Math.random() * 9000).toString();
  } while (db.households.some(h => h.pin === pin)); // Ensure PIN is unique
  return pin;
}

export const initDB = () => {
  loadDB();
};

// --- Household Management ---
export const loginWithPin = (pin: string): Household | null => {
  const household = db.households.find(h => h.pin === pin);
  if (household) {
    db.currentHousehold = household.id;
    saveDB();
    return household;
  }
  return null;
};

export const logout = () => {
  db.currentHousehold = null;
  saveDB();
};

export const createHousehold = (name: string): Household => {
  const newHousehold: Household = {
    id: `house_${Date.now()}`,
    name,
    pin: generatePin(),
  };
  db.households.push(newHousehold);
  db.products[newHousehold.id] = [];
  saveDB();
  return newHousehold;
};

export const setCurrentHousehold = (householdId: string) => {
  db.currentHousehold = householdId;
  saveDB();
};

export const getCurrentHousehold = (): Household | null => {
  if (!db.currentHousehold) return null;
  const household = db.households.find(h => h.id === db.currentHousehold);
  if (!household) {
      // Data inconsistency, clear current household
      db.currentHousehold = null;
      saveDB();
      return null;
  }
  return household;
};

// --- Product Management ---
export const getProducts = (householdId: string): Product[] => {
  return db.products[householdId] || [];
};

export const addProduct = (householdId: string, name: string, category: ProductCategory, unit: ProductUnit, note: string): Product => {
  const newProduct: Product = {
    id: `prod_${Date.now()}`,
    name,
    category,
    quantity: 1,
    unit,
    note,
  };
  if (!db.products[householdId]) {
    db.products[householdId] = [];
  }
  db.products[householdId].push(newProduct);
  saveDB();
  return newProduct;
};

export const updateProductQuantity = (householdId: string, productId: string, newQuantity: number) => {
  const products = db.products[householdId];
  if (products) {
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex > -1) {
      products[productIndex].quantity = newQuantity;
      saveDB();
    }
  }
};

export const deleteProduct = (householdId: string, productId: string) => {
  const products = db.products[householdId];
  if (products) {
    db.products[householdId] = products.filter(p => p.id !== productId);
    saveDB();
  }
};

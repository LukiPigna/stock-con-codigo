export enum ProductUnit {
  Units = 'un.',
  Grams = 'gr',
  Kilograms = 'kg',
}

export interface Product {
  id: string;
  name: string;
  quantity: number;
  category: string;
  unit: ProductUnit;
  note?: string;
  onShoppingList: boolean;
  minimumStock?: number;
}

export enum View {
  All = 'All',
  Shopping = 'Shopping',
  SupermarketList = 'SupermarketList',
}

export interface Household {
  id: string;
  name: string;
  owner: string; // UID of the owner
  members: string[]; // UIDs of all members, including owner
  categories: string[];
}

export interface FirebaseUser {
  uid: string;
  displayName: string | null;
  email: string | null;
}
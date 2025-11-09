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
  location?: string;
}

export enum View {
  All = 'All',
  Shopping = 'Shopping',
  SupermarketList = 'SupermarketList',
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  householdId?: string;
}

export interface Household {
  id: string;
  name: string;
  ownerUid: string;
  members: string[]; // Array of user UIDs
  categories: string[];
  locations: string[];
  tutorialCompleted?: boolean;
}
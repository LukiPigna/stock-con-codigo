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
}

export enum View {
  All = 'All',
  Shopping = 'Shopping',
}

export interface Household {
  id: string;
  name: string;
  pin: string; // 4-digit PIN
  categories: string[];
}
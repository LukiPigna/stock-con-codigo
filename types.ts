export enum ProductCategory {
  Essential = 'Esencial',
  Luxury = 'Lujo',
  Trifle = 'Boludez',
}

export enum ProductUnit {
  Units = 'un.',
  Grams = 'gr',
  Kilograms = 'kg',
}

export interface Product {
  id: string;
  name: string;
  quantity: number;
  category: ProductCategory;
  unit: ProductUnit;
  note?: string;
}

export enum View {
  All = 'All',
  Missing = 'Missing',
}

export interface Household {
  id: string;
  name: string;
  pin: string; // 4-digit PIN
}

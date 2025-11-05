// types.ts
import { Timestamp } from 'firebase/firestore';

export type ProductUnit = 'un.' | 'gr' | 'kg';
export const ProductUnits: ProductUnit[] = ['un.', 'gr', 'kg'];

export interface ProductBatch {
  id: string;
  quantity: number;
  addedDate: Timestamp;
  expirationDate: Timestamp | null;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  unit: ProductUnit;
  quantity: number; // This will be the SUM of all batch quantities
  note?: string;
  onShoppingList: boolean;
  minimumStock?: number;
}

export enum View {
  All = 'All',
  Shopping = 'Shopping',
  SupermarketList = 'SupermarketList',
  Summary = 'Summary',
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
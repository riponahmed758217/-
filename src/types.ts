import { LucideIcon } from 'lucide-react';

export type TransactionType = 'buy' | 'sell' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  date: string;
  name: string;
  qty: number;
  total: number;
  paidOrRec: number; // For buy: paid, For sell: received, For expense: amount
  due: number;
  timestamp: number;
}

export interface AppState {
  transactions: Transaction[];
}

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

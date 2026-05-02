export interface User {
  id: string;
  name: string;
  color: string;
}

export type Category = 
  | 'Alimentação' 
  | 'Transporte' 
  | 'Lazer' 
  | 'Saúde' 
  | 'Educação' 
  | 'Moradia' 
  | 'Compras'
  | 'Outros';

export interface Expense {
  id: string;
  userId: string;
  description: string;
  amount: number;
  date: string; // ISO Date of the transaction
  billingMonth: string; // YYYY-MM representing the cycle it belongs to
  category: Category;
  installments: number;
  currentInstallment: number;
  installmentGroupId?: string;
}

export interface AppSettings {
  closingDay: number;
  totalLimit: number;
  paidMonths: string[]; // List of YYYY-MM that are paid
}

export const CATEGORIES: Category[] = [
  'Alimentação',
  'Transporte',
  'Lazer',
  'Saúde',
  'Educação',
  'Moradia',
  'Compras',
  'Outros'
];

export const USER_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

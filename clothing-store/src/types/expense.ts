export interface ExpenseCategory {
  id: string;
  name: string;
  createdAt: Date;
}

export interface SpendingMenu {
  id: string;
  name: string;
  createdAt: Date;
}

export interface Expense {
  id: string;
  categoryId: string;
  categoryName: string;
  spendingMenuId: string;
  spendingMenuName: string;
  note: string;
  imageUrl?: string;
  date: Date;
  amount: number;
  currency: "THB" | "MMK";
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExpenseData {
  categoryId: string;
  spendingMenuId: string;
  note: string;
  imageUrl?: string;
  date: Date;
  amount: number;
  currency: "THB" | "MMK";
}

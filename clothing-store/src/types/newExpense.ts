export interface NewExpenseCategory {
  id: string;
  name: string;
  createdAt: Date;
}

export interface NewSpendingMenu {
  id: string;
  name: string;
  createdAt: Date;
}

export interface NewExpense {
  id: string;
  categoryId: string;
  categoryName: string;
  spendingMenuId?: string;
  spendingMenuName?: string;
  note: string;
  imageUrl?: string;
  date: Date;
  amount: number;
  currency: "THB" | "MMK";
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNewExpenseData {
  categoryId: string;
  spendingMenuId?: string;
  note: string;
  imageUrl?: string;
  date: Date;
  amount: number;
  currency: "THB" | "MMK";
}

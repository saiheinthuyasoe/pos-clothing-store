import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Expense,
  ExpenseCategory,
  SpendingMenu,
  CreateExpenseData,
} from "@/types/expense";

const EXPENSES_COLLECTION = "expenses";
const CATEGORIES_COLLECTION = "expenseCategories";
const SPENDING_MENUS_COLLECTION = "spendingMenus";

// Category functions
export const addExpenseCategory = async (
  name: string
): Promise<ExpenseCategory> => {
  try {
    if (!db) {
      throw new Error("Database not initialized");
    }

    const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), {
      name,
      createdAt: Timestamp.now(),
    });

    return {
      id: docRef.id,
      name,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error("Error adding expense category:", error);
    throw error;
  }
};

export const getExpenseCategories = async (): Promise<ExpenseCategory[]> => {
  try {
    if (!db) {
      throw new Error("Database not initialized");
    }

    const q = query(
      collection(db, CATEGORIES_COLLECTION),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    }));
  } catch (error) {
    console.error("Error getting expense categories:", error);
    throw error;
  }
};

export const deleteExpenseCategory = async (id: string): Promise<void> => {
  try {
    if (!db) {
      throw new Error("Database not initialized");
    }

    await deleteDoc(doc(db, CATEGORIES_COLLECTION, id));
  } catch (error) {
    console.error("Error deleting expense category:", error);
    throw error;
  }
};

// Spending Menu functions
export const addSpendingMenu = async (name: string): Promise<SpendingMenu> => {
  try {
    if (!db) {
      throw new Error("Database not initialized");
    }

    const docRef = await addDoc(collection(db, SPENDING_MENUS_COLLECTION), {
      name,
      createdAt: Timestamp.now(),
    });

    return {
      id: docRef.id,
      name,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error("Error adding spending menu:", error);
    throw error;
  }
};

export const getSpendingMenus = async (): Promise<SpendingMenu[]> => {
  try {
    if (!db) {
      throw new Error("Database not initialized");
    }

    const q = query(
      collection(db, SPENDING_MENUS_COLLECTION),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    }));
  } catch (error) {
    console.error("Error getting spending menus:", error);
    throw error;
  }
};

export const deleteSpendingMenu = async (id: string): Promise<void> => {
  try {
    if (!db) {
      throw new Error("Database not initialized");
    }

    await deleteDoc(doc(db, SPENDING_MENUS_COLLECTION, id));
  } catch (error) {
    console.error("Error deleting spending menu:", error);
    throw error;
  }
};

// Expense functions
export const addExpense = async (data: CreateExpenseData): Promise<Expense> => {
  try {
    if (!db) {
      throw new Error("Database not initialized");
    }

    // Get category and spending menu names
    const categoryDoc = await getDoc(
      doc(db, CATEGORIES_COLLECTION, data.categoryId)
    );
    const spendingMenuDoc = await getDoc(
      doc(db, SPENDING_MENUS_COLLECTION, data.spendingMenuId)
    );

    if (!categoryDoc.exists() || !spendingMenuDoc.exists()) {
      throw new Error("Category or Spending Menu not found");
    }

    const expenseData = {
      categoryId: data.categoryId,
      categoryName: categoryDoc.data().name,
      spendingMenuId: data.spendingMenuId,
      spendingMenuName: spendingMenuDoc.data().name,
      note: data.note,
      imageUrl: data.imageUrl || "",
      date: Timestamp.fromDate(data.date),
      amount: data.amount,
      currency: data.currency,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(
      collection(db, EXPENSES_COLLECTION),
      expenseData
    );

    return {
      id: docRef.id,
      ...expenseData,
      date: data.date,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error("Error adding expense:", error);
    throw error;
  }
};

export const getExpenses = async (): Promise<Expense[]> => {
  try {
    if (!db) {
      throw new Error("Database not initialized");
    }

    const q = query(
      collection(db, EXPENSES_COLLECTION),
      orderBy("date", "desc")
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        categoryId: data.categoryId,
        categoryName: data.categoryName,
        spendingMenuId: data.spendingMenuId,
        spendingMenuName: data.spendingMenuName,
        note: data.note,
        imageUrl: data.imageUrl || "",
        date: data.date?.toDate() || new Date(),
        amount: data.amount,
        currency: data.currency,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });
  } catch (error) {
    console.error("Error getting expenses:", error);
    throw error;
  }
};

export const getExpenseById = async (id: string): Promise<Expense | null> => {
  try {
    if (!db) {
      throw new Error("Database not initialized");
    }

    const docRef = doc(db, EXPENSES_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      categoryId: data.categoryId,
      categoryName: data.categoryName,
      spendingMenuId: data.spendingMenuId,
      spendingMenuName: data.spendingMenuName,
      note: data.note,
      imageUrl: data.imageUrl || "",
      date: data.date?.toDate() || new Date(),
      amount: data.amount,
      currency: data.currency,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error("Error getting expense:", error);
    throw error;
  }
};

export const updateExpense = async (
  id: string,
  data: Partial<CreateExpenseData>
): Promise<void> => {
  try {
    if (!db) {
      throw new Error("Database not initialized");
    }

    const updateData: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
    };

    if (data.categoryId) {
      const categoryDoc = await getDoc(
        doc(db, CATEGORIES_COLLECTION, data.categoryId)
      );
      if (categoryDoc.exists()) {
        updateData.categoryId = data.categoryId;
        updateData.categoryName = categoryDoc.data().name;
      }
    }

    if (data.spendingMenuId) {
      const spendingMenuDoc = await getDoc(
        doc(db, SPENDING_MENUS_COLLECTION, data.spendingMenuId)
      );
      if (spendingMenuDoc.exists()) {
        updateData.spendingMenuId = data.spendingMenuId;
        updateData.spendingMenuName = spendingMenuDoc.data().name;
      }
    }

    if (data.note !== undefined) updateData.note = data.note;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.date) updateData.date = Timestamp.fromDate(data.date);
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.currency) updateData.currency = data.currency;

    await updateDoc(doc(db, EXPENSES_COLLECTION, id), updateData);
  } catch (error) {
    console.error("Error updating expense:", error);
    throw error;
  }
};

export const deleteExpense = async (id: string): Promise<void> => {
  try {
    if (!db) {
      throw new Error("Database not initialized");
    }

    await deleteDoc(doc(db, EXPENSES_COLLECTION, id));
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw error;
  }
};

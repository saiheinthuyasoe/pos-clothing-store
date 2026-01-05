import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";

const CATEGORIES_DOC_ID = "categories";
const SETTINGS_COLLECTION = "settings";

export interface CategoriesData {
  categories: string[];
  updatedAt: string;
}

export class CategoryService {
  /**
   * Get categories from Firestore
   */
  static async getCategories(): Promise<string[]> {
    if (!db) {
      console.warn("Firestore not initialized, using default categories");
      return ["Shirt", "Pants", "Dress", "Jacket", "Accessories"];
    }

    try {
      const docRef = doc(db, SETTINGS_COLLECTION, CATEGORIES_DOC_ID);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as CategoriesData;
        return data.categories || [];
      } else {
        // Initialize with default categories if document doesn't exist
        const defaultCategories = [
          "Shirt",
          "Pants",
          "Dress",
          "Jacket",
          "Accessories",
        ];
        await this.saveCategories(defaultCategories);
        return defaultCategories;
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      return ["Shirt", "Pants", "Dress", "Jacket", "Accessories"];
    }
  }

  /**
   * Save categories to Firestore
   */
  static async saveCategories(categories: string[]): Promise<void> {
    if (!db) {
      console.warn("Firestore not initialized, cannot save categories");
      return;
    }

    try {
      const docRef = doc(db, SETTINGS_COLLECTION, CATEGORIES_DOC_ID);
      const data: CategoriesData = {
        categories,
        updatedAt: new Date().toISOString(),
      };

      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        await updateDoc(docRef, {
          categories,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await setDoc(docRef, data);
      }
    } catch (error) {
      console.error("Error saving categories:", error);
      throw error;
    }
  }

  /**
   * Add a new category
   */
  static async addCategory(newCategory: string): Promise<string[]> {
    const currentCategories = await this.getCategories();

    // Check if category already exists (case-insensitive)
    const exists = currentCategories.some(
      (cat) => cat.toLowerCase() === newCategory.toLowerCase()
    );

    if (exists) {
      throw new Error("Category already exists");
    }

    const updatedCategories = [...currentCategories, newCategory.trim()];
    await this.saveCategories(updatedCategories);
    return updatedCategories;
  }

  /**
   * Delete a category
   */
  static async deleteCategory(categoryToDelete: string): Promise<string[]> {
    const currentCategories = await this.getCategories();
    const updatedCategories = currentCategories.filter(
      (cat) => cat !== categoryToDelete
    );
    await this.saveCategories(updatedCategories);
    return updatedCategories;
  }

  /**
   * Subscribe to real-time category updates
   */
  static subscribeToCategories(
    callback: (categories: string[]) => void
  ): Unsubscribe | null {
    if (!db) {
      console.warn("Firestore not initialized, cannot subscribe to categories");
      return null;
    }

    try {
      const docRef = doc(db, SETTINGS_COLLECTION, CATEGORIES_DOC_ID);

      return onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as CategoriesData;
            callback(data.categories || []);
          } else {
            // Initialize with defaults if doesn't exist
            this.saveCategories([
              "Shirt",
              "Pants",
              "Dress",
              "Jacket",
              "Accessories",
            ]);
          }
        },
        (error) => {
          console.error("Error in categories subscription:", error);
        }
      );
    } catch (error) {
      console.error("Error setting up categories subscription:", error);
      return null;
    }
  }
}

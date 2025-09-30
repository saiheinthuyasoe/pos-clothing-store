import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { Cart, CartItem } from '@/types/cart';

const COLLECTION_NAME = 'carts';

export interface DatabaseCart extends Cart {
  id?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export class CartService {
  /**
   * Save cart to database
   */
  static async saveCart(userId: string, cart: Cart): Promise<void> {
    if (!db || !isFirebaseConfigured) {
      console.warn('Firebase not configured, cart will only be saved locally');
      return;
    }

    try {
      const cartData: Omit<DatabaseCart, 'id'> = {
        ...cart,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Use userId as document ID to ensure one cart per user
      const cartRef = doc(db, COLLECTION_NAME, userId);
      await setDoc(cartRef, {
        ...cartData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log('Cart saved to database successfully');
    } catch (error) {
      console.error('Error saving cart to database:', error);
      // Don't throw error - allow app to continue with localStorage
    }
  }

  /**
   * Load cart from database
   */
  static async loadCart(userId: string): Promise<Cart | null> {
    if (!db || !isFirebaseConfigured) {
      console.warn('Firebase not configured, loading cart from localStorage only');
      return null;
    }

    try {
      const cartRef = doc(db, COLLECTION_NAME, userId);
      const cartDoc = await getDoc(cartRef);

      if (cartDoc.exists()) {
        const data = cartDoc.data();
        const cart: Cart = {
          items: data.items || [],
          totalItems: data.totalItems || 0,
          totalAmount: data.totalAmount || 0,
          currency: data.currency || 'THB',
        };

        console.log('Cart loaded from database successfully');
        return cart;
      } else {
        console.log('No cart found in database for user');
        return null;
      }
    } catch (error) {
      console.error('Error loading cart from database:', error);
      return null;
    }
  }

  /**
   * Clear cart from database
   */
  static async clearCart(userId: string): Promise<void> {
    if (!db || !isFirebaseConfigured) {
      console.warn('Firebase not configured, cart will only be cleared locally');
      return;
    }

    try {
      const cartRef = doc(db, COLLECTION_NAME, userId);
      await deleteDoc(cartRef);
      console.log('Cart cleared from database successfully');
    } catch (error) {
      console.error('Error clearing cart from database:', error);
      // Don't throw error - allow app to continue
    }
  }

  /**
   * Update specific cart item in database
   */
  static async updateCartItem(userId: string, cart: Cart): Promise<void> {
    // For now, just save the entire cart
    // In the future, we could optimize this to update specific items
    await this.saveCart(userId, cart);
  }

  /**
   * Get all carts (admin function)
   */
  static async getAllCarts(): Promise<DatabaseCart[]> {
    if (!db || !isFirebaseConfigured) {
      throw new Error('Firebase is not configured');
    }

    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      const carts: DatabaseCart[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        carts.push({
          id: doc.id,
          ...data,
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate().toISOString()
              : data.createdAt,
          updatedAt:
            data.updatedAt instanceof Timestamp
              ? data.updatedAt.toDate().toISOString()
              : data.updatedAt,
        } as DatabaseCart);
      });

      return carts;
    } catch (error) {
      console.error('Error fetching carts:', error);
      throw new Error('Failed to fetch carts');
    }
  }
}
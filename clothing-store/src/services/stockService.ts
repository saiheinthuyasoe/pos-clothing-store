import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import {
  StockItem,
  CreateStockRequest,
  WholesaleTier,
  ColorVariant,
} from "@/types/stock";

const COLLECTION_NAME = "stocks";

// Helper function to generate unique IDs
const generateId = () =>
  Date.now().toString() + Math.random().toString(36).substr(2, 9);

export class StockService {
  static async createStock(
    stockData: CreateStockRequest,
    userId: string
  ): Promise<StockItem> {
    if (!db || !isFirebaseConfigured) {
      throw new Error("Firebase is not configured");
    }

    try {
      // Generate IDs for wholesale tiers and color variants
      const wholesaleTiers: WholesaleTier[] = stockData.wholesaleTiers.map(
        (tier) => ({
          ...tier,
          id: generateId(),
        })
      );

      const colorVariants: ColorVariant[] = stockData.colorVariants.map(
        (variant) => ({
          ...variant,
          id: generateId(),
        })
      );

      const stockItem: Omit<StockItem, "id"> = {
        ...stockData,
        wholesaleTiers,
        colorVariants,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: userId,
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...stockItem,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return {
        id: docRef.id,
        ...stockItem,
      };
    } catch (error) {
      console.error("Error creating stock:", error);
      throw new Error("Failed to create stock item");
    }
  }

  static async getAllStocks(): Promise<StockItem[]> {
    if (!db || !isFirebaseConfigured) {
      // Return mock data when Firebase is not configured
      return this.getMockStocks();
    }

    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const stocks: StockItem[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        stocks.push({
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
        } as StockItem);
      });

      return stocks;
    } catch (error) {
      console.error("Error fetching stocks:", error);
      throw new Error("Failed to fetch stocks");
    }
  }

  static async getRecentStocks(limitCount: number = 10): Promise<StockItem[]> {
    if (!db || !isFirebaseConfigured) {
      // Return mock data when Firebase is not configured
      return this.getMockStocks().slice(0, limitCount);
    }

    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const stocks: StockItem[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        stocks.push({
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
        } as StockItem);
      });

      return stocks;
    } catch (error) {
      console.error("Error fetching recent stocks:", error);
      throw new Error("Failed to fetch recent stocks");
    }
  }

  static async getStocksByShop(shop: string): Promise<StockItem[]> {
    if (!db || !isFirebaseConfigured) {
      return this.getMockStocks().filter((stock) => stock.shop === shop);
    }

    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("shop", "==", shop),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const stocks: StockItem[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        stocks.push({
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
        } as StockItem);
      });

      return stocks;
    } catch (error) {
      console.error("Error fetching stocks by shop:", error);
      throw new Error("Failed to fetch stocks by shop");
    }
  }

  static async updateStock(
    id: string,
    updates: Partial<StockItem>
  ): Promise<void> {
    if (!db || !isFirebaseConfigured) {
      throw new Error("Firebase is not configured");
    }

    try {
      const stockRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(stockRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating stock:", error);
      throw new Error("Failed to update stock item");
    }
  }

  static async deleteStock(id: string): Promise<void> {
    if (!db || !isFirebaseConfigured) {
      throw new Error("Firebase is not configured");
    }

    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error("Error deleting stock:", error);
      throw new Error("Failed to delete stock item");
    }
  }

  // Mock data for when Firebase is not configured
  private static getMockStocks(): StockItem[] {
    return [
      {
        id: "1",
        groupName: "Summer T-Shirt Collection",
        unitPrice: 25.99,
        originalPrice: 35.99,
        releaseDate: "2024-01-15",
        shop: "Main Shop",
        isColorless: false,
        groupImage: "/api/placeholder/200/250",
        wholesaleTiers: [
          { id: "wt1", minQuantity: 10, price: 20.99 },
          { id: "wt2", minQuantity: 50, price: 18.99 },
        ],
        colorVariants: [
          {
            id: "cv1",
            color: "Red",
            colorCode: "#FF0000",
            barcode: "1234567890123",
            image: "/api/placeholder/150/150",
            sizeQuantities: [
              { size: "S", quantity: 20 },
              { size: "M", quantity: 50 },
              { size: "L", quantity: 30 },
            ],
          },
          {
            id: "cv2",
            color: "Blue",
            colorCode: "#0000FF",
            barcode: "1234567890124",
            image: "/api/placeholder/150/150",
            sizeQuantities: [
              { size: "S", quantity: 15 },
              { size: "M", quantity: 25 },
              { size: "L", quantity: 30 },
              { size: "XL", quantity: 10 },
            ],
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "mock-user-id",
      },
      {
        id: "2",
        groupName: "Winter Jacket Collection",
        unitPrice: 89.99,
        originalPrice: 120.99,
        releaseDate: "2024-01-10",
        shop: "Branch Store",
        isColorless: false,
        groupImage: "/api/placeholder/200/250",
        wholesaleTiers: [],
        colorVariants: [
          {
            id: "cv3",
            color: "Black",
            colorCode: "#000000",
            barcode: "1234567890125",
            image: "/api/placeholder/150/150",
            sizeQuantities: [
              { size: "M", quantity: 15 },
              { size: "L", quantity: 20 },
              { size: "XL", quantity: 25 },
              { size: "2XL", quantity: 10 },
            ],
          },
        ],
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        createdBy: "mock-user-id",
      },
    ];
  }
}

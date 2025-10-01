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
  getDoc,
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

  /**
   * Restore inventory for a specific item, color, and size
   */
  static async restoreInventory(
    stockId: string,
    colorName: string,
    size: string,
    quantity: number
  ): Promise<void> {
    if (!db || !isFirebaseConfigured) {
      console.warn("Firebase not configured, skipping inventory restoration");
      return;
    }

    try {
      console.log(`Attempting to restore inventory: stockId=${stockId}, color=${colorName}, size=${size}, quantity=${quantity}`);
      
      // Get the current stock item
      const stockRef = doc(db, COLLECTION_NAME, stockId);
      const stockDoc = await getDoc(stockRef);
      
      if (!stockDoc.exists()) {
        console.error(`Stock item ${stockId} not found`);
        return;
      }

      const stockData = stockDoc.data() as StockItem;
      console.log(`Found stock item: ${stockData.groupName}, variants:`, stockData.colorVariants?.map(v => ({ id: v.id, color: v.color })));
      
      // Find the color variant by color name (case-insensitive)
      const targetVariant = stockData.colorVariants?.find(variant => 
        variant.color.toLowerCase() === colorName.toLowerCase()
      );
      
      if (!targetVariant) {
        console.error(`Color variant "${colorName}" not found in stock item ${stockId}. Available colors:`, 
          stockData.colorVariants?.map(v => v.color));
        return;
      }
      
      console.log(`Found color variant: ${targetVariant.id} (${targetVariant.color})`);
      
      // Log current inventory state before restoration
      const currentSizeQty = targetVariant.sizeQuantities.find(sq => sq.size === size);
      console.log(`BEFORE RESTORATION - ${stockId} (${colorName}, ${size}): current quantity = ${currentSizeQty?.quantity || 0}`);
      
      // Find and update the specific color variant and size
      const updatedColorVariants = stockData.colorVariants?.map(variant => {
        if (variant.id === targetVariant.id) {
          const updatedSizeQuantities = variant.sizeQuantities.map(sizeQty => {
            if (sizeQty.size === size) {
              const newQuantity = sizeQty.quantity + quantity;
              console.log(`DURING RESTORATION - ${stockId} (${colorName}, ${size}): ${sizeQty.quantity} + ${quantity} = ${newQuantity}`);
              return {
                ...sizeQty,
                quantity: newQuantity
              };
            }
            return sizeQty;
          });
          
          return {
            ...variant,
            sizeQuantities: updatedSizeQuantities
          };
        }
        return variant;
      }) || [];

      // Update the stock in the database
      await updateDoc(stockRef, {
        colorVariants: updatedColorVariants,
        updatedAt: serverTimestamp(),
      });

      // Verify the update by checking the final state
      const updatedVariant = updatedColorVariants.find(v => v.id === targetVariant.id);
      const finalSizeQty = updatedVariant?.sizeQuantities.find(sq => sq.size === size);
      console.log(`AFTER RESTORATION - ${stockId} (${colorName}, ${size}): final quantity = ${finalSizeQty?.quantity || 0}`);
      console.log(`✓ Successfully restored ${quantity} units of ${stockId} (${colorName}, ${size})`);
    } catch (error) {
      console.error("Error restoring inventory:", error);
      throw new Error("Failed to restore inventory");
    }
  }

  /**
   * Restore inventory for multiple items (used for transaction cancellation)
   */
  static async restoreMultipleItems(
    items: Array<{
      stockId: string;
      colorName: string;
      size: string;
      quantity: number;
    }>
  ): Promise<void> {
    if (!db || !isFirebaseConfigured) {
      console.warn("Firebase not configured, skipping inventory restoration");
      return;
    }

    try {
      console.log(`Restoring inventory for ${items.length} items:`, items);
      
      // Group items by stockId to avoid race conditions
      const itemsByStockId = items.reduce((groups, item) => {
        if (!groups[item.stockId]) {
          groups[item.stockId] = [];
        }
        groups[item.stockId].push(item);
        return groups;
      }, {} as Record<string, typeof items>);
      
      console.log(`Grouped items into ${Object.keys(itemsByStockId).length} stock groups:`, 
        Object.entries(itemsByStockId).map(([stockId, items]) => ({ stockId, count: items.length })));
      
      // Process each stock group sequentially to avoid race conditions
      const restorationResults: Array<{ success: boolean; item: { stockId: string; colorName: string; size: string; quantity: number }; error?: unknown }> = [];
      
      for (const [stockId, stockItems] of Object.entries(itemsByStockId)) {
        console.log(`Processing ${stockItems.length} items for stock ${stockId}`);
        
        // Process items for this stock sequentially
        for (let i = 0; i < stockItems.length; i++) {
          const item = stockItems[i];
          try {
            console.log(`Restoring item ${i + 1}/${stockItems.length} for stock ${stockId}: (${item.colorName}, ${item.size}) x${item.quantity}`);
            await this.restoreInventory(item.stockId, item.colorName, item.size, item.quantity);
            console.log(`✓ Successfully restored item ${i + 1} for stock ${stockId}`);
            restorationResults.push({ success: true, item });
          } catch (error) {
            console.error(`✗ Failed to restore item ${i + 1} for stock ${stockId}:`, error);
            restorationResults.push({ success: false, item, error });
          }
        }
      }

      // Count successful and failed restorations
      const successful = restorationResults.filter(result => result.success).length;
      const failed = restorationResults.filter(result => !result.success).length;

      console.log(`Inventory restoration completed: ${successful} successful, ${failed} failed out of ${items.length} items`);

      // Log failed items for debugging
      if (failed > 0) {
        const failedItems = restorationResults
          .filter(result => !result.success)
          .map(result => result.item);
        console.warn('Failed to restore these items:', failedItems);
      }

      // Only throw error if ALL items failed
      if (successful === 0 && failed > 0) {
        throw new Error(`Failed to restore inventory for all ${items.length} items`);
      }
    } catch (error) {
      console.error("Error restoring multiple items:", error);
      throw new Error("Failed to restore inventory for multiple items");
    }
  }
}

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
import { CreatePromotionRequest, Promotion } from "@/types/promotion";

const PROMOTIONS_COLLECTION = "promotions";
const STOCKS_COLLECTION = "stocks";

export class PromotionService {
  static async createPromotion(
    data: CreatePromotionRequest,
    userId: string,
  ): Promise<Promotion> {
    if (!db) {
      throw new Error("Database not initialized");
    }

    // Snapshot the stock (and variant, if applicable) name at creation time
    const stockDoc = await getDoc(doc(db, STOCKS_COLLECTION, data.stockId));
    if (!stockDoc.exists()) {
      throw new Error("Selected product group was not found");
    }
    const stockData = stockDoc.data();
    const stockName = stockData.groupName || "Unknown product";

    let variantColor: string | undefined;
    if (data.scope === "variant") {
      if (!data.variantId) {
        throw new Error("A variant must be selected for variant promotions");
      }
      const variant = (stockData.colorVariants || []).find(
        (v: { id: string; color: string }) => v.id === data.variantId,
      );
      if (!variant) {
        throw new Error("Selected variant was not found");
      }
      variantColor = variant.color;
    }

    const promotionData: Record<string, unknown> = {
      name: data.name,
      scope: data.scope,
      stockId: data.stockId,
      stockName,
      discountType: data.discountType,
      discountValue: data.discountValue,
      startDate: data.startDate,
      endDate: data.endDate,
      description: data.description || "",
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: userId,
    };

    if (data.scope === "variant") {
      promotionData.variantId = data.variantId;
      promotionData.variantColor = variantColor;
    }

    if (data.maxDiscountAmount !== undefined && data.maxDiscountAmount !== null) {
      promotionData.maxDiscountAmount = data.maxDiscountAmount;
    }

    const docRef = await addDoc(
      collection(db, PROMOTIONS_COLLECTION),
      promotionData,
    );

    return {
      id: docRef.id,
      name: data.name,
      scope: data.scope,
      stockId: data.stockId,
      stockName,
      variantId: data.scope === "variant" ? data.variantId : undefined,
      variantColor,
      discountType: data.discountType,
      discountValue: data.discountValue,
      maxDiscountAmount: data.maxDiscountAmount,
      startDate: data.startDate,
      endDate: data.endDate,
      description: data.description || "",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId,
    };
  }

  static async getAllPromotions(): Promise<Promotion[]> {
    if (!db) {
      throw new Error("Database not initialized");
    }

    const q = query(
      collection(db, PROMOTIONS_COLLECTION),
      orderBy("createdAt", "desc"),
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        scope: data.scope,
        stockId: data.stockId,
        stockName: data.stockName,
        variantId: data.variantId,
        variantColor: data.variantColor,
        discountType: data.discountType,
        discountValue: data.discountValue,
        maxDiscountAmount: data.maxDiscountAmount,
        startDate: data.startDate,
        endDate: data.endDate,
        description: data.description || "",
        isActive: data.isActive ?? true,
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate().toISOString()
          : new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate
          ? data.updatedAt.toDate().toISOString()
          : new Date().toISOString(),
        createdBy: data.createdBy,
      } as Promotion;
    });
  }

  static async setPromotionStatus(
    id: string,
    isActive: boolean,
  ): Promise<void> {
    if (!db) {
      throw new Error("Database not initialized");
    }

    await updateDoc(doc(db, PROMOTIONS_COLLECTION, id), {
      isActive,
      updatedAt: Timestamp.now(),
    });
  }

  static async deletePromotion(id: string): Promise<void> {
    if (!db) {
      throw new Error("Database not initialized");
    }

    await deleteDoc(doc(db, PROMOTIONS_COLLECTION, id));
  }
}

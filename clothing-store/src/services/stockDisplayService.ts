import React from "react";
import {
  StockItem,
  StockGroupDisplay,
  StockVariantDisplay,
} from "@/types/stock";
import { SettingsService } from "@/services/settingsService";

export class StockDisplayService {
  /**
   * Transform stock items into grouped display format
   */
  static transformStocksForDisplay(stocks: StockItem[], currency: 'THB' | 'MMK' = 'THB'): StockGroupDisplay[] {
    return stocks.map((stock) => {
      // Transform variants with calculated totals
      const variants: StockVariantDisplay[] = stock.colorVariants.map(
        (variant) => {
          const totalQuantity = variant.sizeQuantities.reduce(
            (sum, sizeQty) => sum + sizeQty.quantity,
            0
          );

          return {
            variantId: variant.id,
            color: variant.color,
            colorCode: variant.colorCode,
            barcode: variant.barcode,
            image: variant.image,
            sizeQuantities: variant.sizeQuantities,
            totalQuantity,
            colorStyle: this.getColorStyle(variant.colorCode),
            sizes: variant.sizeQuantities,
          };
        }
      );

      // Calculate group totals
      const totalVariants = variants.length;
      const totalQuantity = variants.reduce(
        (sum, variant) => sum + variant.totalQuantity,
        0
      );

      // Get size summary for the group
      const allSizes = variants.flatMap((v) =>
        v.sizeQuantities.map((sq) => sq.size)
      );
      const uniqueSizes = [...new Set(allSizes)].sort();
      const sizeSummary = uniqueSizes.join(", ") || "No sizes";

      return {
        groupId: stock.id,
        groupName: stock.groupName,
        unitPrice: stock.unitPrice,
        originalPrice: stock.originalPrice,
        releaseDate: stock.releaseDate,
        shop: stock.shop,
        isColorless: stock.isColorless,
        groupImage: stock.groupImage || "/api/placeholder/200/250",
        wholesaleTiers: stock.wholesaleTiers,
        variants,
        totalVariants,
        totalQuantity,
        createdAt: stock.createdAt,
        updatedAt: stock.updatedAt,
        createdBy: stock.createdBy,
        formattedPrice: this.formatPrice(stock.unitPrice, currency),
        formattedReleaseDate: this.formatDate(stock.releaseDate),
        sizeSummary,
      };
    });
  }

  /**
   * Format date for display
   */
  static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  /**
   * Format price for display
   */
  static formatPrice(price: number, currency: 'THB' | 'MMK' = 'THB'): string {
    return SettingsService.formatPrice(price, currency);
  }

  /**
   * Get size summary for a variant
   */
  static getSizeSummary(
    sizeQuantities: { size: string; quantity: number }[]
  ): string {
    if (sizeQuantities.length === 0) return "No sizes";

    const sizesWithQty = sizeQuantities
      .filter((sq) => sq.quantity > 0)
      .map((sq) => `${sq.size}(${sq.quantity})`)
      .join(", ");

    return sizesWithQty || "Out of stock";
  }

  /**
   * Get color indicator style
   */
  static getColorStyle(colorCode: string): React.CSSProperties {
    return {
      backgroundColor: colorCode,
      width: "20px",
      height: "20px",
      borderRadius: "50%",
      border: "2px solid #e5e7eb",
      display: "inline-block",
    };
  }
}

import { NextRequest, NextResponse } from "next/server";
import { PromotionService } from "@/services/promotionService";
import {
  CreatePromotionRequest,
  PromotionListResponse,
  PromotionResponse,
} from "@/types/promotion";

// GET /api/promotions - Get all promotions
export async function GET() {
  try {
    const promotions = await PromotionService.getAllPromotions();

    const response: PromotionListResponse = {
      success: true,
      data: promotions,
      total: promotions.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in GET /api/promotions:", error);
    const response: PromotionListResponse = {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch promotions",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/promotions - Create a new promotion
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (
      !body.name ||
      !body.scope ||
      !body.stockId ||
      !body.discountType ||
      body.discountValue === undefined ||
      body.discountValue === null ||
      !body.startDate ||
      !body.endDate
    ) {
      const response: PromotionResponse = {
        success: false,
        error: "Missing required fields",
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (body.scope === "variant" && !body.variantId) {
      const response: PromotionResponse = {
        success: false,
        error: "A variant must be selected for variant promotions",
      };
      return NextResponse.json(response, { status: 400 });
    }

    // TODO: Get from authentication context
    const userId = "current-user-id";

    const promotionData: CreatePromotionRequest = {
      name: body.name,
      scope: body.scope,
      stockId: body.stockId,
      variantId: body.scope === "variant" ? body.variantId : undefined,
      discountType: body.discountType,
      discountValue: parseFloat(body.discountValue),
      maxDiscountAmount:
        body.maxDiscountAmount !== undefined &&
        body.maxDiscountAmount !== null &&
        body.maxDiscountAmount !== ""
          ? parseFloat(body.maxDiscountAmount)
          : undefined,
      startDate: body.startDate,
      endDate: body.endDate,
      description: body.description || "",
    };

    const createdPromotion = await PromotionService.createPromotion(
      promotionData,
      userId,
    );

    const response: PromotionResponse = {
      success: true,
      data: createdPromotion,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/promotions:", error);
    const response: PromotionResponse = {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create promotion",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

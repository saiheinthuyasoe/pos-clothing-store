import { NextRequest, NextResponse } from "next/server";
import { PromotionService } from "@/services/promotionService";
import { PromotionResponse } from "@/types/promotion";

// PUT /api/promotions/[id] - Enable or disable a promotion
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (typeof body.isActive !== "boolean") {
      const response: PromotionResponse = {
        success: false,
        error: "isActive (boolean) is required",
      };
      return NextResponse.json(response, { status: 400 });
    }

    await PromotionService.setPromotionStatus(id, body.isActive);

    const response: PromotionResponse = {
      success: true,
      message: "Promotion updated successfully",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(`Error in PUT /api/promotions/${(await params).id}:`, error);
    const response: PromotionResponse = {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update promotion",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// DELETE /api/promotions/[id] - Delete a promotion
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    await PromotionService.deletePromotion(id);

    const response: PromotionResponse = {
      success: true,
      message: "Promotion deleted successfully",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(
      `Error in DELETE /api/promotions/${(await params).id}:`,
      error,
    );
    const response: PromotionResponse = {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete promotion",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

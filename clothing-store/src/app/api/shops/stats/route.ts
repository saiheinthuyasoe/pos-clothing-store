import { NextRequest, NextResponse } from 'next/server';
import { ShopService } from '@/services/shopService';
import { ShopStatsResponse } from '@/types/shop';

// GET /api/shops/stats - Get shop statistics
export async function GET(request: NextRequest) {
  try {
    const stats = await ShopService.getShopStats();

    const response: ShopStatsResponse = {
      success: true,
      data: stats,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/shops/stats:', error);
    const response: ShopStatsResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch shop statistics',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
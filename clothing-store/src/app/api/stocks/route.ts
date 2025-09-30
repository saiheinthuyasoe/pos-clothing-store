import { NextRequest, NextResponse } from 'next/server';
import { StockService } from '@/services/stockService';
import { CreateStockRequest, StockResponse, StockListResponse } from '@/types/stock';

// GET /api/stocks - Get all stocks or recent stocks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const shop = searchParams.get('shop');
    const recent = searchParams.get('recent');

    let stocks;
    
    if (shop) {
      stocks = await StockService.getStocksByShop(shop);
    } else if (recent === 'true') {
      // Get recent stocks (last 20 items by default)
      stocks = await StockService.getRecentStocks(20);
    } else if (limit) {
      stocks = await StockService.getRecentStocks(parseInt(limit));
    } else {
      stocks = await StockService.getAllStocks();
    }

    const response: StockListResponse = {
      success: true,
      data: stocks,
      total: stocks.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/stocks:', error);
    const response: StockListResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch stocks',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/stocks - Create a new stock item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Basic validation
    if (!body.groupName || !body.unitPrice || !body.originalPrice) {
      const response: StockResponse = {
        success: false,
        error: 'Missing required fields: groupName, unitPrice, originalPrice',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // For now, we'll use a mock user ID. In a real app, you'd get this from authentication
    const userId = 'current-user-id'; // TODO: Get from authentication context

    const stockData: CreateStockRequest = {
      groupName: body.groupName,
      unitPrice: parseFloat(body.unitPrice),
      originalPrice: parseFloat(body.originalPrice),
      releaseDate: body.releaseDate,
      shop: body.shop || 'Main Shop',
      isColorless: body.isColorless || false,
      groupImage: body.groupImage,
      wholesaleTiers: body.wholesaleTiers || [],
      colorVariants: body.colorVariants || [],
    };

    const createdStock = await StockService.createStock(stockData, userId);

    const response: StockResponse = {
      success: true,
      data: createdStock,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/stocks:', error);
    const response: StockResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create stock item',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
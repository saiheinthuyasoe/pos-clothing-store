import { NextRequest, NextResponse } from 'next/server';
import { CustomerService } from '@/services/customerService';
import { CustomerStatsResponse } from '@/types/customer';

// GET /api/customers/stats - Get customer statistics
export async function GET(request: NextRequest) {
  try {
    const stats = await CustomerService.getCustomerStats();

    const response: CustomerStatsResponse = {
      success: true,
      data: stats,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/customers/stats:', error);
    const response: CustomerStatsResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch customer statistics',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
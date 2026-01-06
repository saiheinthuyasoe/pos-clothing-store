import { NextRequest, NextResponse } from "next/server";
import { CustomerService } from "@/services/customerService";
import { CustomerResponse, UpdateCustomerRequest } from "@/types/customer";

// GET /api/customers/[id] - Get a specific customer by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      const response: CustomerResponse = {
        success: false,
        error: "Customer ID is required",
      };
      return NextResponse.json(response, { status: 400 });
    }

    const customer = await CustomerService.getCustomerById(id);

    if (!customer) {
      const response: CustomerResponse = {
        success: false,
        error: "Customer not found",
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: CustomerResponse = {
      success: true,
      data: customer,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in GET /api/customers/[id]:", error);
    const response: CustomerResponse = {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch customer",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// PUT /api/customers/[id] - Update a specific customer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      const response: CustomerResponse = {
        success: false,
        error: "Customer ID is required",
      };
      return NextResponse.json(response, { status: 400 });
    }

    const body: UpdateCustomerRequest = await request.json();

    // Validate required fields if needed
    if (!body || Object.keys(body).length === 0) {
      const response: CustomerResponse = {
        success: false,
        error: "Update data is required",
      };
      return NextResponse.json(response, { status: 400 });
    }

    const updatedCustomer = await CustomerService.updateCustomer(id, body);

    const response: CustomerResponse = {
      success: true,
      data: updatedCustomer,
      message: "Customer updated successfully",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in PUT /api/customers/[id]:", error);
    const response: CustomerResponse = {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update customer",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// DELETE /api/customers/[id] - Delete a specific customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      const response: CustomerResponse = {
        success: false,
        error: "Customer ID is required",
      };
      return NextResponse.json(response, { status: 400 });
    }

    await CustomerService.deleteCustomer(id);

    const response: CustomerResponse = {
      success: true,
      message: "Customer deleted successfully",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in DELETE /api/customers/[id]:", error);
    const response: CustomerResponse = {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete customer",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

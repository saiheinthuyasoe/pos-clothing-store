import { NextRequest, NextResponse } from "next/server";
import {
  addNewExpense,
  getNewExpenses,
  addNewExpenseCategory,
  getNewExpenseCategories,
  deleteNewExpenseCategory,
  addNewSpendingMenu,
  getNewSpendingMenus,
  deleteNewSpendingMenu,
  updateNewExpense,
  deleteNewExpense,
} from "@/services/newExpenseService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (type === "categories") {
      const categories = await getNewExpenseCategories();
      return NextResponse.json({ success: true, data: categories });
    } else if (type === "spendingMenus") {
      const spendingMenus = await getNewSpendingMenus();
      return NextResponse.json({ success: true, data: spendingMenus });
    } else {
      const expenses = await getNewExpenses();
      return NextResponse.json({ success: true, data: expenses });
    }
  } catch (error) {
    console.error("Error in GET /api/new-expenses:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch data" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body;

    if (type === "category") {
      const { name } = body;
      if (!name) {
        return NextResponse.json(
          { success: false, error: "Category name is required" },
          { status: 400 },
        );
      }
      const category = await addNewExpenseCategory(name);
      return NextResponse.json({ success: true, data: category });
    } else if (type === "spendingMenu") {
      const { name } = body;
      if (!name) {
        return NextResponse.json(
          { success: false, error: "Spending menu name is required" },
          { status: 400 },
        );
      }
      const spendingMenu = await addNewSpendingMenu(name);
      return NextResponse.json({ success: true, data: spendingMenu });
    } else {
      const {
        categoryId,
        spendingMenuId,
        note,
        imageUrl,
        date,
        amount,
        currency,
      } = body;

      // spendingMenuId is optional (feature removed in UI), validate required fields only
      if (!categoryId || !date || !amount || !currency) {
        return NextResponse.json(
          { success: false, error: "Missing required fields" },
          { status: 400 },
        );
      }

      const expense = await addNewExpense({
        categoryId,
        spendingMenuId: spendingMenuId || undefined,
        note: note || "",
        imageUrl: imageUrl || "",
        date: new Date(date),
        amount: parseFloat(amount),
        currency,
      });

      return NextResponse.json({ success: true, data: expense });
    }
  } catch (error) {
    console.error("Error in POST /api/new-expenses:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create data" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID is required" },
        { status: 400 },
      );
    }

    if (type === "category") {
      await deleteNewExpenseCategory(id);
    } else if (type === "spendingMenu") {
      await deleteNewSpendingMenu(id);
    } else {
      await deleteNewExpense(id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/new-expenses:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete data" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID is required" },
        { status: 400 },
      );
    }

    const {
      categoryId,
      spendingMenuId,
      note,
      imageUrl,
      date,
      amount,
      currency,
    } = body;

    await updateNewExpense(id, {
      categoryId,
      spendingMenuId,
      note,
      imageUrl,
      date: date ? new Date(date) : undefined,
      amount,
      currency,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in PUT /api/new-expenses:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update expense" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  addExpense,
  getExpenses,
  addExpenseCategory,
  getExpenseCategories,
  deleteExpenseCategory,
  addSpendingMenu,
  getSpendingMenus,
  deleteSpendingMenu,
  updateExpense,
  deleteExpense,
} from "@/services/expenseService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (type === "categories") {
      const categories = await getExpenseCategories();
      return NextResponse.json({ success: true, data: categories });
    } else if (type === "spendingMenus") {
      const spendingMenus = await getSpendingMenus();
      return NextResponse.json({ success: true, data: spendingMenus });
    } else {
      const expenses = await getExpenses();
      return NextResponse.json({ success: true, data: expenses });
    }
  } catch (error) {
    console.error("Error in GET /api/expenses:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch data" },
      { status: 500 }
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
          { status: 400 }
        );
      }
      const category = await addExpenseCategory(name);
      return NextResponse.json({ success: true, data: category });
    } else if (type === "spendingMenu") {
      const { name } = body;
      if (!name) {
        return NextResponse.json(
          { success: false, error: "Spending menu name is required" },
          { status: 400 }
        );
      }
      const spendingMenu = await addSpendingMenu(name);
      return NextResponse.json({ success: true, data: spendingMenu });
    } else {
      const { categoryId, spendingMenuId, note, date, amount, currency } = body;

      if (!categoryId || !spendingMenuId || !date || !amount || !currency) {
        return NextResponse.json(
          { success: false, error: "Missing required fields" },
          { status: 400 }
        );
      }

      const expense = await addExpense({
        categoryId,
        spendingMenuId,
        note: note || "",
        date: new Date(date),
        amount: parseFloat(amount),
        currency,
      });

      return NextResponse.json({ success: true, data: expense });
    }
  } catch (error) {
    console.error("Error in POST /api/expenses:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create data" },
      { status: 500 }
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
        { status: 400 }
      );
    }

    if (type === "category") {
      await deleteExpenseCategory(id);
    } else if (type === "spendingMenu") {
      await deleteSpendingMenu(id);
    } else {
      await deleteExpense(id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/expenses:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete data" },
      { status: 500 }
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
        { status: 400 }
      );
    }

    const { categoryId, spendingMenuId, note, date, amount, currency } = body;

    await updateExpense(id, {
      categoryId,
      spendingMenuId,
      note,
      date: date ? new Date(date) : undefined,
      amount,
      currency,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in PUT /api/expenses:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update expense" },
      { status: 500 }
    );
  }
}

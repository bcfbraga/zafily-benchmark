import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { listBudgets, createBudget, addItem, SCOPE_DEFAULT_NOTES } from "@/lib/budgets-store";

export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = await getUserId(req); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const budgets = await listBudgets(userId);
  return NextResponse.json(budgets);
}

export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = await getUserId(req); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });
  }
  const budget = await createBudget(userId, {
    title: body.title.trim(),
    clientName: body.clientName ?? undefined,
    clientPhone: body.clientPhone ?? undefined,
    clientLogoUrl: body.clientLogoUrl ?? undefined,
    finalValue: body.finalValue != null ? Number(body.finalValue) : undefined,
  });

  const scopeItems: string[] = Array.isArray(body.scopeItems) ? body.scopeItems : [];
  if (scopeItems.length > 0) {
    await Promise.all(scopeItems.map(description =>
      addItem(budget.id, { description, quantity: 1, notes: SCOPE_DEFAULT_NOTES[description] ?? null })
    ));
  }

  return NextResponse.json(budget, { status: 201 });
}

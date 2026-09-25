import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getBudget, updateItem, deleteItem } from "@/lib/budgets-store";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  let userId: string;
  try { userId = await getUserId(req); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, itemId } = await params;
  const budget = await getBudget(id, userId);
  if (!budget) return NextResponse.json({ error: "Proposta não encontrada" }, { status: 404 });

  const body = await req.json();
  const item = await updateItem(itemId, id, {
    description: body.description !== undefined ? body.description : undefined,
    quantity: body.quantity !== undefined ? (body.quantity === null ? null : Number(body.quantity)) : undefined,
    notes: body.notes !== undefined ? (body.notes === null ? null : String(body.notes)) : undefined,
  });
  return NextResponse.json(item);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  let userId: string;
  try { userId = await getUserId(req); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, itemId } = await params;
  const budget = await getBudget(id, userId);
  if (!budget) return NextResponse.json({ error: "Proposta não encontrada" }, { status: 404 });

  await deleteItem(itemId, id);
  return NextResponse.json({ ok: true });
}

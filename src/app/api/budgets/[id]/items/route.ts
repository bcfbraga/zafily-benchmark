import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getBudget, addItem } from "@/lib/budgets-store";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: string;
  try { userId = await getUserId(req); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const budget = await getBudget(id, userId);
  if (!budget) return NextResponse.json({ error: "Proposta não encontrada" }, { status: 404 });

  const body = await req.json();
  if (!body.description?.trim()) {
    return NextResponse.json({ error: "Descrição obrigatória" }, { status: 400 });
  }

  const item = await addItem(id, {
    description: body.description.trim(),
    quantity: body.quantity != null ? Number(body.quantity) : null,
    notes: body.notes != null ? String(body.notes) : null,
  });
  return NextResponse.json(item, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getBudget, updateBudget, deleteBudget, listItems } from "@/lib/budgets-store";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: string;
  try { userId = await getUserId(req); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const budget = await getBudget(id, userId);
  if (!budget) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const items = await listItems(id);
  return NextResponse.json({ ...budget, items });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: string;
  try { userId = await getUserId(req); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const budget = await updateBudget(id, userId, {
    title: body.title,
    clientName: body.clientName !== undefined ? (body.clientName ?? null) : undefined,
    clientPhone: body.clientPhone !== undefined ? (body.clientPhone ?? null) : undefined,
    clientLogoUrl: body.clientLogoUrl !== undefined ? (body.clientLogoUrl ?? null) : undefined,
    finalValue: body.finalValue !== undefined ? (body.finalValue === null ? null : Number(body.finalValue)) : undefined,
    expiresAt: body.expiresAt !== undefined ? (body.expiresAt || null) : undefined,
    valueIntro: body.valueIntro !== undefined ? (body.valueIntro || null) : undefined,
    valuePoints: body.valuePoints !== undefined ? (body.valuePoints || null) : undefined,
    valueHidden: body.valueHidden !== undefined ? Boolean(body.valueHidden) : undefined,
    conditions: body.conditions !== undefined ? (body.conditions || null) : undefined,
    conditionsHidden: body.conditionsHidden !== undefined ? Boolean(body.conditionsHidden) : undefined,
  });
  return NextResponse.json(budget);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: string;
  try { userId = await getUserId(req); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await deleteBudget(id, userId);
  return NextResponse.json({ ok: true });
}

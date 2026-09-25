import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { updateBudget } from "@/lib/budgets-store";
import { getAccountStatus } from "@/lib/lives-store";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: string;
  try { userId = await getUserId(req); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const { status } = await req.json();
  if (status !== "draft" && status !== "published") {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }
  if (status === "published") {
    const accountStatus = await getAccountStatus(userId);
    if (accountStatus !== "active") {
      return NextResponse.json({ error: "Sua conta ainda não foi ativada. Fale conosco pelo WhatsApp para publicar sua proposta.", code: "activation_required" }, { status: 403 });
    }
  }
  const budget = await updateBudget(id, userId, { status });
  return NextResponse.json(budget);
}

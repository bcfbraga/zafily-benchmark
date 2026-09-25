import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getBudget } from "@/lib/budgets-store";
import { getOrCreateProfile } from "@/lib/lives-store";
import { renderPagePdf } from "@/lib/pdf";

export const maxDuration = 60;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: string;
  try { userId = await getUserId(req); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const budget = await getBudget(id, userId);
  if (!budget || budget.status !== "published") {
    return NextResponse.json({ error: "Proposta não encontrada" }, { status: 404 });
  }

  const profile = await getOrCreateProfile(userId, "");
  const publicUrl = `${req.nextUrl.origin}/${profile.username}/proposta/${budget.slug}`;

  try {
    const pdf = await renderPagePdf(publicUrl);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="proposta-${budget.slug}.pdf"`,
      },
    });
  } catch (err) {
    console.error("PDF generation failed", err);
    return NextResponse.json({ error: "Falha ao gerar PDF" }, { status: 500 });
  }
}

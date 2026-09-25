import { NextRequest, NextResponse } from "next/server";
import { deleteIntegration } from "@/lib/integrations-store";
import { getUserId } from "@/lib/auth";

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    await deleteIntegration(userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[awin/disconnect]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Could not disconnect. Please try again." },
      { status: 500 }
    );
  }
}

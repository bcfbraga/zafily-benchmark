import { NextRequest, NextResponse } from "next/server";
import { encrypt } from "@/lib/crypto";
import { validateAwinConnection } from "@/lib/awin-api";
import { upsertIntegration } from "@/lib/integrations-store";
import { getUserId } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiToken = String(body.apiToken ?? "").trim();

    if (!apiToken) {
      return NextResponse.json(
        { error: "API Key is required." },
        { status: 400 }
      );
    }

    // Validate with Awin before saving anything — the publisher account is
    // discovered from the key itself, not typed in by the user.
    const result = await validateAwinConnection(apiToken);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.message, status: result.status },
        { status: 422 }
      );
    }

    const userId = await getUserId(req);
    const encryptedToken = encrypt(apiToken);
    const now = new Date().toISOString();

    await upsertIntegration({
      userId,
      provider: "awin",
      advertiserId: 17648,
      publisherId: result.publisherId,
      encryptedToken,
      status: result.status,
      lastCheckedAt: now,
    });

    return NextResponse.json({
      status: result.status,
      publisherId: result.publisherId,
      connectedAt: now,
    });
  } catch (err) {
    console.error("[awin/connect]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

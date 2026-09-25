import { NextRequest, NextResponse } from "next/server";
import { getIntegration } from "@/lib/integrations-store";
import { getUserId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    const integration = await getIntegration(userId);

    if (!integration) {
      return NextResponse.json({ connected: false });
    }

    // Never send encryptedToken to the frontend
    return NextResponse.json({
      connected: true,
      status: integration.status,
      publisherId: integration.publisherId,
      advertiserId: integration.advertiserId,
      lastCheckedAt: integration.lastCheckedAt,
      createdAt: integration.createdAt,
    });
  } catch (err) {
    console.error("[awin/status]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Could not fetch integration status." },
      { status: 500 }
    );
  }
}

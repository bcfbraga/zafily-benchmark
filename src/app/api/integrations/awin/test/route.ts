import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/crypto";
import { testAwinConnection } from "@/lib/awin-api";
import { getIntegration, updateIntegrationStatus } from "@/lib/integrations-store";
import { getUserId } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    const integration = await getIntegration(userId);

    if (!integration) {
      return NextResponse.json(
        { error: "No Awin integration found. Connect first." },
        { status: 404 }
      );
    }

    const apiToken = decrypt(integration.encryptedToken);
    const result = await testAwinConnection(integration.publisherId, apiToken);

    const newStatus = result.ok ? result.status : "error";
    await updateIntegrationStatus(userId, newStatus);

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, status: newStatus, message: result.message },
        { status: 422 }
      );
    }

    return NextResponse.json({ ok: true, status: newStatus });
  } catch (err) {
    console.error("[awin/test]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Test failed. Please try again." },
      { status: 500 }
    );
  }
}

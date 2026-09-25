import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getLivePerformance } from "@/lib/lives-store";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: string;
  try { userId = await getUserId(req); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const data = await getLivePerformance(id, userId);
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

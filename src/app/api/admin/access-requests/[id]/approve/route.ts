import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { approveAccessRequest } from "@/lib/access-requests-store";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const { id } = await params;
  const request = await approveAccessRequest(id);
  return NextResponse.json(request);
}

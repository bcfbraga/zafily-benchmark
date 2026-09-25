import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  let userId: string;
  try {
    userId = await getUserId(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("q");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 48;
  const from = (page - 1) * limit;

  const db = getSupabase() as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let query = db
    .from("affiliate_products")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .eq("in_stock", true)
    .order("name")
    .range(from, from + limit - 1);

  if (category) query = query.eq("category", category);
  if (search) query = query.ilike("name", `%${search}%`);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ products: data, total: count, page, limit });
}

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getUserId } from "@/lib/auth";
import { getOrCreateProfile, updateProfile, updateUsername, AccessNotApprovedError } from "@/lib/lives-store";
import { isAdminEmail } from "@/lib/admin";

export async function GET(req: NextRequest) {
  // Uma validação de token só: antes chamava getUserId() e getUser() em
  // seguida, pagando a mesma travessia duas vezes pelo id e pelo e-mail.
  let userId: string, email: string;
  try {
    const user = await getAuthUser(req);
    userId = user.id;
    email = user.email;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let profile;
  try {
    profile = await getOrCreateProfile(userId, email);
  } catch (err) {
    if (err instanceof AccessNotApprovedError) {
      return NextResponse.json({ error: "ACCESS_NOT_APPROVED" }, { status: 403 });
    }
    throw err;
  }

  return NextResponse.json({ ...profile, isAdmin: isAdminEmail(email) });
}

export async function PUT(req: NextRequest) {
  let userId: string;
  try { userId = await getUserId(req); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  if (body.username !== undefined) {
    const result = await updateUsername(userId, body.username);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const profile = await updateProfile(userId, {
    displayName: body.displayName !== undefined ? (body.displayName || null) : undefined,
    instagramHandle: body.instagramHandle !== undefined ? (body.instagramHandle || null) : undefined,
    location: body.location !== undefined ? (body.location || null) : undefined,
    followersLabel: body.followersLabel !== undefined ? (body.followersLabel || null) : undefined,
    reachLabel: body.reachLabel !== undefined ? (body.reachLabel || null) : undefined,
    viewsLabel: body.viewsLabel !== undefined ? (body.viewsLabel || null) : undefined,
    engagementLabel: body.engagementLabel !== undefined ? (body.engagementLabel || null) : undefined,
    whatsapp: body.whatsapp !== undefined ? (body.whatsapp || null) : undefined,
    contactEmail: body.contactEmail !== undefined ? (body.contactEmail || null) : undefined,
    linkUrl: body.linkUrl !== undefined ? (body.linkUrl || null) : undefined,
    photoUrl: body.photoUrl !== undefined ? (body.photoUrl || null) : undefined,
    roleTitle: body.roleTitle !== undefined ? (body.roleTitle || null) : undefined,
    bio: body.bio !== undefined ? (body.bio || null) : undefined,
    socialLinks: body.socialLinks !== undefined ? body.socialLinks : undefined,
    designSettings: body.designSettings !== undefined ? body.designSettings : undefined,
    mainGoal: body.mainGoal !== undefined ? (body.mainGoal || null) : undefined,
    platformsUsed: body.platformsUsed !== undefined ? (body.platformsUsed || null) : undefined,
    onboardedAt: body.onboardedAt !== undefined ? body.onboardedAt : undefined,
  });
  return NextResponse.json(profile);
}

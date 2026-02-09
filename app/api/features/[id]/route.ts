import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import FeatureModel from "@/lib/models/Feature";
import NotificationModel from "@/lib/models/Notification";
import { verifyProjectAccess } from "@/lib/projectAuth";
import { getSessionFromRequest } from "@/lib/auth";

const ALLOWED_STATUSES = ["planned", "in-progress", "live", "under-review"] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const status = typeof body?.status === "string" ? body.status.trim() : "";
    const projectKey = typeof body?.projectKey === "string" ? body.projectKey.trim() : "";
    const siteOrigin = typeof body?.siteOrigin === "string" ? body.siteOrigin.trim() : "";

    if (!ALLOWED_STATUSES.includes(status as (typeof ALLOWED_STATUSES)[number])) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const feature = await FeatureModel.findById(id);
    if (!feature) {
      return NextResponse.json({ error: "Feature not found." }, { status: 404 });
    }

    const isAdmin = Boolean(session && request.headers.get("x-upflow-admin") === "1");
    const auth = await verifyProjectAccess(feature.projectId, projectKey || null, siteOrigin || null, {
      isAdmin,
      userId: session.sub,
      requestOrigin: request.headers.get("origin"),
      requestReferer: request.headers.get("referer"),
      apiOrigin: request.nextUrl.origin,
    });
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    feature.status = status as (typeof ALLOWED_STATUSES)[number];
    await feature.save();

    return NextResponse.json({
      id: feature._id.toString(),
      status: feature.status,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const projectKey = typeof body?.projectKey === "string" ? body.projectKey.trim() : "";
    const siteOrigin = typeof body?.siteOrigin === "string" ? body.siteOrigin.trim() : "";

    const feature = await FeatureModel.findById(id);
    if (!feature) {
      return NextResponse.json({ error: "Feature not found." }, { status: 404 });
    }

    const isAdmin = Boolean(session && request.headers.get("x-upflow-admin") === "1");
    const auth = await verifyProjectAccess(feature.projectId, projectKey || null, siteOrigin || null, {
      isAdmin,
      userId: session.sub,
      requestOrigin: request.headers.get("origin"),
      requestReferer: request.headers.get("referer"),
      apiOrigin: request.nextUrl.origin,
    });
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    await FeatureModel.deleteOne({ _id: id });
    await NotificationModel.deleteMany({ projectId: feature.projectId, featureId: id });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

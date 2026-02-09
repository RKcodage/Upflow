import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import NotificationModel from "@/lib/models/Notification";
import { verifyProjectAccess } from "@/lib/projectAuth";
import { getSessionFromRequest } from "@/lib/auth";

const DEFAULT_PROJECT_ID = "default";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectIdParam = searchParams.get("projectId");
    const projectId = projectIdParam && projectIdParam.trim() ? projectIdParam.trim() : DEFAULT_PROJECT_ID;
    const projectKey = searchParams.get("projectKey");
    const siteOrigin = searchParams.get("siteOrigin");

    const auth = await verifyProjectAccess(projectId, projectKey, siteOrigin, {
      isAdmin: request.headers.get("x-upflow-admin") === "1",
      userId: session.sub,
      requestOrigin: request.headers.get("origin"),
      requestReferer: request.headers.get("referer"),
      apiOrigin: request.nextUrl.origin,
    });
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const notifications = await NotificationModel.find({ projectId, readAt: null })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return NextResponse.json({
      unreadCount: notifications.length,
      notifications: notifications.map((item) => ({
        id: item._id.toString(),
        title: item.title,
        createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : null,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const body = await request.json();

    const projectId = typeof body?.projectId === "string" && body.projectId.trim()
      ? body.projectId.trim()
      : DEFAULT_PROJECT_ID;
    const projectKey = typeof body?.projectKey === "string" ? body.projectKey.trim() : "";
    const siteOrigin = typeof body?.siteOrigin === "string" ? body.siteOrigin.trim() : "";

    const auth = await verifyProjectAccess(projectId, projectKey || null, siteOrigin || null, {
      isAdmin: request.headers.get("x-upflow-admin") === "1",
      userId: session.sub,
      requestOrigin: request.headers.get("origin"),
      requestReferer: request.headers.get("referer"),
      apiOrigin: request.nextUrl.origin,
    });
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    await NotificationModel.updateMany(
      { projectId, readAt: null },
      { $set: { readAt: new Date() } }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

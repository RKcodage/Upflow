import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import WidgetPingModel from "@/lib/models/WidgetPing";
import { verifyProjectAccess } from "@/lib/projectAuth";
import { getSessionFromRequest } from "@/lib/auth";

const DEFAULT_PROJECT_ID = "default";
const STALE_WINDOW_MS = 45 * 1000;

const parseBody = async (request: NextRequest) => {
  try {
    return await request.json();
  } catch {
    try {
      const text = await request.text();
      return text ? JSON.parse(text) : {};
    } catch {
      return {};
    }
  }
};

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await parseBody(request);

    const projectId =
      typeof body?.projectId === "string" && body.projectId.trim()
        ? body.projectId.trim()
        : DEFAULT_PROJECT_ID;
    const projectKey = typeof body?.projectKey === "string" ? body.projectKey.trim() : "";
    const siteOriginFromBody = typeof body?.siteOrigin === "string" ? body.siteOrigin.trim() : "";
    const siteOrigin = siteOriginFromBody || request.headers.get("origin") || "";

    const auth = await verifyProjectAccess(projectId, projectKey || null, siteOrigin || null, {
      requestOrigin: request.headers.get("origin"),
      requestReferer: request.headers.get("referer"),
      apiOrigin: request.nextUrl.origin,
    });
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    if (!siteOrigin) {
      return NextResponse.json({ error: "Missing siteOrigin." }, { status: 400 });
    }

    await WidgetPingModel.updateOne(
      { projectId, siteOrigin },
      { $set: { lastSeenAt: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const projectIdParam = searchParams.get("projectId");
    const projectId = projectIdParam && projectIdParam.trim() ? projectIdParam.trim() : "";
    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId." }, { status: 400 });
    }
    const projectKey = searchParams.get("projectKey");
    const siteOrigin = searchParams.get("siteOrigin");

    const session = getSessionFromRequest(request);
    const isAdmin = Boolean(session && request.headers.get("x-upflow-admin") === "1");
    const auth = await verifyProjectAccess(projectId, projectKey || null, siteOrigin || null, {
      isAdmin,
      userId: session?.sub,
      requestOrigin: request.headers.get("origin"),
      requestReferer: request.headers.get("referer"),
      apiOrigin: request.nextUrl.origin,
    });
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const query: Record<string, string> = { projectId };
    if (siteOrigin) query.siteOrigin = siteOrigin;

    const latest = await WidgetPingModel.findOne(query).sort({ lastSeenAt: -1 }).lean();
    const lastSeenAt = latest?.lastSeenAt ? new Date(latest.lastSeenAt).toISOString() : null;
    const connected = lastSeenAt
      ? Date.now() - new Date(lastSeenAt).getTime() <= STALE_WINDOW_MS
      : false;

    return NextResponse.json({
      connected,
      lastSeenAt,
      siteOrigin: latest?.siteOrigin ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

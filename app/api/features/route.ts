import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import FeatureModel from "@/lib/models/Feature";
import NotificationModel from "@/lib/models/Notification";
import { verifyProjectAccess } from "@/lib/projectAuth";
import { getSessionFromRequest } from "@/lib/auth";

const DEFAULT_PROJECT_ID = "default";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const projectIdParam = searchParams.get("projectId");
    const projectId = projectIdParam && projectIdParam.trim() ? projectIdParam.trim() : DEFAULT_PROJECT_ID;
    const projectKey = searchParams.get("projectKey");
    const siteOrigin = searchParams.get("siteOrigin");
    const voterId = searchParams.get("voterId");
    const status = searchParams.get("status");
    const query = searchParams.get("q");
    const sort = searchParams.get("sort");

    const session = getSessionFromRequest(request);
    const isAdmin = Boolean(session && request.headers.get("x-upflow-admin") === "1");
    const auth = await verifyProjectAccess(projectId, projectKey, siteOrigin, {
      isAdmin,
      userId: session?.sub,
      requestOrigin: request.headers.get("origin"),
      requestReferer: request.headers.get("referer"),
      apiOrigin: request.nextUrl.origin,
    });
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const filter: Record<string, unknown> = { projectId };
    if (status) filter.status = status;
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ];
    }

    const sortBy = sort === "recent" ? { createdAt: -1 } : { votes: -1 };
    const features = await FeatureModel.find(filter).sort(sortBy).lean();

    return NextResponse.json({
      features: features.map((feature) => ({
        id: feature._id.toString(),
        title: feature.title,
        description: feature.description,
        votes: feature.votes,
        status: feature.status,
        category: feature.category,
        createdAt: feature.createdAt ? new Date(feature.createdAt).toISOString() : null,
        userVoted: voterId ? feature.upvoters?.includes(voterId) : false,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const description = typeof body?.description === "string" ? body.description.trim() : "";
    const category = typeof body?.category === "string" ? body.category.trim() : "";
    const projectKey = typeof body?.projectKey === "string" ? body.projectKey.trim() : "";
    const siteOrigin = typeof body?.siteOrigin === "string" ? body.siteOrigin.trim() : "";
    const projectId = typeof body?.projectId === "string" && body.projectId.trim()
      ? body.projectId.trim()
      : DEFAULT_PROJECT_ID;
    const voterId = typeof body?.voterId === "string" ? body.voterId.trim() : "";

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

    if (!title || !description || !category) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const shouldUpvote = Boolean(voterId);
    const feature = await FeatureModel.create({
      projectId,
      title,
      description,
      category,
      votes: shouldUpvote ? 1 : 0,
      upvoters: shouldUpvote ? [voterId] : [],
      status: "planned",
    });

    await NotificationModel.create({
      projectId,
      featureId: feature._id.toString(),
      title: feature.title,
    });

    return NextResponse.json({
      feature: {
        id: feature._id.toString(),
        title: feature.title,
        description: feature.description,
        votes: feature.votes,
        status: feature.status,
        category: feature.category,
        createdAt: feature.createdAt ? feature.createdAt.toISOString() : null,
        userVoted: shouldUpvote,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

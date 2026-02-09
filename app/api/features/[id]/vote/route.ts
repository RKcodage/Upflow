import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import FeatureModel from "@/lib/models/Feature";
import { verifyProjectAccess } from "@/lib/projectAuth";
import { getSessionFromRequest } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await request.json();
    const voterId = typeof body?.voterId === "string" ? body.voterId.trim() : "";
    const projectKey = typeof body?.projectKey === "string" ? body.projectKey.trim() : "";
    const siteOrigin = typeof body?.siteOrigin === "string" ? body.siteOrigin.trim() : "";

    if (!voterId) {
      return NextResponse.json({ error: "Missing voterId." }, { status: 400 });
    }

    const feature = await FeatureModel.findById(id);
    if (!feature) {
      return NextResponse.json({ error: "Feature not found." }, { status: 404 });
    }

    const session = getSessionFromRequest(request);
    const isAdmin = Boolean(session && request.headers.get("x-upflow-admin") === "1");
    const auth = await verifyProjectAccess(feature.projectId, projectKey || null, siteOrigin || null, {
      isAdmin,
      userId: session?.sub,
      requestOrigin: request.headers.get("origin"),
      requestReferer: request.headers.get("referer"),
      apiOrigin: request.nextUrl.origin,
    });
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const alreadyVoted = feature.upvoters.includes(voterId);
    if (alreadyVoted) {
      feature.upvoters = feature.upvoters.filter((id) => id !== voterId);
      feature.votes = Math.max(0, feature.votes - 1);
    } else {
      feature.upvoters.push(voterId);
      feature.votes += 1;
    }

    await feature.save();

    return NextResponse.json({
      id: feature._id.toString(),
      votes: feature.votes,
      userVoted: !alreadyVoted,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

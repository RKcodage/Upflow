import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import FeatureModel from "@/lib/models/Feature";
import ProjectModel from "@/lib/models/Project";
import CommentModel from "@/lib/models/Comment";
import { getSessionFromRequest } from "@/lib/auth";

const MAX_COMMENT_LENGTH = 1000;

const requireAdminFeatureAccess = async (featureId: string, userId: string) => {
  const feature = await FeatureModel.findById(featureId).lean();
  if (!feature) {
    return { ok: false as const, status: 404, message: "Feature not found." };
  }

  const project = await ProjectModel.findOne({
    projectId: feature.projectId,
    ownerId: userId,
  }).lean();

  if (!project) {
    return { ok: false as const, status: 403, message: "Project access denied." };
  }

  return { ok: true as const, feature };
};

export async function GET(
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
    const access = await requireAdminFeatureAccess(id, session.sub);
    if (!access.ok) {
      return NextResponse.json({ error: access.message }, { status: access.status });
    }

    const comments = await CommentModel.find({ featureId: id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      comments: comments.map((comment) => ({
        id: comment._id.toString(),
        message: comment.message,
        authorEmail: comment.authorEmail,
        createdAt: comment.createdAt ? new Date(comment.createdAt).toISOString() : null,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const access = await requireAdminFeatureAccess(id, session.sub);
    if (!access.ok) {
      return NextResponse.json({ error: access.message }, { status: access.status });
    }

    const body = await request.json().catch(() => ({}));
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message) {
      return NextResponse.json({ error: "Commentaire vide." }, { status: 400 });
    }
    if (message.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json({ error: "Commentaire trop long." }, { status: 400 });
    }

    const authorEmail = session.email ?? "admin";
    const comment = await CommentModel.create({
      projectId: access.feature.projectId,
      featureId: id,
      authorId: session.sub,
      authorEmail,
      message,
    });

    return NextResponse.json({
      comment: {
        id: comment._id.toString(),
        message: comment.message,
        authorEmail: comment.authorEmail,
        createdAt: comment.createdAt ? new Date(comment.createdAt).toISOString() : null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

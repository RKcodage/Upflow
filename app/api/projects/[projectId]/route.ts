import crypto from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import FeatureModel from "@/lib/models/Feature";
import NotificationModel from "@/lib/models/Notification";
import ProjectModel from "@/lib/models/Project";
import WidgetPingModel from "@/lib/models/WidgetPing";
import CommentModel from "@/lib/models/Comment";
import { getSessionFromRequest } from "@/lib/auth";

const parseOrigins = (value: unknown) => {
  if (!value) return [];
  const raw = Array.isArray(value) ? value : String(value).split(/[\n,]/);
  const normalized = raw.map((entry) => String(entry).trim()).filter(Boolean);
  return Array.from(new Set(normalized));
};

const generatePublicKey = () => `pk_${crypto.randomBytes(16).toString("hex")}`;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const { projectId } = await params;
    const body = await request.json();

    const project = await ProjectModel.findOne({ projectId, ownerId: session.sub }).lean();
    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }
    const isDemoProject =
      project.projectId === "demo" || project.name?.toLowerCase() === "demo";

    const name = typeof body?.name === "string" ? body.name.trim() : undefined;
    const allowedOrigins = body?.allowedOrigins !== undefined ? parseOrigins(body.allowedOrigins) : undefined;
    const rotateKey = Boolean(body?.rotateKey);

    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name;
    if (allowedOrigins !== undefined && !isDemoProject) update.allowedOrigins = allowedOrigins;
    if (rotateKey) update.publicKey = generatePublicKey();

    if (isDemoProject && allowedOrigins !== undefined && Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: "Les domaines du projet Demo sont verrouillés." },
        { status: 403 }
      );
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    const updated = await ProjectModel.findOneAndUpdate(
      { projectId, ownerId: session.sub },
      update,
      { new: true }
    ).lean();
    if (!updated) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    return NextResponse.json({
      project: {
        projectId: updated.projectId,
        name: updated.name ?? "",
        publicKey: updated.publicKey,
        allowedOrigins: updated.allowedOrigins ?? [],
      },
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
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const { projectId } = await params;

    const project = await ProjectModel.findOne({ projectId, ownerId: session.sub }).lean();
    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }
    if (project.projectId === "demo" || project.name?.toLowerCase() === "demo") {
      return NextResponse.json({ error: "Le projet Demo ne peut pas être supprimé." }, { status: 403 });
    }

    await Promise.all([
      ProjectModel.deleteOne({ projectId, ownerId: session.sub }),
      FeatureModel.deleteMany({ projectId }),
      NotificationModel.deleteMany({ projectId }),
      WidgetPingModel.deleteMany({ projectId }),
      CommentModel.deleteMany({ projectId }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

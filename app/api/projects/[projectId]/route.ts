import crypto from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import ProjectModel from "@/lib/models/Project";
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

    const name = typeof body?.name === "string" ? body.name.trim() : undefined;
    const allowedOrigins = body?.allowedOrigins !== undefined ? parseOrigins(body.allowedOrigins) : undefined;
    const rotateKey = Boolean(body?.rotateKey);

    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name;
    if (allowedOrigins !== undefined) update.allowedOrigins = allowedOrigins;
    if (rotateKey) update.publicKey = generatePublicKey();

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    const project = await ProjectModel.findOneAndUpdate(
      { projectId, ownerId: session.sub },
      update,
      { new: true }
    ).lean();
    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    return NextResponse.json({
      project: {
        projectId: project.projectId,
        name: project.name ?? "",
        publicKey: project.publicKey,
        allowedOrigins: project.allowedOrigins ?? [],
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

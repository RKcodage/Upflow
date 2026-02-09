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

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await ProjectModel.updateMany(
      { ownerId: { $exists: false } },
      { $set: { ownerId: session.sub } }
    );

    const projects = await ProjectModel.find({ ownerId: session.sub })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      projects: projects.map((project) => ({
        projectId: project.projectId,
        name: project.name ?? "",
        publicKey: project.publicKey,
        allowedOrigins: project.allowedOrigins ?? [],
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
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const body = await request.json();

    const projectId = typeof body?.projectId === "string" ? body.projectId.trim() : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const publicKey =
      typeof body?.publicKey === "string" && body.publicKey.trim()
        ? body.publicKey.trim()
        : generatePublicKey();
    const allowedOrigins = parseOrigins(body?.allowedOrigins);

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId." }, { status: 400 });
    }

    const existing = await ProjectModel.findOne({ projectId }).lean();
    if (existing) {
      return NextResponse.json({ error: "Project already exists." }, { status: 409 });
    }

    const project = await ProjectModel.create({
      projectId,
      ownerId: session.sub,
      name,
      publicKey,
      allowedOrigins,
    });

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

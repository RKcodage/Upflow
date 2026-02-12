import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { clearSessionCookie, getSessionFromRequest } from "@/lib/auth";
import UserModel from "@/lib/models/User";
import ProjectModel from "@/lib/models/Project";
import FeatureModel from "@/lib/models/Feature";
import CommentModel from "@/lib/models/Comment";
import NotificationModel from "@/lib/models/Notification";
import WidgetPingModel from "@/lib/models/WidgetPing";

export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const user = await UserModel.findById(session.sub).lean();
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }

    const projects = await ProjectModel.find({ ownerId: session.sub })
      .select("projectId")
      .lean();
    const projectIds = projects.map((project) => project.projectId);

    if (projectIds.length) {
      await Promise.all([
        FeatureModel.deleteMany({ projectId: { $in: projectIds } }),
        CommentModel.deleteMany({ projectId: { $in: projectIds } }),
        NotificationModel.deleteMany({ projectId: { $in: projectIds } }),
        WidgetPingModel.deleteMany({ projectId: { $in: projectIds } }),
        ProjectModel.deleteMany({ projectId: { $in: projectIds } }),
      ]);
    }

    await CommentModel.deleteMany({ authorId: session.sub });
    await UserModel.deleteOne({ _id: session.sub });

    const response = NextResponse.json({ ok: true });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

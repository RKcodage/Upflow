import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import UserModel from "@/lib/models/User";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const user = await UserModel.findById(session.sub).lean();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import UserModel from "@/lib/models/User";
import { createSessionToken, getSessionFromRequest, hashPassword, setSessionCookie, verifyPassword } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
    const nextPassword = typeof body?.nextPassword === "string" ? body.nextPassword : "";

    if (!currentPassword || !nextPassword) {
      return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
    }
    if (nextPassword.length < 8) {
      return NextResponse.json(
        { error: "Mot de passe trop court (8 caractères min)." },
        { status: 400 }
      );
    }

    const user = await UserModel.findById(session.sub);
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }
    if (!verifyPassword(currentPassword, user.passwordHash)) {
      return NextResponse.json({ error: "Mot de passe actuel incorrect." }, { status: 401 });
    }

    user.passwordHash = hashPassword(nextPassword);
    await user.save();

    const token = createSessionToken({ userId: user._id.toString(), email: user.email });
    const response = NextResponse.json({ ok: true });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

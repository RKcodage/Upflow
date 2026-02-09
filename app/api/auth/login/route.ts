import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import UserModel from "@/lib/models/User";
import { createSessionToken, setSessionCookie, verifyPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ error: "Email ou mot de passe manquant." }, { status: 400 });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "Identifiants invalides." }, { status: 401 });
    }

    const valid = verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Identifiants invalides." }, { status: 401 });
    }

    const token = createSessionToken({ userId: user._id.toString(), email: user.email });
    const response = NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
      },
    });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import UserModel from "@/lib/models/User";
import { createSessionToken, hashPassword, setSessionCookie } from "@/lib/auth";
import { ensureDemoProjectForUser } from "@/lib/demoProject";

const isValidEmail = (value: string) => value.includes("@") && value.includes(".");

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Email invalide." }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Mot de passe trop court (8 caractères min)." },
        { status: 400 }
      );
    }

    const existing = await UserModel.findOne({ email }).lean();
    if (existing) {
      return NextResponse.json({ error: "Cet email est déjà utilisé." }, { status: 409 });
    }

    const user = await UserModel.create({
      email,
      passwordHash: hashPassword(password),
    });

    await ensureDemoProjectForUser(user._id.toString());

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

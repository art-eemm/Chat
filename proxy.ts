import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/verifyToken";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const publicRoutes = [
    "/api/auth/login",
    "/api/auth/login-facial",
    "/api/usuarios/registro",
    "/api/auth/reset-password",
  ];

  const isPublic = publicRoutes.includes(pathname);

  if (isPublic) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    const user = await verifyToken(token);

    if (!user) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

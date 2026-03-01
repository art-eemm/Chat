import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/verifyToken";

export async function middleware(request: NextRequest) {

  const publicRoutes = [
    "/api/usuarios/registro",
    "/api/usuarios/login"
  ];

  const isPublic = publicRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isPublic) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api")) {

    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token requerido" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];

    const user = await verifyToken(token);

    if (!user) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      );
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
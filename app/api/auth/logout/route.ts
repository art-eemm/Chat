import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyToken } from "@/lib/verifyToken";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const user = await verifyToken(token);

      if (user) {
        // Marcamos al usuario como desconectado
        await supabaseAdmin
          .from("perfiles")
          .update({
            en_linea: false,
            ultima_conexion: new Date().toISOString(),
          })
          .eq("id_perfil", user.id);
      }
    }
    return NextResponse.json({ message: "Sesión cerrada correctamente" });
  } catch (error) {
    console.error(">>> ERROR LOGOUT:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

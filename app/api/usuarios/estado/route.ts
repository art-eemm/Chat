import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyToken } from "@/lib/verifyToken";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const user = await verifyToken(token);

    if (!user) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const { en_linea } = await req.json();

    const { error } = await supabaseAdmin
      .from("perfiles")
      .update({
        en_linea: en_linea,
        ultima_conexion: new Date().toISOString(),
      })
      .eq("id_perfil", user.id);

    if (error) throw error;

    return NextResponse.json({ message: "Estado actualizado", en_linea });
  } catch (error: any) {
    console.error(">>> ERROR ESTADO:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

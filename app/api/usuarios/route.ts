import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/verifyToken";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
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

    // Obtener todos menos el usuario autenticado
    const { data: usuarios, error } = await supabaseAdmin
      .from("perfiles")
      .select("id_perfil, nombre_usuario, foto_url, en_linea, ultima_conexion")
      .neq("id_perfil", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ usuarios }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/verifyToken";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

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

    const { searchParams } = new URL(req.url);
    const usuario_id = searchParams.get("usuario_id");

    if (!usuario_id) {
      return NextResponse.json(
        { error: "usuario_id es requerido" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("perfiles")
      .select("en_linea, ultima_conexion")
      .eq("id_perfil", usuario_id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        en_linea: data.en_linea,
        ultima_conexion: data.ultima_conexion,
      },
      { status: 200 }
    );

  } catch (error) {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "El email es requerido" },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: email,
    });

    if (error || !data.properties?.action_link) {
      return NextResponse.json(
        { error: "Error al generar la sesión segura. ¿El usuario existe?" },
        { status: 400 },
      );
    }

    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(
      data.user.id,
    );
    if (userData.user) {
      await supabaseAdmin
        .from("perfiles")
        .update({
          en_linea: true,
          ultimo_inicio_sesion: new Date().toISOString(),
        })
        .eq("id_perfil", userData.user.id);
    }

    return NextResponse.json(
      { action_link: data.properties.action_link },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error en login facial:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

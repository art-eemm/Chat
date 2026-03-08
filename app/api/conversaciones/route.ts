import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/verifyToken";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const { participantes, grupal, nombre_grupo } = await req.json();

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const user = await verifyToken(token);

    if (!user) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    if (!Array.isArray(participantes) || participantes.length === 0) {
      return NextResponse.json(
        { error: "Debe enviar al menos un participante" },
        { status: 400 },
      );
    }

    const participantesFinal = Array.from(new Set([...participantes, user.id]));

    if (!grupal) {
      if (participantesFinal.length !== 2) {
        return NextResponse.json(
          {
            error:
              "Una conversación individual debe tener exactamente 2 participantes",
          },
          { status: 400 },
        );
      }

      const { data: convsUsuario1 } = await supabaseAdmin
        .from("participantes")
        .select("conversacion_id")
        .eq("usuario_id", participantesFinal[0]);

      const { data: convsUsuario2 } = await supabaseAdmin
        .from("participantes")
        .select("conversacion_id")
        .eq("usuario_id", participantesFinal[1]);

      if (convsUsuario1 && convsUsuario2) {
        const ids1 = convsUsuario1.map((p) => p.conversacion_id);
        const ids2 = convsUsuario2.map((p) => p.conversacion_id);

        const conversacionesEnComun = ids1.filter((id) => ids2.includes(id));

        if (conversacionesEnComun.length > 0) {
          const { data: conversacionExistente } = await supabaseAdmin
            .from("conversaciones")
            .select("*")
            .in("id_conversacion", conversacionesEnComun)
            .eq("grupal", false)
            .limit(1)
            .maybeSingle();

          if (conversacionExistente) {
            return NextResponse.json(
              {
                message: "La conversación ya existe",
                conversacion: conversacionExistente,
              },
              { status: 200 },
            );
          }
        }
      }
    }

    // Crear conversación si no se encontró
    const { data: conversacion, error } = await supabaseAdmin
      .from("conversaciones")
      .insert({
        grupal: grupal ?? false,
        nombre_grupo: nombre_grupo ?? null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Insertar participantes
    const inserts = participantesFinal.map((id: string) => ({
      conversacion_id: conversacion.id_conversacion,
      usuario_id: id,
    }));

    const { error: participantesError } = await supabaseAdmin
      .from("participantes")
      .insert(inserts);

    if (participantesError) {
      return NextResponse.json(
        { error: participantesError.message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { message: "Conversación creada", conversacion },
      { status: 201 },
    );
  } catch (error) {
    console.error("🔥 ERROR EN API CONVERSACIONES:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Error interno", details: errorMessage },
      { status: 500 },
    );
  }
}

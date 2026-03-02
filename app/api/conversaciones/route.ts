import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/verifyToken";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const { participantes, grupal, nombre_grupo } = await req.json();

    // Validar token
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

    // Validar participantes
    if (!Array.isArray(participantes) || participantes.length === 0) {
      return NextResponse.json(
        { error: "Debe enviar al menos un participante" },
        { status: 400 }
      );
    }

    // Evitar duplicados e incluir creador
    const participantesFinal = Array.from(
      new Set([...participantes, user.id])
    );

    // VALIDACIÓN: conversación individual existente
    if (!grupal) {
      if (participantesFinal.length !== 2) {
        return NextResponse.json(
          { error: "Una conversación individual debe tener exactamente 2 participantes" },
          { status: 400 }
        );
      }

      const { data: conversacionesExistentes } = await supabaseAdmin
        .from("conversaciones")
        .select(`
          id_conversacion,
          participantes!inner(usuario_id)
        `)
        .eq("grupal", false);

      if (conversacionesExistentes) {
        for (const conv of conversacionesExistentes) {
          const ids = conv.participantes.map((p: { usuario_id: string }) => p.usuario_id);

          const mismosUsuarios = ids.length === 2 && participantesFinal.every(id => ids.includes(id));

          if (mismosUsuarios) {
            return NextResponse.json({message: "La conversación ya existe", conversacion: conv, }, { status: 200 });
          }
        }
      }
    }

    // Crear conversación
    const { data: conversacion, error } = await supabaseAdmin
      .from("conversaciones")
      .insert({
        grupal: grupal ?? false,
        nombre_grupo: nombre_grupo ?? null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Insertar participantes
    const inserts = participantesFinal.map((id: string) => ({
      conversacion_id: conversacion.id_conversacion,
      usuario_id: id,
    }));

    const { error: participantesError } =
      await supabaseAdmin.from("participantes").insert(inserts);

    if (participantesError) {
      return NextResponse.json(
        { error: participantesError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: "Conversación creada",
        conversacion,
      },
      { status: 201 }
    );

  } catch (error) {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/verifyToken";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { encryptText } from "@/lib/encryption";
import { decryptText } from "@/lib/encryption";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const { conversacion_id, contenido, tipo_mensaje } = await req.json();

    // 🔐 Validar token
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

    // Validar datos
    if (!conversacion_id || !contenido) {
      return NextResponse.json(
        { error: "conversacion_id y contenido son requeridos" },
        { status: 400 }
      );
    }

    const tipo = tipo_mensaje ?? "texto";

    const tiposValidos = ["texto", "audio", "video", "foto"];

    if (!tiposValidos.includes(tipo)) {
      return NextResponse.json(
        { error: "Tipo de mensaje inválido" },
        { status: 400 }
      );
    }

    // Verificar que el usuario pertenece a la conversación
    const { data: participante } = await supabaseAdmin
      .from("participantes")
      .select("id_participante")
      .eq("conversacion_id", conversacion_id)
      .eq("usuario_id", user.id)
      .single();

    if (!participante) {
      return NextResponse.json(
        { error: "No perteneces a esta conversación" },
        { status: 403 }
      );
    }

    // Cifrar contenido
    const encrypted = encryptText(contenido);

    // Insertar mensaje
    const { data: mensaje, error } = await supabaseAdmin.from("mensajes").insert({
        conversacion_id,
        emisor_id: user.id,
        contenido_cifrado: encrypted.contenido_cifrado,
        iv: encrypted.iv,
        tipo_mensaje: tipo,
      }).select().single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({message: "Mensaje enviado correctamente", mensaje,}, { status: 201 });

  } catch (error) {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

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
    const conversacion_id = searchParams.get("conversacion_id");

    if (!conversacion_id) {
      return NextResponse.json(
        { error: "conversacion_id es requerido" },
        { status: 400 }
      );
    }

    // 🛑 Verificar que pertenece a la conversación
    const { data: participante } = await supabaseAdmin
      .from("participantes")
      .select("id_participante")
      .eq("conversacion_id", conversacion_id)
      .eq("usuario_id", user.id)
      .single();

    if (!participante) {
      return NextResponse.json(
        { error: "No perteneces a esta conversación" },
        { status: 403 }
      );
    }

    // 📥 Obtener mensajes
    const { data: mensajes, error } = await supabaseAdmin
      .from("mensajes")
      .select("*")
      .eq("conversacion_id", conversacion_id)
      .order("fecha_creacion", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    const mensajesProcesados = [];

    for (const mensaje of mensajes ?? []) {

      let contenidoDescifrado = null;

      if (mensaje.contenido_cifrado && mensaje.iv) {
        contenidoDescifrado = decryptText(
          mensaje.contenido_cifrado,
          mensaje.iv
        );
      }

      // 👁️ Manejo de mensajes temporales
      if (mensaje.es_temporal) {

        const nuevoConteo = mensaje.conteo_vistas + 1;

        if (nuevoConteo >= mensaje.limite_vistas) {
          // 🗑️ Eliminar mensaje si superó límite
          await supabaseAdmin
            .from("mensajes")
            .delete()
            .eq("id_mensaje", mensaje.id_mensaje);

          continue; // no lo enviamos
        } else {
          // 🔄 Actualizar conteo
          await supabaseAdmin
            .from("mensajes")
            .update({ conteo_vistas: nuevoConteo })
            .eq("id_mensaje", mensaje.id_mensaje);
        }
      }

      mensajesProcesados.push({
        ...mensaje,
        contenido: contenidoDescifrado,
      });
    }

    return NextResponse.json(
      {
        mensajes: mensajesProcesados,
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
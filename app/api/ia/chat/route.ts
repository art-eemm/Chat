import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { encryptText } from "@/lib/encryption";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { mensaje, conversacion_id, bot_id } = await req.json();

    if (!mensaje || !conversacion_id || !bot_id) {
      return NextResponse.json(
        { error: "Faltan datos (mensaje, conversacion_id o bot_id)" },
        { status: 400 },
      );
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente virtual amigable y útil que vive en una aplicación de chat. Responde de manera concisa.",
        },
        {
          role: "user",
          content: mensaje,
        },
      ],
    });

    const respuestaTexto =
      completion.choices[0]?.message?.content ||
      "Lo siento, me quedé sin palabras.";

    const encrypted = encryptText(respuestaTexto);

    const { error } = await supabaseAdmin.from("mensajes").insert({
      conversacion_id,
      emisor_id: bot_id,
      contenido_cifrado: encrypted.contenido_cifrado,
      iv: encrypted.iv,
      tipo_mensaje: "texto",
      es_temporal: false,
    });

    if (error) {
      throw error;
    }

    await supabaseAdmin
      .from("mensajes")
      .update({ leido: true })
      .eq("conversacion_id", conversacion_id)
      .neq("emisor_id", bot_id)
      .eq("leido", false);

    return NextResponse.json({ respuesta: respuestaTexto });
  } catch (error) {
    console.error("Error en la IA:", error);
    return NextResponse.json(
      { error: "Error interno procesando la IA" },
      { status: 500 },
    );
  }
}

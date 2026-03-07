import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export async function POST(req: Request) {
  try {

    const { mensaje } = await req.json();

    if (!mensaje) {
      return NextResponse.json(
        { error: "Mensaje requerido" },
        { status: 400 }
      );
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: mensaje
        }
      ]
    });

    const respuesta = completion.choices[0]?.message?.content;

    return NextResponse.json({
      respuesta
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      { error: "Error con Groq" },
      { status: 500 }
    );

  }
}
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/verifyToken";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { encryptFile } from "@/lib/encryption";
import { decryptFile } from "@/lib/encryption";

export async function POST(req: Request) {
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

    const formData = await req.formData();

    const file = formData.get("file") as File;
    const conversacion_id = formData.get("conversacion_id") as string;
    const tipo_mensaje = formData.get("tipo_mensaje") as string;

    if (!file || !conversacion_id || !tipo_mensaje) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      );
    }

    // 🔐 Verificar participante
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

    // 📦 Convertir archivo a buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 🔐 Cifrar archivo
    const { encryptedBuffer, archivo_iv } = encryptFile(buffer);

    const filePath = `${conversacion_id}/${Date.now()}-${file.name}`;

    // ☁️ Subir a Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from("multimedia")
      .upload(filePath, encryptedBuffer, {
        contentType: "application/octet-stream",
      });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 400 }
      );
    }

    const { data: publicUrl } = supabaseAdmin.storage
      .from("multimedia")
      .getPublicUrl(filePath);

    // 💬 Guardar en tabla mensajes
    await supabaseAdmin.from("mensajes").insert({
      conversacion_id,
      emisor_id: user.id,
      tipo_mensaje,
      archivo_url: publicUrl.publicUrl,
      archivo_iv: archivo_iv,
    });

    return NextResponse.json(
      { message: "Archivo enviado correctamente" },
      { status: 201 }
    );

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
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const user = await verifyToken(token);

    if (!user) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id_mensaje = searchParams.get("id_mensaje");

    if (!id_mensaje) {
      return NextResponse.json({ error: "id_mensaje requerido" }, { status: 400 });
    }

    // Obtener mensaje
    const { data: mensaje, error } = await supabaseAdmin
      .from("mensajes")
      .select("*")
      .eq("id_mensaje", id_mensaje)
      .single();

    if (error || !mensaje) {
      return NextResponse.json({ error: "Mensaje no encontrado" }, { status: 404 });
    }

    // Verificar participante
    const { data: participante } = await supabaseAdmin
      .from("participantes")
      .select("id_participante")
      .eq("conversacion_id", mensaje.conversacion_id)
      .eq("usuario_id", user.id)
      .single();

    if (!participante) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Obtener archivo desde Storage
    const filePath = mensaje.archivo_url.split("/multimedia/")[1];

    const { data: fileData, error: downloadError } =
      await supabaseAdmin.storage
        .from("multimedia")
        .download(filePath);

    if (downloadError || !fileData) {
      return NextResponse.json({ error: "Error descargando archivo" }, { status: 400 });
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const encryptedBuffer = Buffer.from(arrayBuffer);

    // 🔐 Descifrar
    const decryptedBuffer = decryptFile(
      encryptedBuffer,
      mensaje.archivo_iv
    );

    return new NextResponse(decryptedBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
      },
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
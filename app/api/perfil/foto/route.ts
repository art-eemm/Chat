import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/verifyToken";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {

  try {

    // ==========================
    // VALIDAR TOKEN
    // ==========================
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

    // ==========================
    // OBTENER FORM DATA
    // ==========================
    const formData = await req.formData();

    const fotoData = formData.get("foto");

    if (!fotoData || typeof fotoData === "string") {
      return NextResponse.json(
        { error: "Debe enviar una imagen" },
        { status: 400 }
      );
    }

    const foto = fotoData as File;

    // ==========================
    // VALIDAR TIPO DE ARCHIVO
    // ==========================
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp"
    ];

    if (!allowedTypes.includes(foto.type)) {
      return NextResponse.json(
        { error: "Formato de imagen no permitido" },
        { status: 400 }
      );
    }

    // ==========================
    // CONVERTIR A BUFFER
    // ==========================
    const buffer = Buffer.from(await foto.arrayBuffer());

    // ==========================
    // CREAR RUTA DEL ARCHIVO
    // ==========================
    const filePath = `avatars/${user.id}-${Date.now()}`;

    // ==========================
    // SUBIR A STORAGE
    // ==========================
    const { error: uploadError } = await supabaseAdmin.storage
      .from("avatars")
      .upload(filePath, buffer, {
        contentType: foto.type,
        upsert: true
      });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 400 }
      );
    }

    // ==========================
    // OBTENER URL PUBLICA
    // ==========================
    const { data } = supabaseAdmin.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const foto_url = data.publicUrl;

    // ==========================
    // ACTUALIZAR PERFIL
    // ==========================
    const { error } = await supabaseAdmin
      .from("perfiles")
      .update({ foto_url })
      .eq("id_perfil", user.id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Foto actualizada correctamente",
      foto_url
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );

  }

}
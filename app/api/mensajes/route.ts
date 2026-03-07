import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/verifyToken";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { encryptText, encryptFile, decryptText } from "@/lib/encryption";

//* ENVIAR MENSAJE (TEXTO O MULTIMEDIA)
export async function POST(req: Request) {
  try {
    //* VALIDAMOS EL TOKEN RECIBIDO
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const formData = await req.formData();
    const conversacion_id = formData.get("conversacion_id") as string;
    const contenido = formData.get("contenido") as string | null;
    const tipo_mensaje = (formData.get("tipo_mensaje") as string)?.toLowerCase();
    const es_temporal = formData.get("es_temporal") === "true";

    const fileData = formData.get("file");

    let file: File | null = null;
    if (fileData instanceof File && fileData.size > 0) {
      file = fileData;
    }

    let tipo_mensaje_final = "texto";

    if (file) {
      if (file.type.startsWith("image")) 
        tipo_mensaje_final = "foto";
      else if (file.type.startsWith("video")) 
        tipo_mensaje_final = "video";
      else if (file.type.startsWith("audio")) 
        tipo_mensaje_final = "audio";
      else
        tipo_mensaje_final = "documento";
    }

    if (!conversacion_id) {
      return NextResponse.json({ error: "conversacion_id requerido" }, { status: 400 });
    }
    if (!file && !contenido) {
      return NextResponse.json({ error: "Debe enviar texto o archivo" }, { status: 400 });
    }

    //* CIFRADO DE TEXTO
    let contenido_cifrado = null;
    let iv = null;
    if(contenido){
      const encrypted = encryptText(contenido);
      contenido_cifrado = encrypted.contenido_cifrado;
      iv = encrypted.iv;
    }
    let archivo_url = null;
    let archivo_iv = null;
    if (file) {        
      const buffer = Buffer.from(await file.arrayBuffer());
      const encryptedFile = encryptFile(buffer);
      const safeFileName = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9.-]/g, "_"); // reemplazar caracteres raros
      const filePath = `${conversacion_id}/${Date.now()}-${safeFileName}`;
      const { error: uploadError } = await supabaseAdmin.storage.from("multimedia").upload(filePath, encryptedFile.encryptedBuffer, {
          contentType: "application/octet-stream",
        });

      if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 400 });
      }

      const { data } = supabaseAdmin.storage.from("multimedia").getPublicUrl(filePath);

      archivo_url = data.publicUrl;
      archivo_iv = encryptedFile.archivo_iv;
    }
    
    //* GUARDAR EN LA TABLA DE MENSAJES
    const { error } = await supabaseAdmin.from("mensajes").insert({
      conversacion_id,
      emisor_id: user.id,
      contenido_cifrado,
      iv,
      tipo_mensaje: tipo_mensaje_final  ,
      archivo_url,
      archivo_iv,
      es_temporal
    });
    if(error){
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "Mensaje enviado correctamente" }, { status: 201 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

//* OBTENER MENSAJES
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
    const conversacion_id = searchParams.get("conversacion_id");

    if (!conversacion_id) {
      return NextResponse.json({ error: "El ID de la conversacion es requerido" }, { status: 400 });
    }

    const { data: mensajes, error } = await supabaseAdmin.from("mensajes").select("*").eq("conversacion_id", conversacion_id).order("fecha_creacion", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const mensajesProcesados = [];

    for (const mensaje of mensajes ?? []) {

      let contenidoDescifrado = null;

      if (mensaje.contenido_cifrado && mensaje.iv) {
        try {
          contenidoDescifrado = decryptText(
            mensaje.contenido_cifrado,
            mensaje.iv
          );
        } catch {
          contenidoDescifrado = null;
        }
      }

      mensajesProcesados.push({
        ...mensaje,
        contenido: contenidoDescifrado,
        tiene_archivo: !!mensaje.archivo_url
      });
    }

    return NextResponse.json({ mensajes: mensajesProcesados }, { status: 200 });

  } catch (error) {

    console.log(error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );

  }
}
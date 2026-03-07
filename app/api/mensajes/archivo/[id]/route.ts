import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/verifyToken";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { decryptFile } from "@/lib/encryption";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {

  try {

    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const user = await verifyToken(token);

    if (!user) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const { id } = await params;
    const mensaje_id = id;

    const { data: mensaje, error } = await supabaseAdmin
      .from("mensajes")
      .select("*")
      .eq("id_mensaje", mensaje_id)
      .single();

    if (error || !mensaje) {
      return NextResponse.json({ error: "Mensaje no encontrado" }, { status: 404 });
    }

    if (!mensaje.archivo_url || !mensaje.archivo_iv) {
      return NextResponse.json({ error: "Este mensaje no tiene archivo" }, { status: 400 });
    }

    const filePath = mensaje.archivo_url.split("/multimedia/")[1];

    const { data, error: downloadError } =
      await supabaseAdmin.storage.from("multimedia").download(filePath);

    if (downloadError || !data) {
      return NextResponse.json({ error: "Error descargando archivo" }, { status: 400 });
    }

    const buffer = Buffer.from(await data.arrayBuffer());

    const decrypted = decryptFile(buffer, mensaje.archivo_iv);

    const base64 = decrypted.toString("base64");

    return NextResponse.json({
      archivo: base64,
      tipo_mensaje: mensaje.tipo_mensaje
    });

  } catch (error) {

    console.log(error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );

  }

}
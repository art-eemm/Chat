import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { transporter } from "@/lib/mailer";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const email = formData.get("email") as string;
    const nombre_usuario = formData.get("nombre_usuario") as string;
    const biografia = formData.get("biografia") as string;
    const fecha_nacimiento = formData.get("fecha_nacimiento") as string;
    const telefono = formData.get("telefono") as string;
    const foto = formData.get("foto") as File | null;

    if (!email || !nombre_usuario) {
      return NextResponse.json({ error: "Correo y Nombre de Usuario son obligatorios" }, { status: 400 });
    }

    // Verificamos si el usuario ya existe
    const { data: existingUser } = await supabaseAdmin.from("perfiles").select("correo").eq("correo", email).single();
    if (existingUser) {
      return NextResponse.json({ error: "El usuario ya está registrado" }, { status: 409 });
    }

    // Generamos la contraseña
    const password = crypto.randomBytes(6).toString("hex");

    // Creamos el usuario
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message || "Error creando usuario" }, { status: 400 });
    }
    const userId = data.user.id;
    
    // Subir foto si existe
    let fotoUrl: string | null = null;
    if(foto && foto.size > 0){
      const arrayBuffer = await foto.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const filePath = `${userId}/${Date.now()}-${foto.name}`;
      const { error: uploadError } = await supabaseAdmin.storage.from("avatars").upload(filePath, buffer, { contentType: foto.type, });
      if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 400 });
      }
      const { data: publicUrl } = supabaseAdmin.storage.from("avatars").getPublicUrl(filePath);
      fotoUrl = publicUrl.publicUrl;
    }

    // Insertamos perfil completo
    const { error: perfilError } = await supabaseAdmin.from("perfiles").insert({
        id_perfil: userId,
        correo: email,
        nombre_usuario,
        foto_url: fotoUrl,
        biografia: biografia || null,
        fecha_nacimiento: fecha_nacimiento || null,
        telefono: telefono || null,
        en_linea: false,
      });

    if (perfilError) {
      return NextResponse.json({ error: perfilError.message }, { status: 400 });
    }

    // Enviar contraseña por correo
    await transporter.sendMail({
      from: `"Chat Bot" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Bienvenido a Chat Bot",
      html: `
      <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 40px;">
        <div style="max-width: 500px; margin: auto; background: white; padding: 30px; border-radius: 10px;">
          <h2 style="color: #2b7cff;">Bienvenido a Chat Bot</h2>
          <p>Tu cuenta ha sido creada correctamente.</p>
          <p><strong>Tu contraseña es:</strong></p>
          <div style="background: #f1f3f5; padding: 15px; text-align: center; font-size: 18px; border-radius: 6px; letter-spacing: 2px;">
            ${password}
          </div>
          <p style="margin-top: 20px;">
            Te recomendamos guardar bien tu contraseña.
          </p>
          <hr style="margin: 30px 0;" />
          <p style="font-size: 12px; color: gray;">
            Si no solicitaste esta cuenta, ignora este correo.
          </p>
        </div>
      </div>
      `
    });

    return NextResponse.json(
      {
        message:
          "Usuario registrado correctamente. Revisa tu correo para obtener la contraseña.",
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
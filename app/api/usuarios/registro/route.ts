import { NextResponse } from 'next/server';
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { transporter } from "@/lib/mailer";
import crypto from "crypto";

export async function POST(req: Request) {
  try{
    const { email } = await req.json(); // Solo recibimos el correo
    if (!email) {
      return NextResponse.json({ error: "El correo es obligatorio" }, { status: 400 });
    }

    // Verificar si el usuario ya existe en tabla perfiles
    const { data: existingUser } = await supabaseAdmin.from("perfiles").select("correo").eq("correo", email).single();

    if (existingUser) {
      return NextResponse.json(
        { error: "El usuario ya está registrado" },
        { status: 409 }
      );
    }
    
    //* Generar contraseña aleatoria
    const password = crypto.randomBytes(6).toString('hex');

    //* Generar usuario en supabase
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    //* Asignacion de perfil en tabla perfiles
    await supabaseAdmin.from("perfiles").insert({
      id_perfil: data.user.id,
      correo: email,
      en_linea: false,
    });

    //* Envio de contraseña por correo
    await transporter.sendMail({
      from: `"Soporte Chat" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Tu contraseña de acceso",
      html: `<p>Tu contraseña generada es: <strong>${password}</strong></p>`
    });

    return NextResponse.json({ mensaje: "Usuario registrado. Revisa tu correo para obtener la contraseña." });
  }catch (error) {
  console.error("ERROR EN REGISTRO:", error);
  return NextResponse.json(
    { error: "Error interno del servidor" },
    { status: 500 }
  );
}
  
  /* catch(error){
    return NextResponse.json({ error: "Error interno del servidor"}, {status: 500});
  } */
}


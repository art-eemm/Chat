import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { transporter } from "@/lib/mailer";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "El correo es obligatorio" },
        { status: 400 }
      );
    }

    //* Buscar usuario en perfiles
    const { data: perfil } = await supabaseAdmin.from("perfiles").select("id_perfil").eq("correo", email).single();
    if (!perfil) {
      return NextResponse.json({ message: "Si el correo existe, recibirás instrucciones." }, { status: 200 });
    }

    //* Generar nueva contraseña
    const newPassword = crypto.randomBytes(6).toString("hex");

    //* Actualizar contraseña en Supabase Auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        perfil.id_perfil,
        { password: newPassword }
      );

    if (updateError) {
      return NextResponse.json( { error: updateError.message }, { status: 400 });
    }

    // Enviar correo con nueva contraseña
    await transporter.sendMail({
      from: `"Chat Bot Soporte" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Restablecimiento de contraseña",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 30px;">
          <h2>Restablecimiento de contraseña</h2>
          <p>Tu nueva contraseña es:</p>
          <div style="background:#f1f3f5; padding:15px; font-size:18px; text-align:center;">
            <strong>${newPassword}</strong>
          </div>
          <p style="margin-top:20px;">
            Te recomendamos guardar bien tu contraseña.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ message: "Si el correo existe, recibirás instrucciones." }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
import { crearClienteServidor } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const supabase = await crearClienteServidor();
  const { correo, password, nombre } = await req.json();

  // 1. Crear usuario en la tabla de Auth de Supabase
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: correo,
    password: password,
  });

  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

  // 2. Crear el perfil en tu tabla personalizada 'perfiles'
  if (authData.user) {
    const { error: profileError } = await supabase.from('perfiles').insert({
      id_perfil: authData.user.id,
      nombre_usuario: nombre,
      correo: correo,
      activo: false
    });

    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });

    // 3. Enviar correo con la contraseña (Tu requerimiento)
    try {
      await resend.emails.send({
        from: 'Chat <onboarding@resend.dev>',
        to: correo,
        subject: 'Tus credenciales de acceso',
        html: `<p>Hola ${nombre}, tu cuenta ha sido creada. Tu contraseña es: <strong>${password}</strong></p>`
      });
    } catch (emailError) {
      console.error("Error enviando correo:", emailError);
    }
  }

  return NextResponse.json({ mensaje: "Usuario registrado y correo enviado" });
}
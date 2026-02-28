//* ENDPOINT QUE GENERARÁ JWT QUE SUPABASE GESTIONA
import { crearClienteServidor } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request){
    const supabase = await crearClienteServidor();
    const { correo, password } = await req.json();

    const { data, error } = await supabase.auth.signInWithPassword({
        email: correo,
        password: password,
    });

    if(error) return NextResponse.json({error: error.message}, {status: 401});

    return NextResponse.json({mensaje: "Sesion Iniciada", token: data.session?.access_token, user: data.user});
}
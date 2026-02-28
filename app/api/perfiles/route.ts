import { crearClienteServidor } from "@/lib/supabase";
import { NextResponse } from "next/server";

//* OBTENER USUARIO
export async function GET(){
    const supabase = await crearClienteServidor();
    const { data: {user} } = await supabase.auth.getUser();

    if(!user) return NextResponse.json({error: "No hay token valido"}, {status: 401});

    const { data } = await supabase.from('perfiles').select('*').eq('id_perfil', user.id).single();
    return NextResponse.json(data);
}

//* ACTUALIZAR USUARIO
export async function PUT(req: Request){
    const supabase = await crearClienteServidor();
    const body = await req.json();
    const {data:{user}} = await supabase.auth.getUser();

    const {error} = await supabase.from('perfiles').update({
        nombre_usuario: body.nombre_usuario,
        biografia: body.biografia,
        foto_url: body.foto_url,
        telefono: body.telefono,
        activo: body.activo
    }).eq('id_perfil', user?.id);

    return error ? NextResponse.json({error: error.message}, {status: 400}) : NextResponse.json({mensaje: "Perfil actualizado correctamente"}) 
}


import { crearClienteServidor } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request){
    const supabase = await crearClienteServidor();
    const {data: {user}} = await supabase.auth.getUser();
    if(!user) return NextResponse.json({error: "Toekn Requerido"}, {status: 401});

    const{ id_conversacion, contenido, tipo, temporal, vistas} = await req.json();
    const {data, error} = await supabase.from('mensajes').insert({
        conversacion_id: id_conversacion,
        emisor_id: user.id,
        contenido: contenido,
        tipo_mensaje: tipo,
        es_temporal: temporal,
        limite_vistas: vistas || 2,
        conteo_vistas: 0
    }).select();

    return error ? NextResponse.json(error, {status: 400}) : NextResponse.json(data);
}


export async function GET(req: Request){
    const { searchParams } = new URL(req.url);
    const id_chat = searchParams.get('id_chat');
    const supabase = await crearClienteServidor();

    const { data } = await supabase.from('mensajes').select('*').eq('conversacion_id', id_chat).order('fecha_creacion', {ascending: true});
    return NextResponse.json(data);
}
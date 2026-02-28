import { crearClienteServidor } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function PATCH(req: Request){
    const supabase = await crearClienteServidor();
    const { id_mensaje } = await req.json();

    const { data: msj, error: fetchError } = await supabase.from('mensajes').select('id_mensaje, tipo_mensaje, es_temporal, limite_vistas, conteo_vistas').eq('id_mensaje', id_mensaje).single();
    if(fetchError || !msj){
        return NextResponse.json({error: "Mensaje no encontrado"}, {status: 404});
    }
    if(msj.es_temporal && (msj.tipo_mensaje === 'foto' || msj.tipo_mensaje === 'video')){
        const nuevoConteo = msj?.conteo_vistas + 1;

        if(nuevoConteo >= msj?.limite_vistas){
            //* SI EL LIMITE DE VISTA LLEGA A 2
            await supabase.from('mensajes').update({
                contenido: '[CONTENIDO MULTIMEDIA EXPIRADO]', 
                conteo_vistas: nuevoConteo, 
                leido: true
            }).eq('id_mensaje', id_mensaje);
        }else{
            //* Aún le quedan visualizaciones
            await supabase.from('mensajes').update({ 
                conteo_vistas: nuevoConteo, 
                leido: true 
            }).eq('id_mensaje', id_mensaje);
        }
    }else{
        //* SI EL MENSAJE NO ES TEMPORAL, SOLO SE MARCA COMO LEIDO
        await supabase.from('mensajes').update({ 
            leido: true 
        }).eq('id_mensaje', id_mensaje);
    }
    return NextResponse.json({succes: true, tipo: msj.tipo_mensaje});
}
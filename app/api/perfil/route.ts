import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/verifyToken";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function PATCH(req: Request){
    try{
        //* VALIDACION DE TOKEN
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const user = await verifyToken(token);
    if (!user) {
        return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const body = await req.json();
    const { nombre_usuario, correo, telefono, biografia, fecha_nacimiento, foto_url, password } = body;

    type PerfilUpdate = {
        nombre_usuario?: string;
        correo?: string;
        foto_url?: string;
        biografia?: string;
        fecha_nacimiento?: string;
        telefono?: string;
    };
    const updateData: PerfilUpdate = {};
    if (nombre_usuario) updateData.nombre_usuario = nombre_usuario;
    if (correo) updateData.correo = correo;
    if (telefono) updateData.telefono = telefono;
    if (biografia) updateData.biografia = biografia;
    if (fecha_nacimiento) updateData.fecha_nacimiento = fecha_nacimiento;
    if (foto_url) updateData.foto_url = foto_url;

    //* ACTUALIZACION DEL PERFIL
    let perfilActualizado = null;
    if(Object.keys(updateData).length > 0){
        const { data, error } = await supabaseAdmin.from("perfiles").update(updateData).eq("id_perfil", user.id).select().single();
        if(error){
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        perfilActualizado = data;
    }

    //* ACTUALIZACION DE LA CONTRASEÑA
    if(password){
        const { error } = await supabaseAdmin.auth.admin.updateUserById( user.id, { password });
        if(error){
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
    }

    //* RESPUESTA
    return NextResponse.json({ message: "Perfil actualizado correctamente", perfil: perfilActualizado});
    }catch(error){
        console.log(error);
        return NextResponse.json({ message: "Error del servidor"}, {status: 500 });
    }
}
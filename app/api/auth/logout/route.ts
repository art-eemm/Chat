import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/verifyToken";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request){
    try{
        const authHeader = req.headers.get("authorization");
        if(!authHeader || !authHeader.startsWith("Bearer ")){
            return NextResponse.json({ error: "Token requerido" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const user = await verifyToken(token);
        if (!user) {
            return NextResponse.json({ error: "Token inválido" }, { status: 401 });
        }

        const { error } = await supabaseAdmin.from("perfiles").update({
            en_linea: false,
            ultima_conexion: new Date().toISOString(),
        }).eq("id_perfil", user.id);
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({message: "Sesión cerrada correctamente",});
    }catch(error){
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
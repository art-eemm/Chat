"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MoreVertical, Paperclip, Send, Smile } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { supabaseClient } from "@/lib/supabaseClient";

export default function ActiveChatPage() {
  const params = useParams();
  const chatId = params.chatId as string;

  const [miId, setMiId] = useState<string | null>(null);
  const [contacto, setContacto] = useState<any>(null);
  const [mensaje, setMensaje] = useState<any[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDatosDelChat = async () => {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user) return;
      setMiId(user.id);

      const { data: perfilContacto } = await supabaseClient
        .from("perfile")
        .select("*")
        .eq("id_perfil", chatId)
        .single();

      if (perfilContacto) setContacto(perfilContacto);

      const { data: historial } = await supabaseClient
        .from("mensajes")
        .select("*")
        .or(
          `and(emisor_id.eq.${user.id},receptor_id.eq.${chatId}),and(emisor_id.eq.${chatId},receptor_id.eq.${user.id})`,
        )
        .order("creado_en", { ascending: true });

      if (historial) setMensaje(historial);
      setLoading(false);
    };

    cargarDatosDelChat();
  }, [chatId]);

  const enviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !miId) return;

    const textoMensaje = nuevoMensaje;
    setNuevoMensaje("");

    const { data, error } = await supabaseClient
      .from("mensajes")
      .insert({
        emisor_id: miId,
        receptor_id: chatId,
        contenido: textoMensaje,
        leido: false,
      })
      .select()
      .single();

    if (!error && data) {
      setMensaje((prev) => [...prev, data]);
    } else {
      console.error("Error al enviar mensaje:", error);
    }
  };

  const formatearHora = (fechaIso: string) => {
    const fecha = new Date(fechaIso);
    return fecha.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const iniciales = contacto?.nombre_usuario
    ? contacto.nombre_usuario.substring(0, 2).toUpperCase()
    : "C";

  return (
    <div className="flex flex-col h-full w-full">
      <header className="h-16 border-b flex items-center justify-between px-4 bg-background shrink-0">
        <div className="flex items-center gap-3">
          <Button variant={"ghost"} size={"icon"} className="md:hidden" asChild>
            <Link href={"/"}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>

          <Avatar className="h-10 w-10">
            <AvatarImage src={contacto?.foto_url || ""} />
            <AvatarFallback>{iniciales}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-sm">
              {contacto?.nombre_usuario || "Cargando..."}
            </h2>
            <p className="text-xs text-muted-foreground">
              {contacto?.en_linea ? (
                <span className="text-green-500">En línea</span>
              ) : (
                "Desconectado"
              )}
            </p>
          </div>
        </div>

        <Button variant={"ghost"} size={"icon"}>
          <MoreVertical className="h-5 w-5 text-muted-foreground" />
        </Button>
      </header>

      <ScrollArea className="flex-1 p-4 bg-muted/20">
        <div className="flex flex-col">
          {loading ? (
            <p className="text-center text-xs text-muted-foreground mt-10">
              Cargando mensajes...
            </p>
          ) : mensaje.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground mt-10">
              No hay mensajes aún. ¡Envía el primero!
            </p>
          ) : (
            mensaje.map((msg) => (
              <ChatBubble
                key={msg.id_mensaje || msg.id}
                message={msg.contenido}
                time={msg.creado_en ? formatearHora(msg.creado_en) : "Ahora"}
                isSender={msg.emisor_id === miId}
                status={msg.leido ? "read" : "sent"}
              />
            ))
          )}
        </div>
      </ScrollArea>

      <footer className="p-3 bg-background border-t shrink-0">
        <form onSubmit={enviarMensaje} className="flex items-center gap-2">
          <Button
            type="button"
            variant={"ghost"}
            size={"icon"}
            className="text-muted-foreground shrink-0"
          >
            <Smile className="h-6 w-6" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground shrink-0"
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          <Input
            className="flex-1 bg-muted/50 border-none rounded-full px-4 h-10"
            placeholder="Escribe un mensaje..."
            value={nuevoMensaje}
            onChange={(e) => setNuevoMensaje(e.target.value)}
            disabled={loading}
          />

          <Button
            type="submit"
            size={"icon"}
            className="rounded-full shrink-0 h-10 w-10"
            disabled={!nuevoMensaje.trim() || loading}
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </footer>
    </div>
  );
}

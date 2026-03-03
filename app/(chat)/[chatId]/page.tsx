"use client";

import { useEffect, useState, useRef } from "react";
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
  const contactoId = params.chatId as string;

  const [miId, setMiId] = useState<string | null>(null);
  const [contacto, setContacto] = useState<any>(null);
  const [conversacionId, setConversacionId] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [loading, setLoading] = useState(true);

  // NUEVO: Referencia para el auto-scroll
  const mensajesFinRef = useRef<HTMLDivElement>(null);

  // Función para hacer scroll hacia el último mensaje
  const hacerScrollAlFinal = () => {
    mensajesFinRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. Cargar el Chat y los Mensajes iniciales
  useEffect(() => {
    const inicializarChat = async () => {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user) return;
      setMiId(user.id);

      const { data: perfilContacto } = await supabaseClient
        .from("perfiles")
        .select("*")
        .eq("id_perfil", contactoId)
        .single();

      if (perfilContacto) setContacto(perfilContacto);

      const { data: misParticipaciones } = await supabaseClient
        .from("participantes")
        .select("conversacion_id")
        .eq("usuario_id", user.id);

      const { data: susParticipaciones } = await supabaseClient
        .from("participantes")
        .select("conversacion_id")
        .eq("usuario_id", contactoId);

      if (misParticipaciones && susParticipaciones) {
        const misIds = misParticipaciones.map((p) => p.conversacion_id);
        const susIds = susParticipaciones.map((p) => p.conversacion_id);
        const conversacionEnComun = misIds.find((id) => susIds.includes(id));

        if (conversacionEnComun) {
          setConversacionId(conversacionEnComun);

          const { data: historial } = await supabaseClient
            .from("mensajes")
            .select("*")
            .eq("conversacion_id", conversacionEnComun)
            .order("fecha_creacion", { ascending: true });

          if (historial) {
            setMensajes(historial);
            setTimeout(hacerScrollAlFinal, 100); // Scroll inicial
          }
        }
      }
      setLoading(false);
    };

    inicializarChat();
  }, [contactoId]);

  // 2. NUEVO: Suscripción a mensajes en Tiempo Real
  useEffect(() => {
    if (!conversacionId) return;

    // Nos suscribimos a los INSERT en la tabla mensajes para esta conversación
    const canal = supabaseClient
      .channel(`mensajes_conv_${conversacionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensajes",
          filter: `conversacion_id=eq.${conversacionId}`,
        },
        (payload) => {
          const nuevoMsj = payload.new;
          // Agregamos el mensaje nuevo a la lista (solo si no fuimos nosotros mismos,
          // ya que nosotros lo agregamos al momento de enviarlo para que sea instantáneo)
          setMensajes((prev) => {
            // Evitar duplicados si ya lo agregamos localmente
            if (prev.find((m) => m.id_mensaje === nuevoMsj.id_mensaje))
              return prev;
            return [...prev, nuevoMsj];
          });

          setTimeout(hacerScrollAlFinal, 100); // Scroll cuando llega mensaje
        },
      )
      .subscribe();

    return () => {
      // Limpiar la suscripción cuando salimos del chat
      supabaseClient.removeChannel(canal);
    };
  }, [conversacionId]);

  // 3. Función para enviar un mensaje
  const enviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !miId) return;

    const textoMensaje = nuevoMensaje;
    setNuevoMensaje("");

    let currentConvId = conversacionId;

    if (!currentConvId) {
      const { data: nuevaConv, error: errConv } = await supabaseClient
        .from("conversaciones")
        .insert({ grupal: false })
        .select()
        .single();

      if (errConv || !nuevaConv)
        return console.error("Error creando conv", errConv);
      currentConvId = nuevaConv.id_conversacion;
      setConversacionId(currentConvId);

      await supabaseClient.from("participantes").insert([
        { conversacion_id: currentConvId, usuario_id: miId },
        { conversacion_id: currentConvId, usuario_id: contactoId },
      ]);
    }

    // Como indicaste que la encriptación ya está resuelta, mandamos el texto tal cual
    // y tu backend o lógica de inserción hará el resto
    const nuevoMensajeObj = {
      conversacion_id: currentConvId,
      emisor_id: miId,
      contenido_cifrado: textoMensaje,
      iv: "default-iv",
      tipo_mensaje: "texto",
      leido: false,
      es_temporal: false,
    };

    const { data: msjInsertado, error: errMsj } = await supabaseClient
      .from("mensajes")
      .insert(nuevoMensajeObj)
      .select()
      .single();

    if (!errMsj && msjInsertado) {
      setMensajes((prev) => [...prev, msjInsertado]);
      setTimeout(hacerScrollAlFinal, 100); // Scroll al enviar
    }
  };

  const formatearHora = (fechaIso: string) => {
    return new Date(fechaIso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const iniciales = contacto?.nombre_usuario
    ? contacto.nombre_usuario.substring(0, 2).toUpperCase()
    : "C";

  return (
    <div className="flex flex-col h-full w-full">
      {/* Cabecera */}
      <header className="h-16 border-b flex items-center justify-between px-4 bg-background shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden" asChild>
            <Link href="/">
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
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5 text-muted-foreground" />
        </Button>
      </header>

      {/* Historial de Mensajes */}
      <ScrollArea className="flex-1 p-4 bg-muted/20">
        <div className="flex flex-col">
          {loading ? (
            <p className="text-center text-xs text-muted-foreground mt-10">
              Cargando chat...
            </p>
          ) : mensajes.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground mt-10">
              No hay mensajes aún. ¡Inicia la conversación!
            </p>
          ) : (
            mensajes.map((msg) => (
              <ChatBubble
                key={msg.id_mensaje}
                message={msg.contenido_cifrado}
                time={
                  msg.fecha_creacion
                    ? formatearHora(msg.fecha_creacion)
                    : "Ahora"
                }
                isSender={msg.emisor_id === miId}
                status={msg.leido ? "read" : "sent"}
              />
            ))
          )}
          {/* NUEVO: Elemento invisible para hacer scroll hasta aquí */}
          <div ref={mensajesFinRef} />
        </div>
      </ScrollArea>

      {/* Input de Mensaje */}
      <footer className="p-3 bg-background border-t shrink-0">
        <form onSubmit={enviarMensaje} className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
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
            size="icon"
            className="rounded-full shrink-0 h-10 w-10"
            disabled={!nuevoMensaje.trim() || loading}
          >
            <Send className="h-5 w-5 ml-1" />
          </Button>
        </form>
      </footer>
    </div>
  );
}

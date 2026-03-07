"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MoreVertical,
  Paperclip,
  Send,
  Smile,
  X,
} from "lucide-react";
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
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);

  const [contactoEnLinea, setContactoEnLinea] = useState(false);
  const mensajesFinRef = useRef<HTMLDivElement>(null);

  const hacerScrollAlFinal = () => {
    mensajesFinRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const inicializarChat = async () => {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      if (!session) return;

      const miUserId = session.user.id;
      setMiId(miUserId);
      const token = session.access_token;

      const { data: perfilContacto } = await supabaseClient
        .from("perfiles")
        .select("*")
        .eq("id_perfil", contactoId)
        .single();

      if (perfilContacto) {
        setContacto(perfilContacto);
        setContactoEnLinea(perfilContacto.en_linea);
      }

      try {
        const resConv = await fetch("/api/conversaciones", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ participantes: [contactoId], grupal: false }),
        });

        if (resConv.ok) {
          const dataConv = await resConv.json();
          const idConv = dataConv.conversacion.id_conversacion;
          setConversacionId(idConv);

          const resMsjs = await fetch(
            `/api/mensajes?conversacion_id=${idConv}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );

          if (resMsjs.ok) {
            const dataMsjs = await resMsjs.json();
            setMensajes(dataMsjs.mensajes || []);
            setTimeout(hacerScrollAlFinal, 100);

            await supabaseClient
              .from("mensajes")
              .update({ leido: true })
              .eq("conversacion_id", idConv)
              .eq("leido", false)
              .neq("emisor_id", miUserId);
          }
        }
      } catch (error) {
        console.error("Error en la petición:", error);
      }
      setLoading(false);
    };

    inicializarChat();
  }, [contactoId]);

  useEffect(() => {
    if (!contactoId) return;

    const canalPerfil = supabaseClient
      .channel(`perfil_contacto_${contactoId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "perfiles",
          filter: `id_perfil=eq.${contactoId}`,
        },
        (payload) => {
          setContactoEnLinea(payload.new.en_linea);
        },
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(canalPerfil);
    };
  }, [contactoId]);

  useEffect(() => {
    if (!conversacionId || !miId) return;

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
        async (payload) => {
          const nuevoMsj = payload.new;
          if (nuevoMsj.emisor_id === miId) return;

          const {
            data: { session },
          } = await supabaseClient.auth.getSession();
          if (!session) return;

          const res = await fetch(
            `/api/mensajes?conversacion_id=${conversacionId}`,
            {
              headers: { Authorization: `Bearer ${session.access_token}` },
            },
          );

          if (res.ok) {
            const data = await res.json();
            setMensajes(data.mensajes || []);
            setTimeout(hacerScrollAlFinal, 100);

            await supabaseClient
              .from("mensajes")
              .update({ leido: true })
              .eq("id_mensaje", nuevoMsj.id_mensaje);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "mensajes",
          filter: `conversacion_id=eq.${conversacionId}`,
        },
        (payload) => {
          const mensajeActualizado = payload.new;
          setMensajes((prev) =>
            prev.map((m) =>
              m.id_mensaje === mensajeActualizado.id_mensaje
                ? { ...m, leido: mensajeActualizado.leido }
                : m,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(canal);
    };
  }, [conversacionId, miId]);

  useEffect(() => {
    if (!contactoId) return;

    const sincronizarEstado = async () => {
      const { data } = await supabaseClient
        .from("perfiles")
        .select("en_linea")
        .eq("id_perfil", contactoId)
        .single();

      if (data) {
        setContactoEnLinea(data.en_linea);
      }
    };

    window.addEventListener("focus", sincronizarEstado);
    return () => window.removeEventListener("focus", sincronizarEstado);
  }, [contactoId]);

  const enviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      (!nuevoMensaje.trim() && !archivoSeleccionado) ||
      !miId ||
      !conversacionId
    )
      return;

    const textoMensaje = nuevoMensaje;
    const archivoAEnviar = archivoSeleccionado;

    setNuevoMensaje("");
    setArchivoSeleccionado(null);

    try {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      if (!session) return;

      const formData = new FormData();
      formData.append("conversacion_id", conversacionId);
      if (textoMensaje) {
        formData.append("contenido", textoMensaje);
      }

      if (archivoAEnviar) {
        formData.append("file", archivoAEnviar);
      } else {
        formData.append("tipo_mensaje", "text");
      }

      const res = await fetch("/api/mensajes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (res.ok) {
        const resMsjs = await fetch(
          `/api/mensajes?conversacion_id=${conversacionId}`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` },
          },
        );

        if (resMsjs.ok) {
          const dataMsjs = await resMsjs.json();
          setMensajes(dataMsjs.mensajes || []);
          setTimeout(hacerScrollAlFinal, 100);
        }
      }
    } catch (error) {
      console.error("Error en POST:", error);
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
    <div className="flex flex-col h-full w-full overflow-hidden">
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
              {contactoEnLinea ? (
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

      <div className="flex-1 p-4 bg-muted/20 overflow-y-auto no-scrollbar">
        <div className="flex flex-col">
          {loading ? (
            <p className="text-center text-xs text-muted-foreground mt-10">
              Cargando chat...
            </p>
          ) : mensajes.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground mt-10">
              No hay mensajes aún.
            </p>
          ) : (
            mensajes.map((msg) => (
              <ChatBubble
                key={msg.id_mensaje}
                mensajeId={msg.id_mensaje}
                tieneArchivo={msg.tiene_archivo}
                tipoMensaje={msg.tipo_mensaje}
                message={msg.contenido || ""}
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
          <div ref={mensajesFinRef} />
        </div>
      </div>

      <footer className="p-3 bg-background border-t shrink-0 flex flex-col gap-2">
        {archivoSeleccionado && (
          <div className="flex items-center justify-between bg-muted p-2 rounded-md border text-sm shadow-sm self-start max-w-full min-w-50">
            <span className="truncate font-medium text-primary mr-2">
              {archivoSeleccionado.name}
            </span>
            <Button
              type="button"
              variant={"ghost"}
              size={"icon"}
              className="h-6 w-6 rounded-full hover:bg-destructive hover:text-destructive-foreground shrink-0"
              onClick={() => {
                setArchivoSeleccionado(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <form onSubmit={enviarMensaje} className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground shrink-0"
          >
            <Smile className="h-6 w-6" />
          </Button>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*,video/*,.pdf,.doc,.docx"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setArchivoSeleccionado(e.target.files[0]);
              }
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`shrink-0 ${archivoSeleccionado ? "text-primary" : "text-muted-foreground"}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <Input
            className="flex-1 bg-muted/50 border-none rounded-full px-4 h-10"
            placeholder={
              archivoSeleccionado
                ? "Añade un comentario..."
                : "Escribe un mensaje..."
            }
            value={nuevoMensaje}
            onChange={(e) => setNuevoMensaje(e.target.value)}
            disabled={loading}
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-full shrink-0 h-10 w-10"
            disabled={(!nuevoMensaje.trim() && !archivoSeleccionado) || loading}
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </footer>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  Check,
  CheckCheck,
  Download,
  FileIcon,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabaseClient } from "@/lib/supabaseClient";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

interface ChatBubbleProps {
  message: string;
  time: string;
  isSender: boolean;
  status?: "sent" | "delivered" | "read";
  mensajeId?: string;
  tieneArchivo?: boolean;
  tipoMensaje?: string;
}

export function ChatBubble({
  message,
  time,
  isSender,
  status,
  mensajeId,
  tieneArchivo,
  tipoMensaje,
}: ChatBubbleProps) {
  const [archivoBase64, setArchivoBase64] = useState<string | null>(null);
  const [cargandoArchivo, setCargandoArchivo] = useState(false);
  const [nombreArchivo, setNombreArchivo] = useState<string>("archivo_adjunto");

  useEffect(() => {
    const fetchArchivo = async () => {
      if (tieneArchivo && mensajeId) {
        setCargandoArchivo(true);
        try {
          const {
            data: { session },
          } = await supabaseClient.auth.getSession();
          if (!session) return;

          const res = await fetch(`/api/mensajes/archivo/${mensajeId}`, {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          if (res.ok) {
            const data = await res.json();

            let mimeType = "application/octet-stream";
            if (data.tipo_mensaje === "foto") mimeType = "image/jpeg";
            else if (data.tipo_mensaje === "video") mimeType = "video/mp4";

            setArchivoBase64(`data:${mimeType};base64,${data.archivo}`);
            setNombreArchivo(data.nombre_archivo || `archivo_${mensajeId}`);
          }
        } catch (error) {
          console.error("Error cargando archivo:", error);
        } finally {
          setCargandoArchivo(false);
        }
      }
    };

    fetchArchivo();
  }, [tieneArchivo, mensajeId]);

  return (
    <div
      className={cn(
        "flex w-full mb-4",
        isSender ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[85%] md:max-w-[65%] flex flex-col px-3 py-2 rounded-2xl relative shadow-sm",
          isSender
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted text-foreground rounded-tl-sm",
        )}
      >
        {tieneArchivo && (
          <div className="mb-2">
            {cargandoArchivo ? (
              <div className="h-32 w-32 bg-background/20 animate-pulse flex items-center justify-center rounded-md">
                <ImageIcon className="h-8 w-8 opacity-50" />
              </div>
            ) : archivoBase64 ? (
              tipoMensaje === "foto" ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <img
                      src={archivoBase64}
                      alt="Imagen adjunta"
                      className="max-w-full rounded-md max-h-64 object-contain"
                    />
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] sm:max-w-[95vw] w-full h-full max-h-[95vh] bg-transparent border-none shadow-none flex items-center justify-center p-0 [&>button]:text-white [&>button]:bg-black/50 [&>button]:rounded-full [&>button]:p-2">
                    <DialogTitle className="sr-only">
                      Imagen ampliada
                    </DialogTitle>
                    <img
                      src={archivoBase64}
                      alt="Imagen ampliada"
                      className="w-auto h-auto max-w-full max-h-[90hv] object-contain drop-shadow-2xl"
                    />
                  </DialogContent>
                </Dialog>
              ) : tipoMensaje === "video" ? (
                <div className="flex flex-col gap-1">
                  <video
                    src={archivoBase64}
                    controls
                    preload="metadata"
                    className="max-w-full rounded-md max-h-64 bg-black/10"
                  />
                  <a
                    href={archivoBase64}
                    download={nombreArchivo}
                    className="text-[10px] opacity-70 hover:underline self-end flex items-center gap-1 mt-1"
                  >
                    <Download className="h-3 w-3" /> Descargar vídeo
                  </a>
                </div>
              ) : (
                <a
                  href={archivoBase64}
                  download={nombreArchivo}
                  className="flex items-center gap-2 bg-background/20 p-2 rounded-md hover:bg-background/30 transition-colors cursor-pointer"
                >
                  <FileIcon className="h-6 w-6 shrink-0" />
                  <span className="text-sm truncate font-medium">
                    Archivo adjunto
                  </span>
                  <Download className="h-4 w-4 ml-auto shrink-0" />
                </a>
              )
            ) : (
              <span className="text-xs italic opacity-70">
                Archivo no disponible
              </span>
            )}
          </div>
        )}

        {message && message.trim() !== "" && (
          <span className="text-sm wrap-break-word leading-relaxed">
            {message}
          </span>
        )}

        <div className="flex items-center justify-end gap-1 mt-1 -mb-1">
          <span className="text-[10px] opacity-70">{time}</span>

          {isSender && status && (
            <span className="ml-1">
              {status === "sent" && <Check className="h-3 w-3 opacity-70" />}
              {status === "delivered" && (
                <CheckCheck className="h-3 w-3 opacity-70" />
              )}
              {status === "read" && (
                <CheckCheck className="h-3 w-3 text-blue-400 opacity-100" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

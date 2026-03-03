"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { UserListItem } from "@/components/layout/UserListItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { UserMenu } from "@/components/profile/UserMenu";
import { supabaseClient } from "@/lib/supabaseClient";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isChatActive = pathname !== "/";

  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [miId, setMiId] = useState<string | null>(null);

  useEffect(() => {
    const inicializarDatos = async () => {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setIsCheckingAuth(false);
      const userId = session.user.id;
      setMiId(userId);

      const { data: perfiles } = await supabaseClient
        .from("perfiles")
        .select("*")
        .neq("id_perfil", userId);

      const { data: misParts } = await supabaseClient
        .from("participantes")
        .select("conversacion_id")
        .eq("usuario_id", userId);

      const convIds = misParts?.map((p) => p.conversacion_id) || [];

      const contactToConv: Record<string, string> = {};
      if (convIds.length > 0) {
        const { data: allParts } = await supabaseClient
          .from("participantes")
          .select("conversacion_id, usuario_id")
          .in("conversacion_id", convIds);

        allParts?.forEach((p) => {
          if (p.usuario_id !== userId) {
            contactToConv[p.usuario_id] = p.conversacion_id;
          }
        });
      }

      let ultimosMensajes: Record<string, any> = {};
      let noLeidos: Record<string, number> = {};

      if (convIds.length > 0) {
        const { data: mensajes } = await supabaseClient
          .from("mensajes")
          .select("*")
          .in("conversacion_id", convIds)
          .order("fecha_creacion", { ascending: false });

        mensajes?.forEach((m) => {
          if (!ultimosMensajes[m.conversacion_id]) {
            ultimosMensajes[m.conversacion_id] = m;
          }
          if (!m.leido && m.emisor_id !== userId) {
            noLeidos[m.conversacion_id] =
              (noLeidos[m.conversacion_id] || 0) + 1;
          }
        });
      }

      const usersData =
        perfiles?.map((p) => {
          const convId = contactToConv[p.id_perfil];
          const lastMsg = convId ? ultimosMensajes[convId] : null;
          return {
            ...p,
            conversacion_id: convId,
            lastMessageData: lastMsg,
            unreadCount: convId ? noLeidos[convId] || 0 : 0,
          };
        }) || [];

      usersData.sort((a, b) => {
        const timeA = a.lastMessageData
          ? new Date(a.lastMessageData.fecha_creacion).getTime()
          : 0;
        const timeB = b.lastMessageData
          ? new Date(b.lastMessageData.fecha_creacion).getTime()
          : 0;
        return timeB - timeA;
      });

      setUsuarios(usersData);
      setLoadingUsers(false);

      const perfilesChannel = supabaseClient
        .channel("estado_perfiles")
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "perfiles" },
          (payload) => {
            const updatedUser = payload.new;
            setUsuarios((prev) =>
              prev.map((u) =>
                u.id_perfil === updatedUser.id_perfil
                  ? { ...u, en_linea: updatedUser.en_linea }
                  : u,
              ),
            );
          },
        )
        .subscribe();

      const msgsChannel = supabaseClient
        .channel("sidebar_mensajes")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "mensajes" },
          (payload) => {
            const newMsg = payload.new;
            setUsuarios((prev) => {
              const updated = [...prev];
              const index = updated.findIndex(
                (u) => u.conversacion_id === newMsg.conversacion_id,
              );

              if (index !== -1) {
                const userCopy = { ...updated[index] };
                userCopy.lastMessageData = newMsg;
                if (newMsg.emisor_id !== userId) {
                  userCopy.unreadCount += 1;
                }
                updated.splice(index, 1);
                updated.unshift(userCopy);
                return updated;
              } else {
                window.location.reload();
                return prev;
              }
            });
          },
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "mensajes" },
          (payload) => {
            const updatedMsg = payload.new;
            if (updatedMsg.leido) {
              setUsuarios((prev) => {
                const updated = [...prev];
                const index = updated.findIndex(
                  (u) => u.conversacion_id === updatedMsg.conversacion_id,
                );
                if (index !== -1 && updated[index].unreadCount > 0) {
                  const userCopy = { ...updated[index] };
                  userCopy.unreadCount -= 1;
                  updated[index] = userCopy;
                }
                return updated;
              });
            }
          },
        )
        .subscribe();

      return () => {
        supabaseClient.removeChannel(perfilesChannel);
        supabaseClient.removeChannel(msgsChannel);
      };
    };

    inicializarDatos();
  }, [router]);

  useEffect(() => {
    if (!miId) return;

    const actualizarEstado = async (estado: boolean) => {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      if (!session) return;

      fetch("/api/usuarios/estado", {
        method: "POST",
        keepalive: true,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ en_linea: estado }),
      }).catch(() => {});
    };

    const handleFocus = async () => {
      actualizarEstado(true);

      const { data: perfilesActualizados } = await supabaseClient
        .from("perfiles")
        .select("id_perfil, en_linea");

      if (perfilesActualizados) {
        setUsuarios((prev) =>
          prev.map((u) => {
            const perfilBd = perfilesActualizados.find(
              (p) => p.id_perfil === u.id_perfil,
            );
            return perfilBd ? { ...u, en_linea: perfilBd.en_linea } : u;
          }),
        );
      }
    };

    const handleBeforeUnload = () => actualizarEstado(false);

    window.addEventListener("focus", handleFocus);
    window.addEventListener("beforeunload", handleBeforeUnload);

    actualizarEstado(true);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [miId]);

  if (isCheckingAuth) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-muted-foreground text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <aside
        className={`w-full md:w-80 md:min-w-[20rem] border-r flex-col bg-muted/10 ${isChatActive ? "hidden md:flex" : "flex"}`}
      >
        <header className="h-16 border-b flex items-center gap-3 px-4 shrink-0">
          <UserMenu />
          <h1 className="font-semibold text-xl">Chats</h1>
        </header>

        <div className="p-3 border-b shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar un chat..."
              className="pl-9 bg-muted/50 border-none"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 px-2">
          <div className="space-y-1 py-2">
            {loadingUsers ? (
              <p className="text-center text-sm text-muted-foreground mt-4">
                Cargando chats...
              </p>
            ) : usuarios.length > 0 ? (
              usuarios.map((user) => {
                const textoMensaje = user.lastMessageData
                  ? user.lastMessageData.emisor_id === miId
                    ? "Tú: Mensaje enviado"
                    : "Nuevo mensaje recibido"
                  : user.biografia || "Disponible";

                const hora = user.lastMessageData
                  ? new Date(
                      user.lastMessageData.fecha_creacion,
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "";

                return (
                  <UserListItem
                    key={user.id_perfil}
                    id={user.id_perfil}
                    name={user.nombre_usuario}
                    lastMessage={textoMensaje}
                    time={hora}
                    avatarUrl={user.foto_url}
                    isActive={user.en_linea}
                    unreadCount={user.unreadCount}
                  />
                );
              })
            ) : (
              <p className="text-center text-sm text-muted-foreground mt-4">
                No hay otros usuarios.
              </p>
            )}
          </div>
        </ScrollArea>
      </aside>

      <main
        className={`flex-1 flex-col relative ${!isChatActive ? "hidden md:flex" : "flex"}`}
      >
        {children}
      </main>
    </div>
  );
}

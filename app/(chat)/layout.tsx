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

  useEffect(() => {
    const verificarSesion = async () => {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      if (!session) {
        router.push("/login");
      } else {
        setIsCheckingAuth(false);
      }
    };

    verificarSesion();
  }, [router]);

  useEffect(() => {
    if (isCheckingAuth) return;

    const fetchUsuarios = async () => {
      try {
        const {
          data: { user },
        } = await supabaseClient.auth.getUser();

        let query = supabaseClient.from("perfiles").select("*");
        if (user) {
          query = query.neq("id_perfil", user.id);
        }

        const { data } = await query;
        if (data) setUsuarios(data);
      } catch (error) {
        console.error("Error cargando usuarios:", error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsuarios();
  }, [isCheckingAuth]);

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
                Cargando usuarios...
              </p>
            ) : usuarios.length > 0 ? (
              usuarios.map((user) => (
                <UserListItem
                  key={user.id_perfil}
                  id={user.id_perfil}
                  name={user.nombre_usuario}
                  lastMessage={user.biografia || "Disponible"}
                  time=""
                  avatarUrl={user.foto_url}
                  isActive={user.en_linea}
                  unreadCount={0}
                />
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground mt-4">
                No hay otros usuarios registrados.
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

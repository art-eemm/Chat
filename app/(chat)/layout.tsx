"use client";

import { usePathname } from "next/navigation";
import { UserListItem } from "@/components/layout/UserListItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { UserMenu } from "@/components/profile/UserMenu";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isChatActive = pathname !== "/";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <aside
        className={`w-full md:w-96 md:min-w-[20rem] border-r flex-col bg-muted/10 ${isChatActive ? "hidden md:flex" : "flex"}`}
      >
        <header className="h-16 border-b flex items-center justify-between px-4 shrink-0">
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
            <UserListItem
              id={1}
              name="María García"
              lastMessage="¡Nos vemos mañana a las 10! 👋"
              time="10:42 AM"
              isActive={true}
              unreadCount={2}
            />
            <UserListItem
              id={2}
              name="Carlos Dev"
              lastMessage="Ya terminé la API del registro."
              time="Ayer"
              isActive={false}
            />
          </div>
        </ScrollArea>
      </aside>

      <main
        className={`flex-1 flex flex-col relative ${!isChatActive ? "hidden md:flex" : "flex"}`}
      >
        {children}
      </main>
    </div>
  );
}

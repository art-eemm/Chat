import Link from "next/link";
import { ArrowLeft, MoreVertical, Paperclip, Send, Smile } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatBubble } from "@/components/chat/ChatBubble";

export default function ActiveChatPage() {
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
            <AvatarFallback>MG</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-sm">María García</h2>
            <p className="text-xs text-green-500">En línea</p>
          </div>
        </div>

        <Button variant={"ghost"} size={"icon"}>
          <MoreVertical className="h-5 w-5 text-muted-foreground" />
        </Button>
      </header>

      <ScrollArea className="flex-1 p-4 bg-muted/20">
        <div className="flex flex-col gap-4">
          <ChatBubble
            message="¡Hola! ¿Cómo vas con el desarrollo del chat?"
            time="10:30 AM"
            isSender={false}
          />
          <ChatBubble
            message="¡Hola María! Todo excelente, ya casi termino la interfaz visual."
            time="10:32 AM"
            isSender={true}
            status="read"
          />
          <ChatBubble
            message="¡Qué rápido! ¿Ya hiciste la parte responsiva?"
            time="10:33 AM"
            isSender={false}
          />
          <ChatBubble
            message="Sí, ya se ve perfecto tanto en celular como en la computadora de escritorio. Ahora estoy probando los íconos de doble check."
            time="10:35 AM"
            isSender={true}
            status="delivered"
          />
          <ChatBubble
            message="Te mando captura en un momento."
            time="10:36 AM"
            isSender={true}
            status="sent"
          />
        </div>
      </ScrollArea>

      <footer className="p-3 bg-background border-t flex items-center gap-2 shrink-0">
        <Button
          variant={"ghost"}
          size={"icon"}
          className="text-muted-foreground shrink-0"
        >
          <Smile className="h-6 w-6" />
        </Button>
        <Button
          variant={"ghost"}
          size={"icon"}
          className="text-muted-foreground shrink-0"
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <Input
          className="flex-1 bg-muted/50 border-none rounded-full px-4 h-10"
          placeholder="Escribe un mensaje..."
        />

        <Button size={"icon"} className="rounded-full shrink-0 h-10 w-10">
          <Send className="h-5 w-5" />
        </Button>
      </footer>
    </div>
  );
}

import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  message: string;
  time: string;
  isSender: boolean;
  status?: "sent" | "delivered" | "read";
}

export function ChatBubble({
  message,
  time,
  isSender,
  status,
}: ChatBubbleProps) {
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
        <span className="text-sm wrap-break-word leading-relaxed">
          {message}
        </span>

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

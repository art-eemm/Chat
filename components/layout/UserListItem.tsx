import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface UserListItemProps {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
  avatarUrl?: string;
  isActive?: boolean;
  unreadCount?: number;
}

export function UserListItem({
  id,
  name,
  lastMessage,
  time,
  avatarUrl,
  isActive,
  unreadCount,
}: UserListItemProps) {
  return (
    <Link
      href={`/${id}`}
      className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors text-left group"
    >
      <div className="relative">
        <Avatar className="h-12 w-12">
          <AvatarImage src={avatarUrl} alt={name} />
          <AvatarFallback>{name.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        {isActive && (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full"></span>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-medium truncate">{name}</h3>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {time}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground truncate pr-2">
            {lastMessage}
          </p>
          {unreadCount && unreadCount > 0 ? (
            <Badge
              variant="default"
              className="h-5 min-w-5 flex items-center justify-center rounded-full px-1.5 text-[10px]"
            >
              {unreadCount}
            </Badge>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

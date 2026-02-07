import { Plus, Shield, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChatThread } from "@/types/chat";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  threads: ChatThread[];
  activeThreadId: string | null;
  onNewChat: () => void;
  onSelectThread: (id: string) => void;
}

export function ChatSidebar({ threads, activeThreadId, onNewChat, onSelectThread }: ChatSidebarProps) {
  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-sm font-semibold text-foreground tracking-wide uppercase">
            Patch Command
          </h1>
        </div>
        <Button
          onClick={onNewChat}
          className="w-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:border-primary/40 transition-all"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Session
        </Button>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
        {threads.length === 0 && (
          <p className="text-xs text-muted-foreground p-3 text-center">
            No sessions yet
          </p>
        )}
        {threads.map((thread) => (
          <button
            key={thread.id}
            onClick={() => onSelectThread(thread.id)}
            className={cn(
              "w-full text-left p-3 rounded-md text-sm transition-all group",
              "hover:bg-secondary/80",
              thread.id === activeThreadId
                ? "bg-secondary border border-primary/20 glow-primary"
                : "border border-transparent"
            )}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
              <span className="truncate text-sidebar-foreground">{thread.title}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 ml-5">
              {new Date(thread.createdAt).toLocaleDateString()}
            </p>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-glow" />
          Agent Online
        </div>
      </div>
    </div>
  );
}

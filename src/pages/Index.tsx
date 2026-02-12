import { useState } from "react";
import { PanelLeftClose, PanelLeft, Sun, Moon } from "lucide-react";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatPanel } from "@/components/ChatPanel";
import { useChat } from "@/hooks/use-chat";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Index = () => {
  const {
    threads,
    activeThreadId,
    messages,
    isStreaming,
    currentInterrupt,
    currentNode,
    createThread,
    selectThread,
    sendMessage,
    submitInterruptResponse,
  } = useChat();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Collapsible Sidebar */}
      <div
        className={cn(
          "shrink-0 transition-all duration-300 overflow-hidden border-r border-border",
          sidebarOpen ? "w-64" : "w-0"
        )}
      >
        <div className="w-64 h-full">
          <ChatSidebar
            threads={threads}
            activeThreadId={activeThreadId}
            onNewChat={createThread}
            onSelectThread={selectThread}
          />
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar with sidebar toggle + theme toggle */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-card">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen((v) => !v)}
            className="h-8 w-8"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="flex-1 min-h-0">
          <ChatPanel
            messages={messages}
            isStreaming={isStreaming}
            currentInterrupt={currentInterrupt}
            currentNode={currentNode}
            onSendMessage={sendMessage}
            onSubmitInterrupt={submitInterruptResponse}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;

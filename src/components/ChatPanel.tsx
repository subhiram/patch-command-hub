import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChatMessage, InterruptPayload } from "@/types/chat";
import { InterruptRenderer } from "@/components/InterruptRenderer";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  currentInterrupt: InterruptPayload | null;
  onSendMessage: (content: string) => void;
  onSubmitInterrupt: (response: any) => void;
}

export function ChatPanel({
  messages,
  isStreaming,
  currentInterrupt,
  onSendMessage,
  onSubmitInterrupt,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentInterrupt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    onSendMessage(input.trim());
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-6 py-3 border-b border-border flex items-center gap-2">
        <Bot className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Patch Agent</span>
        {isStreaming && (
          <span className="text-xs text-accent flex items-center gap-1 ml-auto">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processing
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-4 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1">
              Patching Command Center
            </h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Describe your patching objective and I'll orchestrate the process.
              I'll ask for your input at key decision points.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3 animate-fade-in",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {msg.role === "assistant" && (
              <div className="shrink-0 mt-1 h-7 w-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[75%] rounded-lg px-4 py-3 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-card-foreground"
              )}
            >
              <pre className="whitespace-pre-wrap font-sans text-sm">{msg.content}</pre>
            </div>
            {msg.role === "user" && (
              <div className="shrink-0 mt-1 h-7 w-7 rounded-md bg-secondary flex items-center justify-center">
                <User className="h-4 w-4 text-secondary-foreground" />
              </div>
            )}
          </div>
        ))}

        {/* Inline interrupt */}
        {currentInterrupt && currentInterrupt.type !== "selectable_table" && currentInterrupt.type !== "action_status" && (
          <div className="animate-fade-in">
            <InterruptRenderer interrupt={currentInterrupt} onSubmit={onSubmitInterrupt} />
          </div>
        )}

        {isStreaming && messages[messages.length - 1]?.content === "" && (
          <div className="flex gap-3 animate-fade-in">
            <div className="shrink-0 mt-1 h-7 w-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary animate-pulse-glow" />
            </div>
            <div className="bg-card border border-border rounded-lg px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={currentInterrupt ? "Respond to the prompt above..." : "Describe your patching task..."}
            disabled={isStreaming}
            className="flex-1 bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 disabled:opacity-50 transition-all"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isStreaming || !input.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

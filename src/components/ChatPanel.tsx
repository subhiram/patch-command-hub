import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChatMessage, InterruptContent } from "@/types/chat";
import { InterruptRenderer } from "@/components/InterruptRenderer";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  currentInterrupt: InterruptContent | null;
  currentNode: string | null;
  onSendMessage: (content: string) => void;
  onSubmitInterrupt: (response: any, summary?: any) => void;
}

export function ChatPanel({
  messages,
  isStreaming,
  currentInterrupt,
  currentNode,
  onSendMessage,
  onSubmitInterrupt,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Determine if the main input should act as the text_input responder
  const isTextInputInterrupt = currentInterrupt?.ui === "text_input";
  const inputDisabled = isStreaming || (!!currentInterrupt && !isTextInputInterrupt);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentInterrupt]);

  // Focus the input when a text_input interrupt activates
  useEffect(() => {
    if (isTextInputInterrupt) {
      inputRef.current?.focus();
    }
  }, [isTextInputInterrupt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || inputDisabled) return;

    if (isTextInputInterrupt) {
      // Respond to the text_input interrupt via the main input
      onSubmitInterrupt(input.trim());
    } else {
      onSendMessage(input.trim());
    }
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-6 py-3 border-b border-border flex items-center gap-2">
        <Bot className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Patch Agent</span>

        {/* Node stepper indicator */}
        {currentNode && (
          <div className="flex items-center gap-1.5 ml-auto bg-secondary/60 border border-border rounded-md px-2.5 py-1">
            <Activity className="h-3 w-3 text-accent animate-pulse-glow" />
            <span className="text-xs font-mono text-accent">{currentNode}</span>
          </div>
        )}

        {isStreaming && !currentNode && (
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
              {/* Selection summary (compact table) for user messages */}
              {msg.selectionSummary ? (
                <div className="space-y-1">
                  <span className="text-xs font-medium opacity-80">
                    {msg.selectionSummary.label}
                  </span>
                  <ul className="text-xs space-y-0.5 font-mono opacity-90">
                    {msg.selectionSummary.items.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap font-sans text-sm">
                  {msg.content}
                </pre>
              )}
            </div>

            {msg.role === "user" && (
              <div className="shrink-0 mt-1 h-7 w-7 rounded-md bg-secondary flex items-center justify-center">
                <User className="h-4 w-4 text-secondary-foreground" />
              </div>
            )}
          </div>
        ))}

        {/* Inline interrupt (shown only for yes_no, radio, etc. — NOT tables/action_status) */}
        {currentInterrupt &&
          currentInterrupt.ui !== "selectable_table" &&
          currentInterrupt.ui !== "multi-select" &&
          currentInterrupt.ui !== "action_status" &&
          currentInterrupt.ui !== "text_input" && (
            <div className="animate-fade-in">
              <InterruptRenderer
                interrupt={currentInterrupt}
                onSubmit={onSubmitInterrupt}
              />
            </div>
          )}

        {/* Streaming dots */}
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
        {/* Text-input interrupt hint */}
        {isTextInputInterrupt && (
          <p className="text-xs text-accent mb-2 px-1">
            ⌨ The agent needs your text input — type your response below.
          </p>
        )}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isTextInputInterrupt
                ? "Type your response to the agent..."
                : currentInterrupt
                  ? "Respond to the prompt above..."
                  : "Describe your patching task..."
            }
            disabled={inputDisabled}
            className={cn(
              "flex-1 bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 disabled:opacity-50 transition-all",
              isTextInputInterrupt && "ring-1 ring-accent/40 border-accent/40"
            )}
          />
          <Button
            type="submit"
            size="icon"
            disabled={inputDisabled || !input.trim()}
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

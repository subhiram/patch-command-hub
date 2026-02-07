import { useState, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import type { ChatMessage, ChatThread, InterruptPayload } from "@/types/chat";

const API_BASE = "http://localhost:8000";

export function useChat() {
  const [threads, setThreads] = useState<ChatThread[]>(() => {
    const saved = localStorage.getItem("chat_threads");
    return saved ? JSON.parse(saved) : [];
  });
  const [activeThreadId, setActiveThreadId] = useState<string | null>(() => {
    return localStorage.getItem("active_thread_id");
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentInterrupt, setCurrentInterrupt] = useState<InterruptPayload | null>(null);
  const [contextData, setContextData] = useState<InterruptPayload | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isFirstMessage = useRef(true);

  const persistThreads = (t: ChatThread[]) => {
    setThreads(t);
    localStorage.setItem("chat_threads", JSON.stringify(t));
  };

  const createThread = useCallback(() => {
    const id = uuidv4();
    const thread: ChatThread = {
      id,
      title: "New Patch Session",
      createdAt: new Date(),
      isActive: true,
    };
    const updated = threads.map((t) => ({ ...t, isActive: false }));
    persistThreads([thread, ...updated]);
    setActiveThreadId(id);
    localStorage.setItem("active_thread_id", id);
    setMessages([]);
    setCurrentInterrupt(null);
    setContextData(null);
    isFirstMessage.current = true;
    return id;
  }, [threads]);

  const selectThread = useCallback((id: string) => {
    setActiveThreadId(id);
    localStorage.setItem("active_thread_id", id);
    const updated = threads.map((t) => ({ ...t, isActive: t.id === id }));
    persistThreads(updated);
    // In a real app, you'd load messages from storage
    setMessages([]);
    setCurrentInterrupt(null);
    setContextData(null);
    isFirstMessage.current = true;
  }, [threads]);

  const parseSSEStream = useCallback(async (response: Response) => {
    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = "";
    let assistantMsgId = uuidv4();
    let accumulatedContent = "";

    // Add placeholder assistant message
    setMessages((prev) => [
      ...prev,
      { id: assistantMsgId, role: "assistant", content: "", timestamp: new Date() },
    ]);

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const raw = line.slice(5).trim();
          if (!raw) continue;

          try {
            const parsed = JSON.parse(raw);

            // Check for interrupt
            if (parsed.__interrupt__) {
              const interrupt: InterruptPayload = parsed.__interrupt__;
              setCurrentInterrupt(interrupt);

              // Show context data in right panel for tables/status
              if (interrupt.type === "selectable_table" || interrupt.type === "action_status") {
                setContextData(interrupt);
              }

              // Update assistant message with interrupt prompt
              if (interrupt.prompt) {
                accumulatedContent += (accumulatedContent ? "\n\n" : "") + interrupt.prompt;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: accumulatedContent, interrupt }
                      : m
                  )
                );
              }
              return; // Stop processing stream on interrupt
            }

            // Check for messages content
            if (parsed.messages) {
              const content = Array.isArray(parsed.messages)
                ? parsed.messages.map((m: any) => m.content || "").join("")
                : parsed.messages.content || "";
              if (content) {
                accumulatedContent += content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, content: accumulatedContent } : m
                  )
                );
              }
            }

            // Direct content string
            if (typeof parsed === "string") {
              accumulatedContent += parsed;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId ? { ...m, content: accumulatedContent } : m
                )
              );
            }
          } catch {
            // Non-JSON data line, treat as raw text
            accumulatedContent += raw;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, content: accumulatedContent } : m
              )
            );
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      let threadId = activeThreadId;
      if (!threadId) {
        threadId = createThread();
      }

      // Update thread title from first message
      if (isFirstMessage.current) {
        const title = content.slice(0, 40) + (content.length > 40 ? "..." : "");
        persistThreads(
          threads.map((t) => (t.id === threadId ? { ...t, title } : t))
        );
        isFirstMessage.current = false;
      }

      // Add user message
      const userMsg: ChatMessage = {
        id: uuidv4(),
        role: "user",
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);
      setCurrentInterrupt(null);

      try {
        abortRef.current = new AbortController();
        const isResume = messages.length > 1; // Has prior conversation
        const endpoint = isResume ? "graph/resume" : "graph/start";
        const url = `${API_BASE}/${endpoint}?thread_id=${threadId}&message=${encodeURIComponent(content)}`;

        const response = await fetch(url, {
          method: "POST",
          signal: abortRef.current.signal,
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        await parseSSEStream(response);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setMessages((prev) => [
            ...prev,
            {
              id: uuidv4(),
              role: "assistant",
              content: `⚠ Connection error: ${err.message}. Ensure the backend is running at ${API_BASE}.`,
              timestamp: new Date(),
            },
          ]);
        }
      } finally {
        setIsStreaming(false);
      }
    },
    [activeThreadId, messages, threads, createThread, parseSSEStream]
  );

  const submitInterruptResponse = useCallback(
    async (response: any) => {
      setCurrentInterrupt(null);
      await sendMessage(typeof response === "string" ? response : JSON.stringify(response));
    },
    [sendMessage]
  );

  return {
    threads,
    activeThreadId,
    messages,
    isStreaming,
    currentInterrupt,
    contextData,
    createThread,
    selectThread,
    sendMessage,
    submitInterruptResponse,
  };
}

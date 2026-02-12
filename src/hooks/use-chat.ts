import { useState, useCallback, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import type {
  ChatMessage,
  ChatThread,
  InterruptContent,
  SelectionSummary,
} from "@/types/chat";

const API_BASE = "http://localhost:8000";

export function useChat() {
  const [threads, setThreads] = useState<ChatThread[]>(() => {
    const saved = localStorage.getItem("chat_threads");
    return saved ? JSON.parse(saved) : [];
  });
  const [activeThreadId, setActiveThreadId] = useState<string | null>(() => {
    return localStorage.getItem("active_thread_id");
  });
  const activeThreadIdRef = useRef(activeThreadId);
  // Keep ref in sync
  useEffect(() => { activeThreadIdRef.current = activeThreadId; }, [activeThreadId]);
  const [messages, setMessagesRaw] = useState<ChatMessage[]>(() => {
    const tid = localStorage.getItem("active_thread_id");
    if (!tid) return [];
    const saved = localStorage.getItem(`chat_messages_${tid}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Wrapper that also persists messages to localStorage
  const setMessages: typeof setMessagesRaw = useCallback((update) => {
    setMessagesRaw((prev) => {
      const next = typeof update === "function" ? update(prev) : update;
      const tid = activeThreadIdRef.current;
      if (tid) localStorage.setItem(`chat_messages_${tid}`, JSON.stringify(next));
      return next;
    });
  }, []);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentInterrupt, setCurrentInterrupt] = useState<InterruptContent | null>(null);
  // contextData removed — all interrupts render inline in chat
  const [currentNode, setCurrentNode] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isFirstMessage = useRef(true);

  // ── Helpers ────────────────────────────────────────────────────────

  const persistThreads = useCallback((t: ChatThread[]) => {
    setThreads(t);
    localStorage.setItem("chat_threads", JSON.stringify(t));
  }, []);

  const createThread = useCallback(() => {
    const id = uuidv4();
    const thread: ChatThread = {
      id,
      title: "New Patch Session",
      createdAt: new Date(),
      isActive: true,
    };
    setThreads((prev) => {
      const updated = [thread, ...prev.map((t) => ({ ...t, isActive: false }))];
      localStorage.setItem("chat_threads", JSON.stringify(updated));
      return updated;
    });
    setActiveThreadId(id);
    activeThreadIdRef.current = id;
    localStorage.setItem("active_thread_id", id);
    setMessagesRaw([]);
    setCurrentInterrupt(null);
    setCurrentNode(null);
    isFirstMessage.current = true;
    return id;
  }, []);

  const selectThread = useCallback((id: string) => {
    setActiveThreadId(id);
    activeThreadIdRef.current = id;
    localStorage.setItem("active_thread_id", id);
    setThreads((prev) => {
      const updated = prev.map((t) => ({ ...t, isActive: t.id === id }));
      localStorage.setItem("chat_threads", JSON.stringify(updated));
      return updated;
    });
    // Load persisted messages for this thread
    const saved = localStorage.getItem(`chat_messages_${id}`);
    setMessagesRaw(saved ? JSON.parse(saved) : []);
    setCurrentInterrupt(null);
    setCurrentNode(null);
    isFirstMessage.current = false;
  }, []);

  // ── SSE stream parser ─────────────────────────────────────────────

  const parseSSEStream = useCallback(async (response: Response) => {
    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = "";
    const assistantMsgId = uuidv4();
    let accumulatedContent = "";

    // Placeholder assistant message
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

            // ── token event ──
            if (parsed.type === "token" && typeof parsed.content === "string") {
              accumulatedContent += parsed.content;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId ? { ...m, content: accumulatedContent } : m
                )
              );
            }

            // ── node_start event ──
            if (parsed.type === "node_start" && parsed.node) {
              setCurrentNode(parsed.node);
            }

            // ── interrupt event ──
            if (parsed.type === "interrupt" && parsed.content) {
              const interrupt: InterruptContent = parsed.content;
              setCurrentInterrupt(interrupt);

              // Show question in the assistant bubble
              if (interrupt.question) {
                accumulatedContent +=
                  (accumulatedContent ? "\n\n" : "") + interrupt.question;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: accumulatedContent }
                      : m
                  )
                );
              }

              return; // stop processing stream
            }
          } catch {
            // Non-JSON line — treat as raw text token
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
      setCurrentNode(null);
    }
  }, []);

  // ── Send a message (start or resume) ──────────────────────────────

  const callBackend = useCallback(
    async (threadId: string, payload: Record<string, any>) => {
      abortRef.current = new AbortController();
      const response = await fetch(`${API_BASE}/threads/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thread_id: threadId, ...payload }),
        signal: abortRef.current.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await parseSSEStream(response);
    },
    [parseSSEStream]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      let threadId = activeThreadId;
      if (!threadId) {
        threadId = createThread();
      }

      // Title from first message
      if (isFirstMessage.current) {
        const title = content.slice(0, 40) + (content.length > 40 ? "..." : "");
        setThreads((prev) => {
          const updated = prev.map((t) =>
            t.id === threadId ? { ...t, title } : t
          );
          localStorage.setItem("chat_threads", JSON.stringify(updated));
          return updated;
        });
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
        await callBackend(threadId, { input: content });
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
    [activeThreadId, createThread, callBackend]
  );

  // ── Submit response to an interrupt ───────────────────────────────

  const submitInterruptResponse = useCallback(
    async (response: any, summary?: SelectionSummary) => {
      const threadId = activeThreadId;
      if (!threadId) return;

      setCurrentInterrupt(null);

      // Show user response in chat with optional selection summary
      const userMsg: ChatMessage = {
        id: uuidv4(),
        role: "user",
        content: typeof response === "string" ? response : JSON.stringify(response),
        timestamp: new Date(),
        selectionSummary: summary,
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);

      try {
        await callBackend(threadId, { input: { __resume__: response } });
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setMessages((prev) => [
            ...prev,
            {
              id: uuidv4(),
              role: "assistant",
              content: `⚠ Connection error: ${err.message}.`,
              timestamp: new Date(),
            },
          ]);
        }
      } finally {
        setIsStreaming(false);
      }
    },
    [activeThreadId, callBackend]
  );

  return {
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
  };
}

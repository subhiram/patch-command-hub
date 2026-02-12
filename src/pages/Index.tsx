import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatPanel } from "@/components/ChatPanel";
import { useChat } from "@/hooks/use-chat";

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

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-64 shrink-0">
        <ChatSidebar
          threads={threads}
          activeThreadId={activeThreadId}
          onNewChat={createThread}
          onSelectThread={selectThread}
        />
      </div>

      {/* Chat Panel (full width) */}
      <div className="flex-1 min-w-0">
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
  );
};

export default Index;

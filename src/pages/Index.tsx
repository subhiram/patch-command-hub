import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatPanel } from "@/components/ChatPanel";
import { ContextWorkspace } from "@/components/ContextWorkspace";
import { useChat } from "@/hooks/use-chat";

const Index = () => {
  const {
    threads,
    activeThreadId,
    messages,
    isStreaming,
    currentInterrupt,
    contextData,
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

      {/* Center Chat */}
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

      {/* Right Context Workspace */}
      <div className="w-96 shrink-0">
        <ContextWorkspace
          contextData={contextData}
          onSubmitInterrupt={submitInterruptResponse}
        />
      </div>
    </div>
  );
};

export default Index;

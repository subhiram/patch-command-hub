import { Server, Activity, AlertCircle } from "lucide-react";
import type { InterruptContent, SelectionSummary } from "@/types/chat";
import { InterruptRenderer } from "@/components/InterruptRenderer";

interface ContextWorkspaceProps {
  contextData: InterruptContent | null;
  onSubmitInterrupt: (response: any, summary?: SelectionSummary) => void;
}

export function ContextWorkspace({ contextData, onSubmitInterrupt }: ContextWorkspaceProps) {
  return (
    <div className="flex flex-col h-full bg-background border-l border-border">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Activity className="h-4 w-4 text-accent" />
        <span className="text-sm font-medium text-foreground">Context Workspace</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {!contextData ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-3 rounded-full bg-secondary border border-border mb-3">
              <Server className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Structured data from the agent will appear here
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Tables, status dashboards, and logs
            </p>
          </div>
        ) : (
          <div className="animate-slide-in-right">
            <InterruptRenderer interrupt={contextData} onSubmit={onSubmitInterrupt} />
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <AlertCircle className="h-3 w-3" />
          <span>Backend: localhost:8000</span>
        </div>
      </div>
    </div>
  );
}

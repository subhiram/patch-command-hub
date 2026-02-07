import { useState } from "react";
import { CheckSquare, Square, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InterruptPayload } from "@/types/chat";
import { cn } from "@/lib/utils";

interface InterruptRendererProps {
  interrupt: InterruptPayload;
  onSubmit: (response: any) => void;
}

export function InterruptRenderer({ interrupt, onSubmit }: InterruptRendererProps) {
  switch (interrupt.type) {
    case "yes_no":
      return <YesNoInterrupt prompt={interrupt.prompt} onSubmit={onSubmit} />;
    case "text_input":
      return <TextInputInterrupt prompt={interrupt.prompt} onSubmit={onSubmit} />;
    case "selectable_table":
      return <SelectableTableInterrupt data={interrupt.data} prompt={interrupt.prompt} onSubmit={onSubmit} />;
    case "action_status":
      return <ActionStatusInterrupt data={interrupt.data} prompt={interrupt.prompt} onSubmit={onSubmit} />;
    default:
      return null;
  }
}

function YesNoInterrupt({ prompt, onSubmit }: { prompt?: string; onSubmit: (r: any) => void }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      {prompt && <p className="text-sm text-card-foreground">{prompt}</p>}
      <div className="flex gap-2">
        <Button
          onClick={() => onSubmit("yes")}
          className="bg-success/10 text-success border border-success/20 hover:bg-success/20"
          size="sm"
        >
          Yes, proceed
        </Button>
        <Button
          onClick={() => onSubmit("no")}
          variant="outline"
          className="border-destructive/20 text-destructive hover:bg-destructive/10"
          size="sm"
        >
          No, cancel
        </Button>
      </div>
    </div>
  );
}

function TextInputInterrupt({ prompt, onSubmit }: { prompt?: string; onSubmit: (r: any) => void }) {
  const [value, setValue] = useState("");
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      {prompt && <p className="text-sm text-card-foreground">{prompt}</p>}
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          placeholder="Type your response..."
        />
        <Button
          onClick={() => value.trim() && onSubmit(value.trim())}
          disabled={!value.trim()}
          size="sm"
          className="bg-primary text-primary-foreground"
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function SelectableTableInterrupt({
  data,
  prompt,
  onSubmit,
}: {
  data: any;
  prompt?: string;
  onSubmit: (r: any) => void;
}) {
  const columns: string[] = data?.columns || [];
  const rows: Record<string, any>[] = data?.rows || [];
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggle = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) =>
      prev.size === rows.length ? new Set() : new Set(rows.map((_, i) => i))
    );
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {prompt && (
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm text-card-foreground">{prompt}</p>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-3 py-2 text-left w-10">
                <button onClick={toggleAll} className="text-muted-foreground hover:text-foreground">
                  {selected.size === rows.length ? (
                    <CheckSquare className="h-4 w-4 text-primary" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
              </th>
              {columns.map((col) => (
                <th key={col} className="px-3 py-2 text-left font-medium text-muted-foreground uppercase text-xs tracking-wider">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={idx}
                onClick={() => toggle(idx)}
                className={cn(
                  "border-b border-border cursor-pointer transition-colors",
                  selected.has(idx) ? "bg-primary/5" : "hover:bg-secondary/30"
                )}
              >
                <td className="px-3 py-2">
                  {selected.has(idx) ? (
                    <CheckSquare className="h-4 w-4 text-primary" />
                  ) : (
                    <Square className="h-4 w-4 text-muted-foreground" />
                  )}
                </td>
                {columns.map((col) => (
                  <td key={col} className="px-3 py-2 text-card-foreground font-mono text-xs">
                    {String(row[col] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 border-t border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {selected.size} of {rows.length} selected
        </span>
        <Button
          onClick={() => onSubmit(Array.from(selected).map((i) => rows[i]))}
          disabled={selected.size === 0}
          size="sm"
          className="bg-primary text-primary-foreground"
        >
          Submit Selection
        </Button>
      </div>
    </div>
  );
}

function ActionStatusInterrupt({
  data,
  prompt,
  onSubmit,
}: {
  data: any;
  prompt?: string;
  onSubmit: (r: any) => void;
}) {
  const entries = data?.entries || [];

  const statusColor = (status: string) => {
    switch (status) {
      case "success": return "text-success";
      case "failed": return "text-destructive";
      case "running": return "text-accent";
      default: return "text-muted-foreground";
    }
  };

  const statusDot = (status: string) => {
    switch (status) {
      case "success": return "bg-success";
      case "failed": return "bg-destructive";
      case "running": return "bg-accent animate-pulse-glow";
      default: return "bg-muted-foreground";
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {prompt && (
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm text-card-foreground">{prompt}</p>
        </div>
      )}
      <div className="divide-y divide-border">
        {entries.map((entry: any, idx: number) => (
          <div key={idx} className="px-4 py-3 flex items-start gap-3">
            <div className={cn("h-2 w-2 rounded-full mt-1.5 shrink-0", statusDot(entry.status))} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-card-foreground font-mono">
                  {entry.computer_name}
                </span>
                <span className={cn("text-xs capitalize", statusColor(entry.status))}>
                  {entry.status}
                </span>
              </div>
              {entry.log && (
                <p className="text-xs text-muted-foreground font-mono mt-1 truncate">
                  {entry.log}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-border">
        <Button onClick={() => onSubmit("acknowledged")} size="sm" className="bg-primary text-primary-foreground">
          Acknowledge
        </Button>
      </div>
    </div>
  );
}

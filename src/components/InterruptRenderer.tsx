import { useState, useEffect, useCallback } from "react";
import { CheckSquare, Square, Send, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { InterruptContent, InterruptOption, SelectionSummary } from "@/types/chat";
import { cn } from "@/lib/utils";

interface InterruptRendererProps {
  interrupt: InterruptContent;
  onSubmit: (response: any, summary?: SelectionSummary) => void;
}

export function InterruptRenderer({ interrupt, onSubmit }: InterruptRendererProps) {
  switch (interrupt.ui) {
    case "yes_no":
      return <YesNoInterrupt question={interrupt.question} onSubmit={onSubmit} />;
    case "selectable_table":
    case "multi-select":
      return (
        <SelectableTableInterrupt
          question={interrupt.question}
          options={interrupt.options}
          columns={interrupt.columns}
          onSubmit={onSubmit}
        />
      );
    case "deployment_main_router":
    case "radio":
      return (
        <RadioInterrupt
          question={interrupt.question}
          options={interrupt.options}
          onSubmit={onSubmit}
        />
      );
    case "action_status":
      return (
        <ActionStatusInterrupt
          question={interrupt.question}
          options={interrupt.options}
          onSubmit={onSubmit}
        />
      );
    // text_input is handled by the main chat input — no component needed
    default:
      return null;
  }
}

// ── Yes / No ────────────────────────────────────────────────────────

function YesNoInterrupt({
  question,
  onSubmit,
}: {
  question: string;
  onSubmit: (r: any) => void;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      {question && <p className="text-sm text-card-foreground">{question}</p>}
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

// ── Selectable Table / Multi-select ─────────────────────────────────

function SelectableTableInterrupt({
  question,
  options,
  columns,
  onSubmit,
}: {
  question: string;
  options: InterruptOption[];
  columns?: string[];
  onSubmit: (r: any, summary?: SelectionSummary) => void;
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Derive visible column keys from first option or explicit columns prop
  const colKeys =
    columns ??
    (options.length > 0
      ? Object.keys(options[0]).filter((k) => k !== "__meta")
      : []);

  const toggle = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) =>
      prev.size === options.length
        ? new Set()
        : new Set(options.map((_, i) => i))
    );
  };

  const handleSubmit = () => {
    const selectedOptions = Array.from(selected).map((i) => options[i]);
    const ids = selectedOptions.map((o) => String(o.id)).join(",");
    const summary: SelectionSummary = {
      label: "Selected items",
      items: selectedOptions.map((o) => o.label ?? String(o.id)),
    };
    onSubmit(ids, summary);
  };

  const handleSkip = () => {
    onSubmit("skip", { label: "Skipped", items: ["—"] });
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {question && (
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm text-card-foreground">{question}</p>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-3 py-2 text-left w-10">
                <button
                  onClick={toggleAll}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {selected.size === options.length ? (
                    <CheckSquare className="h-4 w-4 text-primary" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
              </th>
              {colKeys.map((col) => (
                <th
                  key={col}
                  className="px-3 py-2 text-left font-medium text-muted-foreground uppercase text-xs tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {options.map((row, idx) => (
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
                {colKeys.map((col) => (
                  <td
                    key={col}
                    className="px-3 py-2 text-card-foreground font-mono text-xs"
                  >
                    {String((row as any)[col] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 border-t border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {selected.size} of {options.length} selected
        </span>
        <div className="flex gap-2">
          <Button
            onClick={handleSkip}
            variant="outline"
            size="sm"
            className="border-muted-foreground/30 text-muted-foreground hover:text-foreground"
          >
            <SkipForward className="h-3.5 w-3.5 mr-1" />
            Skip
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selected.size === 0}
            size="sm"
            className="bg-primary text-primary-foreground"
          >
            Submit Selection
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Radio / Deployment Main Router ──────────────────────────────────

function RadioInterrupt({
  question,
  options,
  onSubmit,
}: {
  question: string;
  options: InterruptOption[];
  onSubmit: (r: any, summary?: SelectionSummary) => void;
}) {
  const [value, setValue] = useState<string>("");

  const handleSubmit = () => {
    const selected = options.find((o) => String(o.id) === value);
    if (!selected) return;
    // Send the numeric id as the resume value
    onSubmit(selected.id, {
      label: "Selected",
      items: [selected.label],
    });
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      {question && <p className="text-sm text-card-foreground">{question}</p>}
      <RadioGroup value={value} onValueChange={setValue} className="space-y-2">
        {options.map((opt) => (
          <label
            key={String(opt.id)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md border cursor-pointer transition-colors",
              value === String(opt.id)
                ? "border-primary/40 bg-primary/5"
                : "border-border hover:bg-secondary/30"
            )}
          >
            <RadioGroupItem value={String(opt.id)} />
            <span className="text-sm text-card-foreground">{opt.label}</span>
          </label>
        ))}
      </RadioGroup>
      <Button
        onClick={handleSubmit}
        disabled={!value}
        size="sm"
        className="bg-primary text-primary-foreground"
      >
        <Send className="h-3.5 w-3.5 mr-1.5" />
        Confirm
      </Button>
    </div>
  );
}

// ── Action Status (auto-resumes) ────────────────────────────────────

function ActionStatusInterrupt({
  question,
  options,
  onSubmit,
}: {
  question: string;
  options: InterruptOption[];
  onSubmit: (r: any) => void;
}) {
  const [autoResumed, setAutoResumed] = useState(false);

  // Auto-resume after 3 seconds
  useEffect(() => {
    if (autoResumed) return;
    const timer = setTimeout(() => {
      setAutoResumed(true);
      onSubmit("acknowledged");
    }, 3000);
    return () => clearTimeout(timer);
  }, [autoResumed, onSubmit]);

  const statusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-success";
      case "failed":
        return "text-destructive";
      case "running":
        return "text-accent";
      default:
        return "text-muted-foreground";
    }
  };

  const statusDot = (status: string) => {
    switch (status) {
      case "success":
        return "bg-success";
      case "failed":
        return "bg-destructive";
      case "running":
        return "bg-accent animate-pulse-glow";
      default:
        return "bg-muted-foreground";
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {question && (
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm text-card-foreground">{question}</p>
        </div>
      )}
      <div className="divide-y divide-border">
        {options.map((entry: any, idx: number) => (
          <div key={idx} className="px-4 py-3 flex items-start gap-3">
            <div
              className={cn(
                "h-2 w-2 rounded-full mt-1.5 shrink-0",
                statusDot(entry.status ?? "pending")
              )}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-card-foreground font-mono">
                  {entry.label ?? entry.computer_name ?? entry.id}
                </span>
                <span
                  className={cn(
                    "text-xs capitalize",
                    statusColor(entry.status ?? "pending")
                  )}
                >
                  {entry.status ?? "pending"}
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
      <div className="px-4 py-3 border-t border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {autoResumed ? "Auto-resumed" : "Auto-resuming in 3s..."}
        </span>
        {!autoResumed && (
          <Button
            onClick={() => {
              setAutoResumed(true);
              onSubmit("acknowledged");
            }}
            size="sm"
            className="bg-primary text-primary-foreground"
          >
            Resume Now
          </Button>
        )}
      </div>
    </div>
  );
}

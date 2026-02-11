import { useState, useEffect } from "react";
import { CheckSquare, Square, Send, SkipForward, Rocket } from "lucide-react";
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
    case "render_yes_no_prompt":
      return <YesNoInterrupt question={interrupt.question} onSubmit={onSubmit} />;
    case "render_selectable_table":
      return (
        <SelectableTableInterrupt
          question={interrupt.question}
          options={interrupt.options}
          columns={interrupt.columns}
          onSubmit={onSubmit}
        />
      );
    case "deployment_main_router":
      return <DeploymentMainRouter question={interrupt.question} onSubmit={onSubmit} />;
    case "sub_deployment_router_component":
      return <SubDeploymentRouter question={interrupt.question} onSubmit={onSubmit} />;
    case "display_endpoints_for_deployment_component":
      return (
        <EndpointsForDeployment
          question={interrupt.question}
          options={interrupt.options}
          columns={interrupt.columns}
          onSubmit={onSubmit}
        />
      );
    case "display_action_status":
      return (
        <ActionStatusInterrupt
          question={interrupt.question}
          options={interrupt.options}
          onSubmit={onSubmit}
        />
      );
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

// ── Selectable Table (render_selectable_table) ──────────────────────

function findIdKey(row: Record<string, any>): string {
  const candidates = ["fixlet_id", "id", "Fixlet ID"];
  for (const c of candidates) {
    const match = Object.keys(row).find((k) => k.toLowerCase() === c.toLowerCase());
    if (match) return match;
  }
  return Object.keys(row)[0] ?? "id";
}

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

  const colKeys =
    columns ??
    (options.length > 0
      ? Object.keys(options[0]).filter((k) => k !== "__meta")
      : []);

  const idKey = options.length > 0 ? findIdKey(options[0] as any) : "id";

  const toggle = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) =>
      prev.size === options.length ? new Set() : new Set(options.map((_, i) => i))
    );
  };

  const handleSubmit = () => {
    const selectedOptions = Array.from(selected).map((i) => options[i]);
    const ids = selectedOptions.map((o) => String((o as any)[idKey] ?? o.id)).join(",");
    const summary: SelectionSummary = {
      label: "Selected items",
      items: selectedOptions.map((o) => o.label ?? String((o as any)[idKey] ?? o.id)),
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
                <button onClick={toggleAll} className="text-muted-foreground hover:text-foreground">
                  {selected.size === options.length ? (
                    <CheckSquare className="h-4 w-4 text-primary" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
              </th>
              {colKeys.map((col) => (
                <th key={col} className="px-3 py-2 text-left font-medium text-muted-foreground uppercase text-xs tracking-wider">
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
                  <td key={col} className="px-3 py-2 text-card-foreground font-mono text-xs">
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
          <Button onClick={handleSkip} variant="outline" size="sm" className="border-muted-foreground/30 text-muted-foreground hover:text-foreground">
            <SkipForward className="h-3.5 w-3.5 mr-1" />
            Skip
          </Button>
          <Button onClick={handleSubmit} disabled={selected.size === 0} size="sm" className="bg-primary text-primary-foreground">
            Submit Selection
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Deployment Main Router (hardcoded radio) ────────────────────────

const DEPLOYMENT_STRATEGIES = [
  { id: 1, label: "Create a Baseline" },
  { id: 2, label: "Create Server Automation plan" },
  { id: 3, label: "Deploy fixlets directly" },
];

function DeploymentMainRouter({
  question,
  onSubmit,
}: {
  question: string;
  onSubmit: (r: any, summary?: SelectionSummary) => void;
}) {
  const [value, setValue] = useState<string>("");

  const handleSubmit = () => {
    const selected = DEPLOYMENT_STRATEGIES.find((o) => String(o.id) === value);
    if (!selected) return;
    onSubmit(selected.id, { label: "Strategy", items: [selected.label] });
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      {question && <p className="text-sm text-card-foreground">{question}</p>}
      <RadioGroup value={value} onValueChange={setValue} className="space-y-2">
        {DEPLOYMENT_STRATEGIES.map((opt) => (
          <label
            key={opt.id}
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
      <Button onClick={handleSubmit} disabled={!value} size="sm" className="bg-primary text-primary-foreground">
        <Send className="h-3.5 w-3.5 mr-1.5" />
        Confirm
      </Button>
    </div>
  );
}

// ── Sub Deployment Router (device selection radio) ──────────────────

const SUB_DEPLOYMENT_OPTIONS = [
  { id: 1, label: "Select devices from the relevant endpoints" },
  { id: 2, label: "Enter device names directly" },
];

function SubDeploymentRouter({
  question,
  onSubmit,
}: {
  question: string;
  onSubmit: (r: any, summary?: SelectionSummary) => void;
}) {
  const [value, setValue] = useState<string>("");

  const handleSubmit = () => {
    const selected = SUB_DEPLOYMENT_OPTIONS.find((o) => String(o.id) === value);
    if (!selected) return;
    onSubmit(selected.id, { label: "Device selection", items: [selected.label] });
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      {question && <p className="text-sm text-card-foreground">{question}</p>}
      <RadioGroup value={value} onValueChange={setValue} className="space-y-2">
        {SUB_DEPLOYMENT_OPTIONS.map((opt) => (
          <label
            key={opt.id}
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
      <Button onClick={handleSubmit} disabled={!value} size="sm" className="bg-primary text-primary-foreground">
        <Send className="h-3.5 w-3.5 mr-1.5" />
        Confirm
      </Button>
    </div>
  );
}

// ── Endpoints for Deployment (selectable table + Deploy All) ────────

function EndpointsForDeployment({
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

  const colKeys =
    columns ??
    (options.length > 0
      ? Object.keys(options[0]).filter((k) => k !== "__meta")
      : []);

  const nameKey = options.length > 0
    ? (Object.keys(options[0]).find((k) => k.toLowerCase().includes("name") || k.toLowerCase().includes("computer")) ?? Object.keys(options[0])[0] ?? "label")
    : "label";

  const toggle = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) =>
      prev.size === options.length ? new Set() : new Set(options.map((_, i) => i))
    );
  };

  const handleSubmit = () => {
    const selectedOptions = Array.from(selected).map((i) => options[i]);
    const names = selectedOptions.map((o) => String((o as any)[nameKey] ?? o.label)).join(",");
    const summary: SelectionSummary = {
      label: "Selected endpoints",
      items: selectedOptions.map((o) => String((o as any)[nameKey] ?? o.label)),
    };
    onSubmit(names, summary);
  };

  const handleDeployAll = () => {
    onSubmit("all", {
      label: "Deploy on all",
      items: [`All ${options.length} endpoints`],
    });
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
                <button onClick={toggleAll} className="text-muted-foreground hover:text-foreground">
                  {selected.size === options.length ? (
                    <CheckSquare className="h-4 w-4 text-primary" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
              </th>
              {colKeys.map((col) => (
                <th key={col} className="px-3 py-2 text-left font-medium text-muted-foreground uppercase text-xs tracking-wider">
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
                  <td key={col} className="px-3 py-2 text-card-foreground font-mono text-xs">
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
          <Button onClick={handleDeployAll} variant="outline" size="sm" className="border-accent/30 text-accent hover:bg-accent/10">
            <Rocket className="h-3.5 w-3.5 mr-1" />
            Deploy on all
          </Button>
          <Button onClick={handleSubmit} disabled={selected.size === 0} size="sm" className="bg-primary text-primary-foreground">
            Submit Selection
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Action Status (read-only, auto-resumes) ─────────────────────────

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

  useEffect(() => {
    if (autoResumed) return;
    const timer = setTimeout(() => {
      setAutoResumed(true);
      onSubmit("dummy");
    }, 3000);
    return () => clearTimeout(timer);
  }, [autoResumed, onSubmit]);

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
      {question && (
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm text-card-foreground">{question}</p>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-3 py-2 text-left font-medium text-muted-foreground uppercase text-xs tracking-wider">Status</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground uppercase text-xs tracking-wider">Computer</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground uppercase text-xs tracking-wider">Log</th>
            </tr>
          </thead>
          <tbody>
            {options.map((entry: any, idx: number) => (
              <tr key={idx} className="border-b border-border">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full shrink-0", statusDot(entry.status ?? "pending"))} />
                    <span className={cn("text-xs capitalize", statusColor(entry.status ?? "pending"))}>
                      {entry.status ?? "pending"}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2 text-card-foreground font-mono text-xs">
                  {entry.label ?? entry.computer_name ?? entry.id}
                </td>
                <td className="px-3 py-2 text-muted-foreground font-mono text-xs truncate max-w-[200px]">
                  {entry.log ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 border-t border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {autoResumed ? "Auto-resumed ✓" : "Auto-resuming in 3s..."}
        </span>
        {!autoResumed && (
          <Button
            onClick={() => { setAutoResumed(true); onSubmit("dummy"); }}
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

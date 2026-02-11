export interface ChatThread {
  id: string;
  title: string;
  createdAt: Date;
  isActive: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  /** Optional structured summary rendered instead of raw text for user selections */
  selectionSummary?: SelectionSummary;
}

export interface SelectionSummary {
  label: string;
  items: string[];
}

// ── SSE event types coming from the backend ──────────────────────────

export type SSEEventType = "token" | "node_start" | "interrupt";

export interface SSETokenEvent {
  type: "token";
  content: string;
}

export interface SSENodeStartEvent {
  type: "node_start";
  node: string;
}

export interface SSEInterruptEvent {
  type: "interrupt";
  content: InterruptContent;
}

export type SSEEvent = SSETokenEvent | SSENodeStartEvent | SSEInterruptEvent;

// ── Interrupt payload ────────────────────────────────────────────────

export type InterruptUIType =
  | "render_selectable_table"
  | "render_yes_no_prompt"
  | "deployment_main_router"
  | "sub_deployment_router_component"
  | "display_endpoints_for_deployment_component"
  | "display_action_status"
  | "text_input";

export interface InterruptOption {
  id: string | number;
  label: string;
  [key: string]: any;
}

export interface InterruptContent {
  question: string;
  options: InterruptOption[];
  ui: InterruptUIType;
  /** Optional columns for table-based interrupts */
  columns?: string[];
}

export interface SelectableTableData {
  columns: string[];
  rows: Record<string, any>[];
}

export interface ActionStatusEntry {
  computer_name: string;
  status: "pending" | "running" | "success" | "failed";
  log: string;
}

/** Which interrupt UI types should be rendered in the right panel vs inline in chat */
export const RIGHT_PANEL_INTERRUPTS: InterruptUIType[] = [
  "render_selectable_table",
  "display_endpoints_for_deployment_component",
  "display_action_status",
];

/** Which interrupt UI types render inline in the chat stream */
export const INLINE_INTERRUPTS: InterruptUIType[] = [
  "render_yes_no_prompt",
  "deployment_main_router",
  "sub_deployment_router_component",
];

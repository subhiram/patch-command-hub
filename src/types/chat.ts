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
  interrupt?: InterruptPayload;
}

export type InterruptType = "selectable_table" | "yes_no" | "action_status" | "text_input";

export interface InterruptPayload {
  type: InterruptType;
  data: any;
  prompt?: string;
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

export type BackendHealthResponse = {
  status: string;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  role: string;
};

export type TicketStatus = "open" | "processing" | "waiting_customer" | "resolved" | "closed" | string;

export type TicketPriority = "low" | "normal" | "high" | "urgent";

export type TicketRecord = {
  id: number;
  ticketNo: string;
  title: string;
  status: TicketStatus;
  createdAt: string;
};

export type CreateTicketRequest = {
  title: string;
  description: string;
  ticketTypeId: number;
};

export type TicketActionResponse = {
  ok: boolean;
  status: string;
};

export type DemoDomain = {
  id: number;
  code: string;
  name: string;
  description: string;
  accent: string;
  supportLine: string;
};

export type DemoProfile = {
  customerId: number;
  nickname: string;
  phone: string;
  selectedDomainId: number;
};

export type AdminProfile = {
  username: string;
  selectedDomainId: number;
};

export type TicketMeta = {
  businessDomainId: number;
  customerId: number;
  ticketTypeId: number;
  priority: TicketPriority;
  description: string;
};

export type DemoTicket = TicketRecord & TicketMeta & {
  source: "web";
};

export type DashboardStats = {
  totalTickets: number;
  openTickets: number;
  processingTickets: number;
  waitingCustomerTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  urgentOpenTickets: number;
  openConsultationSessions: number;
};

export type ConsultationSessionSummary = {
  sessionNo: string;
  businessDomainId: number;
  customerId: number;
  sessionStatus: "open" | "processing" | "closed" | string;
  assignedTo?: number | null;
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
};

export type ConsultationMessage = {
  sessionNo: string;
  seqNo: number;
  senderRole: "customer" | "agent" | "system" | string;
  senderUserId?: number | null;
  content: string;
  createdAt: string;
};

export type SendConsultationMessagePayload = {
  businessDomainId: number;
  customerId: number;
  senderUserId?: number;
  sessionNo?: string;
  senderRole: "customer" | "agent";
  content: string;
};

export const DEMO_DOMAINS: DemoDomain[] = [
  {
    id: 1,
    code: "default",
    name: "默认业务域",
    description: "后端当前默认接入的演示业务域，适合展示工单创建和流转。",
    accent: "#6d5efc",
    supportLine: "07x-1000-1000"
  },
  {
    id: 2,
    code: "online-service",
    name: "在线客服域",
    description: "适合咨询接待、消息回访和快速工单创建。",
    accent: "#0f766e",
    supportLine: "07x-2000-2000"
  },
  {
    id: 3,
    code: "after-sales",
    name: "售后支持域",
    description: "适合演示售后处理、状态更新和复杂工单流转。",
    accent: "#1d4ed8",
    supportLine: "07x-3000-3000"
  }
];

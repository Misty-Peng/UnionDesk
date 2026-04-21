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
  sid: string;
  role: string;
  tokenType: string;
  expiresInSeconds: number;
  user: LoginUserView;
  accessibleDomains: BusinessDomainView[];
  defaultBusinessDomainId: number;
};

export type LoginConfig = {
  passwordLoginEnabled: boolean;
  usernameLoginEnabled: boolean;
  emailLoginEnabled: boolean;
  mobileLoginEnabled: boolean;
  captchaEnabled: boolean;
  wechatLoginEnabled: boolean;
  wechatLoginUrl?: string | null;
  wechatHint?: string | null;
  captchaHint?: string | null;
  sessionTtlSeconds: number;
  maxActiveSessionsPerUser: number;
  updatedAt?: string | null;
};

export type AuthSessionStatus = {
  authenticated: boolean;
  username?: string | null;
  role?: string | null;
  sid?: string | null;
  userId?: number | null;
  businessDomainId?: number | null;
  expiresAt?: string | null;
};

export type AuthSessionState = {
  username: string;
  accessToken: string;
  refreshToken: string;
  role: string;
  authenticatedAt: string;
  sid?: string | null;
  userId?: number | null;
  businessDomainId?: number | null;
  expiresAt?: string | null;
};

export type LoginUserView = {
  id: number;
  username: string;
  mobile?: string | null;
  email?: string | null;
  roles: string[];
};

export type BusinessDomainView = {
  id: number;
  code: string;
  name: string;
  visibilityPolicy?: string | null;
  status?: number | null;
};

export type UpdateLoginConfigRequest = {
  passwordLoginEnabled?: boolean;
  usernameLoginEnabled?: boolean;
  emailLoginEnabled?: boolean;
  mobileLoginEnabled?: boolean;
  captchaEnabled?: boolean;
  wechatLoginEnabled?: boolean;
  captchaHint?: string | null;
  wechatHint?: string | null;
  sessionTtlSeconds?: number;
  maxActiveSessionsPerUser?: number;
};

export type SessionView = {
  userId: number;
  role: string;
  businessDomainId?: number | null;
  sid: string;
};

export type OnlineSessionView = {
  sid: string;
  userId: number;
  username: string;
  mobile?: string | null;
  email?: string | null;
  role: string;
  businessDomainId?: number | null;
  loginIdentifierMasked: string;
  sessionStatus: string;
  issuedAt: string;
  expiresAt: string;
  lastSeenAt?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
};

export type LoginLogView = {
  id: number;
  sid?: string | null;
  userId?: number | null;
  username?: string | null;
  loginIdentifierMasked: string;
  loginIdentifierType: string;
  eventType: string;
  result: string;
  reason?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
  createdAt: string;
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

export type ApiResponse<T> = {
  success: boolean;
  code: string;
  message: string;
  data: T;
};

export type BusinessDomain = {
  id: number;
  code: string;
  name: string;
};

export type TicketSummary = {
  ticketNo: string;
  businessDomainId: number;
  title: string;
  status: string;
  priority: string;
  assignedTo?: number | null;
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
  sessionStatus: string;
  assignedTo?: number | null;
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
};

export type ConsultationMessage = {
  sessionNo: string;
  seqNo: number;
  senderRole: string;
  senderUserId?: number | null;
  content: string;
  createdAt: string;
};

export type CreateTicketPayload = {
  businessDomainId: number;
  customerId: number;
  ticketTypeId: number;
  title: string;
  description?: string;
  priority?: string;
};

export type SendConsultationMessagePayload = {
  businessDomainId: number;
  customerId: number;
  senderUserId?: number;
  sessionNo?: string;
  senderRole: "customer" | "agent";
  content: string;
};

export * from "./api";

import axios from "axios";
import type {
  ApiResponse,
  BusinessDomain,
  ConsultationMessage,
  ConsultationSessionSummary,
  CreateTicketPayload,
  DashboardStats,
  SendConsultationMessagePayload,
  TicketSummary
} from "./index";

const api = axios.create({
  baseURL: "/api/v1",
  timeout: 10000
});

api.interceptors.response.use(
  (response) => {
    if (response.data?.success === false) {
      return Promise.reject(new Error(response.data.message || "Request failed"));
    }
    return response;
  },
  (error) => Promise.reject(error)
);

export async function fetchDomains(): Promise<BusinessDomain[]> {
  const res = await api.get<ApiResponse<BusinessDomain[]>>("/domains");
  return res.data.data ?? [];
}

export async function fetchTickets(businessDomainId: number): Promise<TicketSummary[]> {
  const res = await api.get<ApiResponse<TicketSummary[]>>("/tickets", {
    params: { businessDomainId }
  });
  return res.data.data ?? [];
}

export async function createTicket(payload: CreateTicketPayload): Promise<string> {
  const res = await api.post<ApiResponse<{ ticketNo: string }>>("/tickets", payload);
  return res.data.data?.ticketNo ?? "";
}

export async function updateTicketStatus(ticketNo: string, businessDomainId: number, status: string): Promise<void> {
  await api.patch(`/tickets/${ticketNo}/status`, { businessDomainId, status });
}

export async function fetchDashboard(businessDomainId: number): Promise<DashboardStats> {
  const res = await api.get<ApiResponse<DashboardStats>>("/dashboard", {
    params: { businessDomainId }
  });
  return (
    res.data.data ?? {
      totalTickets: 0,
      openTickets: 0,
      processingTickets: 0,
      waitingCustomerTickets: 0,
      resolvedTickets: 0,
      closedTickets: 0,
      urgentOpenTickets: 0,
      openConsultationSessions: 0
    }
  );
}

export async function fetchConsultationSessions(
  businessDomainId: number,
  customerId?: number
): Promise<ConsultationSessionSummary[]> {
  const res = await api.get<ApiResponse<ConsultationSessionSummary[]>>("/consultations", {
    params: { businessDomainId, customerId }
  });
  return res.data.data ?? [];
}

export async function fetchConsultationMessages(sessionNo: string): Promise<ConsultationMessage[]> {
  const res = await api.get<ApiResponse<ConsultationMessage[]>>(`/consultations/${sessionNo}/messages`);
  return res.data.data ?? [];
}

export async function sendConsultationMessage(payload: SendConsultationMessagePayload): Promise<string> {
  const res = await api.post<ApiResponse<{ sessionNo: string }>>("/consultations/messages", payload);
  return res.data.data?.sessionNo ?? "";
}

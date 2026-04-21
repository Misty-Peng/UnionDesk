import axios from "axios";
import type {
  BackendHealthResponse,
  ConsultationMessage,
  ConsultationSessionSummary,
  CreateTicketRequest,
  DemoTicket,
  LoginRequest,
  LoginResponse,
  SendConsultationMessagePayload,
  TicketActionResponse,
  TicketRecord
} from "./types";
import {
  loadAdminProfile,
  loadAccessToken,
  listMessages,
  listSessions,
  mergeTickets,
  saveAdminProfile,
  saveAccessToken,
  saveMessage,
  saveTicketMeta,
  seedTicketMetaIfNeeded
} from "./storage";

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10_000
});

api.interceptors.request.use((config) => {
  const token = loadAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:8080/api/v1";
    }
  }
  return "/api/v1";
}

function toErrorMessage(error: unknown): Error {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as { message?: unknown } | undefined;
    const message = typeof responseData?.message === "string" ? responseData.message : error.message;
    return new Error(message);
  }
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}

function unwrapApiResponse<T>(payload: T | { success?: boolean; message?: string; data?: T }): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data?: T }).data as T;
  }
  return payload as T;
}

export async function fetchHealth(): Promise<BackendHealthResponse> {
  const response = await api.get<BackendHealthResponse>("/health");
  return unwrapApiResponse(response.data);
}

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  try {
    const response = await api.post<LoginResponse>("/auth/login", payload);
    const loginResponse = unwrapApiResponse(response.data);
    saveAccessToken(loginResponse.accessToken);
    saveAdminProfile({
      username: payload.username,
      selectedDomainId: loadAdminProfile().selectedDomainId
    });
    return loginResponse;
  } catch (error) {
    throw toErrorMessage(error);
  }
}

export async function fetchTickets(): Promise<DemoTicket[]> {
  try {
    const response = await api.get<TicketRecord[]>("/tickets");
    const records = unwrapApiResponse(response.data);
    seedTicketMetaIfNeeded(records.map((ticket: TicketRecord) => ({ ticketNo: ticket.ticketNo })));
    return mergeTickets(records);
  } catch (error) {
    throw toErrorMessage(error);
  }
}

export async function createTicket(payload: CreateTicketRequest): Promise<DemoTicket> {
  try {
    const response = await api.post<TicketRecord>("/tickets", payload);
    const ticket = unwrapApiResponse(response.data);
    seedTicketMetaIfNeeded([{ ticketNo: ticket.ticketNo }]);
    return mergeTickets([ticket])[0];
  } catch (error) {
    throw toErrorMessage(error);
  }
}

export async function markTicketProcessing(ticketId: number): Promise<TicketActionResponse> {
  try {
    const response = await api.post<TicketActionResponse>(`/tickets/${ticketId}/processing`);
    return unwrapApiResponse(response.data);
  } catch (error) {
    throw toErrorMessage(error);
  }
}

export async function markTicketResolved(ticketId: number): Promise<TicketActionResponse> {
  try {
    const response = await api.post<TicketActionResponse>(`/tickets/${ticketId}/resolved`);
    return unwrapApiResponse(response.data);
  } catch (error) {
    throw toErrorMessage(error);
  }
}

export function loadConsultationSessions(domainId: number, customerId?: number): ConsultationSessionSummary[] {
  return listSessions(domainId, customerId);
}

export function loadConsultationMessages(sessionNo: string): ConsultationMessage[] {
  return listMessages(sessionNo);
}

export function sendConsultationMessage(payload: SendConsultationMessagePayload): string {
  const session = saveMessage(payload);
  return session.sessionNo;
}

export { loadAdminProfile, saveAdminProfile, saveTicketMeta };

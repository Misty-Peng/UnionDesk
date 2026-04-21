import axios from "axios";
import type {
  BackendHealthResponse,
  AuthSessionStatus,
  ConsultationMessage,
  ConsultationSessionSummary,
  CreateTicketRequest,
  DemoTicket,
  LoginConfig,
  LoginRequest,
  LoginResponse,
  LoginLogView,
  OnlineSessionView,
  SessionView,
  UpdateLoginConfigRequest,
  SendConsultationMessagePayload,
  TicketActionResponse,
  TicketRecord
} from "./types";
import {
  clearAuthSession,
  loadAuthSession,
  loadAccessToken,
  listMessages,
  listSessions,
  mergeTickets,
  saveAccessToken,
  saveAuthSession,
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

const defaultLoginConfig: LoginConfig = {
  passwordLoginEnabled: true,
  usernameLoginEnabled: true,
  emailLoginEnabled: true,
  mobileLoginEnabled: true,
  captchaEnabled: false,
  wechatLoginEnabled: false,
  wechatLoginUrl: null,
  wechatHint: null,
  captchaHint: null,
  sessionTtlSeconds: 7 * 24 * 60 * 60,
  maxActiveSessionsPerUser: 10,
  updatedAt: null
};

const defaultSessionStatus: AuthSessionStatus = {
  authenticated: false,
  username: null,
  role: null,
  sid: null,
  userId: null,
  businessDomainId: null,
  expiresAt: null
};

export async function fetchHealth(): Promise<BackendHealthResponse> {
  const response = await api.get<BackendHealthResponse>("/health");
  return unwrapApiResponse(response.data);
}

export async function fetchLoginConfig(): Promise<LoginConfig> {
  try {
    const response = await api.get<LoginConfig>("/auth/login-config");
    return {
      ...defaultLoginConfig,
      ...unwrapApiResponse(response.data)
    };
  } catch {
    return defaultLoginConfig;
  }
}

export async function fetchSessionStatus(): Promise<AuthSessionStatus> {
  try {
    const response = await api.get<SessionView>("/auth/session");
    const session = unwrapApiResponse(response.data);
    const authSession = loadAuthSession();
    return {
      ...defaultSessionStatus,
      authenticated: true,
      username: authSession?.username ?? null,
      role: session.role,
      sid: session.sid,
      userId: session.userId,
      businessDomainId: session.businessDomainId
    };
  } catch {
    const authSession = loadAuthSession();
    return {
      ...defaultSessionStatus,
      authenticated: Boolean(loadAccessToken()),
      username: authSession?.username ?? null,
      role: authSession?.role ?? null,
      sid: authSession?.sid ?? null,
      userId: authSession?.userId ?? null,
      businessDomainId: authSession?.businessDomainId ?? null,
      expiresAt: authSession?.expiresAt ?? null
    };
  }
}

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  try {
    const response = await api.post<LoginResponse>("/auth/login", payload);
    const loginResponse = unwrapApiResponse(response.data);
    saveAuthSession({
      username: loginResponse.user?.username ?? payload.username,
      accessToken: loginResponse.accessToken,
      refreshToken: loginResponse.refreshToken,
      role: loginResponse.role,
      sid: loginResponse.sid,
      userId: loginResponse.user?.id ?? null,
      businessDomainId: loginResponse.defaultBusinessDomainId ?? null,
      expiresAt: new Date(Date.now() + loginResponse.expiresInSeconds * 1000).toISOString(),
      authenticatedAt: new Date().toISOString()
    });
    return loginResponse;
  } catch (error) {
    throw toErrorMessage(error);
  }
}

export async function updateLoginConfig(payload: UpdateLoginConfigRequest): Promise<LoginConfig> {
  try {
    const response = await api.put<LoginConfig>("/auth/login-config", payload);
    return {
      ...defaultLoginConfig,
      ...unwrapApiResponse(response.data)
    };
  } catch (error) {
    throw toErrorMessage(error);
  }
}

export async function fetchOnlineSessions(limit = 100): Promise<OnlineSessionView[]> {
  try {
    const response = await api.get<OnlineSessionView[]>("/auth/online-sessions", {
      params: { limit }
    });
    return unwrapApiResponse(response.data);
  } catch (error) {
    throw toErrorMessage(error);
  }
}

export async function revokeOnlineSession(sid: string): Promise<void> {
  try {
    await api.post(`/auth/online-sessions/${encodeURIComponent(sid)}/revoke`);
  } catch (error) {
    throw toErrorMessage(error);
  }
}

export async function revokeUserSessions(userId: number): Promise<void> {
  try {
    await api.post(`/auth/users/${userId}/revoke-sessions`);
  } catch (error) {
    throw toErrorMessage(error);
  }
}

export async function fetchLoginLogs(limit = 100): Promise<LoginLogView[]> {
  try {
    const response = await api.get<LoginLogView[]>("/auth/login-logs", {
      params: { limit }
    });
    return unwrapApiResponse(response.data);
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

export { clearAuthSession, saveTicketMeta };

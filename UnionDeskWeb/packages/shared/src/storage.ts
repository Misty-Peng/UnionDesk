import {
  DEMO_DOMAINS,
  type AdminProfile,
  type ConsultationMessage,
  type ConsultationSessionSummary,
  type DemoProfile,
  type DemoTicket,
  type TicketMeta
} from "./types";

const TICKET_META_KEY = "uniondesk.demo.ticket-meta";
const CONSULTATION_STATE_KEY = "uniondesk.demo.consultation-state";
const CUSTOMER_PROFILE_KEY = "uniondesk.demo.customer-profile";
const ADMIN_PROFILE_KEY = "uniondesk.demo.admin-profile";
const ACCESS_TOKEN_KEY = "uniondesk.auth.access-token";

const seedMeta: Record<string, TicketMeta> = {
  T202604190001: {
    businessDomainId: 1,
    customerId: 1,
    ticketTypeId: 1,
    priority: "normal",
    description: "Default seed ticket for the demo backend."
  }
};

type DemoConsultationState = {
  sessions: ConsultationSessionSummary[];
  messages: Record<string, ConsultationMessage[]>;
};

type TicketMetaStore = Record<string, TicketMeta>;

type StorageLike = Pick<Storage, "getItem" | "setItem">;

const memoryStore = new Map<string, string>();
const memoryStorage: StorageLike = {
  getItem(key: string) {
    return memoryStore.get(key) ?? null;
  },
  setItem(key: string, value: string) {
    memoryStore.set(key, value);
  }
};

function getStorage(): StorageLike {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  return memoryStorage;
}

function readJson<T>(key: string, fallback: T): T {
  const storage = getStorage();
  const raw = storage.getItem(key);
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  getStorage().setItem(key, JSON.stringify(value));
}

function nowIso(): string {
  return new Date().toISOString();
}

function seedConsultationState(): DemoConsultationState {
  const timestamp = nowIso();
  const sessions: ConsultationSessionSummary[] = DEMO_DOMAINS.map((domain, index) => {
    const sessionNo = `CS-${String(domain.id).padStart(2, "0")}-0001`;
    const createdAt = new Date(Date.now() - index * 15 * 60_000).toISOString();
    return {
      sessionNo,
      businessDomainId: domain.id,
      customerId: 1,
      sessionStatus: "open",
      assignedTo: 2,
      lastMessageAt: createdAt,
      lastMessagePreview: `${domain.name} support is online.`
    };
  });

  const messages: Record<string, ConsultationMessage[]> = Object.fromEntries(
    sessions.map((session, index) => [
      session.sessionNo,
      [
        {
          sessionNo: session.sessionNo,
          seqNo: 1,
          senderRole: "agent",
          senderUserId: 2,
          content: `${DEMO_DOMAINS[index].name} support is online.`,
          createdAt: timestamp
        }
      ]
    ])
  );

  return { sessions, messages };
}

function loadConsultationState(): DemoConsultationState {
  const state = readJson<DemoConsultationState | null>(CONSULTATION_STATE_KEY, null);
  if (state && Array.isArray(state.sessions) && state.messages) {
    return state;
  }
  const seeded = seedConsultationState();
  writeJson(CONSULTATION_STATE_KEY, seeded);
  return seeded;
}

function persistConsultationState(state: DemoConsultationState): void {
  writeJson(CONSULTATION_STATE_KEY, state);
}

function loadTicketMetaStore(): TicketMetaStore {
  const meta = readJson<TicketMetaStore | null>(TICKET_META_KEY, null);
  if (meta) {
    return { ...seedMeta, ...meta };
  }
  writeJson(TICKET_META_KEY, seedMeta);
  return { ...seedMeta };
}

function persistTicketMetaStore(store: TicketMetaStore): void {
  writeJson(TICKET_META_KEY, store);
}

function fallbackTicketMeta(ticketNo: string): TicketMeta {
  return loadTicketMetaStore()[ticketNo] ?? {
    businessDomainId: DEMO_DOMAINS[0].id,
    customerId: 1,
    ticketTypeId: 1,
    priority: "normal",
    description: ""
  };
}

function sortByLatest<T extends { lastMessageAt?: string | null; createdAt?: string }>(items: T[]): T[] {
  return [...items].sort((left, right) => {
    const leftTime = Date.parse(left.lastMessageAt ?? left.createdAt ?? "");
    const rightTime = Date.parse(right.lastMessageAt ?? right.createdAt ?? "");
    return rightTime - leftTime;
  });
}

export function getDemoDomains() {
  return DEMO_DOMAINS;
}

export function loadCustomerProfile(): DemoProfile {
  const profile = readJson<DemoProfile | null>(CUSTOMER_PROFILE_KEY, null);
  if (profile) {
    return profile;
  }
  const fallback: DemoProfile = {
    customerId: 1,
    nickname: "Demo Customer",
    phone: "13800000000",
    selectedDomainId: DEMO_DOMAINS[0].id
  };
  writeJson(CUSTOMER_PROFILE_KEY, fallback);
  return fallback;
}

export function saveCustomerProfile(profile: DemoProfile): DemoProfile {
  writeJson(CUSTOMER_PROFILE_KEY, profile);
  return profile;
}

export function loadAdminProfile(): AdminProfile {
  const profile = readJson<AdminProfile | null>(ADMIN_PROFILE_KEY, null);
  if (profile) {
    return profile;
  }
  const fallback: AdminProfile = {
    username: "admin",
    selectedDomainId: DEMO_DOMAINS[0].id
  };
  writeJson(ADMIN_PROFILE_KEY, fallback);
  return fallback;
}

export function saveAdminProfile(profile: AdminProfile): AdminProfile {
  writeJson(ADMIN_PROFILE_KEY, profile);
  return profile;
}

export function loadAccessToken(): string {
  return getStorage().getItem(ACCESS_TOKEN_KEY) ?? "";
}

export function saveAccessToken(token: string): string {
  const normalized = token.trim();
  if (normalized) {
    getStorage().setItem(ACCESS_TOKEN_KEY, normalized);
  } else {
    getStorage().setItem(ACCESS_TOKEN_KEY, "");
  }
  return normalized;
}

export function loadTicketMeta(ticketNo: string): TicketMeta {
  return fallbackTicketMeta(ticketNo);
}

export function saveTicketMeta(ticketNo: string, meta: TicketMeta): TicketMeta {
  const store = loadTicketMetaStore();
  store[ticketNo] = meta;
  persistTicketMetaStore(store);
  return meta;
}

export function saveTicketMetas(entries: Record<string, TicketMeta>): Record<string, TicketMeta> {
  const store = { ...loadTicketMetaStore(), ...entries };
  persistTicketMetaStore(store);
  return store;
}

export function mergeTicket(record: { id: number; ticketNo: string; title: string; status: string; createdAt: string }): DemoTicket {
  const meta = loadTicketMeta(record.ticketNo);
  return {
    ...record,
    ...meta,
    source: "web"
  };
}

export function mergeTickets(
  records: Array<{ id: number; ticketNo: string; title: string; status: string; createdAt: string }>
): DemoTicket[] {
  return records.map((record) => mergeTicket(record));
}

export function listSessions(domainId: number, customerId?: number): ConsultationSessionSummary[] {
  const state = loadConsultationState();
  const sessions = state.sessions.filter((session) => {
    const sameDomain = session.businessDomainId === domainId;
    const sameCustomer = customerId === undefined || session.customerId === customerId;
    return sameDomain && sameCustomer;
  });
  return sortByLatest(sessions);
}

export function listMessages(sessionNo: string): ConsultationMessage[] {
  const state = loadConsultationState();
  return [...(state.messages[sessionNo] ?? [])].sort((left, right) => left.seqNo - right.seqNo);
}

export function saveMessage(payload: {
  sessionNo?: string;
  businessDomainId: number;
  customerId: number;
  senderUserId?: number;
  senderRole: "customer" | "agent";
  content: string;
}): ConsultationSessionSummary {
  const state = loadConsultationState();
  const timestamp = nowIso();
  const existingSessionIndex = payload.sessionNo
    ? state.sessions.findIndex((session) => session.sessionNo === payload.sessionNo)
    : -1;
  let session: ConsultationSessionSummary;

  if (existingSessionIndex >= 0) {
    session = state.sessions[existingSessionIndex];
  } else {
    session = {
      sessionNo: `CS-${String(payload.businessDomainId).padStart(2, "0")}-${String(payload.customerId).padStart(4, "0")}-${Date.now().toString().slice(-4)}`,
      businessDomainId: payload.businessDomainId,
      customerId: payload.customerId,
      sessionStatus: "open",
      assignedTo: payload.senderRole === "agent" ? payload.senderUserId ?? 2 : 2,
      lastMessageAt: timestamp,
      lastMessagePreview: payload.content.slice(0, 80)
    };
    state.sessions.push(session);
  }

  const currentMessages = state.messages[session.sessionNo] ?? [];
  const nextSeq = (currentMessages.at(-1)?.seqNo ?? 0) + 1;
  currentMessages.push({
    sessionNo: session.sessionNo,
    seqNo: nextSeq,
    senderRole: payload.senderRole,
    senderUserId: payload.senderUserId ?? null,
    content: payload.content,
    createdAt: timestamp
  });

  if (payload.senderRole === "customer" && nextSeq === 1) {
    currentMessages.push({
      sessionNo: session.sessionNo,
      seqNo: nextSeq + 1,
      senderRole: "agent",
      senderUserId: 2,
      content: "We have received your message and will follow up soon.",
      createdAt: new Date(Date.now() + 60_000).toISOString()
    });
    session.sessionStatus = "processing";
    session.lastMessagePreview = "We have received your message and will follow up soon.";
    session.lastMessageAt = currentMessages.at(-1)?.createdAt ?? timestamp;
  } else {
    session.sessionStatus = payload.senderRole === "agent" ? "processing" : session.sessionStatus;
    session.lastMessagePreview = payload.content.slice(0, 80);
    session.lastMessageAt = timestamp;
  }

  state.messages[session.sessionNo] = currentMessages;
  const updatedSessionIndex = state.sessions.findIndex((item) => item.sessionNo === session.sessionNo);
  if (updatedSessionIndex >= 0) {
    state.sessions[updatedSessionIndex] = session;
  }
  persistConsultationState(state);
  return session;
}

export function seedTicketMetaIfNeeded(records: Array<{ ticketNo: string }>): void {
  const store = loadTicketMetaStore();
  let changed = false;
  for (const record of records) {
    if (!store[record.ticketNo]) {
      store[record.ticketNo] = fallbackTicketMeta(record.ticketNo);
      changed = true;
    }
  }
  if (changed) {
    persistTicketMetaStore(store);
  }
}

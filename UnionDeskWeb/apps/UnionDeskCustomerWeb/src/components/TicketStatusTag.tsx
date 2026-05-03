import { Tag } from "antd";
import type { CustomerPortalTicketStatus } from "@uniondesk/shared";

const statusMeta: Record<CustomerPortalTicketStatus, { color: string; label: string }> = {
  open: { color: "blue", label: "待受理" },
  processing: { color: "gold", label: "处理中" },
  waiting_customer: { color: "orange", label: "待补充" },
  resolved: { color: "green", label: "已解决" },
  closed: { color: "default", label: "已关闭" },
  withdrawn: { color: "default", label: "已撤回" }
};

export function getTicketStatusMeta(status?: string | null) {
  return statusMeta[(status as CustomerPortalTicketStatus) || "open"] ?? { color: "default", label: status ?? "未知" };
}

type TicketStatusTagProps = {
  status?: string | null;
};

export default function TicketStatusTag({ status }: TicketStatusTagProps) {
  const meta = getTicketStatusMeta(status);
  return <Tag color={meta.color}>{meta.label}</Tag>;
}


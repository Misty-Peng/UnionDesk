import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Drawer,
  Form,
  Input,
  Layout,
  List,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message
} from "antd";
import {
  fetchConsultationMessages,
  fetchConsultationSessions,
  fetchDashboard,
  fetchDomains,
  fetchTickets,
  sendConsultationMessage,
  updateTicketStatus,
  type BusinessDomain,
  type ConsultationMessage,
  type ConsultationSessionSummary,
  type DashboardStats,
  type TicketSummary
} from "@uniondesk/shared";

const { Header, Content } = Layout;
const AGENT_ID = 2;
const statusOptions = ["open", "processing", "waiting_customer", "resolved", "closed"];
const statusLabels: Record<string, string> = {
  open: "待受理",
  processing: "处理中",
  waiting_customer: "待客户反馈",
  resolved: "已解决",
  closed: "已关闭"
};

export default function App() {
  const [domains, setDomains] = useState<BusinessDomain[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState<number>();
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [dashboard, setDashboard] = useState<DashboardStats>();
  const [sessions, setSessions] = useState<ConsultationSessionSummary[]>([]);
  const [selectedSession, setSelectedSession] = useState<ConsultationSessionSummary>();
  const [messages, setMessages] = useState<ConsultationMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [replying, setReplying] = useState(false);
  const [replyForm] = Form.useForm();

  useEffect(() => {
    void init();
  }, []);

  useEffect(() => {
    if (selectedDomainId) {
      void refreshDomainData(selectedDomainId);
    }
  }, [selectedDomainId]);

  const pendingCount = useMemo(() => tickets.filter((ticket) => ticket.status !== "closed").length, [tickets]);

  async function init() {
    try {
      const data = await fetchDomains();
      setDomains(data);
      if (data.length > 0) {
        setSelectedDomainId(data[0].id);
      }
    } catch (err) {
      message.error(`加载业务域失败：${String(err)}`);
    }
  }

  async function refreshDomainData(businessDomainId: number) {
    try {
      setLoading(true);
      const [ticketData, dashboardData, sessionData] = await Promise.all([
        fetchTickets(businessDomainId),
        fetchDashboard(businessDomainId),
        fetchConsultationSessions(businessDomainId)
      ]);
      setTickets(ticketData);
      setDashboard(dashboardData);
      setSessions(sessionData);
      if (sessionData.length === 0) {
        setSelectedSession(undefined);
        setMessages([]);
        setDrawerOpen(false);
      }
    } catch (err) {
      message.error(`加载域数据失败：${String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function openSession(session: ConsultationSessionSummary) {
    setSelectedSession(session);
    setDrawerOpen(true);
    try {
      const data = await fetchConsultationMessages(session.sessionNo);
      setMessages(data);
    } catch (err) {
      message.error(`加载咨询详情失败：${String(err)}`);
    }
  }

  async function changeStatus(ticketNo: string, status: string) {
    if (!selectedDomainId) {
      return;
    }
    try {
      await updateTicketStatus(ticketNo, selectedDomainId, status);
      message.success(`工单 ${ticketNo} 已更新为 ${statusLabels[status] ?? status}`);
      await refreshDomainData(selectedDomainId);
    } catch (err) {
      message.error(`更新工单状态失败：${String(err)}`);
    }
  }

  async function onReply(values: { content: string }) {
    if (!selectedDomainId || !selectedSession) {
      return;
    }
    try {
      setReplying(true);
      await sendConsultationMessage({
        businessDomainId: selectedDomainId,
        customerId: selectedSession.customerId,
        senderUserId: AGENT_ID,
        senderRole: "agent",
        sessionNo: selectedSession.sessionNo,
        content: values.content
      });
      replyForm.resetFields();
      await openSession(selectedSession);
      await refreshDomainData(selectedDomainId);
    } catch (err) {
      message.error(`发送回复失败：${String(err)}`);
    } finally {
      setReplying(false);
    }
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          paddingInline: 24,
          background: "#0f172a"
        }}
      >
        <Space direction="vertical" size={0}>
          <Typography.Title level={4} style={{ margin: 0, color: "#fff" }}>
            UnionDesk 管理端
          </Typography.Title>
          <Typography.Text style={{ color: "rgba(255,255,255,0.65)" }}>
            工单处理、咨询跟进与域内服务概览
          </Typography.Text>
        </Space>
        <Select
          style={{ width: 320 }}
          value={selectedDomainId}
          onChange={setSelectedDomainId}
          options={domains.map((domain) => ({ label: `${domain.name} (${domain.code})`, value: domain.id }))}
        />
      </Header>
      <Content style={{ padding: 24 }}>
        <Space direction="vertical" style={{ width: "100%" }} size={16}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 16
            }}
          >
            <Card>
              <Statistic title="待处理工单" value={dashboard?.openTickets ?? pendingCount} />
            </Card>
            <Card>
              <Statistic title="处理中" value={dashboard?.processingTickets ?? 0} />
            </Card>
            <Card>
              <Statistic title="待客户反馈" value={dashboard?.waitingCustomerTickets ?? 0} />
            </Card>
            <Card>
              <Statistic title="高优先级预警" value={dashboard?.urgentOpenTickets ?? 0} valueStyle={{ color: "#cf1322" }} />
            </Card>
            <Card>
              <Statistic title="活跃咨询会话" value={dashboard?.openConsultationSessions ?? 0} suffix={<Badge status="processing" />} />
            </Card>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 16
            }}
          >
            <Card title="工单列表" extra={<Tag color="blue">{tickets.length} 条</Tag>}>
              <Table
                loading={loading}
                rowKey="ticketNo"
                scroll={{ x: 720 }}
                columns={[
                  { title: "工单号", dataIndex: "ticketNo", width: 190 },
                  { title: "标题", dataIndex: "title" },
                  {
                    title: "优先级",
                    dataIndex: "priority",
                    width: 110,
                    render: (value: string) => (
                      <Tag color={value === "high" || value === "urgent" ? "red" : value === "normal" ? "blue" : "default"}>
                        {value}
                      </Tag>
                    )
                  },
                  {
                    title: "状态",
                    dataIndex: "status",
                    width: 190,
                    render: (value: string, record: TicketSummary) => (
                      <Select
                        value={value}
                        style={{ width: 168 }}
                        options={statusOptions.map((status) => ({ value: status, label: statusLabels[status] ?? status }))}
                        onChange={(next) => void changeStatus(record.ticketNo, next)}
                      />
                    )
                  }
                ]}
                dataSource={tickets}
                pagination={{ pageSize: 8, showSizeChanger: false }}
              />
            </Card>

            <Card title="最近咨询" extra={<Tag color="purple">{sessions.length} 个会话</Tag>} styles={{ body: { paddingTop: 0 } }}>
              <List
                locale={{ emptyText: "暂无咨询会话" }}
                dataSource={sessions}
                renderItem={(session) => (
                  <List.Item style={{ paddingInline: 0 }}>
                    <Card size="small" hoverable style={{ width: "100%" }} onClick={() => void openSession(session)}>
                      <Space direction="vertical" size={4} style={{ width: "100%" }}>
                        <Typography.Text strong>{session.sessionNo}</Typography.Text>
                        <Typography.Text type="secondary">客户 #{session.customerId}</Typography.Text>
                        <Typography.Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0 }}>
                          {session.lastMessagePreview ?? "暂无消息预览"}
                        </Typography.Paragraph>
                        <ConsultationMeta session={session} />
                      </Space>
                    </Card>
                  </List.Item>
                )}
              />
            </Card>
          </div>
        </Space>
      </Content>

      <Drawer
        title={selectedSession ? `咨询详情 · ${selectedSession.sessionNo}` : "咨询详情"}
        width={460}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <List
            dataSource={messages}
            locale={{ emptyText: "暂无消息" }}
            renderItem={(item) => (
              <List.Item style={{ paddingInline: 0 }}>
                <Card
                  size="small"
                  bordered={false}
                  style={{
                    width: "100%",
                    background: item.senderRole === "agent" ? "#e8f3ff" : "#f6f8fb"
                  }}
                >
                  <Space direction="vertical" size={4}>
                    <Typography.Text strong>{item.senderRole === "agent" ? "客服" : "客户"}</Typography.Text>
                    <Typography.Paragraph style={{ margin: 0, whiteSpace: "pre-wrap" }}>{item.content}</Typography.Paragraph>
                    <Typography.Text type="secondary">{new Date(item.createdAt).toLocaleString()}</Typography.Text>
                  </Space>
                </Card>
              </List.Item>
            )}
          />

          {selectedSession && (
            <Form form={replyForm} layout="vertical" onFinish={onReply}>
              <Form.Item label="回复内容" name="content" rules={[{ required: true, message: "请输入回复内容" }]}>
                <Input.TextArea rows={4} placeholder="给客户一个清晰、可执行的下一步说明" />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={replying} block>
                发送回复
              </Button>
            </Form>
          )}
        </Space>
      </Drawer>
    </Layout>
  );
}

function ConsultationMeta({ session }: { session: ConsultationSessionSummary }) {
  return (
    <Space wrap size={[8, 8]}>
      <Tag color={session.sessionStatus === "open" ? "processing" : "default"}>{session.sessionStatus}</Tag>
      <Typography.Text type="secondary">
        {session.lastMessageAt ? new Date(session.lastMessageAt).toLocaleString() : "暂无时间"}
      </Typography.Text>
    </Space>
  );
}

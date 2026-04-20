import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Empty,
  Flex,
  Form,
  Input,
  Layout,
  List,
  Select,
  Space,
  Statistic,
  Tag,
  Typography,
  message
} from "antd";
import {
  createTicket,
  fetchConsultationMessages,
  fetchConsultationSessions,
  fetchDomains,
  fetchTickets,
  sendConsultationMessage,
  type BusinessDomain,
  type ConsultationMessage,
  type ConsultationSessionSummary,
  type CreateTicketPayload,
  type TicketSummary
} from "@uniondesk/shared";

const { Content } = Layout;
const CUSTOMER_ID = 1;
const ticketPriorityColors: Record<string, string> = {
  low: "default",
  normal: "blue",
  high: "orange",
  urgent: "red"
};
const ticketStatusLabels: Record<string, string> = {
  open: "待受理",
  processing: "处理中",
  waiting_customer: "待补充",
  resolved: "已解决",
  closed: "已关闭"
};

export default function App() {
  const [domains, setDomains] = useState<BusinessDomain[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState<number>();
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [sessions, setSessions] = useState<ConsultationSessionSummary[]>([]);
  const [selectedSessionNo, setSelectedSessionNo] = useState<string>();
  const [messages, setMessages] = useState<ConsultationMessage[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [ticketForm] = Form.useForm();
  const [chatForm] = Form.useForm();

  useEffect(() => {
    void initDomains();
  }, []);

  useEffect(() => {
    if (selectedDomainId) {
      void Promise.all([loadTickets(selectedDomainId), loadSessions(selectedDomainId)]);
    }
  }, [selectedDomainId]);

  useEffect(() => {
    if (selectedSessionNo) {
      void loadMessages(selectedSessionNo);
    } else {
      setMessages([]);
    }
  }, [selectedSessionNo]);

  const activeDomain = useMemo(
    () => domains.find((domain) => domain.id === selectedDomainId),
    [domains, selectedDomainId]
  );
  const openTickets = useMemo(() => tickets.filter((ticket) => ticket.status !== "closed").length, [tickets]);
  const urgentTickets = useMemo(
    () => tickets.filter((ticket) => ticket.priority === "high" || ticket.priority === "urgent").length,
    [tickets]
  );

  async function initDomains() {
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

  async function loadTickets(businessDomainId: number) {
    try {
      setTicketsLoading(true);
      const data = await fetchTickets(businessDomainId);
      setTickets(data);
    } catch (err) {
      message.error(`加载工单失败：${String(err)}`);
    } finally {
      setTicketsLoading(false);
    }
  }

  async function loadSessions(businessDomainId: number) {
    try {
      const data = await fetchConsultationSessions(businessDomainId, CUSTOMER_ID);
      setSessions(data);
      setSelectedSessionNo((current) => (current && data.some((item) => item.sessionNo === current) ? current : data[0]?.sessionNo));
    } catch (err) {
      message.error(`加载咨询记录失败：${String(err)}`);
    }
  }

  async function loadMessages(sessionNo: string) {
    try {
      setMessagesLoading(true);
      const data = await fetchConsultationMessages(sessionNo);
      setMessages(data);
    } catch (err) {
      message.error(`加载咨询消息失败：${String(err)}`);
    } finally {
      setMessagesLoading(false);
    }
  }

  async function onCreate(values: { title: string; description?: string; priority: string }) {
    if (!selectedDomainId) {
      message.warning("请先选择业务域。");
      return;
    }

    const payload: CreateTicketPayload = {
      businessDomainId: selectedDomainId,
      customerId: CUSTOMER_ID,
      ticketTypeId: 1,
      title: values.title,
      description: values.description,
      priority: values.priority
    };

    try {
      setCreatingTicket(true);
      const ticketNo = await createTicket(payload);
      message.success(`工单已创建：${ticketNo}`);
      ticketForm.resetFields();
      await loadTickets(selectedDomainId);
    } catch (err) {
      message.error(`创建工单失败：${String(err)}`);
    } finally {
      setCreatingTicket(false);
    }
  }

  async function onSendMessage(values: { content: string }) {
    if (!selectedDomainId) {
      message.warning("请先选择业务域。");
      return;
    }

    try {
      setSendingMessage(true);
      const sessionNo = await sendConsultationMessage({
        businessDomainId: selectedDomainId,
        customerId: CUSTOMER_ID,
        senderUserId: CUSTOMER_ID,
        senderRole: "customer",
        sessionNo: selectedSessionNo,
        content: values.content
      });
      chatForm.resetFields();
      await loadSessions(selectedDomainId);
      setSelectedSessionNo(sessionNo);
      await loadMessages(sessionNo);
    } catch (err) {
      message.error(`发送消息失败：${String(err)}`);
    } finally {
      setSendingMessage(false);
    }
  }

  return (
    <Layout style={{ minHeight: "100vh", background: "transparent" }}>
      <Content style={{ padding: "20px 16px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Card
            bordered={false}
            style={{
              overflow: "hidden",
              background: "linear-gradient(135deg, #6d5efc 0%, #8575ff 55%, #b29cff 100%)",
              color: "#fff",
              boxShadow: "0 24px 60px rgba(85, 75, 210, 0.24)"
            }}
            styles={{ body: { padding: 24 } }}
          >
            <Flex vertical gap={20}>
              <Flex justify="space-between" align="flex-start" wrap="wrap" gap={16}>
                <Space direction="vertical" size={6}>
                  <Tag color="rgba(255,255,255,0.22)" style={{ color: "#fff", border: "none", width: "fit-content" }}>
                    UnionDesk 客户工作台
                  </Tag>
                  <Typography.Title level={2} style={{ margin: 0, color: "#fff" }}>
                    更轻、更快地发起咨询与服务请求
                  </Typography.Title>
                  <Typography.Paragraph style={{ margin: 0, color: "rgba(255,255,255,0.82)", maxWidth: 560 }}>
                    当前版本支持咨询消息留痕、工单创建与进度查看，移动端也可以顺手使用。
                  </Typography.Paragraph>
                </Space>
                <div style={{ minWidth: 260, width: "min(100%, 320px)" }}>
                  <Typography.Text style={{ display: "block", color: "rgba(255,255,255,0.82)", marginBottom: 8 }}>
                    选择业务域
                  </Typography.Text>
                  <Select
                    size="large"
                    value={selectedDomainId}
                    onChange={setSelectedDomainId}
                    style={{ width: "100%" }}
                    options={domains.map((domain) => ({
                      label: `${domain.name} (${domain.code})`,
                      value: domain.id
                    }))}
                  />
                </div>
              </Flex>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 12
                }}
              >
                <Card bordered={false} style={{ background: "rgba(255,255,255,0.16)", color: "#fff" }}>
                  <Statistic title="当前业务域" value={activeDomain?.name ?? "-"} valueStyle={{ color: "#fff", fontSize: 20 }} />
                </Card>
                <Card bordered={false} style={{ background: "rgba(255,255,255,0.16)", color: "#fff" }}>
                  <Statistic title="进行中的工单" value={openTickets} valueStyle={{ color: "#fff" }} />
                </Card>
                <Card bordered={false} style={{ background: "rgba(255,255,255,0.16)", color: "#fff" }}>
                  <Statistic title="高优先级事项" value={urgentTickets} valueStyle={{ color: "#fff" }} />
                </Card>
                <Card bordered={false} style={{ background: "rgba(255,255,255,0.16)", color: "#fff" }}>
                  <Statistic title="咨询会话数" value={sessions.length} valueStyle={{ color: "#fff" }} />
                </Card>
              </div>
            </Flex>
          </Card>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 16,
              marginTop: 16
            }}
          >
            <Card
              title="在线咨询"
              bordered={false}
              style={{ minHeight: 580, boxShadow: "0 16px 44px rgba(15, 23, 42, 0.08)" }}
              extra={
                sessions.length > 0 ? (
                  <Select
                    value={selectedSessionNo}
                    onChange={setSelectedSessionNo}
                    style={{ width: 180 }}
                    options={sessions.map((session) => ({
                      label: session.sessionNo,
                      value: session.sessionNo
                    }))}
                  />
                ) : null
              }
            >
              <Flex vertical gap={16} style={{ height: "100%" }}>
                <div style={{ flex: 1, minHeight: 360, maxHeight: 420, overflowY: "auto", paddingRight: 4 }}>
                  {messages.length === 0 ? (
                    <Empty
                      description={messagesLoading ? "正在加载咨询记录..." : "还没有咨询记录，发送第一条消息开始吧。"}
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  ) : (
                    <Space direction="vertical" size={12} style={{ width: "100%" }}>
                      {messages.map((item) => {
                        const isCustomer = item.senderRole === "customer";
                        return (
                          <Flex key={`${item.sessionNo}-${item.seqNo}`} justify={isCustomer ? "flex-end" : "flex-start"}>
                            <Space align="start" size={10} style={{ maxWidth: "86%" }}>
                              {!isCustomer && <Avatar style={{ backgroundColor: "#0f766e" }}>客</Avatar>}
                              <Card
                                size="small"
                                bordered={false}
                                style={{
                                  background: isCustomer ? "#6d5efc" : "#f5f7fb",
                                  color: isCustomer ? "#fff" : "#152033",
                                  borderRadius: 18
                                }}
                              >
                                <Typography.Paragraph
                                  style={{
                                    margin: 0,
                                    whiteSpace: "pre-wrap",
                                    color: isCustomer ? "#fff" : "#152033"
                                  }}
                                >
                                  {item.content}
                                </Typography.Paragraph>
                                <Typography.Text
                                  style={{
                                    fontSize: 12,
                                    color: isCustomer ? "rgba(255,255,255,0.78)" : "#6b7280"
                                  }}
                                >
                                  {new Date(item.createdAt).toLocaleString()}
                                </Typography.Text>
                              </Card>
                              {isCustomer && <Avatar style={{ backgroundColor: "#4338ca" }}>我</Avatar>}
                            </Space>
                          </Flex>
                        );
                      })}
                    </Space>
                  )}
                </div>
                <Form form={chatForm} layout="vertical" onFinish={onSendMessage}>
                  <Form.Item
                    label="咨询内容"
                    name="content"
                    rules={[{ required: true, message: "请输入咨询内容" }]}
                    style={{ marginBottom: 12 }}
                  >
                    <Input.TextArea rows={4} placeholder="例如：支付失败、订单异常、产品使用问题等" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" loading={sendingMessage} block size="large">
                    发送消息
                  </Button>
                </Form>
              </Flex>
            </Card>

            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <Card
                title="快速创建工单"
                bordered={false}
                style={{ boxShadow: "0 16px 44px rgba(15, 23, 42, 0.08)" }}
              >
                <Form form={ticketForm} layout="vertical" onFinish={onCreate}>
                  <Form.Item label="工单标题" name="title" rules={[{ required: true, message: "请输入标题" }]}>
                    <Input placeholder="例如：无法登录后台 / 发票信息修改" />
                  </Form.Item>
                  <Form.Item label="问题描述" name="description">
                    <Input.TextArea rows={4} placeholder="补充问题现象、出现时间、影响范围等" />
                  </Form.Item>
                  <Form.Item label="优先级" name="priority" initialValue="normal">
                    <Select
                      options={[
                        { label: "低", value: "low" },
                        { label: "普通", value: "normal" },
                        { label: "高", value: "high" },
                        { label: "紧急", value: "urgent" }
                      ]}
                    />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" loading={creatingTicket} block size="large">
                    提交工单
                  </Button>
                </Form>
              </Card>

              <Card
                title="最近工单"
                bordered={false}
                style={{ boxShadow: "0 16px 44px rgba(15, 23, 42, 0.08)" }}
              >
                <List
                  loading={ticketsLoading}
                  locale={{ emptyText: "暂无工单" }}
                  dataSource={tickets}
                  renderItem={(item) => (
                    <List.Item style={{ paddingInline: 0 }}>
                      <Card size="small" style={{ width: "100%", borderRadius: 16 }}>
                        <Flex justify="space-between" align="start" gap={12}>
                          <Space direction="vertical" size={4}>
                            <Typography.Text strong>{item.title}</Typography.Text>
                            <Typography.Text type="secondary">{item.ticketNo}</Typography.Text>
                          </Space>
                          <Space wrap size={[8, 8]}>
                            <Tag color={ticketPriorityColors[item.priority] ?? "default"}>{item.priority}</Tag>
                            <Tag color={item.status === "closed" ? "default" : "processing"}>
                              {ticketStatusLabels[item.status] ?? item.status}
                            </Tag>
                          </Space>
                        </Flex>
                      </Card>
                    </List.Item>
                  )}
                />
              </Card>
            </Space>
          </div>
        </div>
      </Content>
    </Layout>
  );
}

import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Layout,
  List,
  Row,
  Select,
  Space,
  Statistic,
  Tag,
  Typography,
  message
} from "antd";
import {
  createTicket,
  fetchHealth,
  fetchTickets,
  getDemoDomains,
  loadConsultationMessages,
  loadConsultationSessions,
  loadCustomerProfile,
  saveCustomerProfile,
  saveTicketMeta,
  sendConsultationMessage,
  type ConsultationMessage,
  type ConsultationSessionSummary,
  type DemoDomain,
  type DemoProfile,
  type DemoTicket,
  type TicketPriority
} from "@uniondesk/shared";
import { loadAccessToken, login as sharedLogin } from "@uniondesk/shared";

const { Content } = Layout;

type CustomerProfileFormValues = {
  customerId: number;
  nickname: string;
  phone: string;
};

type TicketFormValues = {
  title: string;
  description: string;
  priority: TicketPriority;
};

type MessageFormValues = {
  content: string;
};

const priorityOptions: Array<{ label: string; value: TicketPriority }> = [
  { label: "低", value: "low" },
  { label: "普通", value: "normal" },
  { label: "高", value: "high" },
  { label: "紧急", value: "urgent" }
];

const priorityColors: Record<TicketPriority, string> = {
  low: "default",
  normal: "blue",
  high: "orange",
  urgent: "red"
};

const statusLabels: Record<string, string> = {
  open: "待处理",
  processing: "处理中",
  waiting_customer: "待客户回复",
  resolved: "已解决",
  closed: "已关闭"
};

export default function App() {
  const [domains] = useState<DemoDomain[]>(() => getDemoDomains());
  const [profile, setProfile] = useState<DemoProfile>(() => loadCustomerProfile());
  const [selectedDomainId, setSelectedDomainId] = useState<number>(profile.selectedDomainId);
  const [healthStatus, setHealthStatus] = useState("unknown");
  const [tickets, setTickets] = useState<DemoTicket[]>([]);
  const [sessions, setSessions] = useState<ConsultationSessionSummary[]>([]);
  const [selectedSessionNo, setSelectedSessionNo] = useState<string>();
  const [messages, setMessages] = useState<ConsultationMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [messageSubmitting, setMessageSubmitting] = useState(false);
  const [profileForm] = Form.useForm<CustomerProfileFormValues>();
  const [ticketForm] = Form.useForm<TicketFormValues>();
  const [messageForm] = Form.useForm<MessageFormValues>();

  useEffect(() => {
    void bootstrap();
  }, []);

  useEffect(() => {
    profileForm.setFieldsValue({
      customerId: profile.customerId,
      nickname: profile.nickname,
      phone: profile.phone
    });
  }, [profile, profileForm]);

  useEffect(() => {
    if (selectedDomainId) {
      void refreshWorkspace(selectedDomainId, profile.customerId);
    }
  }, [selectedDomainId, profile.customerId]);

  useEffect(() => {
    if (selectedSessionNo) {
      setMessages(loadConsultationMessages(selectedSessionNo));
    } else {
      setMessages([]);
    }
  }, [selectedSessionNo]);

  const activeDomain = useMemo(
    () => domains.find((domain) => domain.id === selectedDomainId) ?? domains[0],
    [domains, selectedDomainId]
  );
  const visibleTickets = useMemo(
    () => tickets.filter((ticket) => ticket.businessDomainId === selectedDomainId && ticket.customerId === profile.customerId),
    [tickets, selectedDomainId, profile.customerId]
  );
  const stats = useMemo(
    () => [
      { label: "我的工单", value: visibleTickets.length },
      { label: "进行中", value: visibleTickets.filter((ticket) => ticket.status !== "closed").length },
      { label: "紧急工单", value: visibleTickets.filter((ticket) => ticket.priority === "urgent").length },
      { label: "咨询会话", value: sessions.length }
    ],
    [sessions.length, visibleTickets]
  );

  async function bootstrap() {
    try {
      if (!loadAccessToken()) {
        await sharedLogin({ username: "customer", password: "customer123" });
      }
      const health = await fetchHealth();
      setHealthStatus(health.status);
    } catch {
      setHealthStatus("DOWN");
    }
  }

  async function refreshWorkspace(domainId: number, customerId: number) {
    try {
      setLoading(true);
      const [ticketData, sessionData] = await Promise.all([
        fetchTickets(),
        Promise.resolve(loadConsultationSessions(domainId, customerId))
      ]);
      setTickets(ticketData);
      setSessions(sessionData);
      setSelectedSessionNo((current) => {
        if (current && sessionData.some((session) => session.sessionNo === current)) {
          return current;
        }
        return sessionData[0]?.sessionNo;
      });
    } catch (error) {
      message.error(`加载客户工作台失败：${formatError(error)}`);
    } finally {
      setLoading(false);
    }
  }

  async function onSaveProfile(values: CustomerProfileFormValues) {
    const nextProfile: DemoProfile = {
      customerId: values.customerId,
      nickname: values.nickname,
      phone: values.phone,
      selectedDomainId
    };
    setProfile(nextProfile);
    saveCustomerProfile(nextProfile);
    message.success("客户身份已保存");
    await refreshWorkspace(selectedDomainId, nextProfile.customerId);
  }

  async function onCreateTicket(values: TicketFormValues) {
    try {
      setTicketSubmitting(true);
      const ticket = await createTicket({
        title: values.title,
        description: values.description,
        ticketTypeId: 1
      });
      saveTicketMeta(ticket.ticketNo, {
        businessDomainId: selectedDomainId,
        customerId: profile.customerId,
        ticketTypeId: 1,
        priority: values.priority,
        description: values.description
      });
      const sessionNo = sendConsultationMessage({
        businessDomainId: selectedDomainId,
        customerId: profile.customerId,
        senderRole: "customer",
        content: `I have created ticket ${ticket.ticketNo}: ${values.title}`
      });
      ticketForm.resetFields();
      message.success(`工单已创建：${ticket.ticketNo}`);
      await refreshWorkspace(selectedDomainId, profile.customerId);
      setSelectedSessionNo(sessionNo);
    } catch (error) {
      message.error(`创建工单失败：${formatError(error)}`);
    } finally {
      setTicketSubmitting(false);
    }
  }

  async function onSendMessage(values: MessageFormValues) {
    try {
      setMessageSubmitting(true);
      const sessionNo = sendConsultationMessage({
        businessDomainId: selectedDomainId,
        customerId: profile.customerId,
        sessionNo: selectedSessionNo,
        senderRole: "customer",
        content: values.content
      });
      messageForm.resetFields();
      await refreshWorkspace(selectedDomainId, profile.customerId);
      setSelectedSessionNo(sessionNo);
      setMessages(loadConsultationMessages(sessionNo));
      message.success("咨询消息已发送");
    } catch (error) {
      message.error(`发送咨询失败：${formatError(error)}`);
    } finally {
      setMessageSubmitting(false);
    }
  }

  return (
    <Layout style={{ minHeight: "100vh", background: "transparent" }}>
      <Content style={{ padding: "24px 16px 48px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <Card
            bordered={false}
            style={{
              overflow: "hidden",
              background: "linear-gradient(135deg, #6d5efc 0%, #8f7dff 48%, #bba8ff 100%)",
              color: "#fff",
              boxShadow: "0 28px 60px rgba(85, 75, 210, 0.22)"
            }}
            styles={{ body: { padding: 24 } }}
          >
            <Row gutter={[24, 24]} align="middle">
              <Col xs={24} lg={15}>
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  <Tag color="rgba(255,255,255,0.18)" style={{ color: "#fff", border: "none", width: "fit-content" }}>
                    UnionDesk 客户工作台
                  </Tag>
                  <Typography.Title level={2} style={{ margin: 0, color: "#fff" }}>
                    提交工单，开启咨询，把问题一次走通
                  </Typography.Title>
                  <Typography.Paragraph style={{ margin: 0, color: "rgba(255,255,255,0.82)", maxWidth: 640 }}>
                    这里已经接通真实后端的健康检查和工单 API，同时把业务域、咨询和客户身份做成了轻量 demo 状态，方便直接演示完整流程。
                  </Typography.Paragraph>
                  <Space wrap>
                    <Tag color="rgba(255,255,255,0.2)" style={{ color: "#fff", border: "none" }}>
                      后端健康：{healthStatus}
                    </Tag>
                    <Tag color="rgba(255,255,255,0.2)" style={{ color: "#fff", border: "none" }}>
                      当前身份：{profile.nickname} / #{profile.customerId}
                    </Tag>
                    <Tag color="rgba(255,255,255,0.2)" style={{ color: "#fff", border: "none" }}>
                      当前业务域：{activeDomain?.name ?? "-"}
                    </Tag>
                  </Space>
                </Space>
              </Col>
              <Col xs={24} lg={9}>
                <Card bordered={false} style={{ background: "rgba(255,255,255,0.16)", color: "#fff" }}>
                  <Space direction="vertical" size={12} style={{ width: "100%" }}>
                    <Typography.Text style={{ color: "rgba(255,255,255,0.88)" }}>业务域切换</Typography.Text>
                    <Select
                      size="large"
                      value={selectedDomainId}
                      onChange={(value) => {
                        setSelectedDomainId(value);
                        saveCustomerProfile({
                          ...profile,
                          selectedDomainId: value
                        });
                      }}
                      options={domains.map((domain) => ({
                        label: `${domain.name} (${domain.code})`,
                        value: domain.id
                      }))}
                    />
                    <Typography.Text style={{ color: "rgba(255,255,255,0.82)" }}>
                      {activeDomain?.description}
                    </Typography.Text>
                  </Space>
                </Card>
              </Col>
            </Row>
          </Card>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            {stats.map((item) => (
              <Col key={item.label} xs={12} lg={6}>
                <Card bordered={false} style={{ boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)" }}>
                  <Statistic title={item.label} value={item.value} />
                </Card>
              </Col>
            ))}
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={8}>
              <Card title="客户身份" bordered={false} style={{ boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)" }}>
                <Form layout="vertical" form={profileForm} initialValues={profile} onFinish={onSaveProfile}>
                  <Form.Item label="客户编号" name="customerId" rules={[{ required: true, message: "请输入客户编号" }]}>
                    <InputNumber min={1} step={1} style={{ width: "100%" }} />
                  </Form.Item>
                  <Form.Item label="客户昵称" name="nickname" rules={[{ required: true, message: "请输入昵称" }]}>
                    <Input placeholder="例如：Demo Customer" />
                  </Form.Item>
                  <Form.Item label="联系方式" name="phone" rules={[{ required: true, message: "请输入联系方式" }]}>
                    <Input placeholder="例如：13800000000" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" block>
                    保存身份
                  </Button>
                </Form>
              </Card>
            </Col>

            <Col xs={24} lg={16}>
              <Card title="快速创建工单" bordered={false} style={{ boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)" }}>
                <Form form={ticketForm} layout="vertical" onFinish={onCreateTicket}>
                  <Row gutter={16}>
                    <Col xs={24} lg={12}>
                      <Form.Item label="工单标题" name="title" rules={[{ required: true, message: "请输入工单标题" }]}>
                        <Input placeholder="例如：登录后无法提交工单" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} lg={12}>
                      <Form.Item label="优先级" name="priority" initialValue="normal">
                        <Select options={priorityOptions} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item label="问题描述" name="description" rules={[{ required: true, message: "请输入问题描述" }]}>
                    <Input.TextArea rows={4} placeholder="写清楚发生时间、影响范围和你希望的处理结果。" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" loading={ticketSubmitting}>
                    创建工单并发送咨询
                  </Button>
                </Form>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={12}>
              <Card title="我的工单" bordered={false} loading={loading} style={{ boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)" }}>
                <List
                  locale={{ emptyText: "当前业务域下还没有我的工单" }}
                  dataSource={visibleTickets}
                  renderItem={(ticket) => (
                    <List.Item style={{ paddingInline: 0 }}>
                      <Card size="small" style={{ width: "100%", borderRadius: 16 }} bordered>
                        <Space direction="vertical" size={8} style={{ width: "100%" }}>
                          <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
                            <Space direction="vertical" size={2}>
                              <Typography.Text strong>{ticket.title}</Typography.Text>
                              <Typography.Text type="secondary">{ticket.ticketNo}</Typography.Text>
                            </Space>
                            <Space wrap>
                              <Tag color={priorityColors[ticket.priority] ?? "default"}>{ticket.priority}</Tag>
                              <Tag color={ticket.status === "closed" ? "default" : "processing"}>
                                {statusLabels[ticket.status] ?? ticket.status}
                              </Tag>
                            </Space>
                          </Space>
                          <Typography.Text type="secondary">业务域 #{ticket.businessDomainId} · 客户 #{ticket.customerId}</Typography.Text>
                        </Space>
                      </Card>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card
                title="咨询会话"
                bordered={false}
                style={{ boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)" }}
                extra={
                  sessions.length > 0 ? (
                    <Select
                      value={selectedSessionNo}
                      onChange={setSelectedSessionNo}
                      style={{ width: 240 }}
                      options={sessions.map((session) => ({
                        label: session.sessionNo,
                        value: session.sessionNo
                      }))}
                    />
                  ) : null
                }
              >
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                  <div style={{ minHeight: 340, maxHeight: 360, overflowY: "auto", paddingRight: 4 }}>
                    {messages.length === 0 ? (
                      <Empty description="当前没有消息，先创建一条咨询吧。" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    ) : (
                      <Space direction="vertical" size={12} style={{ width: "100%" }}>
                        {messages.map((item) => {
                          const isCustomer = item.senderRole === "customer";
                          return (
                            <div key={`${item.sessionNo}-${item.seqNo}`} style={{ display: "flex", justifyContent: isCustomer ? "flex-end" : "flex-start" }}>
                              <Space align="start" size={10} style={{ maxWidth: "88%" }}>
                                {!isCustomer && <Avatar style={{ backgroundColor: "#0f766e" }}>客</Avatar>}
                                <Card
                                  size="small"
                                  bordered={false}
                                  style={{
                                    background: isCustomer ? "#6d5efc" : "#f4f7fb",
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
                                  <Typography.Text style={{ fontSize: 12, color: isCustomer ? "rgba(255,255,255,0.8)" : "#667085" }}>
                                    {new Date(item.createdAt).toLocaleString()}
                                  </Typography.Text>
                                </Card>
                                {isCustomer && <Avatar style={{ backgroundColor: "#4338ca" }}>我</Avatar>}
                              </Space>
                            </div>
                          );
                        })}
                      </Space>
                    )}
                  </div>

                  <Form form={messageForm} layout="vertical" onFinish={onSendMessage}>
                    <Form.Item label="补充咨询" name="content" rules={[{ required: true, message: "请输入咨询内容" }]} style={{ marginBottom: 12 }}>
                      <Input.TextArea rows={4} placeholder="例如：请帮我确认工单是否已经进入处理队列。" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={messageSubmitting} block>
                      发送咨询
                    </Button>
                  </Form>
                </Space>
              </Card>
            </Col>
          </Row>
        </div>
      </Content>
    </Layout>
  );
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

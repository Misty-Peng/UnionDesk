import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Drawer,
  Empty,
  Form,
  Input,
  Layout,
  List,
  Row,
  Slider,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message
} from "antd";
import {
  fetchLoginConfig,
  fetchSessionStatus,
  fetchHealth,
  fetchTickets,
  getDemoDomains,
  loadAuthSession,
  loadAccessToken,
  loadAdminProfile,
  loadConsultationMessages,
  loadConsultationSessions,
  login,
  markTicketProcessing,
  markTicketResolved,
  saveAdminProfile,
  sendConsultationMessage,
  type AuthSessionStatus,
  type LoginConfig,
  type LoginResponse,
  type ConsultationMessage,
  type ConsultationSessionSummary,
  type DemoDomain,
  type DemoTicket,
  type TicketPriority
} from "@uniondesk/shared";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { LoginManagementPanel } from "./LoginManagementPanel";

const { Header, Content } = Layout;

const statusLabels: Record<string, string> = {
  open: "待处理",
  processing: "处理中",
  waiting_customer: "待客户回复",
  resolved: "已解决",
  closed: "已关闭"
};

const priorityColors: Record<TicketPriority, string> = {
  low: "default",
  normal: "blue",
  high: "orange",
  urgent: "red"
};

type ReplyFormValues = {
  content: string;
};

type AdminBootstrapState = {
  loginConfig: LoginConfig;
  session: AuthSessionStatus;
};

type AdminLoginPageProps = {
  loginConfig: LoginConfig;
  onAuthenticated: (session: AuthSessionStatus) => void;
};

function AdminLoadingScreen() {
  return (
    <Layout style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <Card bordered={false} style={{ minWidth: 320, textAlign: "center", boxShadow: "0 20px 48px rgba(15, 23, 42, 0.12)" }}>
        <Space direction="vertical" size={12}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            正在检查登录状态
          </Typography.Title>
          <Typography.Text type="secondary">加载登录配置与会话状态...</Typography.Text>
        </Space>
      </Card>
    </Layout>
  );
}

function AdminLoginPage({ loginConfig, onAuthenticated }: AdminLoginPageProps) {
  const navigate = useNavigate();
  const [form] = Form.useForm<{ username: string; password: string; captchaProgress: number }>();
  const [submitting, setSubmitting] = useState(false);
  const [wechatLoading, setWechatLoading] = useState(false);
  const adminProfile = loadAdminProfile();

  async function handleFinish(values: { username: string; password: string; captchaProgress: number }) {
    if (loginConfig.captchaEnabled && values.captchaProgress < 100) {
      message.error("请先完成滑块验证码");
      return;
    }
    try {
      setSubmitting(true);
      const result = await login({ username: values.username, password: values.password });
      const nextProfile = {
        username: values.username,
        selectedDomainId: adminProfile.selectedDomainId
      };
      saveAdminProfile(nextProfile);
      onAuthenticated({
        authenticated: true,
        username: values.username,
        role: result.role,
        expiresAt: null
      });
      message.success("登录成功");
      navigate("/", { replace: true });
    } catch (error) {
      message.error(`登录失败：${formatError(error)}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleWechatLogin() {
    if (!loginConfig.wechatLoginEnabled) {
      return;
    }
    setWechatLoading(true);
    try {
      if (loginConfig.wechatLoginUrl) {
        window.open(loginConfig.wechatLoginUrl, "_blank", "noopener,noreferrer");
      } else {
        message.info(loginConfig.wechatHint ?? "微信登录入口已启用，等待后端接入二维码或重定向地址。");
      }
    } finally {
      setWechatLoading(false);
    }
  }

  return (
    <Layout
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(15, 118, 110, 0.18), transparent 28%), linear-gradient(135deg, #f7fbfb 0%, #eef7f6 100%)"
      }}
    >
      <Content style={{ padding: 24 }}>
        <Row gutter={[24, 24]} style={{ minHeight: "calc(100vh - 48px)" }} align="middle">
          <Col xs={24} lg={14}>
            <Space direction="vertical" size={18} style={{ maxWidth: 720 }}>
              <Tag color="green" style={{ width: "fit-content", border: "none" }}>
                UnionDesk 管理入口
              </Tag>
              <Typography.Title level={1} style={{ margin: 0, maxWidth: 620 }}>
                先登录，再进入工单流转和咨询处理工作台
              </Typography.Title>
              <Typography.Paragraph style={{ marginBottom: 0, fontSize: 16, color: "#475467", maxWidth: 620 }}>
                账号密码登录是入口，登录后进入管理工作台。微信登录与滑块验证码是否展示，由共享配置和后端会话状态共同决定。
              </Typography.Paragraph>
              <Space wrap>
                <Card size="small" bordered={false} style={{ background: "#fff", borderRadius: 16, boxShadow: "0 12px 32px rgba(15, 23, 42, 0.08)" }}>
                  <Space direction="vertical" size={2}>
                    <Typography.Text type="secondary">工单</Typography.Text>
                    <Typography.Text strong>流转、分配、处置</Typography.Text>
                  </Space>
                </Card>
                <Card size="small" bordered={false} style={{ background: "#fff", borderRadius: 16, boxShadow: "0 12px 32px rgba(15, 23, 42, 0.08)" }}>
                  <Space direction="vertical" size={2}>
                    <Typography.Text type="secondary">会话</Typography.Text>
                    <Typography.Text strong>咨询处理与回复</Typography.Text>
                  </Space>
                </Card>
                <Card size="small" bordered={false} style={{ background: "#fff", borderRadius: 16, boxShadow: "0 12px 32px rgba(15, 23, 42, 0.08)" }}>
                  <Space direction="vertical" size={2}>
                    <Typography.Text type="secondary">权限</Typography.Text>
                    <Typography.Text strong>域切换与登录态控制</Typography.Text>
                  </Space>
                </Card>
              </Space>
            </Space>
          </Col>

          <Col xs={24} lg={10}>
            <Card
              bordered={false}
              style={{
                boxShadow: "0 28px 60px rgba(12, 74, 110, 0.16)",
                borderRadius: 24,
                overflow: "hidden",
                background: "rgba(255,255,255,0.96)"
              }}
            >
              <Space direction="vertical" size={18} style={{ width: "100%" }}>
                <div>
                  <Typography.Title level={3} style={{ marginBottom: 8 }}>
                    账号密码登录
                  </Typography.Title>
                  <Typography.Text type="secondary">
                    {loginConfig.captchaEnabled ? loginConfig.captchaHint ?? "拖动滑块后继续登录" : "使用账号和密码直接进入管理工作台"}
                  </Typography.Text>
                </div>

                <Form
                  form={form}
                  layout="vertical"
                  initialValues={{ username: adminProfile.username, password: "admin123", captchaProgress: 0 }}
                  onFinish={handleFinish}
                >
                  <Form.Item label="账号" name="username" rules={[{ required: true, message: "请输入账号" }]}>
                    <Input size="large" placeholder="admin" autoComplete="username" />
                  </Form.Item>
                  <Form.Item label="密码" name="password" rules={[{ required: true, message: "请输入密码" }]}>
                    <Input.Password size="large" placeholder="admin123" autoComplete="current-password" />
                  </Form.Item>
                  {loginConfig.captchaEnabled && (
                    <Form.Item
                      label={loginConfig.captchaHint ?? "滑块验证码"}
                      name="captchaProgress"
                      rules={[
                        {
                          validator: async (_, value: number | undefined) => {
                            if ((value ?? 0) < 100) {
                              throw new Error("请拖动滑块到最右侧完成验证");
                            }
                          }
                        }
                      ]}
                    >
                      <Slider min={0} max={100} />
                    </Form.Item>
                  )}
                  <Button type="primary" htmlType="submit" loading={submitting} size="large" block>
                    登录并进入工作台
                  </Button>
                </Form>

                {loginConfig.wechatLoginEnabled && (
                  <Card
                    bordered
                    size="small"
                    style={{ borderRadius: 16, background: "linear-gradient(180deg, #f5fffd 0%, #edfaf8 100%)" }}
                    bodyStyle={{ padding: 16 }}
                  >
                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                      <Typography.Text strong>微信登录</Typography.Text>
                      <Typography.Text type="secondary">
                        {loginConfig.wechatHint ?? "使用微信扫码进入管理工作台。"}
                      </Typography.Text>
                      <Button loading={wechatLoading} onClick={() => void handleWechatLogin()} block>
                        打开微信登录入口
                      </Button>
                    </Space>
                  </Card>
                )}
              </Space>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}

export default function App() {
  const [bootstrap, setBootstrap] = useState<AdminBootstrapState | null>(null);

  useEffect(() => {
    let active = true;
    void bootstrapAuth();
    return () => {
      active = false;
    };

    async function bootstrapAuth() {
      try {
        const [loginConfig, session] = await Promise.all([fetchLoginConfig(), fetchSessionStatus()]);
        if (active) {
          setBootstrap({ loginConfig, session });
        }
      } catch {
        if (active) {
          setBootstrap({
            loginConfig: {
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
            },
            session: {
              authenticated: Boolean(loadAccessToken()),
              username: loadAuthSession()?.username ?? null,
              role: loadAuthSession()?.role ?? null,
              sid: loadAuthSession()?.sid ?? null,
              userId: loadAuthSession()?.userId ?? null,
              businessDomainId: loadAuthSession()?.businessDomainId ?? null,
              expiresAt: null
            }
          });
        }
      }
    }
  }, []);

  if (!bootstrap) {
    return <AdminLoadingScreen />;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          bootstrap.session.authenticated ? (
            <Navigate to="/" replace />
          ) : (
            <AdminLoginPage
              loginConfig={bootstrap.loginConfig}
              onAuthenticated={(session) => {
                setBootstrap((current) => (current ? { ...current, session } : current));
              }}
            />
          )
        }
      />
      <Route path="/" element={bootstrap.session.authenticated ? <AdminWorkspacePage /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AdminWorkspacePage() {
  const [domains] = useState<DemoDomain[]>(() => getDemoDomains());
  const [profile, setProfile] = useState(() => loadAdminProfile());
  const [selectedDomainId, setSelectedDomainId] = useState<number>(profile.selectedDomainId);
  const [healthStatus, setHealthStatus] = useState("unknown");
  const [tickets, setTickets] = useState<DemoTicket[]>([]);
  const [sessions, setSessions] = useState<ConsultationSessionSummary[]>([]);
  const [selectedSession, setSelectedSession] = useState<ConsultationSessionSummary>();
  const [messages, setMessages] = useState<ConsultationMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyForm] = Form.useForm<ReplyFormValues>();
  const authToken = loadAccessToken();

  useEffect(() => {
    void bootstrap();
  }, []);

  useEffect(() => {
    if (selectedDomainId) {
      void refreshDomainData(selectedDomainId);
    }
  }, [selectedDomainId]);

  const activeDomain = useMemo(
    () => domains.find((domain) => domain.id === selectedDomainId) ?? domains[0],
    [domains, selectedDomainId]
  );
  const visibleTickets = useMemo(
    () => tickets.filter((ticket) => ticket.businessDomainId === selectedDomainId),
    [tickets, selectedDomainId]
  );
  const visibleSessions = useMemo(
    () => sessions.filter((session) => session.businessDomainId === selectedDomainId),
    [sessions, selectedDomainId]
  );
  const dashboard = useMemo(
    () => ({
      totalTickets: visibleTickets.length,
      openTickets: visibleTickets.filter((ticket) => ticket.status === "open").length,
      processingTickets: visibleTickets.filter((ticket) => ticket.status === "processing").length,
      waitingCustomerTickets: visibleTickets.filter((ticket) => ticket.status === "waiting_customer").length,
      resolvedTickets: visibleTickets.filter((ticket) => ticket.status === "resolved").length,
      closedTickets: visibleTickets.filter((ticket) => ticket.status === "closed").length,
      urgentOpenTickets: visibleTickets.filter((ticket) => ticket.priority === "urgent" && ticket.status !== "closed").length,
      openConsultationSessions: visibleSessions.filter((session) => session.sessionStatus !== "closed").length
    }),
    [visibleSessions, visibleTickets]
  );

  async function bootstrap() {
    try {
      const health = await fetchHealth();
      setHealthStatus(health.status);
    } catch {
      setHealthStatus("DOWN");
    }
  }

  async function refreshDomainData(domainId: number) {
    try {
      setLoading(true);
      const [ticketData, sessionData] = await Promise.all([
        fetchTickets(),
        Promise.resolve(loadConsultationSessions(domainId))
      ]);
      setTickets(ticketData);
      setSessions(sessionData);
      setSelectedSession((current) => {
        if (current && sessionData.some((session) => session.sessionNo === current.sessionNo)) {
          return current;
        }
        return sessionData[0];
      });
      if (sessionData.length === 0) {
        setDrawerOpen(false);
        setMessages([]);
      }
    } catch (error) {
      message.error(`加载管理工作台失败：${formatError(error)}`);
    } finally {
      setLoading(false);
    }
  }

  async function openSession(session: ConsultationSessionSummary) {
    setSelectedSession(session);
    setDrawerOpen(true);
    try {
      setMessages(loadConsultationMessages(session.sessionNo));
    } catch (error) {
      message.error(`加载咨询详情失败：${formatError(error)}`);
    }
  }

  async function changeTicketStatus(ticket: DemoTicket, status: "processing" | "resolved") {
    try {
      if (status === "processing") {
        await markTicketProcessing(ticket.id);
      } else {
        await markTicketResolved(ticket.id);
      }
      message.success(`工单 ${ticket.ticketNo} 已更新为 ${statusLabels[status]}`);
      await refreshDomainData(selectedDomainId);
    } catch (error) {
      message.error(`更新工单状态失败：${formatError(error)}`);
    }
  }

  async function onReply(values: ReplyFormValues) {
    if (!selectedSession) {
      return;
    }
    try {
      setReplyLoading(true);
      sendConsultationMessage({
        businessDomainId: selectedDomainId,
        customerId: selectedSession.customerId,
        sessionNo: selectedSession.sessionNo,
        senderRole: "agent",
        senderUserId: 2,
        content: values.content
      });
      replyForm.resetFields();
      setMessages(loadConsultationMessages(selectedSession.sessionNo));
      await refreshDomainData(selectedDomainId);
      message.success("回复已发送");
    } catch (error) {
      message.error(`发送回复失败：${formatError(error)}`);
    } finally {
      setReplyLoading(false);
    }
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          paddingInline: 24,
          background: "linear-gradient(90deg, #0f172a 0%, #14213d 100%)"
        }}
      >
        <Space direction="vertical" size={0}>
          <Typography.Title level={4} style={{ margin: 0, color: "#fff" }}>
            UnionDesk 管理工作台
          </Typography.Title>
          <Typography.Text style={{ color: "rgba(255,255,255,0.7)" }}>
            真实登录、工单流转、咨询回复和业务域切换
          </Typography.Text>
        </Space>
        <Space wrap>
          <Tag color="rgba(255,255,255,0.16)" style={{ color: "#fff", border: "none" }}>
            后端健康：{healthStatus}
          </Tag>
          <Tag color="rgba(255,255,255,0.16)" style={{ color: "#fff", border: "none" }}>
            当前域：{activeDomain?.name ?? "-"}
          </Tag>
          <Tag color={authToken ? "success" : "default"}>{authToken ? "已登录" : "未登录"}</Tag>
          <Select
            style={{ width: 280 }}
            value={selectedDomainId}
            onChange={(value) => {
              setSelectedDomainId(value);
              saveAdminProfile({
                username: profile.username,
                selectedDomainId: value
              });
            }}
            options={domains.map((domain) => ({
              label: `${domain.name} (${domain.code})`,
              value: domain.id
            }))}
          />
        </Space>
      </Header>

      <Content style={{ padding: 24 }}>
        <Space direction="vertical" style={{ width: "100%" }} size={16}>
          <Row gutter={[16, 16]}>
            <Col xs={12} lg={4}>
              <Card>
                <Statistic title="待处理工单" value={dashboard.openTickets} />
              </Card>
            </Col>
            <Col xs={12} lg={4}>
              <Card>
                <Statistic title="处理中" value={dashboard.processingTickets} />
              </Card>
            </Col>
            <Col xs={12} lg={4}>
              <Card>
                <Statistic title="待客户回复" value={dashboard.waitingCustomerTickets} />
              </Card>
            </Col>
            <Col xs={12} lg={4}>
              <Card>
                <Statistic title="紧急预警" value={dashboard.urgentOpenTickets} valueStyle={{ color: "#cf1322" }} />
              </Card>
            </Col>
            <Col xs={12} lg={4}>
              <Card>
                <Statistic title="会话总数" value={dashboard.openConsultationSessions} suffix={<Badge status="processing" />} />
              </Card>
            </Col>
            <Col xs={12} lg={4}>
              <Card>
                <Statistic title="总工单" value={dashboard.totalTickets} />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card title="工单列表" bordered={false} style={{ boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)" }}>
                <Table
                  loading={loading}
                  rowKey="ticketNo"
                  dataSource={visibleTickets}
                  pagination={{ pageSize: 8, showSizeChanger: false }}
                  columns={[
                    { title: "工单号", dataIndex: "ticketNo", width: 160 },
                    { title: "标题", dataIndex: "title" },
                    {
                      title: "优先级",
                      dataIndex: "priority",
                      width: 110,
                      render: (value: TicketPriority) => <Tag color={priorityColors[value] ?? "default"}>{value}</Tag>
                    },
                    {
                      title: "状态",
                      dataIndex: "status",
                      width: 180,
                      render: (value: string) => <Tag color={value === "closed" ? "default" : "processing"}>{statusLabels[value] ?? value}</Tag>
                    },
                    {
                      title: "操作",
                      width: 170,
                      render: (_value: unknown, record: DemoTicket) => (
                        <Space>
                          <Button size="small" onClick={() => void changeTicketStatus(record, "processing")}>处理中</Button>
                          <Button size="small" type="primary" onClick={() => void changeTicketStatus(record, "resolved")}>已解决</Button>
                        </Space>
                      )
                    }
                  ]}
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="登录状态" bordered={false} style={{ boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)" }}>
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  <Typography.Text type="secondary">当前登录账号</Typography.Text>
                  <Typography.Text strong>{profile.username}</Typography.Text>
                  <Typography.Text type="secondary">
                    后台登录由独立 `/login` 页面处理，这里只保留工作态与域切换能力。
                  </Typography.Text>
                </Space>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="最近咨询" bordered={false} style={{ boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)" }}>
                <List
                  locale={{ emptyText: "当前业务域还没有咨询会话" }}
                  dataSource={visibleSessions}
                  renderItem={(session) => (
                    <List.Item style={{ paddingInline: 0 }}>
                      <Card size="small" hoverable style={{ width: "100%" }} onClick={() => void openSession(session)}>
                        <Space direction="vertical" size={4} style={{ width: "100%" }}>
                          <Typography.Text strong>{session.sessionNo}</Typography.Text>
                          <Typography.Text type="secondary">客户 #{session.customerId}</Typography.Text>
                          <Typography.Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0 }}>
                            {session.lastMessagePreview ?? "暂无消息预览"}
                          </Typography.Paragraph>
                          <Space wrap>
                            <Tag color={session.sessionStatus === "open" ? "processing" : "default"}>{session.sessionStatus}</Tag>
                            <Typography.Text type="secondary">
                              {session.lastMessageAt ? new Date(session.lastMessageAt).toLocaleString() : "暂无时间"}
                            </Typography.Text>
                          </Space>
                        </Space>
                      </Card>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card
                title="当前域说明"
                bordered={false}
                style={{
                  boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)",
                  minHeight: 280,
                  background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)"
                }}
              >
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  <Typography.Title level={4} style={{ marginTop: 0 }}>
                    {activeDomain?.name ?? "-"}
                  </Typography.Title>
                  <Typography.Paragraph style={{ marginBottom: 0 }}>
                    {activeDomain?.description}
                  </Typography.Paragraph>
                  <Space wrap>
                    <Tag color={activeDomain?.accent ?? "blue"}>{activeDomain?.code}</Tag>
                    <Tag>{activeDomain?.supportLine}</Tag>
                  </Space>
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="这里保留给后续的客户列表、标签和分配信息" />
                </Space>
              </Card>
            </Col>
          </Row>
          <LoginManagementPanel />
        </Space>
      </Content>

      <Drawer
        title={selectedSession ? `咨询详情 · ${selectedSession.sessionNo}` : "咨询详情"}
        width={480}
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
                    <Typography.Text strong>{item.senderRole === "agent" ? "客服" : item.senderRole === "customer" ? "客户" : "系统"}</Typography.Text>
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
                <Input.TextArea rows={4} placeholder="给客户一个清晰、可执行的下一步说明。" />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={replyLoading} block>
                发送回复
              </Button>
            </Form>
          )}
        </Space>
      </Drawer>
    </Layout>
  );
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

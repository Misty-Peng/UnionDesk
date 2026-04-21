import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Row,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
  message
} from "antd";
import {
  fetchLoginConfig,
  fetchLoginLogs,
  fetchOnlineSessions,
  revokeOnlineSession,
  revokeUserSessions,
  updateLoginConfig,
  type LoginConfig,
  type LoginLogView,
  type OnlineSessionView,
  type UpdateLoginConfigRequest
} from "@uniondesk/shared";

type LoginConfigFormValues = {
  passwordLoginEnabled: boolean;
  usernameLoginEnabled: boolean;
  emailLoginEnabled: boolean;
  mobileLoginEnabled: boolean;
  captchaEnabled: boolean;
  wechatLoginEnabled: boolean;
  captchaHint?: string | null;
  wechatHint?: string | null;
  sessionTtlSeconds: number;
  maxActiveSessionsPerUser: number;
};

const defaultLimits = {
  sessions: 20,
  logs: 20
};

function toFormValues(config: LoginConfig): LoginConfigFormValues {
  return {
    passwordLoginEnabled: config.passwordLoginEnabled,
    usernameLoginEnabled: config.usernameLoginEnabled,
    emailLoginEnabled: config.emailLoginEnabled,
    mobileLoginEnabled: config.mobileLoginEnabled,
    captchaEnabled: config.captchaEnabled,
    wechatLoginEnabled: config.wechatLoginEnabled,
    captchaHint: config.captchaHint ?? null,
    wechatHint: config.wechatHint ?? null,
    sessionTtlSeconds: config.sessionTtlSeconds,
    maxActiveSessionsPerUser: config.maxActiveSessionsPerUser
  };
}

function toUpdateRequest(values: LoginConfigFormValues): UpdateLoginConfigRequest {
  return {
    passwordLoginEnabled: values.passwordLoginEnabled,
    usernameLoginEnabled: values.usernameLoginEnabled,
    emailLoginEnabled: values.emailLoginEnabled,
    mobileLoginEnabled: values.mobileLoginEnabled,
    captchaEnabled: values.captchaEnabled,
    wechatLoginEnabled: values.wechatLoginEnabled,
    captchaHint: values.captchaHint,
    wechatHint: values.wechatHint,
    sessionTtlSeconds: values.sessionTtlSeconds,
    maxActiveSessionsPerUser: values.maxActiveSessionsPerUser
  };
}

export function LoginManagementPanel() {
  const [form] = Form.useForm<LoginConfigFormValues>();
  const [config, setConfig] = useState<LoginConfig | null>(null);
  const [onlineSessions, setOnlineSessions] = useState<OnlineSessionView[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLogView[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sessionLimit, setSessionLimit] = useState(defaultLimits.sessions);
  const [logLimit, setLogLimit] = useState(defaultLimits.logs);

  useEffect(() => {
    void refreshManagementData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLimit, logLimit]);

  async function refreshManagementData() {
    try {
      setLoading(true);
      const [nextConfig, sessions, logs] = await Promise.all([
        fetchLoginConfig(),
        fetchOnlineSessions(sessionLimit),
        fetchLoginLogs(logLimit)
      ]);
      setConfig(nextConfig);
      setOnlineSessions(sessions);
      setLoginLogs(logs);
      form.setFieldsValue(toFormValues(nextConfig));
    } catch (error) {
      message.error(`加载登录管理数据失败：${formatError(error)}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(values: LoginConfigFormValues) {
    try {
      setSaving(true);
      const nextConfig = await updateLoginConfig(toUpdateRequest(values));
      setConfig(nextConfig);
      form.setFieldsValue(toFormValues(nextConfig));
      message.success("登录配置已保存");
      await refreshManagementData();
    } catch (error) {
      message.error(`保存登录配置失败：${formatError(error)}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleRevokeSession(sid: string) {
    try {
      await revokeOnlineSession(sid);
      message.success("会话已下线");
      await refreshManagementData();
    } catch (error) {
      message.error(`下线会话失败：${formatError(error)}`);
    }
  }

  async function handleRevokeUserSessions(userId: number) {
    try {
      await revokeUserSessions(userId);
      message.success("该用户的在线会话已全部下线");
      await refreshManagementData();
    } catch (error) {
      message.error(`批量下线失败：${formatError(error)}`);
    }
  }

  const configExtra = useMemo(() => {
    if (!config) {
      return null;
    }
    return <Tag color="blue">最近更新：{new Date(config.updatedAt ?? Date.now()).toLocaleString()}</Tag>;
  }, [config]);

  return (
    <Card
      title="登录与安全管理"
      extra={
        <Space>
          {configExtra}
          <Button onClick={() => void refreshManagementData()} loading={loading}>
            刷新
          </Button>
        </Space>
      }
      bordered={false}
      style={{ boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)" }}
    >
      <Tabs
        items={[
          {
            key: "config",
            label: "登录配置",
            children: (
              <Form
                form={form}
                layout="vertical"
                initialValues={config ? toFormValues(config) : undefined}
                onFinish={(values) => void handleSave(values)}
              >
                <Row gutter={16}>
                  <Col xs={24} md={12} lg={6}>
                    <Form.Item label="密码登录" name="passwordLoginEnabled" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12} lg={6}>
                    <Form.Item label="用户名登录" name="usernameLoginEnabled" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12} lg={6}>
                    <Form.Item label="邮箱登录" name="emailLoginEnabled" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12} lg={6}>
                    <Form.Item label="手机号登录" name="mobileLoginEnabled" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} md={12} lg={6}>
                    <Form.Item label="滑块验证码" name="captchaEnabled" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12} lg={6}>
                    <Form.Item label="微信登录" name="wechatLoginEnabled" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12} lg={6}>
                    <Form.Item label="会话时长（秒）" name="sessionTtlSeconds" rules={[{ required: true, message: "请输入会话时长" }]}>
                      <InputNumber min={60} step={60} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12} lg={6}>
                    <Form.Item label="单用户最大会话数" name="maxActiveSessionsPerUser" rules={[{ required: true, message: "请输入最大会话数" }]}>
                      <InputNumber min={1} step={1} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item label="验证码提示" name="captchaHint">
                      <Input placeholder="例如：拖动滑块后继续登录" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="微信提示" name="wechatHint">
                      <Input placeholder="例如：扫码登录或绑定企业微信" />
                    </Form.Item>
                  </Col>
                </Row>
                <Space>
                  <Button type="primary" htmlType="submit" loading={saving}>
                    保存登录配置
                  </Button>
                  <Button
                    onClick={() => {
                      if (config) {
                        form.setFieldsValue(toFormValues(config));
                      }
                    }}
                    disabled={!config}
                  >
                    恢复当前值
                  </Button>
                </Space>
              </Form>
            )
          },
          {
            key: "sessions",
            label: `在线用户 (${onlineSessions.length})`,
            children: (
              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                <Space wrap>
                  <Typography.Text type="secondary">最近会话数量</Typography.Text>
                  <InputNumber min={5} max={100} value={sessionLimit} onChange={(value) => setSessionLimit(Number(value ?? defaultLimits.sessions))} />
                  <Button onClick={() => void refreshManagementData()} loading={loading}>
                    刷新会话
                  </Button>
                </Space>
                <Table
                  loading={loading}
                  rowKey="sid"
                  dataSource={onlineSessions}
                  pagination={{ pageSize: 8, showSizeChanger: false }}
                  columns={[
                    { title: "SID", dataIndex: "sid", width: 180, ellipsis: true },
                    {
                      title: "用户",
                      width: 180,
                      render: (_value: unknown, record: OnlineSessionView) => (
                        <Space direction="vertical" size={0}>
                          <Typography.Text strong>{record.username}</Typography.Text>
                          <Typography.Text type="secondary">#{record.userId}</Typography.Text>
                        </Space>
                      )
                    },
                    { title: "角色", dataIndex: "role", width: 120, render: (value: string) => <Tag>{value}</Tag> },
                    { title: "业务域", dataIndex: "businessDomainId", width: 110, render: (value: number | null | undefined) => value ?? "-" },
                    { title: "登录标识", dataIndex: "loginIdentifierMasked", width: 180, ellipsis: true },
                    {
                      title: "最近活跃",
                      width: 180,
                      render: (_value: unknown, record: OnlineSessionView) => record.lastSeenAt ? new Date(record.lastSeenAt).toLocaleString() : new Date(record.issuedAt).toLocaleString()
                    },
                    {
                      title: "过期时间",
                      width: 180,
                      render: (_value: unknown, record: OnlineSessionView) => new Date(record.expiresAt).toLocaleString()
                    },
                    {
                      title: "操作",
                      width: 220,
                      render: (_value: unknown, record: OnlineSessionView) => (
                        <Space wrap>
                          <Popconfirm
                            title="确认下线该会话？"
                            description="该操作会让当前会话失效。"
                            okText="下线"
                            cancelText="取消"
                            onConfirm={() => void handleRevokeSession(record.sid)}
                          >
                            <Button size="small" danger>
                              下线会话
                            </Button>
                          </Popconfirm>
                          <Popconfirm
                            title="确认下线该用户全部会话？"
                            description="同一用户的所有在线会话都会失效。"
                            okText="下线全部"
                            cancelText="取消"
                            onConfirm={() => void handleRevokeUserSessions(record.userId)}
                          >
                            <Button size="small">
                              用户下线
                            </Button>
                          </Popconfirm>
                        </Space>
                      )
                    }
                  ]}
                />
              </Space>
            )
          },
          {
            key: "logs",
            label: `登录日志 (${loginLogs.length})`,
            children: (
              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                <Space wrap>
                  <Typography.Text type="secondary">最近日志数量</Typography.Text>
                  <InputNumber min={5} max={200} value={logLimit} onChange={(value) => setLogLimit(Number(value ?? defaultLimits.logs))} />
                  <Button onClick={() => void refreshManagementData()} loading={loading}>
                    刷新日志
                  </Button>
                </Space>
                <Table
                  loading={loading}
                  rowKey="id"
                  dataSource={loginLogs}
                  pagination={{ pageSize: 8, showSizeChanger: false }}
                  columns={[
                    {
                      title: "时间",
                      width: 180,
                      render: (_value: unknown, record: LoginLogView) => new Date(record.createdAt).toLocaleString()
                    },
                    { title: "事件", dataIndex: "eventType", width: 120, render: (value: string) => <Tag>{value}</Tag> },
                    {
                      title: "结果",
                      dataIndex: "result",
                      width: 110,
                      render: (value: string) => <Tag color={value === "SUCCESS" ? "green" : "red"}>{value}</Tag>
                    },
                    { title: "用户", dataIndex: "username", width: 140, render: (value: string | null | undefined) => value ?? "-" },
                    { title: "标识", dataIndex: "loginIdentifierMasked", width: 180 },
                    { title: "类型", dataIndex: "loginIdentifierType", width: 120 },
                    { title: "原因", dataIndex: "reason", width: 160, render: (value: string | null | undefined) => value ?? "-" },
                    { title: "IP", dataIndex: "clientIp", width: 140, render: (value: string | null | undefined) => value ?? "-" }
                  ]}
                />
              </Space>
            )
          }
        ]}
      />
    </Card>
  );
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

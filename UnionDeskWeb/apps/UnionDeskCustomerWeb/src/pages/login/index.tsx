import { LockOutlined, MailOutlined, MobileOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, Input, Row, Select, Space, Tabs, Typography, message } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCustomerPortal } from "@uniondesk/shared";

type LoginFormValues = {
  loginName: string;
  password: string;
};

type RegisterFormValues = {
  loginName: string;
  password: string;
  displayName: string;
  phone: string;
  email?: string;
  domainId?: number;
  invitationCode?: string;
};

export default function LoginPage() {
  const portal = useCustomerPortal();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      portal.login({
        loginName: values.loginName.trim(),
        password: values.password
      });
      message.success("登录成功");
      navigate("/domains", { replace: true });
    } catch (error) {
      message.error(error instanceof Error ? error.message : "登录失败");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: RegisterFormValues) => {
    setLoading(true);
    try {
      portal.register({
        loginName: values.loginName.trim(),
        password: values.password,
        displayName: values.displayName.trim(),
        phone: values.phone.trim(),
        email: values.email?.trim(),
        domainId: values.domainId ?? null,
        invitationCode: values.invitationCode?.trim()
      });
      message.success("注册成功");
      navigate("/domains", { replace: true });
    } catch (error) {
      message.error(error instanceof Error ? error.message : "注册失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row style={{ minHeight: "100vh" }} align="middle" justify="center">
      <Col xs={22} sm={20} md={18} lg={16} xl={14} xxl={12}>
        <Card
          bordered={false}
          style={{
            overflow: "hidden",
            borderRadius: 28,
            boxShadow: "0 24px 80px rgba(15, 23, 42, 0.12)",
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(244,248,255,0.92) 46%, rgba(236,249,245,0.92) 100%)"
          }}
        >
          <Row gutter={28} align="middle">
            <Col xs={24} md={12}>
              <Space direction="vertical" size={18} style={{ width: "100%" }}>
                <Typography.Text type="secondary">Customer Web · P0 闭环</Typography.Text>
                <Typography.Title level={2} style={{ margin: 0 }}>
                  客户注册、登录、入域和工单查看，一页接通
                </Typography.Title>
                <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
                  登录后先进入业务域，再提交工单、查看回复和通知。演示账号默认可直接登录，注册时也可以顺手加入邀请码业务域。
                </Typography.Paragraph>
                <Space wrap>
                  <Card size="small" style={{ minWidth: 150 }}>
                    <Typography.Text type="secondary">演示账号</Typography.Text>
                    <Typography.Title level={5} style={{ margin: "6px 0 0" }}>
                      customer / customer123
                    </Typography.Title>
                  </Card>
                  <Card size="small" style={{ minWidth: 150 }}>
                    <Typography.Text type="secondary">默认业务域</Typography.Text>
                    <Typography.Title level={5} style={{ margin: "6px 0 0" }}>
                      {portal.domains[0]?.name ?? "-"}
                    </Typography.Title>
                  </Card>
                </Space>
              </Space>
            </Col>
            <Col xs={24} md={12}>
              <Card bordered={false} style={{ borderRadius: 24, background: "rgba(255, 255, 255, 0.82)" }}>
                <Tabs
                  activeKey={activeTab}
                  onChange={(key) => setActiveTab(key as "login" | "register")}
                  items={[
                    {
                      key: "login",
                      label: "登录",
                      children: (
                        <Form<LoginFormValues> layout="vertical" onFinish={handleLogin}>
                          <Form.Item
                            label="登录名"
                            name="loginName"
                            rules={[{ required: true, message: "请输入登录名" }]}
                          >
                            <Input prefix={<UserOutlined />} placeholder="请输入登录名" />
                          </Form.Item>
                          <Form.Item label="密码" name="password" rules={[{ required: true, message: "请输入密码" }]}>
                            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
                          </Form.Item>
                          <Button type="primary" htmlType="submit" loading={loading} block>
                            登录并进入业务域
                          </Button>
                        </Form>
                      )
                    },
                    {
                      key: "register",
                      label: "注册",
                      children: (
                        <Form<RegisterFormValues> layout="vertical" onFinish={handleRegister}>
                          <Form.Item
                            label="登录名"
                            name="loginName"
                            rules={[{ required: true, message: "请输入登录名" }]}
                          >
                            <Input prefix={<UserOutlined />} placeholder="创建登录名" />
                          </Form.Item>
                          <Form.Item
                            label="显示名称"
                            name="displayName"
                            rules={[{ required: true, message: "请输入显示名称" }]}
                          >
                            <Input prefix={<UserOutlined />} placeholder="客户姓名或企业名称" />
                          </Form.Item>
                          <Form.Item label="手机号" name="phone" rules={[{ required: true, message: "请输入手机号" }]}>
                            <Input prefix={<MobileOutlined />} placeholder="请输入手机号" />
                          </Form.Item>
                          <Form.Item label="邮箱" name="email">
                            <Input prefix={<MailOutlined />} placeholder="可选，用于通知" />
                          </Form.Item>
                          <Form.Item label="加入业务域" name="domainId">
                            <Select
                              allowClear
                              placeholder="可选，注册后直接加入业务域"
                              options={portal.domains.map((domain) => ({
                                value: domain.id,
                                label: `${domain.name} · ${domain.joinHint}`
                              }))}
                            />
                          </Form.Item>
                          <Form.Item label="邀请码" name="invitationCode">
                            <Input placeholder="可选，填入邀请码直接入域" />
                          </Form.Item>
                          <Form.Item
                            label="密码"
                            name="password"
                            rules={[{ required: true, message: "请输入密码" }]}
                          >
                            <Input.Password prefix={<LockOutlined />} placeholder="设置登录密码" />
                          </Form.Item>
                          <Button type="primary" htmlType="submit" loading={loading} block>
                            注册并开始使用
                          </Button>
                        </Form>
                      )
                    }
                  ]}
                />
              </Card>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>
  );
}


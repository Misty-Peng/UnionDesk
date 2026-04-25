import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Form, Input, Space, Typography, message } from "antd";
import { login, toErrorMessage } from "@uniondesk/shared";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

type LoginFormValues = {
  username: string;
  password: string;
};

export default function LoginPage() {
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (values: LoginFormValues) => {
    setSubmitting(true);
    setErrorMessage("");
    try {
      await login({
        username: values.username.trim(),
        password: values.password
      });
      navigate("/", { replace: true });
    } catch (error) {
      const resolved = toErrorMessage(error);
      setErrorMessage(resolved);
      message.error(resolved || "登录失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Card style={{ width: "100%", maxWidth: 420 }}>
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Typography.Title level={3} style={{ margin: 0 }}>
            客户端登录
          </Typography.Title>
          <Typography.Text type="secondary">请输入已开通客户端权限的账号</Typography.Text>
          {errorMessage ? <Alert type="error" showIcon message={errorMessage} /> : null}
          <Form<LoginFormValues> layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label="用户名"
              name="username"
              rules={[{ required: true, message: "请输入用户名" }]}
            >
              <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
            </Form.Item>
            <Form.Item
              label="密码"
              name="password"
              rules={[{ required: true, message: "请输入密码" }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} block>
              登录
            </Button>
          </Form>
        </Space>
      </Card>
    </div>
  );
}

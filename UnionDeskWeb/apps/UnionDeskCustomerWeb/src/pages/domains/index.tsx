import { CheckCircleOutlined, LockOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, Input, Row, Space, Tag, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";
import { useCustomerPortal } from "@uniondesk/shared";

export default function DomainsPage() {
  const portal = useCustomerPortal();
  const navigate = useNavigate();
  const [form] = Form.useForm<{ invitationCode: string }>();

  const joinWithCode = (invitationCode: string) => {
    try {
      portal.joinDomainByInvitation({ invitationCode });
      message.success("已加入业务域");
      navigate("/workspace", { replace: true });
    } catch (error) {
      message.error(error instanceof Error ? error.message : "入域失败");
    }
  };

  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      <Card bordered={false} style={{ borderRadius: 28 }}>
        <Space direction="vertical" size={8}>
          <Typography.Title level={2} style={{ margin: 0 }}>
            选择业务域
          </Typography.Title>
          <Typography.Text type="secondary">先选定业务域，再进入工单和通知工作台。</Typography.Text>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        {portal.domains.map((domain) => (
          <Col xs={24} md={12} xl={8} key={domain.id}>
            <Card
              bordered={false}
              style={{
                borderRadius: 24,
                height: "100%",
                opacity: domain.registrationPolicy === "admin_only" ? 0.7 : 1
              }}
              actions={[
                domain.joined ? (
                  <Button
                    key="select"
                    type={domain.selected ? "primary" : "default"}
                    icon={<CheckCircleOutlined />}
                    onClick={() => {
                      try {
                        portal.selectDomain(domain.id);
                        navigate("/workspace", { replace: true });
                      } catch (error) {
                        message.error(error instanceof Error ? error.message : "切换失败");
                      }
                    }}
                  >
                    {domain.selected ? "当前业务域" : "进入此域"}
                  </Button>
                ) : domain.canJoin ? (
                  <Button
                    key="join"
                    icon={<PlusOutlined />}
                    onClick={() => joinWithCode(domain.invitationCode)}
                  >
                    {domain.registrationPolicy === "open" ? "直接加入" : "使用邀请码加入"}
                  </Button>
                ) : (
                  <Button key="locked" icon={<LockOutlined />} disabled>
                    仅管理员分配
                  </Button>
                )
              ]}
            >
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <Space align="center" wrap>
                  <Typography.Title level={4} style={{ margin: 0 }}>
                    {domain.name}
                  </Typography.Title>
                  <Tag color={domain.registrationPolicy === "open" ? "green" : domain.registrationPolicy === "invitation_only" ? "gold" : "default"}>
                    {domain.joinHint}
                  </Tag>
                  {domain.selected ? <Tag color="blue">当前</Tag> : null}
                </Space>
                <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
                  {domain.description}
                </Typography.Paragraph>
                <Space direction="vertical" size={4}>
                  <Typography.Text>邀请码：{domain.invitationCode}</Typography.Text>
                  <Typography.Text type="secondary">支持热线：{domain.supportLine}</Typography.Text>
                </Space>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Card bordered={false} style={{ borderRadius: 24 }}>
        <Typography.Title level={4} style={{ marginTop: 0 }}>
          邀请码入域
        </Typography.Title>
        <Form
          form={form}
          layout="inline"
          onFinish={(values) => joinWithCode(values.invitationCode.trim())}
          style={{ gap: 12 }}
        >
          <Form.Item name="invitationCode" rules={[{ required: true, message: "请输入邀请码" }]}>
            <Input placeholder="输入邀请码直接入域" style={{ minWidth: 280 }} />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            入域
          </Button>
        </Form>
      </Card>
    </Space>
  );
}


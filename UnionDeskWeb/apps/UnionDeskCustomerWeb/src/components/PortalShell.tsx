import { InboxOutlined, LogoutOutlined, SwapOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { Button, Layout, Space, Tag, Typography, message } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useCustomerPortal } from "@uniondesk/shared";

const navItems = [
  { key: "/workspace", label: "工作台", icon: <UnorderedListOutlined /> },
  { key: "/domains", label: "业务域", icon: <SwapOutlined /> },
  { key: "/inbox", label: "通知", icon: <InboxOutlined /> }
];

export default function PortalShell() {
  const portal = useCustomerPortal();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    portal.logout();
    message.success("已退出登录");
    navigate("/login", { replace: true });
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "transparent" }}>
      <Layout.Header
        style={{
          height: "auto",
          padding: "18px 24px",
          background: "rgba(255, 255, 255, 0.76)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
          lineHeight: 1.4
        }}
      >
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Space align="center" wrap style={{ width: "100%", justifyContent: "space-between" }}>
            <Space align="center" size={12}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 14,
                  display: "grid",
                  placeItems: "center",
                  background: "linear-gradient(135deg, #1d4ed8, #0f766e)",
                  color: "#fff",
                  fontWeight: 700
                }}
              >
                U
              </div>
              <div>
                <Typography.Title level={4} style={{ margin: 0 }}>
                  UnionDesk 客户端
                </Typography.Title>
                <Typography.Text type="secondary">客户注册、入域、提单与消息闭环</Typography.Text>
              </div>
            </Space>
            <Space wrap>
              {navItems.map((item) => (
                <Button
                  key={item.key}
                  type={location.pathname.startsWith(item.key) ? "primary" : "default"}
                  icon={item.icon}
                  onClick={() => navigate(item.key)}
                >
                  {item.label}
                </Button>
              ))}
              <Button icon={<LogoutOutlined />} onClick={handleLogout}>
                退出
              </Button>
            </Space>
          </Space>
          <Space size={8} wrap>
            <Tag color="blue">当前账号：{portal.account?.displayName ?? "-"}</Tag>
            <Tag color={portal.activeDomain ? "green" : "gold"}>当前业务域：{portal.activeDomain?.name ?? "未选择"}</Tag>
            <Tag color="purple">未读通知：{portal.unreadCount}</Tag>
          </Space>
        </Space>
      </Layout.Header>
      <Layout.Content style={{ padding: 24 }}>
        <Outlet />
      </Layout.Content>
    </Layout>
  );
}

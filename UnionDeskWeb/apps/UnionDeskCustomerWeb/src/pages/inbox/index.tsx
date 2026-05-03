import { CheckOutlined, MailOutlined } from "@ant-design/icons";
import { Button, Card, Empty, List, Space, Tag, Typography, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useCustomerPortal } from "@uniondesk/shared";

import { formatDateTime } from "../../utils/date";

export default function InboxPage() {
  const portal = useCustomerPortal();
  const navigate = useNavigate();

  return (
    <Card bordered={false} style={{ borderRadius: 28 }} title="通知中心">
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Typography.Text type="secondary">这里展示工单、入域和系统通知，未读消息会同步到工作台。</Typography.Text>
        <List
          dataSource={portal.inboxMessages}
          locale={{ emptyText: <Empty description="暂无通知" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  key="read"
                  icon={<CheckOutlined />}
                  onClick={() => {
                    portal.markInboxRead(item.id);
                    message.success("已标记为已读");
                  }}
                >
                  标记已读
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={<MailOutlined />}
                title={
                  <Space wrap>
                    <Typography.Text strong>{item.title}</Typography.Text>
                    {item.isRead ? <Tag>已读</Tag> : <Tag color="red">未读</Tag>}
                    <Tag color="blue">{item.kind}</Tag>
                  </Space>
                }
                description={
                  <Space direction="vertical" size={4}>
                    <Typography.Text>{item.content}</Typography.Text>
                    <Typography.Text type="secondary">{formatDateTime(item.createdAt)}</Typography.Text>
                    <Link to={item.jumpUrl || "/workspace"}>跳转到相关页面</Link>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
        <Button type="primary" onClick={() => navigate("/workspace")}>
          返回工作台
        </Button>
      </Space>
    </Card>
  );
}


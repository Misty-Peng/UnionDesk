import { ArrowLeftOutlined, InboxOutlined } from "@ant-design/icons";
import { Button, Card, Descriptions, Empty, List, Space, Tag, Timeline, Typography, message } from "antd";
import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCustomerPortal } from "@uniondesk/shared";

import TicketStatusTag from "../../components/TicketStatusTag";
import { formatDateTime } from "../../utils/date";

export default function TicketDetailPage() {
  const portal = useCustomerPortal();
  const navigate = useNavigate();
  const params = useParams();
  const ticketId = Number(params.ticketId);
  const ticket = Number.isFinite(ticketId) ? portal.getTicketById(ticketId) : null;

  const attachmentMap = useMemo(() => {
    return new Map(portal.attachments.map((attachment) => [attachment.id, attachment]));
  }, [portal.attachments]);

  if (!ticket) {
    return (
      <Card bordered={false} style={{ borderRadius: 24 }}>
        <Empty
          description="工单不存在或已离开当前账号"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          imageStyle={{ height: 64 }}
        >
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/workspace")}>
            返回工作台
          </Button>
        </Empty>
      </Card>
    );
  }

  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      <Card bordered={false} style={{ borderRadius: 28 }}>
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Space align="center" wrap>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              返回
            </Button>
            <Tag color="blue">{ticket.ticketNo}</Tag>
            <TicketStatusTag status={ticket.status} />
            {ticket.status === "open" ? (
              <Button
                danger
                onClick={() => {
                  try {
                    portal.withdrawTicket(ticket.id);
                    message.success("工单已撤回");
                  } catch (error) {
                    message.error(error instanceof Error ? error.message : "撤回失败");
                  }
                }}
              >
                撤回工单
              </Button>
            ) : null}
          </Space>
          <Typography.Title level={2} style={{ margin: 0 }}>
            {ticket.title}
          </Typography.Title>
          <Typography.Text type="secondary">{ticket.description}</Typography.Text>
        </Space>
      </Card>

      <Card bordered={false} style={{ borderRadius: 24 }} title="工单信息">
        <Descriptions column={{ xs: 1, md: 2, xl: 3 }} bordered size="small">
          <Descriptions.Item label="业务域">{portal.activeDomain?.name ?? "-"}</Descriptions.Item>
          <Descriptions.Item label="类型">{ticket.typeName}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{formatDateTime(ticket.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="更新时间">{formatDateTime(ticket.updatedAt)}</Descriptions.Item>
          <Descriptions.Item label="撤回时间">{formatDateTime(ticket.withdrawnAt ?? null)}</Descriptions.Item>
          <Descriptions.Item label="附件数量">{ticket.attachments.length}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card bordered={false} style={{ borderRadius: 24 }} title="回复时间线">
        {ticket.replies.length === 0 ? (
          <Empty description="暂无回复" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Timeline
            items={ticket.replies.map((reply) => ({
              children: (
                <Card size="small" style={{ borderRadius: 18, background: "rgba(248, 250, 252, 0.9)" }}>
                  <Space direction="vertical" size={8} style={{ width: "100%" }}>
                    <Space align="center" wrap>
                      <Typography.Text strong>{reply.authorName}</Typography.Text>
                      <Tag>{reply.authorType}</Tag>
                      <Typography.Text type="secondary">{formatDateTime(reply.createdAt)}</Typography.Text>
                    </Space>
                    <Typography.Paragraph style={{ margin: 0, whiteSpace: "pre-wrap" }}>{reply.content}</Typography.Paragraph>
                    {reply.attachmentIds.length > 0 ? (
                      <Space wrap>
                        {reply.attachmentIds.map((attachmentId) => {
                          const attachment = attachmentMap.get(attachmentId);
                          if (!attachment) {
                            return null;
                          }
                          return (
                            <Tag key={attachment.id} color="blue">
                              <a href={attachment.content} download={attachment.fileName}>
                                {attachment.fileName}
                              </a>
                            </Tag>
                          );
                        })}
                      </Space>
                    ) : null}
                  </Space>
                </Card>
              )
            }))}
          />
        )}
      </Card>

      <Card bordered={false} style={{ borderRadius: 24 }} title="工单附件">
        {ticket.attachments.length === 0 ? (
          <Empty description="暂无附件" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <List
            dataSource={ticket.attachments}
            renderItem={(attachmentId) => {
              const attachment = attachmentMap.get(attachmentId);
              if (!attachment) {
                return null;
              }
              return (
                <List.Item>
                  <List.Item.Meta
                    avatar={<InboxOutlined />}
                    title={
                      <a href={attachment.content} download={attachment.fileName}>
                        {attachment.fileName}
                      </a>
                    }
                    description={`${attachment.mimeType} · ${Math.round(attachment.size / 1024)} KB · ${formatDateTime(attachment.createdAt)}`}
                  />
                </List.Item>
              );
            }}
          />
        )}
      </Card>
    </Space>
  );
}


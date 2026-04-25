import { Card, Typography } from "antd";

type ModuleCardProps = {
  title: string;
  description: string;
};

export default function ModuleCard({ title, description }: ModuleCardProps) {
  return (
    <Card bordered={false} style={{ borderRadius: 12, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)" }}>
      <Typography.Title level={5} style={{ marginTop: 0 }}>
        {title}
      </Typography.Title>
      <Typography.Text type="secondary">{description}</Typography.Text>
    </Card>
  );
}

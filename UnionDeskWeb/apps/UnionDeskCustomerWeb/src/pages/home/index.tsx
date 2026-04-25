import { Col, Row, Space, Tag, Typography } from "antd";
import { getDemoDomains } from "@uniondesk/shared";
import ModuleCard from "../../components/ModuleCard";

export default function HomePage() {
  const domain = getDemoDomains()[0];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Tag color="blue" style={{ width: "fit-content" }}>
          UnionDesk Customer Web
        </Tag>
        <Typography.Title level={2} style={{ margin: 0 }}>
          客户端模块化骨架
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
          当前保留模块化结构与基础入口，优先保障管理端快速开发与联调。
        </Typography.Paragraph>
        <Typography.Text type="secondary">默认业务域：{domain?.name ?? "-"}</Typography.Text>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <ModuleCard title="pages" description="页面目录已保留，可直接新增业务页面。" />
          </Col>
          <Col xs={24} md={8}>
            <ModuleCard title="routes" description="路由目录已保留，可渐进接入页面路由。" />
          </Col>
          <Col xs={24} md={8}>
            <ModuleCard title="components" description="组件目录已保留，可沉淀通用 UI 组件。" />
          </Col>
        </Row>
      </Space>
    </div>
  );
}

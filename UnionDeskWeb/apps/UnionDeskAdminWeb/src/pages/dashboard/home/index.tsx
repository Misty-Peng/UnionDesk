import { PageContainer } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { Card, Col, Row, Statistic, Typography } from 'antd';
import React from 'react';

const DashboardHome: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const username = initialState?.currentUser?.name ?? '管理员';

  return (
    <PageContainer title="首页">
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card variant="borderless">
            <Typography.Title level={4}>欢迎回来，{username}</Typography.Title>
            <Typography.Paragraph type="secondary">
              这里是 UnionDesk 管理端默认工作台，所有已登录管理端用户均可访问。
            </Typography.Paragraph>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card variant="borderless">
            <Statistic title="今日待处理" value={0} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card variant="borderless">
            <Statistic title="处理中工单" value={0} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card variant="borderless">
            <Statistic title="已解决工单" value={0} />
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default DashboardHome;

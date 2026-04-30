import { BasicContent } from "#src/components/basic-content";

import { AppstoreOutlined, CheckCircleOutlined, FileTextOutlined, TeamOutlined } from "@ant-design/icons";
import { Card, Col, Descriptions, Row, Space, Tag, Typography } from "antd";

const summaryCards = [
	{
		title: "入口与模式切换",
		description: "头像左侧的独立按钮可进入平台管理面板，并可一键返回业务端。",
		icon: <AppstoreOutlined />,
	},
	{
		title: "组织与用户",
		description: "已先落地部门/组织、平台用户和离职池骨架，后续接入真实接口与审计动作。",
		icon: <TeamOutlined />,
	},
	{
		title: "公告与日志",
		description: "平台公告、导入导出审计、日志检索与内容治理都归入这里。",
		icon: <FileTextOutlined />,
	},
] as const;

export default function PlatformHome() {
	return (
		<BasicContent className="h-full bg-colorBgContainer">
			<Card
				className="h-full"
				bodyStyle={{ height: "100%" }}
			>
				<div className="flex h-full flex-col gap-6">
					<div className="flex flex-col gap-3">
						<Space size={8} wrap>
							<Tag color="blue">平台管理</Tag>
							<Tag color="processing">管理面板</Tag>
						</Space>
						<Typography.Title level={2} className="!mb-0">
							平台管理面板
						</Typography.Title>
						<Typography.Paragraph type="secondary" className="!mb-0 max-w-3xl">
							这里是平台级治理入口，当前先用于承接平台模式切换、入口跳转和后续平台模块的统一入口。
						</Typography.Paragraph>
					</div>

					<Row gutter={[16, 16]}>
						{summaryCards.map(item => (
							<Col key={item.title} xs={24} md={8}>
								<Card
									className="h-full"
									title={(
										<div className="flex items-center gap-2">
											{item.icon}
											<span>{item.title}</span>
										</div>
									)}
								>
									<Typography.Paragraph className="!mb-0" type="secondary">
										{item.description}
									</Typography.Paragraph>
								</Card>
							</Col>
						))}
					</Row>

					<Descriptions
						bordered
						column={1}
						title="当前状态"
						items={[
							{
								key: "status",
								label: "平台入口",
								children: (
									<Space size={8}>
										<CheckCircleOutlined className="text-success" />
										<span>已接入头像左侧按钮</span>
									</Space>
								),
							},
							{
								key: "scope",
								label: "可见范围",
								children: "仅具备平台管理角色的账号可见。",
							},
							{
								key: "next",
								label: "下一步",
								children: "接入平台用户、平台组织、离职池和首页统计的真实接口。",
							},
						]}
					/>
				</div>
			</Card>
		</BasicContent>
	);
}

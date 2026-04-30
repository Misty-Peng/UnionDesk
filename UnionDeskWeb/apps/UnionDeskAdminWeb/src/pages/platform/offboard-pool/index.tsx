import type { TableProps } from "antd";

import { BasicContent } from "#src/components/basic-content";

import { DownloadOutlined, RollbackOutlined } from "@ant-design/icons";
import { Button, Card, Col, Row, Space, Table, Tag, Typography } from "antd";

interface OffboardRow {
	id: number;
	username: string;
	name: string;
	orgName: string;
	roles: string[];
	offboardAt: string;
	reason: string;
	operator: string;
}

const offboardRows: OffboardRow[] = [
	{
		id: 1,
		username: "former-ops",
		name: "离职运营",
		orgName: "平台运营部",
		roles: ["platform_operator"],
		offboardAt: "2026-04-20 16:30",
		reason: "人员离职",
		operator: "平台管理员",
	},
	{
		id: 2,
		username: "former-audit",
		name: "历史审计",
		orgName: "安全审计组",
		roles: ["security_auditor"],
		offboardAt: "2026-04-12 11:05",
		reason: "组织调整",
		operator: "平台管理员",
	},
];

const columns: TableProps<OffboardRow>["columns"] = [
	{
		title: "账号",
		dataIndex: "username",
		width: 160,
	},
	{
		title: "姓名",
		dataIndex: "name",
		width: 140,
	},
	{
		title: "原组织",
		dataIndex: "orgName",
		width: 180,
	},
	{
		title: "原角色",
		dataIndex: "roles",
		render: (_, record) => (
			<Space size={4} wrap>
				{record.roles.map(role => <Tag key={role}>{role}</Tag>)}
			</Space>
		),
	},
	{
		title: "离职时间",
		dataIndex: "offboardAt",
		width: 180,
	},
	{
		title: "离职原因",
		dataIndex: "reason",
		width: 140,
	},
	{
		title: "操作人",
		dataIndex: "operator",
		width: 140,
	},
	{
		title: "操作",
		key: "action",
		width: 180,
		render: () => (
			<Space size={8}>
				<Button size="small" type="link" disabled>恢复</Button>
				<Button size="small" type="link" danger disabled>删除</Button>
			</Space>
		),
	},
];

export default function PlatformOffboardPool() {
	return (
		<BasicContent className="h-full bg-colorBgLayout">
			<div className="flex h-full flex-col gap-4">
				<Row gutter={[16, 16]}>
					<Col xs={24} md={8}>
						<Card>
							<Typography.Text type="secondary">离职人员</Typography.Text>
							<Typography.Title level={3} className="!mb-0 !mt-2">2</Typography.Title>
						</Card>
					</Col>
					<Col xs={24} md={8}>
						<Card>
							<Typography.Text type="secondary">可恢复账号</Typography.Text>
							<Typography.Title level={3} className="!mb-0 !mt-2">2</Typography.Title>
						</Card>
					</Col>
					<Col xs={24} md={8}>
						<Card>
							<Typography.Text type="secondary">本月离职</Typography.Text>
							<Typography.Title level={3} className="!mb-0 !mt-2">2</Typography.Title>
						</Card>
					</Col>
				</Row>

				<Card
					className="min-h-0 flex-1"
					title="离职池"
					extra={(
						<Space>
							<Button icon={<DownloadOutlined />} disabled>导出</Button>
							<Button icon={<RollbackOutlined />} disabled>批量恢复</Button>
						</Space>
					)}
				>
					<Table<OffboardRow>
						rowKey="id"
						columns={columns}
						dataSource={offboardRows}
						pagination={false}
						scroll={{ x: 1080 }}
					/>
				</Card>
			</div>
		</BasicContent>
	);
}

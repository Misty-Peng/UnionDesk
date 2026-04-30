import type { TableProps } from "antd";

import { BasicContent } from "#src/components/basic-content";

import { PlusCircleOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, Card, Col, Row, Space, Table, Tag, Typography } from "antd";

interface PlatformUserRow {
	id: number;
	username: string;
	name: string;
	orgName: string;
	roles: string[];
	status: "active" | "disabled" | "offboard";
	lastLoginAt: string;
}

const statusText: Record<PlatformUserRow["status"], string> = {
	active: "在职",
	disabled: "停用",
	offboard: "离职",
};

const statusColor: Record<PlatformUserRow["status"], string> = {
	active: "success",
	disabled: "default",
	offboard: "warning",
};

const users: PlatformUserRow[] = [
	{
		id: 1,
		username: "admin",
		name: "平台管理员",
		orgName: "平台运营部",
		roles: ["platform_admin"],
		status: "active",
		lastLoginAt: "2026-04-30 09:21",
	},
	{
		id: 2,
		username: "auditor",
		name: "审计人员",
		orgName: "安全审计组",
		roles: ["security_auditor"],
		status: "active",
		lastLoginAt: "2026-04-29 18:04",
	},
	{
		id: 3,
		username: "ops-disabled",
		name: "停用账号",
		orgName: "平台运营部",
		roles: ["platform_operator"],
		status: "disabled",
		lastLoginAt: "-",
	},
];

const columns: TableProps<PlatformUserRow>["columns"] = [
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
		title: "所属组织",
		dataIndex: "orgName",
		width: 180,
	},
	{
		title: "角色",
		dataIndex: "roles",
		render: (_, record) => (
			<Space size={4} wrap>
				{record.roles.map(role => <Tag key={role}>{role}</Tag>)}
			</Space>
		),
	},
	{
		title: "状态",
		dataIndex: "status",
		width: 100,
		render: (_, record) => <Tag color={statusColor[record.status]}>{statusText[record.status]}</Tag>,
	},
	{
		title: "最近登录",
		dataIndex: "lastLoginAt",
		width: 180,
	},
	{
		title: "操作",
		key: "action",
		width: 160,
		render: () => (
			<Space size={8}>
				<Button size="small" type="link" disabled>编辑</Button>
				<Button size="small" type="link" disabled>离职</Button>
			</Space>
		),
	},
];

export default function PlatformUser() {
	return (
		<BasicContent className="h-full bg-colorBgLayout">
			<div className="flex h-full flex-col gap-4">
				<Row gutter={[16, 16]}>
					<Col xs={24} md={8}>
						<Card>
							<Typography.Text type="secondary">在职用户</Typography.Text>
							<Typography.Title level={3} className="!mb-0 !mt-2">2</Typography.Title>
						</Card>
					</Col>
					<Col xs={24} md={8}>
						<Card>
							<Typography.Text type="secondary">停用账号</Typography.Text>
							<Typography.Title level={3} className="!mb-0 !mt-2">1</Typography.Title>
						</Card>
					</Col>
					<Col xs={24} md={8}>
						<Card>
							<Typography.Text type="secondary">平台角色</Typography.Text>
							<Typography.Title level={3} className="!mb-0 !mt-2">3</Typography.Title>
						</Card>
					</Col>
				</Row>

				<Card
					className="min-h-0 flex-1"
					title="平台用户"
					extra={(
						<Space>
							<Button icon={<UploadOutlined />} disabled>导入</Button>
							<Button type="primary" icon={<PlusCircleOutlined />} disabled>新增用户</Button>
						</Space>
					)}
				>
					<Table<PlatformUserRow>
						rowKey="id"
						columns={columns}
						dataSource={users}
						pagination={false}
						scroll={{ x: 960 }}
					/>
				</Card>
			</div>
		</BasicContent>
	);
}

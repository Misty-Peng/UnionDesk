import type { TableProps } from "antd";
import type { IamUser } from "@uniondesk/shared";

import { fetchPlatformUsers } from "#src/api/platform/iam";
import { BasicContent } from "#src/components/basic-content";

import { PlusCircleOutlined, UploadOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Col, Row, Space, Table, Tag, Typography } from "antd";
import { useEffect, useState } from "react";

interface PlatformUserRow {
	id: number;
	username: string;
	mobile: string;
	email: string;
	scopeNames: string[];
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

function resolveUserStatus(user: IamUser): PlatformUserRow["status"] {
	if (user.employmentStatus === "offboarded") {
		return "offboard";
	}
	return user.status === 1 ? "active" : "disabled";
}

function toPlatformUserRow(user: IamUser): PlatformUserRow {
	return {
		id: user.id,
		username: user.username,
		mobile: user.mobile || "-",
		email: user.email || "-",
		scopeNames: user.businessDomainIds.length > 0
			? user.businessDomainIds.map(domainId => `域 #${domainId}`)
			: ["全局"],
		roles: user.roleCodes,
		status: resolveUserStatus(user),
		lastLoginAt: "-",
	};
}

const columns: TableProps<PlatformUserRow>["columns"] = [
	{
		title: "账号",
		dataIndex: "username",
		width: 160,
	},
	{
		title: "手机号",
		dataIndex: "mobile",
		width: 140,
	},
	{
		title: "邮箱",
		dataIndex: "email",
		width: 180,
	},
	{
		title: "绑定范围",
		dataIndex: "scopeNames",
		width: 180,
		render: (_, record) => (
			<Space size={4} wrap>
				{record.scopeNames.map(scopeName => <Tag key={scopeName}>{scopeName}</Tag>)}
			</Space>
		),
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
	const [users, setUsers] = useState<PlatformUserRow[]>([]);
	const [loading, setLoading] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);

	useEffect(() => {
		let ignore = false;

		setLoading(true);
		fetchPlatformUsers()
			.then((iamUsers) => {
				if (ignore) {
					return;
				}
				setUsers(iamUsers.map(toPlatformUserRow));
				setLoadError(null);
			})
			.catch(() => {
				if (ignore) {
					return;
				}
				setLoadError("平台用户加载失败，请稍后重试。");
			})
			.finally(() => {
				if (!ignore) {
					setLoading(false);
				}
			});

		return () => {
			ignore = true;
		};
	}, []);

	const activeCount = users.filter(user => user.status === "active").length;
	const disabledCount = users.filter(user => user.status === "disabled").length;
	const roleCount = new Set(users.flatMap(user => user.roles)).size;

	return (
		<BasicContent className="h-full bg-colorBgLayout">
			<div className="flex h-full flex-col gap-4">
				<Row gutter={[16, 16]}>
					<Col xs={24} md={8}>
						<Card>
							<Typography.Text type="secondary">在职用户</Typography.Text>
							<Typography.Title level={3} className="!mb-0 !mt-2">{activeCount}</Typography.Title>
						</Card>
					</Col>
					<Col xs={24} md={8}>
						<Card>
							<Typography.Text type="secondary">停用账号</Typography.Text>
							<Typography.Title level={3} className="!mb-0 !mt-2">{disabledCount}</Typography.Title>
						</Card>
					</Col>
					<Col xs={24} md={8}>
						<Card>
							<Typography.Text type="secondary">平台角色</Typography.Text>
							<Typography.Title level={3} className="!mb-0 !mt-2">{roleCount}</Typography.Title>
						</Card>
					</Col>
				</Row>
				{loadError
					? <Alert type="error" showIcon message={loadError} />
					: null}

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
						loading={loading}
						pagination={false}
						scroll={{ x: 1080 }}
					/>
				</Card>
			</div>
		</BasicContent>
	);
}

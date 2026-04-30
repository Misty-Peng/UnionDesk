import type { DataNode } from "antd/es/tree";
import type { TableProps } from "antd";

import { BasicContent } from "#src/components/basic-content";

import { ApartmentOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { Button, Card, Col, Row, Space, Table, Tag, Tree, Typography } from "antd";

interface DeptRow {
	id: number;
	code: string;
	name: string;
	parentName: string;
	leader: string;
	sortNo: number;
	status: "enabled" | "disabled";
	remark: string;
}

const treeData: DataNode[] = [
	{
		key: "platform",
		title: "平台组织",
		children: [
			{ key: "platform-ops", title: "平台运营部" },
			{ key: "security-audit", title: "安全审计组" },
			{ key: "service-governance", title: "服务治理组" },
		],
	},
];

const deptRows: DeptRow[] = [
	{
		id: 1,
		code: "platform-ops",
		name: "平台运营部",
		parentName: "平台组织",
		leader: "平台管理员",
		sortNo: 10,
		status: "enabled",
		remark: "负责平台账号、角色和业务域配置。",
	},
	{
		id: 2,
		code: "security-audit",
		name: "安全审计组",
		parentName: "平台组织",
		leader: "审计人员",
		sortNo: 20,
		status: "enabled",
		remark: "负责审计日志和安全策略核查。",
	},
	{
		id: 3,
		code: "service-governance",
		name: "服务治理组",
		parentName: "平台组织",
		leader: "-",
		sortNo: 30,
		status: "disabled",
		remark: "预留组织节点。",
	},
];

const columns: TableProps<DeptRow>["columns"] = [
	{
		title: "组织编码",
		dataIndex: "code",
		width: 180,
	},
	{
		title: "组织名称",
		dataIndex: "name",
		width: 160,
	},
	{
		title: "上级组织",
		dataIndex: "parentName",
		width: 160,
	},
	{
		title: "负责人",
		dataIndex: "leader",
		width: 140,
	},
	{
		title: "排序",
		dataIndex: "sortNo",
		width: 90,
	},
	{
		title: "状态",
		dataIndex: "status",
		width: 100,
		render: (_, record) => (
			<Tag color={record.status === "enabled" ? "success" : "default"}>
				{record.status === "enabled" ? "启用" : "停用"}
			</Tag>
		),
	},
	{
		title: "备注",
		dataIndex: "remark",
	},
];

export default function PlatformDept() {
	return (
		<BasicContent className="h-full bg-colorBgLayout">
			<Row gutter={[16, 16]} className="h-full">
				<Col xs={24} lg={7} className="h-full">
					<Card
						className="h-full"
						title={(
							<Space>
								<ApartmentOutlined />
								<span>组织树</span>
							</Space>
						)}
					>
						<Tree
							defaultExpandAll
							treeData={treeData}
						/>
					</Card>
				</Col>
				<Col xs={24} lg={17} className="h-full">
					<Card
						className="h-full"
						title="部门 / 组织管理"
						extra={<Button type="primary" icon={<PlusCircleOutlined />} disabled>新增组织</Button>}
					>
						<Typography.Paragraph type="secondary">
							组织树用于承载平台内部人员归属，与业务域配置分开维护。
						</Typography.Paragraph>
						<Table<DeptRow>
							rowKey="id"
							columns={columns}
							dataSource={deptRows}
							pagination={false}
							scroll={{ x: 900 }}
						/>
					</Card>
				</Col>
			</Row>
		</BasicContent>
	);
}

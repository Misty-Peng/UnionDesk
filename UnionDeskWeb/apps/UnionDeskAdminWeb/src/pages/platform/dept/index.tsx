import type { PlatformOrganizationView } from "@uniondesk/shared";
import type { DataNode } from "antd/es/tree";
import type { TableProps } from "antd";

import { fetchPlatformOrganizations } from "#src/api/platform/organization";
import { BasicContent } from "#src/components/basic-content";

import { ApartmentOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Col, Row, Space, Table, Tag, Tree, Typography } from "antd";
import { useEffect, useState } from "react";

interface DeptRow {
	id: number;
	code: string;
	name: string;
	parentName: string;
	leader: string;
	sortNo: number;
	status: number;
	remark: string;
}

function buildTreeData(units: PlatformOrganizationView[]): DataNode[] {
	const nodeMap = new Map<string, DataNode>();
	const rootNodes: DataNode[] = [];

	for (const unit of units) {
		nodeMap.set(String(unit.id), {
			key: String(unit.id),
			title: unit.name,
			children: [],
		});
	}

	for (const unit of units) {
		const node = nodeMap.get(String(unit.id));
		if (!node) {
			continue;
		}
		if (unit.parentId == null) {
			rootNodes.push(node);
			continue;
		}
		const parentNode = nodeMap.get(String(unit.parentId));
		if (!parentNode) {
			rootNodes.push(node);
			continue;
		}
		parentNode.children = [...(parentNode.children ?? []), node];
	}

	return rootNodes;
}

function toDeptRow(unit: PlatformOrganizationView): DeptRow {
	return {
		id: unit.id,
		code: unit.code,
		name: unit.name,
		parentName: unit.parentName || "-",
		leader: unit.leaderName || "-",
		sortNo: unit.orderNo,
		status: unit.status,
		remark: unit.remark || "-",
	};
}

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
			<Tag color={record.status === 1 ? "success" : "default"}>
				{record.status === 1 ? "启用" : "停用"}
			</Tag>
		),
	},
	{
		title: "备注",
		dataIndex: "remark",
	},
];

export default function PlatformDept() {
	const [deptRows, setDeptRows] = useState<DeptRow[]>([]);
	const [treeData, setTreeData] = useState<DataNode[]>([]);
	const [loading, setLoading] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);

	useEffect(() => {
		let ignore = false;

		setLoading(true);
		fetchPlatformOrganizations()
			.then((units) => {
				if (ignore) {
					return;
				}
				setDeptRows(units.map(toDeptRow));
				setTreeData(buildTreeData(units));
				setLoadError(null);
			})
			.catch(() => {
				if (ignore) {
					return;
				}
				setLoadError("平台组织加载失败，请稍后重试。");
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
						{loadError
							? <Alert type="error" showIcon message={loadError} className="!mb-4" />
							: null}
						<Table<DeptRow>
							rowKey="id"
							columns={columns}
							dataSource={deptRows}
							loading={loading}
							pagination={false}
							scroll={{ x: 900 }}
						/>
					</Card>
				</Col>
			</Row>
		</BasicContent>
	);
}

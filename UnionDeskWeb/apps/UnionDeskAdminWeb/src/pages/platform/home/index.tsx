import type { LoginLogView } from "@uniondesk/shared";

import { fetchPlatformOverview } from "#src/api/platform/overview";
import { BasicContent } from "#src/components/basic-content";

import { Alert, Card, Col, List, Row, Space, Statistic, Tag, Typography } from "antd";
import { useEffect, useState } from "react";

function resolveAuditTitle(log: LoginLogView): string {
	return log.result === "success" ? "登录成功" : "登录失败";
}

function resolveAuditDescription(log: LoginLogView): string {
	const parts = [
		log.loginIdentifierMasked,
		log.reason || "无附加原因",
		log.createdAt,
	];
	return parts.filter(Boolean).join(" · ");
}

export default function PlatformHome() {
	const [overview, setOverview] = useState({
		domainCount: 0,
		activeUserCount: 0,
		disabledUserCount: 0,
		offboardUserCount: 0,
		pendingImportTaskCount: 0,
		announcementCount: 0,
		recentAuditCount: 0,
		loginLogs: [] as LoginLogView[],
	});
	const [loading, setLoading] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);

	useEffect(() => {
		let ignore = false;

		setLoading(true);
		fetchPlatformOverview()
			.then((nextOverview) => {
				if (ignore) {
					return;
				}
				setOverview(nextOverview);
				setLoadError(null);
			})
			.catch(() => {
				if (ignore) {
					return;
				}
				setLoadError("平台首页统计加载失败，请稍后重试。");
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
							这里承接平台级治理摘要，只展示平台域、用户与审计等总览信息，不混入业务看板指标。
						</Typography.Paragraph>
					</div>

					<Row gutter={[16, 16]}>
						<Col xs={24} md={12} xl={6}>
							<Card loading={loading}>
								<Statistic title="平台域数量" value={overview.domainCount} />
							</Card>
						</Col>
						<Col xs={24} md={12} xl={6}>
							<Card loading={loading}>
								<Statistic title="在职用户" value={overview.activeUserCount} />
								<Typography.Text type="secondary">停用账号 {overview.disabledUserCount} 人</Typography.Text>
							</Card>
						</Col>
						<Col xs={24} md={12} xl={6}>
							<Card loading={loading}>
								<Statistic title="离职人员" value={overview.offboardUserCount} />
							</Card>
						</Col>
						<Col xs={24} md={12} xl={6}>
							<Card loading={loading}>
								<Statistic title="最近审计" value={overview.recentAuditCount} suffix="条" />
							</Card>
						</Col>
					</Row>
					{loadError
						? <Alert type="error" showIcon message={loadError} />
						: null}

					<Row gutter={[16, 16]} className="min-h-0 flex-1">
						<Col xs={24} xl={16} className="min-h-0">
							<Card
								className="h-full"
								title="最近审计"
								loading={loading}
							>
								<List
									dataSource={overview.loginLogs}
									locale={{ emptyText: "暂无审计记录" }}
									renderItem={log => (
										<List.Item>
											<List.Item.Meta
												title={(
													<Space size={8}>
														<span>{log.username || "未知账号"}</span>
														<Tag color={log.result === "success" ? "success" : "error"}>
															{resolveAuditTitle(log)}
														</Tag>
													</Space>
												)}
												description={resolveAuditDescription(log)}
											/>
										</List.Item>
									)}
								/>
							</Card>
						</Col>
						<Col xs={24} xl={8} className="min-h-0">
							<Card
								className="h-full"
								title="预留模块"
								loading={loading}
							>
								<div className="flex flex-col gap-3">
									<div className="flex items-center justify-between">
										<Typography.Text>待处理导入任务</Typography.Text>
										<Tag>{overview.pendingImportTaskCount}</Tag>
									</div>
									<div className="flex items-center justify-between">
										<Typography.Text>公告数量</Typography.Text>
										<Tag>{overview.announcementCount}</Tag>
									</div>
									<Typography.Paragraph type="secondary" className="!mb-0">
										导入导出中心与公告中心尚未进入本轮开发，当前先保留首页统计位。
									</Typography.Paragraph>
								</div>
							</Card>
						</Col>
					</Row>
				</div>
			</Card>
		</BasicContent>
	);
}

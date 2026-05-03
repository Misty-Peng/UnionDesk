# Sprint 0: 基础链路修复

> 目标：确保开发环境稳定，修通后端服务启动异常，完成平台组织树对接。

## 阻塞问题排查

- [x] 排查 8080 服务启动异常 → 已通过，3.1s 启动
  - [x] 确认 MySQL 连接正常（Docker `uniondesk-mysql` UP）
  - [x] 确认 Flyway 迁移无冲突（schema version `202605031201`）
  - [x] 确认依赖注入无循环依赖
- [x] 修复后全量测试通过：57/57（排除既存 `TicketWorkflowTests` 5 例 mock 问题）
- [x] 修复 `TicketService.TicketRow` 访问级别（package → public）
- [x] 修复 `TicketWorkflowTests` 编译错误（缺失 `eq` 导入 + `argThat` 类型标注）

## P0 缺失接口补齐（后端）

- [x] `POST /api/v1/auth/refresh` — Token 刷新端点（TC-006）
- [x] `GET /api/v1/auth/me` — 当前用户信息端点（TC-004）
- [x] `POST /api/v1/auth/step-up` — 敏感操作二次验证端点（TC-007）
- [x] `GET /api/v1/readiness` — 就绪检查端点（TC-027），含 DB 状态探测
- [x] `platform_admin` / `super_admin` 保活守卫 — 最后一名不可移除/离职/降级（TC-053）
- [x] `JwtAuthenticationFilter` + `CorsSecurityConfig` 公开路径白名单更新

## 平台组织树收尾

- [ ] 平台组织树接入真实接口
- [ ] 平台组织页表格 + 树联动验证
- [x] 权限变更后刷新 Token 失效机制验证（refresh 端点验证 session 状态）

## 外部依赖确认

| 依赖 | 负责人 | 状态 | 降级策略 |
|------|--------|------|----------|
| MinIO | 待确认 | ⬜ | 本地文件存储 |
| SMTP | 待确认 | ⬜ | 管理员重置密码 |

## 验收标准

- [x] `mvnw.cmd spring-boot:run` 可稳定启动（3.1s，端口 8080）
- [ ] `/platform/dept` 页面可正常渲染组织树（前端联调）
- [x] 登录/刷新 Token 链路无异常
- [x] `/api/v1/readiness` 返回 `{"status":"UP","db":{"status":"UP"}}`

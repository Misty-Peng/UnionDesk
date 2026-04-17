# UnionDesk

> 面向企业客户服务场景的多业务域工单平台，统一处理 **咨询**、**工单**、**反馈/建议** 三类请求。

当前仓库为 UnionDesk 的项目工作区，**尚处于启动阶段**：产品需求、系统架构、数据库设计、技术栈方案已沉淀在 `doc/`，代码仓库（`UnionDesk/` 后端、`UnionDeskWeb/` 前端）尚未初始化。本 README 用于描述当前真实状态与下一步动作；`AGENTS.md` 用于约束后续开发协作。

---

## 1. 仓库结构

```text
UnionDesk/
├─ AGENTS.md                # 开发协作与代码代理（Agent）指导规范
├─ README.md                # 本文件
├─ doc/                     # 中文设计文档
│  ├─ PRD.md                # 产品需求文档
│  ├─ 系统架构设计.md        # 模块化单体架构 + 演进路线
│  ├─ 数据库设计.md          # 实体、索引、生命周期
│  ├─ 技术栈方案.md          # 前后端、数据、日志、部署选型
│  ├─ schema.sql            # MySQL 8 初始化 DDL
│  └─ README.md             # 文档总览
├─ UnionDesk/               # 后端服务工程（待初始化）
└─ UnionDeskWeb/            # 前端工作区（待初始化，含客户端 + 管理端）
```

## 2. 项目定位

- **UnionDesk**（后端）：身份认证、IAM、业务域、工单、咨询、反馈、通知、审计，统一 REST API。
- **UnionDeskWeb**（前端）：Monorepo，包含：
  - `apps/customer-web`：客户端（提单、查单、反馈）
  - `apps/admin-web`：管理端（客服工作台、配置、权限）
  - `packages/shared`：共享 API Client、类型、组件

详细职责与模块划分见 `doc/系统架构设计.md`。

## 3. MVP 目标（摘自 PRD）

1. 多业务域的数据与权限隔离。
2. 每个业务域独立配置工单类型与动态字段。
3. 打通"客户提交 → 客服处理 → 关闭"闭环。
4. SLA 规则与超时预警。
5. 预留知识库二期接口。

## 4. 技术栈基线

| 层次 | 选型 |
|---|---|
| 后端运行时 | Java 21+（目标 Java 25 LTS，按团队可用版本就近落地） |
| 后端框架 | Spring Boot 3.x、Spring Security（JWT Access + Refresh） |
| 持久层 | MyBatis（或 MyBatis-Plus） |
| 数据库迁移 | Flyway |
| 缓存 | Redis |
| 异步 | RabbitMQ（评估后再引入） |
| 数据库 | MySQL 8.x（开发先用 8.0，目标 8.4 LTS） |
| 对象存储 | S3 协议（开发用 MinIO） |
| 前端 | React + TypeScript + Vite + Ant Design |
| 包管理 | pnpm workspace |
| 日志 | ELK 优先，本地回退 Logback 滚动文件 |
| 容器化 | Docker / docker compose |

完整细节见 `doc/技术栈方案.md`。

## 5. 当前完成度

- [x] 产品需求文档 PRD
- [x] 系统架构设计文档
- [x] 数据库设计文档 + `schema.sql`
- [x] 技术栈方案
- [x] `AGENTS.md` 开发协作规范
- [ ] 后端工程脚手架（Spring Boot + Flyway + MyBatis）
- [ ] 前端 Monorepo 脚手架（pnpm + Vite + AntD）
- [ ] 本地一键启动（docker compose + MySQL + MinIO）
- [ ] 鉴权与 IAM 最小闭环
- [ ] 工单核心闭环（提交 → 处理 → 关闭）

## 6. 下一步路线

### 阶段 0：基础设施
1. 初始化 `UnionDesk/` Spring Boot 工程，接入 Flyway 执行 `doc/schema.sql`。
2. 初始化 `UnionDeskWeb/` pnpm workspace，拆出 `apps/customer-web`、`apps/admin-web`、`packages/shared`。
3. 提供 `docker-compose.yml`（MySQL 8、Redis、MinIO）。

### 阶段 1：最小闭环
1. 登录 / Token 刷新 / 基于 `business_domain_id` 的数据权限。
2. 业务域 CRUD + 工单类型 + 动态字段配置。
3. 客户端完成"选域 → 提单 → 查单"。
4. 管理端完成"工单池 → 分配 → 回复 → 关闭"。
5. 审计日志（`ticket_event_log` / `operation_log`）。

### 阶段 2：增强
1. SLA 计时与超时预警。
2. 咨询会话与"咨询转工单"。
3. 通知模板（站内 → 邮件/短信）。
4. OpenAPI 驱动的前端类型化 API Client。

## 7. 快速开始（占位）

> 后端 / 前端工程尚未落地，以下命令将在阶段 0 完成后生效。当前请先阅读 `AGENTS.md` 与 `doc/` 下设计文档。

```powershell
# 启动依赖（MySQL / Redis / MinIO）
docker compose up -d

# 后端
cd UnionDesk
.\mvnw.cmd spring-boot:run

# 前端
cd ..\UnionDeskWeb
pnpm install
pnpm -C apps/customer-web dev
pnpm -C apps/admin-web dev
```

## 8. 参考

- 产品需求：`doc/PRD.md`
- 系统架构：`doc/系统架构设计.md`
- 数据库设计：`doc/数据库设计.md`
- 技术栈方案：`doc/技术栈方案.md`
- 初始化 DDL：`doc/schema.sql`
- 开发协作规范：`AGENTS.md`

# UnionDesk 工作区

`UnionDesk` 当前由两个核心工程组成：

- `UnionDesk`：后端服务，负责业务域、咨询会话、工单、统计接口等能力
- `UnionDeskWeb`：前端工作区，包含客户侧与管理端两个 React 应用

同时保留 `doc` 目录，用于沉淀产品、架构、数据库和技术方案文档。

## 当前完成度

目前已经具备一个可继续迭代的初步可运行版本，覆盖以下最小业务链路：

- 客户侧
  - 选择业务域
  - 发起咨询并查看咨询历史
  - 创建工单
  - 查看自己的最近工单
- 管理端
  - 查看业务域看板统计
  - 查看工单列表并更新状态
  - 查看咨询会话并回复客户
- 后端
  - Flyway 初始化数据库
  - 提供域、咨询、工单、看板统计等 REST API
  - 提供本地文件日志，后续可切换到 ELK

## 工作区结构

```text
UnionDesk/
├─ doc/                    # 中文文档
├─ UnionDesk/              # Spring Boot 后端
└─ UnionDeskWeb/           # React 前端工作区
```

## 技术栈

- 后端：Java 21、Spring Boot 3.4、Spring Security、MyBatis、Flyway
- 数据库：MySQL 8.0（本地 Docker 开发环境）
- 前端：React、TypeScript、Vite、Ant Design、pnpm workspace
- 日志：Logback 本地滚动文件；后续接入 ELK

说明：

- 文档里曾规划 MySQL 8.4，但当前本地开发链路为了兼容 Flyway，已先落到 `MySQL 8.0`，这样能保证本地稳定启动与迁移执行。

## 快速启动

### 1. 启动数据库

```powershell
cd F:\WorkSpace\UnionDesk\UnionDesk
docker compose up -d
```

### 2. 启动后端

优先使用 Maven Wrapper：

```powershell
cd F:\WorkSpace\UnionDesk\UnionDesk
.\mvnw.cmd spring-boot:run
```

如果你的终端已经识别 `mvn`，也可以使用：

```powershell
mvn spring-boot:run
```

### 3. 启动前端

```powershell
cd F:\WorkSpace\UnionDesk\UnionDeskWeb
pnpm install
pnpm dev:customer
pnpm dev:admin
```

默认访问地址：

- 客户侧：`http://localhost:5173`
- 管理端：`http://localhost:5174`
- 后端：`http://localhost:8080`

## 已验证内容

我已经在本地完成以下验证：

- `docker compose up -d`
- `.\mvnw.cmd test` / `mvn test`
- `pnpm build`
- 后端真实接口验证：
  - `GET /api/v1/health`
  - `GET /api/v1/domains`
  - `GET /api/v1/dashboard`
  - `GET /api/v1/tickets`
  - `POST /api/v1/tickets`
  - `POST /api/v1/consultations/messages`
  - `GET /api/v1/consultations`
  - `GET /api/v1/consultations/{sessionNo}/messages`

## 后续建议

下一阶段建议继续推进：

1. 接入 JWT 登录态与基于 `business_domain_id` 的权限控制
2. 补齐工单详情、回复、附件、反馈等完整业务流程
3. 为前端增加自动化测试和端到端测试
4. 将 Flyway SQL 中已提示弃用的 `VALUES()` 语法逐步替换

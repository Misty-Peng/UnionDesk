# AGENTS.md

本文件定义本项目中所有 Agent 的统一行为规范与执行准则。  
该文件面向人工智能研发 Agent（如 CodeX / Codex / 自定义 Agent），用于指导其在本项目中的研发、分析与决策行为。

---

# 1. 角色定义

你是一个：

> **人工智能研发领域专家级 Agent**

具备以下能力：

- 架构设计能力（系统架构 / Agent 架构 / 数据架构）
- 研发能力（编码、重构、调试、性能优化）
- 方案能力（方案设计、对比分析、风险识别）
- 推理能力（多步任务拆解、复杂问题分析）
- 工程能力（遵守分层、规范、可维护性）

行为准则：
这是你的工作准则，需要遵守你的工作准则

1. 编码前需要先设计和思考
不要假设，不要隐藏困惑，要暴露权衡。
- 明确声明假设，不确定就问
- 如果存在多种解读，请全部列出，不要默默的选择一个
- 如果存在更简单、更好的方案，请说出来，该反驳时就反驳
- 如果有不清楚的地方，停下来，说明什么地方不清楚，然后问

2. 简单性优先
使用最少的的代码解决问题，不做任何投机性的开发。
- 不添加没被要求的功能
- 不为单次使用的代码做抽象
- 不添加没被要求的灵活性和可配置性
- 不为不可能发生的场景做错误处理
- 如果写了200行，但50行就能解决问题，那么就进行重写

3. 精准修改
只动必须动的，只清理自己造成的。
编辑现有代码时：
- 不改善相邻的代码，注释或者格式
- 不重构没坏的东西，
- 匹配现有的代码风格，即使你会用不同的方式
- 如果发现无关的的死代码，提一句就好，不需要删除
当你的更改或创建孤儿内容时：
- 删除你的更改、未使用的导入、变量或函数
- 不要在没有要求的情况下，删除现有的死代码

4. 目标驱动执行
定义成功标准，循环直到验证通过
- 添加验证 -> 写无效输入测试，让他通过
- 修复BUG -> 写复现测试，让他通过
- 重构X -> 确保测试在重构前后都通过

对于多步骤任务，要列一个简短的计划，每一个步骤都要添加检查点：
''' 
1. [步骤1] -> 验证 [检查]
2. [步骤2] -> 验证 [检查]
3. [步骤3] -> 验证 [检查]
……
'''

强大的成功标准使你可以独立循环。弱标准（“让他发挥作用”）需要不断的验证。

这些准则在以下情况下有效：
- 在差异中不必要的更改
- 由于过度复杂而减少的重写
- 在实现之前，而不是错误之后的澄清问题

---

## 2. 目录与模块约定

### 2.1 后端 `UnionDesk/`

按 `doc/系统架构设计.md` §4 划分模块，建议包结构：

```
com.uniondesk
├─ auth           # 登录、Token、密码策略
├─ iam            # 用户、角色、域授权、权限中间件
├─ domain         # 业务域配置
├─ ticket         # 工单类型、动态字段、状态流转、SLA
├─ consultation   # 咨询会话、转工单
├─ feedback       # 反馈/建议
├─ notification   # 站内/邮件/短信模板与发送
├─ audit          # 审计日志
└─ common         # 通用：request_id、异常、错误码、分页、JSON
```

- 控制器路径统一 `/api/v1/**`。
- 禁止跨模块直接访问对端 Mapper，必须通过对端的 Service / Facade。
- Flyway 脚本位于 `src/main/resources/db/migration/`，命名 `V{yyyyMMddHHmm}__{desc}.sql`，**只能追加，不能修改已发布脚本**。

### 2.2 前端 `UnionDeskWeb/`

```
UnionDeskWeb/
├─ apps/
│  ├─ customer-web/       # 客户端
│  └─ admin-web/          # 管理端
├─ packages/
│  └─ shared/             # API Client（OpenAPI 生成）、类型、组件、主题
└─ pnpm-workspace.yaml
```

- 两端**共用** `packages/shared` 中的 API Client 与类型，不在应用内重复定义。
- 路由、状态（Zustand/RTK 二选一并保持一致）、错误处理统一在 `shared` 中固化。

---

## 3. 编码规范

### 3.1 通用
- 文件与代码使用 **UTF-8**，禁止 BOM。
- 不得提交注释掉的死代码、`TODO` 不得失去负责人与 issue 链接。
- 不得擅自添加或删除注释/文档（遵循用户规则）。

### 3.2 Java
- JDK：按 `doc/技术栈方案.md` 执行（目标 Java 25，实际按本地可用版本落地，至少 Java 21）。
- 格式：Google Java Style 或 Spring 官方格式，二选一并在 `.editorconfig` / Spotless 固化。
- 包内不得出现循环依赖；DTO 与实体分离。
- 所有 REST 接口必须：
  - 走统一异常处理 + 统一错误码。
  - 创建/流转接口支持 `Idempotency-Key`。
  - 入参校验使用 `jakarta.validation`。

### 3.3 TypeScript / React
- `strict: true`；禁止 `any`，必要时使用 `unknown` + 类型守卫。
- 组件优先函数式 + Hooks；公共组件沉入 `packages/shared`。
- 接口层类型**由后端 OpenAPI 生成**，禁止手写重复的请求/响应类型。

### 3.4 SQL 与数据库
- 字符集 `utf8mb4`；时间 `datetime(3)`。
- 主键 `bigint unsigned`，表名 `snake_case`。
- 禁止依赖 `NULL` 的唯一索引语义（见 `doc/数据库设计.md` §2.3）。
- 索引策略须匹配 `doc/数据库设计.md` §4。

---

## 4. 安全与权限红线

1. 鉴权：JWT Access + Refresh，密码 Argon2 或 bcrypt。
2. 授权：RBAC + 业务域范围；**后端计算有效域范围**，前端只用于展示。
3. 对象级权限：工单详情、附件、咨询消息必须在 Service 层复核归属域与归属人。
4. 附件通过签名 URL 访问，禁止直链；上传前校验大小与类型。
5. 管理端写接口必须落 `operation_log`，核心业务写操作必须落 `ticket_event_log` / `consultation_message`。
6. 禁止在日志、异常消息中输出密码、令牌、身份证号等敏感字段。

---

## 5. 提交、分支与评审

- 分支模型：`master`（或 `main`）为主干；功能分支 `feat/xxx`、修复 `fix/xxx`、文档 `docs/xxx`、重构 `refactor/xxx`。
- Commit 信息遵循 **Conventional Commits**：`feat(ticket): 支持动态字段必填校验`。
- PR 必须：
  1. 关联 issue 或需求条目。
  2. 勾选是否改动 `doc/`、`schema.sql`、Flyway 脚本。
  3. 通过本地构建与测试（见 §6）。
  4. 至少一位评审通过。

---

## 6. 构建与验证（所有 Agent 必须在提交前执行）

> 工程初始化完成前，以下命令中未落地的部分可跳过；一旦落地，Agent 必须在每次提交前完整执行。

### 后端
```powershell
cd UnionDesk
.\mvnw.cmd -q -DskipTests=false verify
```

### 前端
```powershell
cd UnionDeskWeb
pnpm install --frozen-lockfile
pnpm -r lint
pnpm -r typecheck
pnpm -r build
```

### 数据库迁移
- 新增表 / 列 / 索引必须通过 Flyway 脚本，不得手工改库。
- 启动时 Flyway 必须能**从空库**一次性迁移成功。

---

## 7. 测试纪律

1. 新功能必须带测试，或在 PR 中显式说明测试计划。
2. 修 Bug 必须补回归测试。
3. **禁止**为了让流水线通过而删除或弱化已有测试；如需调整，须在 PR 中说明。
4. 分层建议：
   - 后端：单元测试（Service / 校验 / 状态机） + MyBatis 集成测试（Testcontainers MySQL） + 关键 REST 的切片测试。
   - 前端：组件/Hook 单测；关键流程端到端测试（Playwright，后续引入）。

---

## 8. 日志与可观测性

- 日志框架：Logback；日志分类：**应用日志 / 业务日志 / 审计日志**。
- 每个请求生成 `request_id` 并透传下游、记录到日志与审计。
- 不得使用 `System.out` / `console.log` 作为生产日志手段。
- 建议接入 ELK；未接入前使用本地滚动文件。

---

## 9. AI 代理（Cascade 等）工作守则

面向自动化代码代理的额外约束：

1. **先读后写**：执行任何修改前，先阅读 `AGENTS.md` 与相关 `doc/` 文档、目标文件。
2. **最小变更**：一次 PR 只做一件事；避免顺手重构无关代码。
3. **不擅自新增文件**：特别是 `.md` 进度笔记、脚本、示例工程；除非任务明确需要。
4. **不修改已发布的 Flyway 脚本**：只能追加新版本。
5. **破坏性命令需确认**：`rm -rf`、数据库重置、`git push --force` 等必须由人类审批。
6. **路径使用绝对路径**：在 Windows + PowerShell 环境下注意引号与反斜杠。
7. **与文档保持一致**：若发现代码与 `doc/` 冲突，停止编码并在回复中提示，不要自行"对齐"。
8. **遵循本项目编码规范与安全红线**（§3、§4）。
9. **输出完整代码**：不得使用 `...` 省略。
10. **不添加/删除注释**：除非任务明确要求。

---

## 10. 常见任务剧本

### 10.1 新增一张业务表
1. 在 `doc/数据库设计.md` 补充实体与索引策略。
2. 在 `doc/schema.sql` 同步 DDL（保持与 Flyway 一致的最终态）。
3. 新增 Flyway 脚本 `V{yyyyMMddHHmm}__add_xxx.sql`。
4. 新增 MyBatis Mapper / Entity / Service / Controller。
5. 补单测 + 集成测试，运行 §6 校验。

### 10.2 新增一个 REST 接口
1. 确认模块归属（§2.1）。
2. 在该模块加 Controller + Service + DTO；校验与错误码走统一机制。
3. 更新 OpenAPI 定义（后续接入后），触发前端 `packages/shared` 类型再生成。
4. 至少一个切片测试覆盖 2xx / 4xx / 权限拒绝。

### 10.3 新增一个前端页面
1. 确定属于 `customer-web` 还是 `admin-web`。
2. 公共能力沉到 `packages/shared`。
3. 接口只能走 `shared` 中的类型化 Client。
4. 通过 `pnpm -r typecheck && pnpm -r build`。

---

## 11. 变更本文件

- 修改 `AGENTS.md` 需在 PR 标题使用 `docs(agents): ...`。
- 如与 `doc/` 冲突，需同 PR 一并更新 `doc/` 并在说明中列出差异。

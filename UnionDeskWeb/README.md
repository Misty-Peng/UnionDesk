# UnionDeskWeb 前端工作区

## 项目定位

`UnionDeskWeb` 是前端工作区，包含两个应用：

- `customer-web`：客户侧，强调简约、现代、移动端友好
- `admin-web`：管理端，强调稳定、清晰、可用

## 技术栈

- React
- TypeScript
- Vite
- Ant Design
- pnpm workspace

## 目录结构

```text
UnionDeskWeb/
├─ apps/
│  ├─ customer-web/    # 客户侧应用
│  └─ admin-web/       # 管理端应用
├─ packages/
│  └─ shared/          # 共享类型与 API 封装
├─ package.json
├─ pnpm-workspace.yaml
└─ tsconfig.base.json
```

## 当前功能

### 客户侧

- 选择业务域
- 查看最近工单
- 创建工单
- 发起咨询并查看咨询历史

### 管理端

- 查看业务看板统计
- 查看工单列表
- 更新工单状态
- 查看咨询会话并回复

## 开发启动

```powershell
pnpm install
pnpm dev:customer
pnpm dev:admin
```

## 构建验证

```powershell
pnpm build
```

## 本地访问地址

- 客户侧：`http://localhost:5173`
- 管理端：`http://localhost:5174`

## 说明

- 开发环境下，Vite 会把 `/api/*` 代理到 `http://localhost:8080`
- 共享请求封装位于 `packages/shared/src/api.ts`
- 当前版本先保证核心流程可运行，后续可继续拆分路由、状态管理和自动化测试

# 文档总览

本目录用于维护 UnionDesk 的产品、架构、数据库和管理端设计文档。

## 仓库定位

- `UnionDesk`：后端服务
- `UnionDeskWeb`：前端应用，包含 `UnionDeskCustomerWeb` 和 `UnionDeskAdminWeb`
- `agent-work/`：Agent 工作产物目录，不作为正式文档目录

## 当前文档

- `PRD.md`：产品需求说明，定义业务目标、角色与核心流程
- `系统架构设计.md`：系统架构说明，定义模块边界、数据流、部署与可观测性
- `技术栈方案.md`：技术选型与基础约定
- `数据库设计.md`：数据库设计说明，定义实体、索引、归档与迁移约定
- `schema.sql`：数据库最终态 DDL
- `平台管理端设计.md`：平台管理端入口、模式切换、模块边界与当前进度
- `checklist/platform/平台管理端开发清单.md`：平台管理端开发清单与进度记录

## 当前对齐状态

- 管理端当前落点是 `UnionDeskWeb/apps/UnionDeskAdminWeb`
- 平台入口已经接入，位置在头部头像左侧
- 平台首页 `/platform/home` 已可访问
- `system/menu`、`system/role` 已是可用页面，`system/user` 与 `system/dept` 目前还是骨架页
- 导入导出、公告、日志、屏蔽词、知识库仍是后续模块
- `schema.sql` 只记录最终 DDL，不记录历史迁移过程

## 维护规则

- 需求边界变化时，优先同步 `PRD.md`、`系统架构设计.md`、`数据库设计.md` 与平台管理端设计文档
- 已完成事项同步到 checklist，未完成事项不要写成已完成
- 与代码实现出现偏差时，以当前代码实现和后端迁移事实为准，并在文档里说明差异

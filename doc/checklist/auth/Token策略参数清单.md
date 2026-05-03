# Token 策略参数清单

## 业务域
- 认证 / 会话

## 目标
- 明确 Access Token、Refresh Token、并发会话数与 Refresh Token 轮换策略的默认值及配置入口。

## 开发任务
- [x] 在 `3.1.7` 中补充 Token 默认时长、并发会话数和轮换规则。
- [x] 在 `3.2.7` 中补充 Token 策略可由 `system_config` 统一维护。
- [x] 明确同一账号最多 `5` 个并发会话，超限时踢掉最旧会话。
- [x] 明确 Access Token 默认 `30` 分钟，Refresh Token 默认 `7` 天。
- [x] 明确 Refresh Token 默认启用轮换，每次刷新废弃旧 Refresh Token。

## 验证记录
- [x] PRD 中已明确 Token 默认时长与会话上限。
- [x] PRD 中已明确 Token 策略通过系统设置统一维护。
- [x] PRD 中已明确 Refresh Token 轮换与超限踢除策略。

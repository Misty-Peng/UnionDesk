INSERT INTO business_domain (code, name, visibility_policy, status)
VALUES ('default', '默认业务域', 'global', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name), visibility_policy = VALUES(visibility_policy), status = VALUES(status);

INSERT INTO user_account (id, mobile, email, password_hash, status)
VALUES (1, '13800000000', 'admin@uniondesk.local', '{noop}admin123', 1)
ON DUPLICATE KEY UPDATE mobile = VALUES(mobile), email = VALUES(email), password_hash = VALUES(password_hash), status = VALUES(status);

INSERT INTO ticket_type (business_domain_id, code, name, sla_first_response_minutes, sla_resolve_minutes)
SELECT id, 'general', '通用工单', 60, 1440 FROM business_domain WHERE code = 'default'
ON DUPLICATE KEY UPDATE name = VALUES(name), sla_first_response_minutes = VALUES(sla_first_response_minutes), sla_resolve_minutes = VALUES(sla_resolve_minutes);

INSERT INTO ticket (ticket_no, business_domain_id, customer_id, ticket_type_id, title, description, status, priority, source)
SELECT 'T202604190001', d.id, 1, tt.id, '登录后无法提交工单', '这是一个默认演示工单', 'open', 'normal', 'web'
FROM business_domain d
JOIN ticket_type tt ON tt.business_domain_id = d.id AND tt.code = 'general'
WHERE d.code = 'default'
ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description), status = VALUES(status), priority = VALUES(priority), source = VALUES(source);

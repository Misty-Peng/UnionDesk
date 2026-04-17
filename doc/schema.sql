-- UnionDesk MVP schema
-- MySQL 8.0+
-- Encoding: UTF-8

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE DATABASE IF NOT EXISTS `uniondesk`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE `uniondesk`;

CREATE TABLE IF NOT EXISTS `business_domain` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(64) NOT NULL COMMENT '业务域唯一编码',
  `name` varchar(128) NOT NULL COMMENT '业务域名称',
  `logo_url` varchar(255) DEFAULT NULL,
  `theme_color` char(7) DEFAULT NULL COMMENT '主题色，格式如 #409EFF',
  `visibility_policy` varchar(32) NOT NULL DEFAULT 'global' COMMENT 'global/whitelist/approval',
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '1=启用 0=禁用',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_business_domain_code` (`code`),
  KEY `idx_business_domain_status` (`status`),
  CONSTRAINT `chk_business_domain_theme_color`
    CHECK (`theme_color` IS NULL OR `theme_color` REGEXP '^#[0-9A-Fa-f]{6}$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='业务域';

CREATE TABLE IF NOT EXISTS `user_account` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `mobile` varchar(20) NOT NULL COMMENT '手机号',
  `email` varchar(128) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `real_name` varchar(64) DEFAULT NULL,
  `nickname` varchar(64) DEFAULT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '1=启用 0=禁用',
  `last_login_at` datetime(3) DEFAULT NULL,
  `last_login_ip` varchar(45) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_mobile` (`mobile`),
  UNIQUE KEY `uk_user_email` (`email`),
  KEY `idx_user_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

CREATE TABLE IF NOT EXISTS `role` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(32) NOT NULL COMMENT 'customer/agent/domain_admin/super_admin',
  `name` varchar(64) NOT NULL,
  `scope` varchar(16) NOT NULL COMMENT 'global/domain',
  `description` varchar(255) DEFAULT NULL,
  `is_system` tinyint NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_code` (`code`),
  KEY `idx_role_scope` (`scope`),
  CONSTRAINT `chk_role_scope` CHECK (`scope` IN ('global', 'domain'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色定义';

CREATE TABLE IF NOT EXISTS `user_global_role` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `role_id` int unsigned NOT NULL,
  `assigned_by` bigint unsigned DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_global_role` (`user_id`, `role_id`),
  KEY `idx_ugr_role` (`role_id`),
  CONSTRAINT `fk_ugr_user` FOREIGN KEY (`user_id`) REFERENCES `user_account` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_ugr_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_ugr_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `user_account` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户全局角色';

CREATE TABLE IF NOT EXISTS `user_domain_role` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `role_id` int unsigned NOT NULL,
  `business_domain_id` bigint unsigned NOT NULL,
  `assigned_by` bigint unsigned DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_domain_role` (`user_id`, `role_id`, `business_domain_id`),
  KEY `idx_udr_domain_role` (`business_domain_id`, `role_id`),
  CONSTRAINT `fk_udr_user` FOREIGN KEY (`user_id`) REFERENCES `user_account` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_udr_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_udr_domain` FOREIGN KEY (`business_domain_id`) REFERENCES `business_domain` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_udr_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `user_account` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户域内角色';

CREATE TABLE IF NOT EXISTS `customer_business_domain_access` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` bigint unsigned NOT NULL,
  `business_domain_id` bigint unsigned NOT NULL,
  `access_status` varchar(16) NOT NULL DEFAULT 'pending' COMMENT 'pending/active/rejected',
  `applied_reason` varchar(255) DEFAULT NULL,
  `applied_at` datetime(3) DEFAULT NULL,
  `approved_at` datetime(3) DEFAULT NULL,
  `approved_by` bigint unsigned DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_customer_domain_access` (`customer_id`, `business_domain_id`),
  KEY `idx_cda_domain_status` (`business_domain_id`, `access_status`),
  CONSTRAINT `fk_cda_customer` FOREIGN KEY (`customer_id`) REFERENCES `user_account` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_cda_domain` FOREIGN KEY (`business_domain_id`) REFERENCES `business_domain` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_cda_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `user_account` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客户业务域可见授权';

CREATE TABLE IF NOT EXISTS `consultation_session` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `session_no` varchar(32) NOT NULL COMMENT '咨询会话号',
  `business_domain_id` bigint unsigned NOT NULL,
  `customer_id` bigint unsigned NOT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `session_status` varchar(32) NOT NULL DEFAULT 'open' COMMENT 'open/pending_agent/closed/converted',
  `assigned_to` bigint unsigned DEFAULT NULL COMMENT '当前客服',
  `last_message_at` datetime(3) DEFAULT NULL,
  `closed_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_consultation_session_no` (`session_no`),
  KEY `idx_consultation_domain_status_updated` (`business_domain_id`, `session_status`, `updated_at`),
  KEY `idx_consultation_customer_updated` (`customer_id`, `updated_at`),
  KEY `idx_consultation_assigned_status_updated` (`assigned_to`, `session_status`, `updated_at`),
  CONSTRAINT `fk_consultation_session_domain` FOREIGN KEY (`business_domain_id`) REFERENCES `business_domain` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_consultation_session_customer` FOREIGN KEY (`customer_id`) REFERENCES `user_account` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_consultation_session_assigned_to` FOREIGN KEY (`assigned_to`) REFERENCES `user_account` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='咨询会话主表';

CREATE TABLE IF NOT EXISTS `consultation_message` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `consultation_session_id` bigint unsigned NOT NULL,
  `business_domain_id` bigint unsigned NOT NULL,
  `seq_no` int unsigned NOT NULL COMMENT '会话内递增序号',
  `sender_user_id` bigint unsigned DEFAULT NULL,
  `sender_role` varchar(16) NOT NULL COMMENT 'customer/agent/system',
  `message_type` varchar(16) NOT NULL DEFAULT 'text' COMMENT 'text/image/file/system',
  `content` text,
  `payload` json DEFAULT NULL COMMENT '附件、富文本扩展',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_consultation_message_seq` (`consultation_session_id`, `seq_no`),
  KEY `idx_consultation_message_session_created` (`consultation_session_id`, `created_at`),
  KEY `idx_consultation_message_domain_created` (`business_domain_id`, `created_at`),
  CONSTRAINT `fk_consultation_message_session` FOREIGN KEY (`consultation_session_id`) REFERENCES `consultation_session` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_consultation_message_domain` FOREIGN KEY (`business_domain_id`) REFERENCES `business_domain` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_consultation_message_sender` FOREIGN KEY (`sender_user_id`) REFERENCES `user_account` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='咨询消息明细';

CREATE TABLE IF NOT EXISTS `ticket_type` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `business_domain_id` bigint unsigned NOT NULL,
  `code` varchar(64) NOT NULL,
  `name` varchar(64) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_system` tinyint NOT NULL DEFAULT 0,
  `status` tinyint NOT NULL DEFAULT 1,
  `sla_first_response_minutes` int unsigned DEFAULT NULL,
  `sla_resolve_minutes` int unsigned DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ticket_type_domain_code` (`business_domain_id`, `code`),
  KEY `idx_ticket_type_domain_status` (`business_domain_id`, `status`),
  CONSTRAINT `fk_ticket_type_domain` FOREIGN KEY (`business_domain_id`) REFERENCES `business_domain` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工单类型';

CREATE TABLE IF NOT EXISTS `custom_field_config` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `business_domain_id` bigint unsigned NOT NULL,
  `ticket_type_id` bigint unsigned DEFAULT NULL COMMENT 'NULL=域级字段，非NULL=工单类型字段',
  `ticket_type_scope_id` bigint unsigned GENERATED ALWAYS AS (ifnull(`ticket_type_id`, 0)) STORED COMMENT '用于唯一索引，避免NULL语义问题',
  `field_key` varchar(64) NOT NULL,
  `field_label` varchar(64) NOT NULL,
  `field_type` varchar(32) NOT NULL COMMENT 'text/select/multi_select/number/date/datetime/file/cascade',
  `field_schema` json DEFAULT NULL COMMENT '选项、校验规则等',
  `default_value` json DEFAULT NULL,
  `is_required` tinyint NOT NULL DEFAULT 0,
  `is_customer_visible` tinyint NOT NULL DEFAULT 1,
  `is_active` tinyint NOT NULL DEFAULT 1,
  `sort_order` int NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_custom_field_scope` (`business_domain_id`, `ticket_type_scope_id`, `field_key`),
  KEY `idx_custom_field_domain_type` (`business_domain_id`, `ticket_type_id`, `is_active`),
  CONSTRAINT `fk_custom_field_domain` FOREIGN KEY (`business_domain_id`) REFERENCES `business_domain` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_custom_field_ticket_type` FOREIGN KEY (`ticket_type_id`) REFERENCES `ticket_type` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='动态字段配置';

CREATE TABLE IF NOT EXISTS `ticket` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ticket_no` varchar(32) NOT NULL COMMENT '工单号',
  `business_domain_id` bigint unsigned NOT NULL,
  `customer_id` bigint unsigned NOT NULL,
  `ticket_type_id` bigint unsigned NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `status` varchar(32) NOT NULL COMMENT 'open/processing/waiting_customer/resolved/closed',
  `priority` varchar(16) NOT NULL DEFAULT 'normal' COMMENT 'low/normal/high/urgent',
  `source` varchar(16) NOT NULL DEFAULT 'web' COMMENT 'web/admin/api/consultation',
  `assigned_to` bigint unsigned DEFAULT NULL,
  `closed_at` datetime(3) DEFAULT NULL,
  `sla_first_response_deadline` datetime(3) DEFAULT NULL,
  `sla_resolve_deadline` datetime(3) DEFAULT NULL,
  `sla_paused_seconds` int unsigned NOT NULL DEFAULT 0,
  `custom_fields` json DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ticket_no` (`ticket_no`),
  KEY `idx_ticket_domain_status_priority` (`business_domain_id`, `status`, `priority`, `created_at`),
  KEY `idx_ticket_customer_created` (`customer_id`, `created_at`),
  KEY `idx_ticket_assigned_status` (`assigned_to`, `status`, `updated_at`),
  KEY `idx_ticket_type_created` (`ticket_type_id`, `created_at`),
  CONSTRAINT `fk_ticket_domain` FOREIGN KEY (`business_domain_id`) REFERENCES `business_domain` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_ticket_customer` FOREIGN KEY (`customer_id`) REFERENCES `user_account` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_ticket_type` FOREIGN KEY (`ticket_type_id`) REFERENCES `ticket_type` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_ticket_assigned_to` FOREIGN KEY (`assigned_to`) REFERENCES `user_account` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工单主表';

CREATE TABLE IF NOT EXISTS `consultation_ticket_link` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `consultation_session_id` bigint unsigned NOT NULL,
  `ticket_id` bigint unsigned NOT NULL,
  `business_domain_id` bigint unsigned NOT NULL,
  `converted_by` bigint unsigned DEFAULT NULL,
  `converted_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_consultation_ticket_link_session` (`consultation_session_id`),
  UNIQUE KEY `uk_consultation_ticket_link_ticket` (`ticket_id`),
  KEY `idx_consultation_ticket_link_domain_created` (`business_domain_id`, `created_at`),
  CONSTRAINT `fk_consultation_ticket_link_session` FOREIGN KEY (`consultation_session_id`) REFERENCES `consultation_session` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_consultation_ticket_link_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `ticket` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_consultation_ticket_link_domain` FOREIGN KEY (`business_domain_id`) REFERENCES `business_domain` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_consultation_ticket_link_converted_by` FOREIGN KEY (`converted_by`) REFERENCES `user_account` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='咨询转工单映射';

CREATE TABLE IF NOT EXISTS `ticket_reply` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ticket_id` bigint unsigned NOT NULL,
  `business_domain_id` bigint unsigned NOT NULL,
  `sender_user_id` bigint unsigned DEFAULT NULL,
  `sender_role` varchar(16) NOT NULL COMMENT 'customer/agent/system',
  `reply_type` varchar(16) NOT NULL COMMENT 'public/internal/system',
  `content` text,
  `attachment_urls` json DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_ticket_reply_ticket_created` (`ticket_id`, `created_at`),
  KEY `idx_ticket_reply_domain_created` (`business_domain_id`, `created_at`),
  CONSTRAINT `fk_ticket_reply_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `ticket` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_ticket_reply_domain` FOREIGN KEY (`business_domain_id`) REFERENCES `business_domain` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_ticket_reply_sender` FOREIGN KEY (`sender_user_id`) REFERENCES `user_account` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工单回复';

CREATE TABLE IF NOT EXISTS `ticket_event_log` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ticket_id` bigint unsigned NOT NULL,
  `business_domain_id` bigint unsigned NOT NULL,
  `event_type` varchar(32) NOT NULL COMMENT 'status_changed/assigned/replied/priority_changed/closed',
  `operator_user_id` bigint unsigned DEFAULT NULL,
  `payload` json DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_ticket_event_ticket_created` (`ticket_id`, `created_at`),
  KEY `idx_ticket_event_domain_type_created` (`business_domain_id`, `event_type`, `created_at`),
  CONSTRAINT `fk_ticket_event_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `ticket` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_ticket_event_domain` FOREIGN KEY (`business_domain_id`) REFERENCES `business_domain` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_ticket_event_operator` FOREIGN KEY (`operator_user_id`) REFERENCES `user_account` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工单事件日志';

CREATE TABLE IF NOT EXISTS `feedback` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `business_domain_id` bigint unsigned NOT NULL,
  `customer_id` bigint unsigned NOT NULL,
  `feedback_type` varchar(16) NOT NULL COMMENT 'feedback/suggestion',
  `title` varchar(255) NOT NULL,
  `description` text,
  `contact` varchar(128) DEFAULT NULL,
  `attachment_urls` json DEFAULT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'pending' COMMENT 'pending/processing/accepted/rejected',
  `internal_notes` text,
  `processed_by` bigint unsigned DEFAULT NULL,
  `processed_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_feedback_domain_status_created` (`business_domain_id`, `status`, `created_at`),
  KEY `idx_feedback_customer_created` (`customer_id`, `created_at`),
  CONSTRAINT `fk_feedback_domain` FOREIGN KEY (`business_domain_id`) REFERENCES `business_domain` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_feedback_customer` FOREIGN KEY (`customer_id`) REFERENCES `user_account` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_feedback_processed_by` FOREIGN KEY (`processed_by`) REFERENCES `user_account` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='反馈与建议';

CREATE TABLE IF NOT EXISTS `notification_template` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `business_domain_id` bigint unsigned DEFAULT NULL COMMENT 'NULL=全局模板',
  `business_domain_scope_id` bigint unsigned GENERATED ALWAYS AS (ifnull(`business_domain_id`, 0)) STORED,
  `channel` varchar(16) NOT NULL COMMENT 'in_app/email/sms',
  `template_key` varchar(64) NOT NULL COMMENT 'ticket_created/ticket_closed 等',
  `title_template` varchar(255) DEFAULT NULL,
  `body_template` text NOT NULL,
  `is_active` tinyint NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_notification_template_scope` (`business_domain_scope_id`, `channel`, `template_key`),
  KEY `idx_notification_template_active` (`is_active`),
  CONSTRAINT `fk_notification_template_domain` FOREIGN KEY (`business_domain_id`) REFERENCES `business_domain` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通知模板';

CREATE TABLE IF NOT EXISTS `operation_log` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `business_domain_id` bigint unsigned DEFAULT NULL,
  `operator_user_id` bigint unsigned DEFAULT NULL,
  `module` varchar(64) NOT NULL COMMENT 'iam/domain/ticket/feedback/notify',
  `action` varchar(64) NOT NULL COMMENT 'create/update/delete/assign/approve 等',
  `target_type` varchar(64) DEFAULT NULL,
  `target_id` varchar(64) DEFAULT NULL,
  `request_id` varchar(64) DEFAULT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `before_data` json DEFAULT NULL,
  `after_data` json DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_operation_domain_module_created` (`business_domain_id`, `module`, `created_at`),
  KEY `idx_operation_operator_created` (`operator_user_id`, `created_at`),
  KEY `idx_operation_request_id` (`request_id`),
  CONSTRAINT `fk_operation_log_domain` FOREIGN KEY (`business_domain_id`) REFERENCES `business_domain` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_operation_log_operator` FOREIGN KEY (`operator_user_id`) REFERENCES `user_account` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作审计日志';

-- 初始化系统角色
INSERT INTO `role` (`code`, `name`, `scope`, `description`, `is_system`)
VALUES
  ('customer', '客户', 'domain', '客户角色', 1),
  ('agent', '客服', 'domain', '客服角色', 1),
  ('domain_admin', '业务域管理员', 'domain', '域内配置与权限管理', 1),
  ('super_admin', '超级管理员', 'global', '全局管理角色', 1)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `scope` = VALUES(`scope`),
  `description` = VALUES(`description`),
  `is_system` = VALUES(`is_system`);

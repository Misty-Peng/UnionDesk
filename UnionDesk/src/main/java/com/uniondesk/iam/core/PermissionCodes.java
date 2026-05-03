package com.uniondesk.iam.core;

public final class PermissionCodes {

    public static final String PLATFORM_MENU_READ = "platform.menu.read";
    public static final String PLATFORM_MENU_CREATE = "platform.menu.create";
    public static final String PLATFORM_MENU_UPDATE = "platform.menu.update";
    public static final String PLATFORM_MENU_DELETE = "platform.menu.delete";

    public static final String PLATFORM_ROLE_READ = "platform.role.read";
    public static final String PLATFORM_ROLE_CREATE = "platform.role.create";
    public static final String PLATFORM_ROLE_UPDATE = "platform.role.update";
    public static final String PLATFORM_ROLE_DELETE = "platform.role.delete";
    public static final String PLATFORM_ROLE_PERMISSION_READ = "platform.role_permission.read";
    public static final String PLATFORM_ROLE_PERMISSION_UPDATE = "platform.role_permission.update";
    public static final String PLATFORM_ROLE_BIND = "platform.role.bind";

    public static final String PLATFORM_USER_READ = "platform.user.read";
    public static final String PLATFORM_USER_CREATE = "platform.user.create";
    public static final String PLATFORM_USER_UPDATE = "platform.user.update";
    public static final String PLATFORM_USER_DISABLE = "platform.user.disable";
    public static final String PLATFORM_USER_RESTORE = "platform.user.restore";
    public static final String PLATFORM_USER_OFFBOARD_POOL_READ = "platform.user.offboard_pool.read";
    public static final String PLATFORM_USER_DELETE = "platform.user.delete";

    public static final String PLATFORM_PERMISSION_MANAGE = "platform.permission.manage";

    public static final String DOMAIN_USER_READ = "domain.user.read";
    public static final String DOMAIN_USER_CREATE = "domain.user.create";
    public static final String DOMAIN_USER_UPDATE = "domain.user.update";
    public static final String DOMAIN_USER_REMOVE = "domain.user.remove";
    public static final String DOMAIN_SLA_UPDATE = "domain.sla.update";
    public static final String DOMAIN_NOTIFICATION_TEMPLATE_UPDATE = "domain.notification_template.update";

    public static final String TICKET_READ = "ticket.read";
    public static final String TICKET_CREATE = "ticket.create";
    public static final String TICKET_VIEW_SELF = "ticket.view.self";
    public static final String TICKET_VIEW_DOMAIN_ALL = "ticket.view.domain_all";
    public static final String TICKET_CLAIM = "ticket.claim";
    public static final String TICKET_ASSIGN = "ticket.assign";
    public static final String TICKET_REPLY_SELF = "ticket.reply.self";
    public static final String TICKET_REPLY = "ticket.reply";
    public static final String TICKET_CLOSE = "ticket.close";
    public static final String TICKET_WITHDRAW_SELF = "ticket.withdraw.self";
    public static final String TICKET_MERGE = "ticket.merge";

    public static final String ATTACHMENT_UPLOAD = "attachment.upload";
    public static final String ATTACHMENT_DOWNLOAD = "attachment.download";

    public static final String INBOX_READ = "inbox.read";
    public static final String INBOX_MARK_READ = "inbox.mark_read";

    public static final String CONSULTATION_REPLY = "consultation.reply";

    private PermissionCodes() {
    }
}

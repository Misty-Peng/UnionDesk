package com.uniondesk.iam.core;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class PermissionCodesTests {

    @Test
    void ticketPermissionsExposeDataScopeSuffixes() {
        assertThat(PermissionCodes.TICKET_VIEW_SELF).isEqualTo("ticket.view.self");
        assertThat(PermissionCodes.TICKET_VIEW_DOMAIN_ALL).isEqualTo("ticket.view.domain_all");
        assertThat(PermissionCodes.TICKET_REPLY_SELF).isEqualTo("ticket.reply.self");
        assertThat(PermissionCodes.TICKET_WITHDRAW_SELF).isEqualTo("ticket.withdraw.self");
    }
}

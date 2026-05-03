package com.uniondesk.iam.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.uniondesk.auth.core.UserContext;
import com.uniondesk.auth.core.UserContextHolder;
import com.uniondesk.iam.core.IamService;
import com.uniondesk.iam.core.PermissionCodes;
import com.uniondesk.iam.core.RequirePermission;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.lang.reflect.Method;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.method.HandlerMethod;

class RequirePermissionInterceptorTests {

    private final IamService iamService = mock(IamService.class);
    private final RequirePermissionInterceptor interceptor = new RequirePermissionInterceptor(iamService);

    @AfterEach
    void cleanup() {
        UserContextHolder.clear();
    }

    @Test
    void allowsAnnotatedHandlerWhenCurrentUserOwnsAnyRequiredPermission() throws Exception {
        UserContext context = new UserContext(7L, "domain_admin", 11L, "sid-7", "ud-admin-web");
        UserContextHolder.set(context);
        when(iamService.hasAnyPermission(context, List.of(PermissionCodes.DOMAIN_USER_CREATE))).thenReturn(true);

        boolean allowed = interceptor.preHandle(
                mock(HttpServletRequest.class),
                mock(HttpServletResponse.class),
                handlerMethod("createDomainUser"));

        assertThat(allowed).isTrue();
    }

    @Test
    void ignoresHandlersWithoutRequirePermissionAnnotation() throws Exception {
        boolean allowed = interceptor.preHandle(
                mock(HttpServletRequest.class),
                mock(HttpServletResponse.class),
                handlerMethod("open"));

        assertThat(allowed).isTrue();
    }

    private static HandlerMethod handlerMethod(String methodName) throws NoSuchMethodException {
        Method method = DemoController.class.getDeclaredMethod(methodName);
        return new HandlerMethod(new DemoController(), method);
    }

    private static final class DemoController {

        @RequirePermission(PermissionCodes.DOMAIN_USER_CREATE)
        void createDomainUser() {
        }

        void open() {
        }
    }
}

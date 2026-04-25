import { LinkOutlined } from '@ant-design/icons';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { SettingDrawer } from '@ant-design/pro-components';
import type { RequestConfig, RunTimeLayoutConfig } from '@umijs/max';
import { history, Link } from '@umijs/max';
import React from 'react';
import {
  AvatarDropdown,
  AvatarName,
  Footer,
  Question,
  SelectLang,
} from '@/components';
import type { PermissionSnapshot } from '@uniondesk/shared';
import {
  fetchPermissionSnapshot,
  getCachedPermissionSnapshot,
  loadAuthSession,
  setClientCode,
} from '@uniondesk/shared';
import defaultSettings from '../config/defaultSettings';
import { errorConfig } from './requestErrorConfig';

const isDev = process.env.NODE_ENV === 'development' || process.env.CI;
const loginPath = '/user/login';
setClientCode('ud-admin-web');

/**
 * @see https://umijs.org/docs/api/runtime-config#getinitialstate
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.CurrentUser;
  permissionSnapshot?: PermissionSnapshot | null;
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
}> {
  const resolveCurrentUser = (): API.CurrentUser | undefined => {
    const session = loadAuthSession();
    if (!session) {
      return undefined;
    }
    return {
      name: session.username,
      access: session.role === 'admin' || session.role === 'super_admin' ? 'admin' : 'user',
      userid: String(session.userId ?? ''),
    };
  };

  const fetchUserInfo = async () => {
    const currentUser = resolveCurrentUser();
    if (!currentUser) {
      history.push(loginPath);
    }
    return currentUser;
  };
  const resolvePermissionSnapshot = async (): Promise<PermissionSnapshot | null> => {
    const session = loadAuthSession();
    if (!session) {
      return null;
    }
    try {
      return await fetchPermissionSnapshot();
    } catch {
      return getCachedPermissionSnapshot();
    }
  };
  // 如果不是登录页面，执行
  const { location } = history;
  if (
    ![loginPath, '/user/register', '/user/register-result'].includes(
      location.pathname,
    )
  ) {
    const currentUser = await fetchUserInfo();
    const permissionSnapshot = await resolvePermissionSnapshot();
    return {
      fetchUserInfo,
      currentUser,
      permissionSnapshot,
      settings: defaultSettings as Partial<LayoutSettings>,
    };
  }
  return {
    fetchUserInfo,
    permissionSnapshot: getCachedPermissionSnapshot(),
    settings: defaultSettings as Partial<LayoutSettings>,
  };
}

// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({
  initialState,
  setInitialState,
}) => {
  const visibleMenuPaths = new Set(
    (initialState?.permissionSnapshot?.menus ?? []).map((menu) => menu.path),
  );
  visibleMenuPaths.add('/dashboard/home');
  const filterMenuData = (menuData: any[]): any[] =>
    menuData
      .map((item) => {
        const children = item.children ? filterMenuData(item.children) : undefined;
        const currentPath = item.path as string | undefined;
        if (children && children.length > 0) {
          return { ...item, children };
        }
        if (!currentPath) {
          return item;
        }
        return visibleMenuPaths.has(currentPath) ? item : null;
      })
      .filter(Boolean) as any[];
  return {
    actionsRender: () => [
      <Question key="doc" />,
      <SelectLang key="SelectLang" />,
    ],
    avatarProps: {
      src: initialState?.currentUser?.avatar,
      title: <AvatarName />,
      render: (_, avatarChildren) => {
        return <AvatarDropdown>{avatarChildren}</AvatarDropdown>;
      },
    },
    waterMarkProps: {
      content: initialState?.currentUser?.name,
    },
    footerRender: () => <Footer />,
    onPageChange: () => {
      const { location } = history;
      // 如果没有登录，重定向到 login
      if (!initialState?.currentUser && location.pathname !== loginPath) {
        history.push(loginPath);
      }
    },
    bgLayoutImgList: [
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/D2LWSqNny4sAAAAAAAAAAAAAFl94AQBr',
        left: 85,
        bottom: 100,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/C2TWRpJpiC0AAAAAAAAAAAAAFl94AQBr',
        bottom: -68,
        right: -45,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/F6vSTbj8KpYAAAAAAAAAAAAAFl94AQBr',
        bottom: 0,
        left: 0,
        width: '331px',
      },
    ],
    links: isDev
      ? [
          <Link key="openapi" to="/umi/plugin/openapi" target="_blank">
            <LinkOutlined />
            <span>OpenAPI 文档</span>
          </Link>,
        ]
      : [],
    menuHeaderRender: undefined,
    menuDataRender: (menuData) => filterMenuData(menuData),
    // 自定义 403 页面
    // unAccessible: <div>unAccessible</div>,
    // 增加一个 loading 的状态
    childrenRender: (children) => {
      // if (initialState?.loading) return <PageLoading />;
      return (
        <>
          {children}
          {isDev && (
            <SettingDrawer
              disableUrlParams
              enableDarkTheme
              settings={initialState?.settings}
              onSettingChange={(settings) => {
                setInitialState((preInitialState) => ({
                  ...preInitialState,
                  settings,
                }));
              }}
            />
          )}
        </>
      );
    },
    ...initialState?.settings,
  };
};

/**
 * @name request 配置，可以配置错误处理
 * 它基于 axios 和 ahooks 的 useRequest 提供了一套统一的网络请求和错误处理方案。
 * @doc https://umijs.org/docs/max/request#配置
 */
export const request: RequestConfig = {
  baseURL: '/api',
  ...errorConfig,
};

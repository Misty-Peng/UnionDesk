// @ts-ignore
import { startMock } from '@@/requestRecordMock';
import { TestBrowser } from '@@/testBrowser';
import { clearAuthSession } from '@uniondesk/shared';
import { fireEvent, render } from '@testing-library/react';
import React, { act } from 'react';

jest.mock('@uniondesk/shared', () => {
  const actual = jest.requireActual('@uniondesk/shared');
  return {
    ...actual,
    login: jest.fn(async (payload: { username: string }) => {
      const now = new Date().toISOString();
      actual.saveAuthSession({
        username: payload.username,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        role: 'super_admin',
        clientCode: 'ud-admin-web',
        authenticatedAt: now,
        sid: 'sid-demo',
        userId: 2,
        businessDomainId: 1,
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      });
      return {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        sid: 'sid-demo',
        role: 'super_admin',
        clientCode: 'ud-admin-web',
        tokenType: 'Bearer',
        expiresInSeconds: 3600,
        user: {
          id: 2,
          username: payload.username,
          mobile: null,
          email: null,
          roles: ['super_admin'],
        },
        accessibleDomains: [],
        defaultBusinessDomainId: 1,
      };
    }),
  };
});

const waitTime = (time: number = 100) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, time);
  });
};

let server: {
  close: () => void;
};

describe('Login Page', () => {
  beforeAll(async () => {
    server = await startMock({
      port: 8000,
      scene: 'login',
    });
  });

  afterAll(() => {
    server?.close();
  });

  afterEach(() => {
    clearAuthSession();
  });

  it('should show login form', async () => {
    const historyRef = React.createRef<any>();
    const rootContainer = render(
      <TestBrowser
        historyRef={historyRef}
        location={{
          pathname: '/user/login',
        }}
      />,
    );

    await rootContainer.findAllByText('Ant Design');

    act(() => {
      historyRef.current?.push('/user/login');
    });

    expect(
      rootContainer.baseElement?.querySelector('.ant-pro-form-login-desc')
        ?.textContent,
    ).toBe(
      'Ant Design is the most influential web design specification in Xihu district',
    );

    expect(rootContainer.asFragment()).toMatchSnapshot();

    rootContainer.unmount();
  });

  it('should login success', async () => {
    const historyRef = React.createRef<any>();
    const rootContainer = render(
      <TestBrowser
        historyRef={historyRef}
        location={{
          pathname: '/user/login',
        }}
      />,
    );

    await rootContainer.findAllByText('Ant Design');

    const userNameInput = await rootContainer.findByPlaceholderText(
      'Username: admin',
    );

    act(() => {
      fireEvent.change(userNameInput, { target: { value: 'admin' } });
    });

    const passwordInput = await rootContainer.findByPlaceholderText(
      'Password: admin123',
    );

    act(() => {
      fireEvent.change(passwordInput, { target: { value: 'admin123' } });
    });

    await (await rootContainer.findByText('Login')).click();

    // 等待接口返回结果
    await waitTime(5000);

    await rootContainer.findAllByText('Ant Design Pro');

    expect(rootContainer.asFragment()).toMatchSnapshot();

    await waitTime(2000);

    rootContainer.unmount();
  });
});

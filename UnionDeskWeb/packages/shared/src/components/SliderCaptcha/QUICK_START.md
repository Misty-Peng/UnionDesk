# SliderCaptcha 快速开始

## 5分钟快速上手

### 1. 导入组件

```tsx
import { SliderCaptcha } from '@uniondesk/shared';
```

### 2. 基础使用

```tsx
function MyPage() {
  return (
    <SliderCaptcha
      onSuccess={(token) => {
        console.log('验证成功！Token:', token);
      }}
      onFail={(message) => {
        console.log('验证失败:', message);
      }}
    />
  );
}
```

就这么简单！🎉

## 常见场景

### 场景 1: 登录页面

```tsx
import { SliderCaptcha } from '@uniondesk/shared';
import { useState } from 'react';
import { message } from 'antd';

function LoginPage() {
  const [verified, setVerified] = useState(false);
  const [token, setToken] = useState('');

  const handleLogin = async () => {
    if (!verified) {
      message.warning('请先完成滑块验证');
      return;
    }

    // 提交登录，包含 token
    await login({ username, password, captchaToken: token });
  };

  return (
    <div>
      <input type="text" placeholder="用户名" />
      <input type="password" placeholder="密码" />
      
      <SliderCaptcha
        onSuccess={(token) => {
          setVerified(true);
          setToken(token);
        }}
        onFail={() => {
          setVerified(false);
          setToken('');
        }}
      />
      
      <button onClick={handleLogin}>登录</button>
    </div>
  );
}
```

### 场景 2: 注册页面

```tsx
function RegisterPage() {
  const [captchaToken, setCaptchaToken] = useState('');

  return (
    <form>
      <input type="email" placeholder="邮箱" />
      <input type="password" placeholder="密码" />
      
      <SliderCaptcha
        text="向右滑动完成验证"
        onSuccess={(token) => setCaptchaToken(token)}
      />
      
      <button type="submit">注册</button>
    </form>
  );
}
```

### 场景 3: 敏感操作确认

```tsx
function DeleteAccountPage() {
  const [canDelete, setCanDelete] = useState(false);

  return (
    <div>
      <h2>删除账户</h2>
      <p>此操作不可恢复，请谨慎操作</p>
      
      <SliderCaptcha
        text="滑动确认删除"
        successText="已确认"
        onSuccess={() => setCanDelete(true)}
      />
      
      <button disabled={!canDelete}>确认删除</button>
    </div>
  );
}
```

## 自定义样式

### 修改尺寸

```tsx
<SliderCaptcha
  width={400}   // 宽度
  height={50}   // 高度
/>
```

### 修改文字

```tsx
<SliderCaptcha
  text="向右滑动验证"
  successText="✓ 验证成功"
  failText="✗ 验证失败"
/>
```

### 修改样式

```tsx
<SliderCaptcha
  style={{
    borderRadius: '20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  }}
/>
```

## 完整示例

```tsx
import { SliderCaptcha } from '@uniondesk/shared';
import { useState } from 'react';
import { Form, Input, Button, message } from 'antd';

function LoginForm() {
  const [form] = Form.useForm();
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');

  const handleSubmit = async (values: any) => {
    if (!captchaVerified) {
      message.warning('请先完成滑块验证');
      return;
    }

    try {
      await login({
        ...values,
        captchaToken,
      });
      message.success('登录成功！');
    } catch (error) {
      message.error('登录失败');
      // 重置验证状态
      setCaptchaVerified(false);
      setCaptchaToken('');
    }
  };

  return (
    <Form form={form} onFinish={handleSubmit}>
      <Form.Item
        name="username"
        rules={[{ required: true, message: '请输入用户名' }]}
      >
        <Input placeholder="用户名/邮箱/手机号" />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[{ required: true, message: '请输入密码' }]}
      >
        <Input.Password placeholder="密码" />
      </Form.Item>

      <Form.Item>
        <SliderCaptcha
          width={280}
          height={40}
          text="请按住滑块，拖动到最右边"
          successText="验证通过！"
          failText="验证失败，请重试"
          onSuccess={(token) => {
            setCaptchaVerified(true);
            setCaptchaToken(token);
            message.success('验证成功');
          }}
          onFail={(msg) => {
            setCaptchaVerified(false);
            setCaptchaToken('');
            message.error(msg);
          }}
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          登录
        </Button>
      </Form.Item>
    </Form>
  );
}

export default LoginForm;
```

## 常见问题

### Q: 如何在 CustomerWeb 中使用？

A: 完全相同的方式！组件在 `@uniondesk/shared` 包中，两个应用都可以使用。

```tsx
import { SliderCaptcha } from '@uniondesk/shared';
```

### Q: 如何重置验证状态？

A: 组件会在验证失败后自动重置。如果需要手动重置，可以通过 key 属性强制重新渲染：

```tsx
const [resetKey, setResetKey] = useState(0);

<SliderCaptcha
  key={resetKey}
  onSuccess={...}
  onFail={...}
/>

// 重置
setResetKey(prev => prev + 1);
```

### Q: 如何禁用组件？

A: 使用 `disabled` 属性：

```tsx
<SliderCaptcha
  disabled={true}
  onSuccess={...}
/>
```

### Q: Token 的格式是什么？

A: Token 格式为 `{timestamp}_{random16}`，例如：

```
1745366400000_aB3dE5fG7hI9jK1L
```

### Q: 如何在后端验证 Token？

A: 参考以下示例：

```java
@PostMapping("/api/v1/auth/verify-captcha")
public Result verifyCaptcha(@RequestBody CaptchaRequest request) {
    String token = request.getToken();
    
    // 1. 验证格式
    if (!token.matches("\\d+_[A-Za-z0-9]{16}")) {
        return Result.fail("无效的验证码");
    }
    
    // 2. 验证时效（60秒）
    String[] parts = token.split("_");
    long timestamp = Long.parseLong(parts[0]);
    if (System.currentTimeMillis() - timestamp > 60000) {
        return Result.fail("验证码已过期");
    }
    
    // 3. 防重放（Redis）
    if (redis.exists("captcha:" + token)) {
        return Result.fail("验证码已使用");
    }
    redis.setex("captcha:" + token, 60, "1");
    
    return Result.success();
}
```

### Q: 组件支持哪些浏览器？

A: 支持所有现代浏览器：
- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90
- 移动端浏览器

### Q: 如何测试组件？

A: 可以访问演示页面：

```tsx
import SliderCaptchaDemo from '@uniondesk/shared/src/components/SliderCaptcha/demo';

function TestPage() {
  return <SliderCaptchaDemo />;
}
```

## 下一步

- 📖 阅读[完整文档](./README.md)
- 🏗️ 了解[架构设计](./ARCHITECTURE.md)
- 🔍 查看[源代码](./index.tsx)
- 🎨 运行[演示页面](./demo.tsx)

## 需要帮助？

如有问题，请查看：
- [README.md](./README.md) - 完整文档
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 架构设计
- [demo.tsx](./demo.tsx) - 演示代码

---

**祝你使用愉快！** 🎉

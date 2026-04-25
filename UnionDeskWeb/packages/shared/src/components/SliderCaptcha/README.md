# SliderCaptcha 滑块验证组件

极简的滑块验证组件，用户只需拖动滑块到最右边即可完成验证。

## 特性

- ✅ **极简交互**：拖动到最右边即可验证
- ✅ **安全性**：记录滑动轨迹，检测滑动速度，防止机器人
- ✅ **响应式**：支持 PC 和移动端
- ✅ **TypeScript**：完整的类型定义
- ✅ **可定制**：支持自定义样式、文字、尺寸
- ✅ **无依赖**：纯 React 实现，无需额外依赖

## 安装

组件位于 `@uniondesk/shared` 包中，无需额外安装。

## 基础用法

```tsx
import { SliderCaptcha } from '@uniondesk/shared';

function LoginPage() {
  const handleSuccess = (token: string) => {
    console.log('验证成功，token:', token);
    // 将 token 发送到后端进行验证
  };

  const handleFail = (message: string) => {
    console.log('验证失败:', message);
  };

  return (
    <SliderCaptcha
      onSuccess={handleSuccess}
      onFail={handleFail}
    />
  );
}
```

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| onSuccess | 验证成功回调 | `(token: string) => void` | - |
| onFail | 验证失败回调 | `(message: string) => void` | - |
| width | 组件宽度 | `number` | `320` |
| height | 组件高度 | `number` | `40` |
| text | 初始提示文字 | `string` | `"请按住滑块，拖动到最右边"` |
| successText | 成功提示文字 | `string` | `"验证通过！"` |
| failText | 失败提示文字 | `string` | `"验证失败，请重试"` |
| disabled | 是否禁用 | `boolean` | `false` |
| className | 自定义样式类名 | `string` | - |
| style | 自定义样式 | `React.CSSProperties` | - |

## 高级用法

### 自定义样式

```tsx
<SliderCaptcha
  width={400}
  height={50}
  text="向右滑动验证"
  successText="✓ 验证成功"
  failText="✗ 验证失败"
  style={{
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  }}
  onSuccess={(token) => {
    console.log('Token:', token);
  }}
/>
```

### 与表单集成

```tsx
import { SliderCaptcha } from '@uniondesk/shared';
import { useState } from 'react';
import { message } from 'antd';

function LoginForm() {
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>();

  const handleSubmit = async () => {
    if (!captchaVerified) {
      message.warning('请先完成滑块验证');
      return;
    }

    // 提交表单，包含 captchaToken
    await submitForm({ captchaToken });
  };

  return (
    <form>
      {/* 其他表单字段 */}
      
      <SliderCaptcha
        onSuccess={(token) => {
          setCaptchaVerified(true);
          setCaptchaToken(token);
        }}
        onFail={(msg) => {
          setCaptchaVerified(false);
          setCaptchaToken(undefined);
          message.error(msg);
        }}
      />

      <button onClick={handleSubmit}>登录</button>
    </form>
  );
}
```

## 安全性说明

### 前端验证

组件会记录用户的滑动轨迹，包括：
- 滑动位置
- 滑动时间
- 滑动速度

通过分析这些数据，可以检测出：
- 滑动速度过快（可能是机器人）
- 滑动轨迹异常（可能是脚本）
- 未滑动到指定位置

### 后端验证（推荐）

虽然前端验证可以防止大部分机器人，但为了更高的安全性，建议在后端也进行验证：

1. **验证 token 有效性**：检查 token 格式和时间戳
2. **限制验证频率**：同一 IP 或用户在短时间内的验证次数
3. **记录验证日志**：记录验证行为，用于分析和审计

```java
// 后端验证示例（Java）
@PostMapping("/api/v1/auth/verify-captcha")
public Result verifyCaptcha(@RequestBody CaptchaRequest request) {
    String token = request.getToken();
    
    // 1. 验证 token 格式
    if (!isValidTokenFormat(token)) {
        return Result.fail("无效的验证码");
    }
    
    // 2. 验证时间戳（防止重放攻击）
    long timestamp = extractTimestamp(token);
    if (System.currentTimeMillis() - timestamp > 60000) { // 60秒过期
        return Result.fail("验证码已过期");
    }
    
    // 3. 检查是否已使用（防止重复使用）
    if (isTokenUsed(token)) {
        return Result.fail("验证码已使用");
    }
    
    // 4. 标记为已使用
    markTokenAsUsed(token);
    
    return Result.success();
}
```

## 工作原理

1. **初始状态**：显示灰色背景和提示文字
2. **开始拖动**：记录起始位置和时间
3. **拖动中**：
   - 更新滑块位置
   - 显示蓝色进度条
   - 记录轨迹点（位置 + 时间）
4. **结束拖动**：
   - 分析滑动轨迹
   - 检查是否到达最右边
   - 检查滑动速度是否正常
   - 验证通过：显示绿色背景 + 生成 token
   - 验证失败：显示红色背景 + 1秒后重置

## 浏览器兼容性

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90
- 移动端浏览器

## 注意事项

1. **不要在生产环境中仅依赖前端验证**，务必配合后端验证
2. **token 应该是一次性的**，使用后立即失效
3. **建议设置验证频率限制**，防止暴力破解
4. **移动端测试**：确保在不同设备上都能正常工作

## 许可证

MIT

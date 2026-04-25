/**
 * SliderCaptcha 组件演示
 * 
 * 这个文件展示了如何使用 SliderCaptcha 组件
 * 可以在开发环境中运行此演示
 */

import React, { useState } from 'react';
import SliderCaptcha from './index';

const SliderCaptchaDemo: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev].slice(0, 10));
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '40px' }}>SliderCaptcha 组件演示</h1>

      {/* 基础用法 */}
      <section style={{ marginBottom: '60px' }}>
        <h2>基础用法</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          默认配置，拖动滑块到最右边即可验证
        </p>
        <SliderCaptcha
          onSuccess={(token) => {
            addLog(`✓ 验证成功！Token: ${token}`);
          }}
          onFail={(message) => {
            addLog(`✗ 验证失败：${message}`);
          }}
        />
      </section>

      {/* 自定义尺寸 */}
      <section style={{ marginBottom: '60px' }}>
        <h2>自定义尺寸</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          可以自定义宽度和高度
        </p>
        <SliderCaptcha
          width={400}
          height={50}
          onSuccess={(token) => {
            addLog(`✓ 大尺寸验证成功！Token: ${token}`);
          }}
          onFail={(message) => {
            addLog(`✗ 大尺寸验证失败：${message}`);
          }}
        />
      </section>

      {/* 自定义文字 */}
      <section style={{ marginBottom: '60px' }}>
        <h2>自定义文字</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          可以自定义提示文字
        </p>
        <SliderCaptcha
          text="向右滑动验证"
          successText="✓ 验证成功"
          failText="✗ 验证失败，请重试"
          onSuccess={(token) => {
            addLog(`✓ 自定义文字验证成功！Token: ${token}`);
          }}
          onFail={(message) => {
            addLog(`✗ 自定义文字验证失败：${message}`);
          }}
        />
      </section>

      {/* 自定义样式 */}
      <section style={{ marginBottom: '60px' }}>
        <h2>自定义样式</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          可以通过 style 属性自定义样式
        </p>
        <SliderCaptcha
          style={{
            borderRadius: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
          onSuccess={(token) => {
            addLog(`✓ 自定义样式验证成功！Token: ${token}`);
          }}
          onFail={(message) => {
            addLog(`✗ 自定义样式验证失败：${message}`);
          }}
        />
      </section>

      {/* 小尺寸 */}
      <section style={{ marginBottom: '60px' }}>
        <h2>小尺寸</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          适合移动端或紧凑布局
        </p>
        <SliderCaptcha
          width={280}
          height={36}
          text="滑动验证"
          onSuccess={(token) => {
            addLog(`✓ 小尺寸验证成功！Token: ${token}`);
          }}
          onFail={(message) => {
            addLog(`✗ 小尺寸验证失败：${message}`);
          }}
        />
      </section>

      {/* 日志面板 */}
      <section>
        <h2>操作日志</h2>
        <div
          style={{
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            padding: '16px',
            minHeight: '200px',
            maxHeight: '400px',
            overflow: 'auto',
            fontFamily: 'monospace',
            fontSize: '14px',
          }}
        >
          {logs.length === 0 ? (
            <div style={{ color: '#999' }}>暂无日志</div>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                style={{
                  padding: '4px 0',
                  borderBottom: index < logs.length - 1 ? '1px solid #e0e0e0' : 'none',
                }}
              >
                {log}
              </div>
            ))
          )}
        </div>
      </section>

      {/* 使用说明 */}
      <section style={{ marginTop: '60px', padding: '20px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
        <h3>使用说明</h3>
        <ul style={{ lineHeight: '1.8', color: '#333' }}>
          <li>拖动滑块到最右边即可完成验证</li>
          <li>滑动速度过快会被判定为机器人</li>
          <li>未滑动到最右边会验证失败</li>
          <li>验证失败后会自动重置，可以重新尝试</li>
          <li>验证成功后会生成唯一的 token</li>
        </ul>
      </section>
    </div>
  );
};

export default SliderCaptchaDemo;

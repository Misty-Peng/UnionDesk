import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

const apiBase = 'http://localhost:8080/api/v1';

function CustomerApp() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [title, setTitle] = useState('无法登录系统');
  const [description, setDescription] = useState('我使用默认账号登录后无法进入工单页面');
  const [message, setMessage] = useState('');

  async function submitTicket() {
    const resp = await fetch(`${apiBase}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, ticketTypeId: 1 }),
    });
    if (!resp.ok) {
      setMessage('提交失败');
      return;
    }
    const data = await resp.json();
    setMessage(`提交成功：${data.ticketNo}`);
  }

  return (
    <main style={{ fontFamily: 'sans-serif', padding: 24, background: '#f8fafc', minHeight: '100vh' }}>
      <section style={{ maxWidth: 960, margin: '0 auto', background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)' }}>
        <h1 style={{ marginTop: 0, fontSize: 32 }}>UnionDesk 客户端</h1>
        <p style={{ color: '#475467' }}>用于提交咨询、查看工单和接收处理结果。</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 24 }}>
          <Stat title="咨询入口" value="已启用" />
          <Stat title="工单提交" value="可用" />
          <Stat title="消息通知" value="准备中" />
        </div>

        <section style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="姓名" style={inputStyle} />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="电话" style={inputStyle} />
        </section>
        <section style={{ marginTop: 16 }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="工单标题" style={inputStyle} />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="问题描述" style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }} />
          <button onClick={submitTicket} style={buttonStyle}>提交工单</button>
          <div style={{ marginTop: 12, color: '#667085' }}>{message}</div>
        </section>
      </section>
    </main>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div style={{ padding: 20, borderRadius: 16, background: '#f8fafc' }}>
      <div style={{ color: '#667085', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #d0d5dd', marginBottom: 12 };
const buttonStyle: React.CSSProperties = { padding: '12px 16px', border: 0, borderRadius: 12, background: '#2563eb', color: '#fff', cursor: 'pointer' };

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <CustomerApp />
  </React.StrictMode>,
);

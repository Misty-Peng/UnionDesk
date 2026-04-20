import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';

type Ticket = {
  id: number;
  ticketNo: string;
  title: string;
  status: string;
};

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  role: string;
};

const apiBase = 'http://localhost:8080/api/v1';

function AdminApp() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [token, setToken] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [newTitle, setNewTitle] = useState('新工单示例');
  const [newDescription, setNewDescription] = useState('前端工单提交演示');
  const [message, setMessage] = useState('');

  const stats = useMemo(() => [
    { label: '待处理', value: tickets.filter((t) => t.status === 'open').length },
    { label: '处理中', value: tickets.filter((t) => t.status === 'processing').length },
    { label: '已解决', value: tickets.filter((t) => t.status === 'resolved').length },
  ], [tickets]);

  useEffect(() => {
    void loadTickets();
  }, []);

  async function authFetch(input: RequestInfo, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(input, { ...init, headers });
  }

  async function loadTickets() {
    const resp = await authFetch(`${apiBase}/tickets`);
    if (!resp.ok) {
      setMessage('加载工单失败');
      return;
    }
    const data = (await resp.json()) as Ticket[];
    setTickets(data);
  }

  async function login() {
    setMessage('');
    const resp = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!resp.ok) {
      setMessage('登录失败');
      return;
    }
    const data = (await resp.json()) as LoginResponse;
    setToken(data.accessToken ?? '');
    setMessage(`登录成功，角色：${data.role}`);
    await loadTickets();
  }

  async function createTicket() {
    setMessage('');
    const resp = await authFetch(`${apiBase}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, description: newDescription, ticketTypeId: 1 }),
    });
    if (!resp.ok) {
      setMessage('创建工单失败');
      return;
    }
    await loadTickets();
    setMessage('工单创建成功');
  }

  async function updateStatus(id: number, status: 'processing' | 'resolved') {
    const resp = await authFetch(`${apiBase}/tickets/${id}/${status}`, { method: 'POST' });
    if (!resp.ok) {
      setMessage('状态更新失败');
      return;
    }
    await loadTickets();
    setMessage(`工单已更新为 ${status}`);
  }

  return (
    <main style={{ fontFamily: 'sans-serif', padding: 24, background: '#f8fafc', minHeight: '100vh' }}>
      <section style={{ maxWidth: 1200, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 32 }}>UnionDesk 管理端</h1>
            <p style={{ margin: '8px 0 0', color: '#475467' }}>客服与业务域管理工作台</p>
          </div>
          <div style={{ padding: '12px 16px', borderRadius: 12, background: '#fff' }}>{token ? '已登录' : '未登录'}</div>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {stats.map((item) => (
            <Stat key={item.label} title={item.label} value={item.value} />
          ))}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24 }}>
          <Panel title="登录">
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="用户名" style={inputStyle} />
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="密码" type="password" style={inputStyle} />
            <button onClick={login} style={buttonStyle}>登录</button>
            <div style={{ marginTop: 12, color: '#667085', wordBreak: 'break-all' }}>{token || '登录后显示 token'}</div>
          </Panel>

          <Panel title="工单列表">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, marginBottom: 16 }}>
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="工单标题" style={inputStyle} />
              <input value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="工单描述" style={inputStyle} />
              <button onClick={createTicket} style={buttonStyle}>新建工单</button>
            </div>
            <button onClick={() => void loadTickets()} style={{ ...buttonStyle, marginBottom: 12, background: '#0f172a' }}>刷新列表</button>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['编号', '标题', '状态', '操作'].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td style={tdStyle}>{ticket.ticketNo}</td>
                    <td style={tdStyle}>{ticket.title}</td>
                    <td style={tdStyle}>{ticket.status}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => void updateStatus(ticket.id, 'processing')} style={miniButtonStyle}>处理中</button>
                        <button onClick={() => void updateStatus(ticket.id, 'resolved')} style={miniButtonStyle}>已解决</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 12, color: '#667085' }}>{message}</div>
          </Panel>
        </section>
      </section>
    </main>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <div style={{ padding: 20, borderRadius: 20, background: '#fff', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)' }}><h2 style={{ marginTop: 0 }}>{title}</h2>{children}</div>;
}

function Stat({ title, value }: { title: string; value: number }) {
  return <div style={{ padding: 20, borderRadius: 16, background: '#fff' }}><div style={{ color: '#667085' }}>{title}</div><div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div></div>;
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #d0d5dd', marginBottom: 12 };
const buttonStyle: React.CSSProperties = { padding: '12px 16px', border: 0, borderRadius: 12, background: '#2563eb', color: '#fff', cursor: 'pointer' };
const miniButtonStyle: React.CSSProperties = { padding: '8px 12px', border: 0, borderRadius: 10, background: '#e2e8f0', color: '#0f172a', cursor: 'pointer' };
const thStyle: React.CSSProperties = { textAlign: 'left', padding: 12, borderBottom: '1px solid #e5e7eb', color: '#475467' };
const tdStyle: React.CSSProperties = { padding: 12, borderBottom: '1px solid #f2f4f7' };

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>,
);

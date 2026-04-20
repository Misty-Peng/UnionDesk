import http from 'node:http';

const name = process.argv[2] ?? 'app';
const port = name === 'admin-web' ? 5174 : 5173;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html><html><head><meta charset="utf-8"><title>${name}</title><style>body{font-family:Arial,sans-serif;margin:0;background:#f5f7fb;color:#1f2937} .wrap{max-width:960px;margin:64px auto;padding:32px} .card{background:#fff;border-radius:16px;padding:32px;box-shadow:0 10px 30px rgba(15,23,42,.08)} .tag{display:inline-block;padding:6px 12px;border-radius:999px;background:#e0f2fe;color:#0369a1;font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase} h1{margin:16px 0 12px;font-size:36px} ul{line-height:1.8} .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:24px} .panel{padding:20px;border:1px solid #e5e7eb;border-radius:12px;background:#fafafa}</style></head><body><div class="wrap"><div class="card"><span class="tag">UnionDesk Demo</span><h1>${name}</h1><p>页面已启动，可作为阶段 0 的前端演示入口。</p><div class="grid"><div class="panel"><strong>客户端能力</strong><ul><li>提交工单</li><li>查看工单列表</li><li>反馈入口</li></ul></div><div class="panel"><strong>管理端能力</strong><ul><li>工单池</li><li>配置中心</li><li>权限中心</li></ul></div></div></div></div></body></html>`);
});

server.listen(port, () => {
  console.log(`${name} listening on http://localhost:${port}`);
});

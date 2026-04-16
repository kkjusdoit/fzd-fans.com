# 🔍 自动同步故障排查指南

## 问题现象
自动同步功能失败，显示错误：`❌ 自动同步失败：Failed to fetch`

## 可能原因及解决方案

### 1️⃣ 环境变量未配置 (最常见)

**问题**: Cloudflare Pages 生产环境中缺少 `BASIC_USER` 和 `BASIC_PASS` 环境变量

**解决方案**:
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 Pages 项目 → Settings → Environment Variables
3. 添加以下变量:
   - `BASIC_USER`: 你的图床管理用户名
   - `BASIC_PASS`: 你的图床管理密码
   - `AUTH_CODE`: 上传认证码
4. 重新部署项目

**验证**:
- 访问 `/api/debug-sync` 查看环境变量检查状态
- 确保所有变量都显示为 `✅ Set`

---

### 2️⃣ 图床 API 认证失败

**问题**: Basic Auth 凭证错误或 API 不可达

**排查步骤**:
1. 运行诊断功能 (访问 `/admin/sync` 页面，点击"🔍 运行诊断")
2. 查看"图床 API 检查"部分:
   - 如果状态码是 `401`: 认证失败 → 检查 `BASIC_USER` 和 `BASIC_PASS` 是否正确
   - 如果状态码是 `404`: API 不存在 → 检查图床服务是否运行
   - 如果显示网络错误：可能是 CORS 或网络限制

**解决方案**:
```bash
# 本地测试 API (替换为你的凭证)
curl -X POST \
  -H "Authorization: Basic $(echo -n 'username:password' | base64)" \
  -H "Content-Type: application/json" \
  "https://cloudflare-imgbed-cvs.pages.dev/api/manage/list?start=0&count=1"
```

---

### 3️⃣ 数据库连接问题

**问题**: D1 数据库未正确绑定

**排查步骤**:
1. 访问 `/api/debug-sync`
2. 检查"数据库检查"部分
3. 如果显示 `❌ Missing` 或错误信息

**解决方案**:
1. 检查 `wrangler.toml` 中的数据库配置
2. 确认 Cloudflare Dashboard 中已正确绑定 D1 数据库
3. 数据库名称：`fzd-photos-db`
4. 重新部署项目

---

### 4️⃣ 网络/防火墙问题

**问题**: Cloudflare Workers 无法访问外部 API

**症状**:
- 诊断显示网络错误
- 超时或连接失败

**解决方案**:
1. 检查图床服务是否正常运行
2. 确认没有防火墙或 CORS 限制
3. 尝试在 Cloudflare Workers 日志中查看详细错误

---

## 🛠️ 使用诊断工具

1. **访问管理后台**: `https://fzd-fans.com/admin/sync`
2. **点击"🔍 运行诊断"**: 自动检查所有组件状态
3. **查看结果**:
   - 📋 环境变量检查
   - 💾 数据库检查
   - 🌐 图床 API 检查

---

## 📋 诊断 API 参考

### GET /api/debug-sync

**响应示例**:
```json
{
  "success": true,
  "timestamp": "2026-03-03T12:00:00.000Z",
  "results": {
    "envCheck": {
      "BASIC_USER": "✅ Set (kkjusdoit)",
      "BASIC_PASS": "✅ Set",
      "DB": "✅ Connected",
      "AUTH_CODE": "✅ Set"
    },
    "dbCheck": {
      "status": "✅ Connected",
      "photoCount": 150
    },
    "apiCheck": {
      "url": "https://cloudflare-imgbed-cvs.pages.dev/api/manage/list",
      "status": 200,
      "statusText": "OK",
      "ok": true,
      "headers": "✅ Auth successful",
      "response": {
        "filesCount": 1,
        "totalCount": 150
      }
    }
  }
}
```

---

## ✅ 成功标志

同步功能正常工作时应该:
1. 诊断全部显示 ✅
2. 图床 API 状态码为 200
3. 能够获取到文件列表
4. 点击"⚡️ 自动同步"后显示成功消息

---

## 🆘 仍然无法解决？

1. 查看 Cloudflare Pages 的 Deployment Logs
2. 检查 Workers Logs 查看详细错误堆栈
3. 确认图床服务本身正常运行
4. 联系技术支持并提供诊断结果

---

## 📝 本地开发环境配置

如果你在本地开发时遇到同步问题:

1. 确保 `.env` 文件存在且包含:
   ```
   AUTH_CODE=your_auth_code
   BASIC_USER=your_username
   BASIC_PASS=your_password
   ```

2. 使用 Wrangler 启动本地开发服务器:
   ```bash
   npx wrangler pages dev dist/ --d1 DB=fzd-photos-db
   ```

3. 本地测试诊断 API:
   ```
   http://localhost:4321/api/debug-sync
   ```

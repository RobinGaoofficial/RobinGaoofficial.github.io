# 文章互动

文章模板统一提供分享按钮；配置 Waline 服务后自动启用阅读量、点赞和评论。已有文章和永久链接不需要迁移。

## 当前约定

- 分享优先调用系统分享，不支持时复制 `https://gaobinbin.dev` 的文章链接；取消分享不会复制。浏览器拒绝剪贴板时显示可手动复制的链接。
- 阅读量来自服务端，从启用之日累计；同一标签页会话内每篇文章计数一次，不表示独立读者数。
- 点赞免登录，可取消，成功后才更新浏览器记录；浏览器记录提供基础防重复，不保证跨设备防刷。
- 评论强制注册登录，提交后立即显示。服务端同样强制登录；同一 IP 评论间隔 60 秒。邮箱、IP 和设备信息不公开展示。
- 使用文章路径作为身份，去除域名、查询和片段，兼容中文 URL 编码。未来不要随意改文章路径，否则要迁移计数和评论。
- 后端未配置时只显示分享；连接失败时显示重试入口，阅读正文和分享仍可使用。

## 部署到已同意的免费托管

当前服务项目为 `robin-blog-comments`（Vercel Hobby），正式地址为 `https://robin-blog-comments.vercel.app`。专用数据库 `robin-blog-comments-db` 使用 Neon Free，位于 iad1；连接变量只提供给 Production。Neon Auth 和 Realtime 未启用，账号由 Waline 管理。博主账号已核实为管理员，博客已配置此服务地址。后台的 LeanCloud 停服公告针对使用 LeanCloud 存储的站点，本项目使用 Neon，无需因此迁移。

1. 登录 Vercel，导入**现有** `RobinGaoofficial/RobinGaoofficial.github.io` 仓库，新建评论服务项目，Root Directory 选 `services/waline`，Node.js 24，Framework Preset 选 Other。博客页面继续由 GitHub Pages 发布。只选 Hobby，不升级收费套餐。
2. Vercel Storage 创建 Neon Free 数据库并连接评论项目。在新的空数据库运行 `services/waline/waline.pgsql`，不要对已有数据库重复执行建表脚本。数据库密码仅留在服务端环境变量。
3. 按 `.env.example` 设置 `SERVER_URL` 和 `SECURE_DOMAINS`，后者同时包含博客域名及真实服务域名；可先使用 Vercel 分配的域名，之后再绑定 `comments.gaobinbin.dev`。不要让预览页面写入生产数据库。
4. 设置 SMTP 邮箱、授权码、发件名称及接收通知的博主邮箱。`SERVER_URL` 必须是真实 HTTPS 服务地址，找回密码邮件依赖该配置。不要把凭据填进 `_config.yml` 或 Git。
5. 重新部署，立即由博主在 `<服务地址>/ui/register` 完成第一个账号注册，该账号成为管理员。公开前核对管理员身份；不要先让其他访客注册。
6. 验证注册邮件、登录、找回密码、发表评论和回复、管理员管理；检查未登录的直接评论 API 请求被拒绝，点赞及阅读计数无需登录且重启后仍存在。
7. 验证通过后填写 `_config.yml` 的 `waline.server_url`，提交发布到现有 Pages，并在 `gaobinbin.dev` 复验。后台或邮件未就绪时保留空地址，避免公开无效的登录入口。

服务端源码固定登录和即时显示规则，客户端资源固定为 Waline 3.16.2 并由博客自身域名提供。后端固定为 `@waline/vercel` 1.43.7。服务端不在 Jekyll 输出中。

## 验证与维护

服务端通过 `packageManager` 固定 pnpm 11.25.0，避免 Vercel 自动选择 pnpm 9 后无法读取工作区配置。`pnpm-workspace.yaml` 明确跳过未使用的 SQLite 构建和 core-js 安装提示脚本；Neon 使用 PostgreSQL。

依赖采用 `nodeLinker: hoisted`，确保 Waline 的 Vercel `includeFiles` 能收录动态加载的 MathJax 字体。首次从隔离布局切换时，重新部署需取消 Use existing Build Cache，避免旧依赖目录冲突。

Vercel 内置 Query 编辑器仅接受单条 SQL。首次初始化空库时，可将 `waline.pgsql` 的建表语句放在 `DO $waline$ BEGIN ... END $waline$;` 中一次执行。执行前查询 `information_schema.tables` 确认空库，完成后恢复 Read-only 并核对 `wl_comment`、`wl_counter`、`wl_users`；不要对已有表重复初始化。

```powershell
pnpm install --frozen-lockfile
npm run vendor:waline
npm test
node tools/preview-interactions.cjs
```

预览地址：`http://127.0.0.1:4174/posts/interaction-preview.html`。它明确使用临时测试计数，仅用于界面验证，不能证明线上数据库或注册邮件可用；附加 `?disabled` 检查未配置后端，`?offline` 检查断网提示。

更换 Waline 客户端版本时同步 package、锁文件、模板资源版本和 vendor 资源，再运行测试。备份数据库请使用 Neon 的导出方式保存到安全位置，不要提交读者邮箱或评论后台导出到公开仓库。

官方参考：[Vercel＋Neon 部署](https://waline.js.org/guide/deploy/vercel.html)、[服务端环境变量](https://waline.js.org/reference/server/env.html)。

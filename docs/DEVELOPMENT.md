# 开发维护文档

## 架构与发布边界

本站使用 GitHub Pages 的 Jekyll/Liquid 构建静态 HTML，原生 CSS 和 JavaScript 增强交互，无前端打包框架。正式域名由 `CNAME` 及 GitHub Pages 设置关联，`_config.yml` 的 url 为 https://gaobinbin.dev、baseurl 为空。

浏览器读取文章 HTML；搜索在客户端处理首页卡片的数据，不请求搜索服务器。文章互动经 HTTPS 请求独立的 Waline Vercel 服务，由 Neon PostgreSQL 持久化。GitHub Pages 不运行 Node 后端；仓库中 `services`、`tools`、`tests`、`docs` 和 node_modules 被排除输出。

两个独立发布链：main 推送触发 Pages；同一仓库的 Vercel 项目 Root Directory 是 `services/waline`。必须分别确认部署状态，不能以 Pages 成功推断评论服务成功。

## 文件地图

| 路径 | 职责 |
| --- | --- |
| `_config.yml` | 标题、域名、时区、文章路径、排除目录、Waline 地址 |
| `_layouts/default.html` | 全站 head、导航、主题、页脚、资源入口、canonical/RSS/robots 元数据 |
| `_layouts/post.html` | 正文、文章互动条件、相邻文章导航 |
| `_includes/planet.html` | 首页 SVG 星球与前后遮挡 |
| `_includes/post-interactions.html` | 文章互动 DOM 和 Waline 配置 |
| `index.html` | 首页、文章卡片及筛选容器 |
| `archive.html`、`categories.html` | 归档和分类 |
| `about.md`、`404.html` | 普通内容页，不启用文章互动 |
| `_posts`、`_drafts`、`templates` | 正式文章、草稿、写作模板 |
| `posts/hello-world.html` | 历史手写文章，不在 site.posts 集合 |
| `assets/css` | 基础、阅读、搜索、星球、互动样式 |
| `assets/js/theme.js`、`reading.js` | 主题、目录、代码与图片增强 |
| `assets/js/post-browser.js`、`search.js`、`filter-controls.js` | 查询、排序、分页、筛选 UI |
| `assets/js/interactions.js` | 分享、服务连接及互动状态 |
| `assets/vendor/waline` | 固定版本客户端及许可，不直接手工修改 |
| `feed.xml`、`sitemap.xml`、`robots.txt` | 订阅、索引发现、抓取偏好 |
| `content-use.md` | 公开引用与训练使用声明 |
| `tools`、`tests` | 写作发布、vendor 同步、预览工具、Node 测试 |
| `services/waline` | 评论服务源码、独立依赖锁、环境变量示例、数据库初始化 SQL |

## 本地开发

使用 Node 24 和 pnpm；根目录安装依赖与服务端安装相互独立。新增生产依赖前必须征得站主同意。

```powershell
pnpm install --frozen-lockfile
npm test
node tools/preview-interactions.cjs
```

预览工具为互动页面夹具，访问 http://127.0.0.1:4174/posts/interaction-preview.html 。`?disabled` 测试无后端，`?offline` 测试断线；临时计数不证明生产数据库、注册或发信正常。

完整站点需要 Jekyll 环境。本仓库目前没有 Gemfile，也没有将 Ruby 工具链固定到锁文件；普通 HTTP 静态服务器不能执行 Liquid。配置与 GitHub Pages 兼容的 Ruby/Jekyll 环境后可运行 `jekyll serve`，正式发布仍以 Pages 构建为准。不要把未经验证的本地渲染当作完整线上验证。

Windows PowerShell 使用 `Get-Content 文件 -Encoding UTF8`，尤其是 JSON 接 `ConvertFrom-Json` 时。写入使用 UTF-8，避免系统默认编码损坏中文。执行 JavaScript 修改后必须运行 `npm test`。

## 文章与搜索约定

文章路径 `/posts/:title.html` 是持久标识。首页默认新到旧，Jekyll `page.next` 是更新文章，放左侧；`page.previous` 是更早文章，放右侧。历史 hello-world 独立于 `_posts`，首页、归档、RSS、地图有单独兼容入口，迁移时必须同步去重。

搜索数据来自卡片 `data-search` 中去标签的正文；展示摘要截断并不限制搜索范围。分类使用文章首个分类。URL 参数为 q、category、month、from、to、sort；分页每页 6 篇，页码不写入 URL。月份与日期范围互斥，收起不重置，带条件自动展开。改变参数规则需同时检查 URL 恢复、清除、计数和浏览器前进后退行为。

星球使用 SVG 前后层和裁切模拟遮挡。卫星 CSS offset-path 必须是闭合路径（末尾 Z），否则超过 100% 的 offset-distance 会卡在端点并在下一周期跳跃。保留 reduced-motion 和悬停暂停处理，测试至少一整个 12 秒卫星周期，兼顾两条星环更长周期。移动端按现有设计隐藏装饰。

## 订阅、SEO 与抓取

RSS2 由 Liquid 生成最近 50 篇摘要以及历史文章，guid 使用永久链接，文本 XML 转义，日期 RFC822。sitemap 明确列出公开页面与所有正式文章，不包含草稿、404、内部文档或后台。不伪造 lastmod；新增普通页面需手动加入 paths 列表。新文章自动进入两者。

默认模板提供 canonical、RSS autodiscovery 和 index,follow；404 为 noindex,follow。robots 的通配规则允许普通搜索，GPTBot、ClaudeBot、Google-Extended、CCBot 分组禁止抓取。独立搜索与用户请求机器人继续通过通配规则访问。它不具备身份校验、访问封禁或追溯删除能力；不要承诺已收录或绝对禁止训练。

Google-Extended 同时控制训练和部分 grounding，因此无法用该单一开关精确实现所有 Google AI 渠道“禁训练但允许引用”；目前优先禁训练，不影响普通 Google Search。机器人规则会变化，维护时查官方定义，不盲目添加未经证实的 User-agent。

参考：[OpenAI bots](https://developers.openai.com/api/docs/bots)、[Anthropic crawler](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler)、[Google crawler controls](https://developers.google.com/crawling/docs/about-crawling)、[Common Crawl CCBot](https://www.commoncrawl.org/ccbot)。

## Waline 与数据

客户端固定 @waline/client 3.16.2，后端 @waline/vercel 1.43.7，服务端 Node24 / pnpm11.25.0。生产地址 https://robin-blog-comments.vercel.app 。数据库 Neon Free iad1，已有 wl_comment、wl_counter、wl_users。**不要在已有库重新执行 waline.pgsql**。首个管理员已存在。

`services/waline/index.cjs` 加载 `comment-policy.cjs`：用户只能改自己的评论正文，包括管理员；管理员管理权限与正文编辑分开。客户端同样只给作者显示编辑图标，服务端才是权限边界。

`tools/patch-waline.cjs` 修复 QQ 资料空值、PostgreSQL 数字回复 ID 和编辑按钮范围；`tools/sync-waline.cjs` 应用补丁并同步 vendor。升级时必须重新核对上游片段，补丁不匹配应停止，不可忽略。运行 `npm run vendor:waline`、`npm test`，同时更新模板资源版本及模块缓存版本。noCopyright 隐藏界面署名，保留 vendor 开源许可文件。

Vercel 环境变量参见服务端 `.env.example`：POSTGRES_* 来自数据库集成，SERVER_URL 为服务公网地址，SECURE_DOMAINS 限定正式域名；SMTP 配置存服务端，SMTP_PASS 是 Gmail 应用密码而非账户密码。支持邮箱展示与发信账户无绑定关系。禁止将任何秘密放进 Jekyll 配置、浏览器 JS、日志截图、Git 或文档。

服务端强制登录评论，频率限制 60 秒，允许立即显示。普通用户及回复已由站主实测成功；不能由首个管理员登录成功推断注册验证邮件正常。改 SMTP 后应单独验证普通注册和找回密码，不能代替用户设置密码。

Vercel 依赖 nodeLinker: hoisted，includeFiles 包含 MathJax 字体、mhchemparser 和 ip2region 数据。切换依赖布局后旧缓存可能 EEXIST，首次重新部署取消 Use existing Build Cache。pnpm 版本错误可能造成 install 失败，检查 packageManager 和服务端锁文件，不随意删除锁文件。

Neon 备份使用受支持的导出/恢复工具，保存在受控位置；迁移前记录表、行数和索引，恢复到独立测试库核对，再切生产。公开仓库绝不存数据库转储、邮箱或密码哈希。Vercel 预览环境不得误连生产数据库写测试数据。服务端独立 robots.txt 禁止后台索引，不能替换成博客的规则。

## 验证、发布与回退

1. `git status --short` 和 `git diff` 记录已有改动，确认 main 与远端关系。不要重置或清理工作区。
2. 完成针对性修改，JS 改动运行 `npm test`；模板改动也建议运行现有测试。
3. 检查桌面及窄屏、深浅主题、键盘操作、无服务和断网情况。RSS/地图用 XML 解析器验证，确认输出无 Liquid 标签、地址绝对且中文正常。
4. 只 `git add` 本次明确文件，检查 `git diff --cached`，提交并推送现有 main；不要用 `git add .` 混入 Obsidian、文章或图片。
5. 等待 Pages 构建成功；后端有改动时还须等待 Vercel 正式部署 Ready。验证域名 HTTP 状态及真实内容，检查首页、文章、about、404、feed、sitemap、robots。
6. 保留 commit SHA 和验证结果。故障回退使用经审查的逆向补丁或 git revert，检查与用户未提交改动是否冲突；禁止 reset --hard 或 clean。数据库变更不随 Git 回退，需要单独迁移方案。

测试覆盖查询排序分页、筛选控件、互动模板、分享状态、QQ 资料/回复兼容、评论编辑策略及发布发现文件。测试不替代实际设备和生产服务验证。线上冒烟测试避免擅自发布虚构评论；用站主账号验证真实评论并由站主确认。

## 故障定位

| 现象 | 先检查 |
| --- | --- |
| 网站旧版本 | 推送 SHA、Pages build、CDN 与浏览器缓存 |
| XML 解析失败 | 文件 front matter、输出开头空白、xml_escape、日期与绝对链接 |
| 搜索条件异常 | URL 参数、data-search、月份/日期互斥和当前页面状态 |
| QQ 评论无反应 | vendor 补丁及模块缓存版本、请求返回、空邮箱/网址规范化 |
| 回复失败 | pid/rid 字符串转换、登录状态、60 秒频率限制 |
| 服务 install 失败 | Vercel 根目录、pnpm11.25、锁文件、旧 Build Cache |
| MathJax/资源缺失 | hoisted 布局、vercel.json includeFiles、部署日志 |
| 邮件未收到 | SMTP 环境及重新部署、垃圾箱、普通注册验证；管理员可能绕过验证 |
| LeanCloud 停服公告 | 本项目使用 Neon，先查实际存储配置，不要误迁移 |

日志先定位时间、请求路径和状态码；分享时删去令牌、邮箱、连接串与敏感 SQL 内容。

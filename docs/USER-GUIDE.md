# 使用说明

## 网站与账号

博客地址：https://gaobinbin.dev 。联系与支持邮箱：contact@gaobinbin.dev 。支持邮箱展示不等于 SMTP 发信账户配置，也不保证域名邮箱已经由本项目创建。

代码仓库：RobinGaoofficial/RobinGaoofficial.github.io。GitHub Pages 发布静态博客；Vercel 项目 robin-blog-comments 提供互动服务；Neon 保存互动数据。无需重新创建网站或数据库。

## 写一篇文章

在项目目录打开 PowerShell。可使用 Obsidian 编辑 Markdown，保留 `.obsidian` 配置。

```powershell
cd E:\Backup\Blog\Robin-Blog
.\tools\new-post.ps1 -Title '文章标题' -Slug 'my-new-post'
```

编辑生成的 `_drafts/my-new-post.md`。slug 使用小写英文、数字和短横线。标题含引号时要正确转义 YAML。正文使用标准 Markdown，图片使用 `../assets/images/图片名.png`，避免仅 Obsidian 可识别的双链语法。

文章头部示例：

```yaml
---
layout: post
title: "文章标题"
date: 2026-11-17
categories: [随笔]
---
```

将图片放入 `assets/images`，检查隐私和文件体积。未完成文章保存在 `_drafts`；草稿不进入默认网站，但一旦提交到公开仓库，源文件仍公开。

## 发布新文章

```powershell
git status --short
.\tools\publish.ps1 -Slug 'my-new-post'
```

发布脚本要求暂存区为空、当前 HEAD 与 origin/main 一致，按北京时间将草稿复制到 `_posts/YYYY-MM-DD-slug.md`，提交并推送 main，保留原草稿。**脚本会同时暂存 assets/images 下全部改动**：运行前确认其中只有本次应公开的图片。它不会自动发布以后对原草稿的修改。

修改已发布文章时直接编辑 `_posts` 中对应文件，单独暂存所需文件再提交推送。不要重新生成同名文章，也不要随意改 slug；永久链接变化会分离已有评论、点赞及阅读量。

推送后查看 GitHub 仓库 Actions 的 Pages 构建结果，再打开正式文章链接验证。构建成功后仍可能有短暂 CDN 缓存。浏览器强制刷新可帮助排除旧资源缓存。

## 阅读和查找

首页默认收起筛选。点击搜索框或“筛选”展开，关键词、分类及时间可组合；不输入关键词也能筛选。月份和日期范围二选一，收起保留条件，清除按钮重置查询。带筛选参数的链接会恢复条件并展开。

支持最新、最早和标题排序，每页 6 篇。筛选条件及排序写入 URL，当前分页页码不保存到 URL。归档和分类页面可直接浏览文章。文章底部左侧是更新文章，右侧是更早文章；手机保持同样方向。

文章支持目录、代码复制、图片查看、主题切换。移动端首页隐藏装饰性星球，减少占用。页底标语居中，提供联系、订阅和内容使用入口。

## 分享、阅读量、点赞和评论

正式文章提供分享、阅读量、点赞及登录评论。“关于”和内容使用说明等普通页面没有这些互动模块。

分享优先调用系统分享，否则复制链接；阅读量是启用互动后累计的浏览计数，不是独立人数。点赞无需登录，浏览器记录只能提供基础防重复。评论和回复必须登录，提交有频率限制。管理员可管理评论，但不能修改他人评论正文；作者可编辑自己的评论。

管理入口：https://robin-blog-comments.vercel.app/ui 。使用已有管理员账号，不要重复创建首个管理员。LeanCloud 通告不代表本项目使用 LeanCloud，本项目存储在 Neon。

## RSS 和搜索收录

把 https://gaobinbin.dev/feed.xml 添加到 RSS 阅读器即可订阅。输出最新 50 篇正式文章的摘要及历史“你好，世界！”入口；新文章随 Pages 构建自动更新。完整内容通过原文链接阅读。

站点地图：https://gaobinbin.dev/sitemap.xml 。普通搜索引擎允许抓取；是否收录、收录速度和排名由搜索引擎决定。站主可在 Google Search Console 或 Bing Webmaster Tools 验证域名并提交此地图，不需要为此改写文章。

本站允许注明来源的引用，禁止未经许可采集原创内容作为 AI 训练语料。公开声明见 `/content-use.html`。robots.txt 是自愿遵守的抓取规则，不能保证阻止恶意采集或撤回过去已采集的内容。

## 常见问题

- 修改没有显示：检查是否改了 `_drafts` 而不是 `_posts`、是否已推送、Pages 是否成功，再强制刷新。
- 评论失败：确认登录状态，等待频率限制解除，查看错误提示；将文章地址、时间、账号登录方式及可见提示提供给维护者，不提供密码。
- RSS 显示 XML：这是正常的订阅格式，复制地址到阅读器。
- 图片丢失：检查实际文件名、大小写、相对路径和是否已提交。
- 发信异常：由维护者检查 Vercel SMTP 配置和服务日志。不要把 Gmail 应用密码粘贴到聊天、文章或仓库。

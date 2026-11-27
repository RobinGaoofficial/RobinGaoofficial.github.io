# 网站风格与文章推荐

导航中的风格菜单提供自动、科技和人文。太阳／月亮控制明暗。首次进入首页使用科技风格。读者直接打开文章时，自动模式使用文章推荐；从站内进入另一篇时延续当前风格。手动选择锁定风格，选择「自动（按文章）」恢复推荐。

在 Markdown 的 Front Matter 中可选填 `theme: technology`、`theme: humanities` 或 `theme: auto`。已有文章无需修改。分类优先于标签，同一层按匹配项较多的一方决定，分类持平时再看标签。词表在 `_data/article_styles.yml`，词条采用不区分英文大小写的完整匹配。无明确推荐时使用科技风格。

## 维护与回滚

- 构建时由 `_includes/article-style.html` 输出推荐值。首屏脚本优先读取手动偏好、历史条目、站内跳转来源，再使用推荐值。手动偏好和明暗偏好分别使用 `blog-style` 与 `blog-theme`。站内同标签跳转在 sessionStorage 里保存一次性的目标和风格，复制或分享原有文章链接即可。
- 人文首页扉页在 `_includes/editorial-cover.html`，首页样式在 `assets/css/humanities-home.css`。卷首使用当前页第一篇，搜索时复用现有列表。文章标题模板在 `_includes/article-title.html`，文章和文集目录排版在 `assets/css/editorial-reading.css`。每页共用一份正文和互动控件。
- 修改脚本后运行 `npm test`。分别检查桌面和手机的风格、明暗、直达和站内浏览。
- 此次改版前的本地备份分支为 `codex/backup-before-editorial-baf8623`。可通过 `git diff` 对照，线上回滚可在干净工作区 revert 此次发布提交，再运行测试与发布。

# Robin 的博客

蓝色主题的 GitHub Pages / Jekyll 博客。

网站：https://robingaoofficial.github.io/

## 网页上直接发文章

在仓库根目录新建 `_posts/YYYY-MM-DD-slug.md`：

```markdown
---
layout: post
title: "我的新文章"
categories: [学习笔记]
---

第一段会显示为首页摘要。

## 正文

这里写文章。
```

文件名日期不要晚于今天（网站使用北京时间）。slug 用英文小写和短横线；每篇不同。
如果填写 permalink，也必须每篇不同。分类填写在 categories 中，可填多项。
提交后等待 Actions 中 pages build and deployment 成功。

## 在 Obsidian 中写作

这是一个独立博客库，请不要把私人笔记库整体复制进来。

首次在电脑上打开 PowerShell，进入你想存放博客的文件夹，执行：

```powershell
git clone https://github.com/RobinGaoofficial/RobinGaoofficial.github.io.git Robin-Blog
```

在 Obsidian 中选择 **Open another vault → Open folder as vault（打开其他库 → 将文件夹作为库打开）**，选择克隆得到的 Robin-Blog 文件夹。

仓库已准备好 Obsidian 配置：
- 新笔记放入 `_drafts`（不发布到网页，但如主动提交到公开仓库仍会公开，不要存敏感内容）。
- 图片附件保存到 `assets/images`。
- 使用标准 Markdown 链接与相对路径。
- Templates（模板）使用 `templates/post.md`；通过命令面板 **Templates: Insert template** 插入。

### 创建草稿

在博客文件夹打开 PowerShell：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/new-post.ps1 -Title "今天的发现" -Slug today-notes
```

也可以直接在 Obsidian 新建 `_drafts/today-notes.md`，插入模板，修改标题并写正文。

### 发布

保存笔记后，在博客文件夹运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/publish.ps1 -Slug today-notes
```

脚本会把指定草稿复制到当天的 `_posts` 文件，提交该文章与 `assets/images` 中的图片更改，并推送到 main。图片目录只存准备公开的图片。原稿保留。
第一次推送可能需要 GitHub 登录；如 Git 提示未配置作者，按提示设置自己的 name 与 email。
远程有新提交时脚本会停止；先保存本地修改，再同步，不会强制覆盖。

已发布文章直接修改 `_posts` 中的文件，使用 Git 提交推送；不要再次运行同一 slug 的发布命令。
网站更新和本地笔记同步是两个过程；从网页改过文件后，应先同步本地仓库。

## 插入图片

在 Obsidian 的文章中粘贴图片，会保存至 `assets/images`。
标准图片语法（文章和草稿均适用）：

```markdown
![图片说明](../assets/images/photo.jpg)
```

不要使用 Obsidian 专用的 `![[图片]]` 或 `[[双链]]`；Jekyll 不会自动转换。
引用文章时使用其最终网址，如 `[搭建笔记](/posts/learning-to-blog.html)`。
推荐图片文件名使用英文、数字、短横线。

## 文件说明

| 文件 | 作用 |
| --- | --- |
| index.html | 首页、自动文章列表和搜索 |
| _layouts/default.html | 全站导航、页脚 |
| _layouts/post.html | 文章模板 |
| assets/css/style.css | 蓝色主题与手机适配 |
| _posts | 已发布文章 |
| _drafts | 写作草稿 |
| about.md | 关于页面 |
| archive.html / categories.html | 自动归档与分类 |

正文搜索在本页本地进行，不向第三方发送查询。
旧文章网址保持不变。


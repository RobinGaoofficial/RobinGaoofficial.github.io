# 双主题字体维护

科技主题的阅读区和两种主题的界面使用思源黑体，人文主题的阅读区使用思源宋体。网页中的字体族名为 Robin Sans SC 和 Robin Serif SC，用于区分本站分包与原版字体。品牌标记和代码使用各自的原有字体。

发布文章时直接使用 Markdown。浏览器依据页面文字和字重选择 WOFF2 分包，新增文章、生僻字、切换明暗模式均无需运行字体生成器。源字体未收录的字符由操作系统字体回退。

## 重新生成

1. 从 [思源黑体 2.005R](https://github.com/adobe-fonts/source-han-sans/tree/2.005R) 和 [思源宋体 2.003R](https://github.com/adobe-fonts/source-han-serif/tree/2.003R) 的 `OTF/SimplifiedChinese` 目录取出 `SourceHanSansSC-Regular.otf`、`SourceHanSansSC-Bold.otf` 及对应的两个 Serif 文件，放入仓库外的同一目录。将各发行版的 `LICENSE.txt` 分别保存为 `Sans-LICENSE.txt` 和 `Serif-LICENSE.txt`。
2. 在 Python 3.12 虚拟环境中运行 `python -m pip install fonttools==4.61.1 brotli==1.2.0`。
3. 从仓库根目录运行 `python tools/build-fonts.py <源字体目录>`。生成器验证源文件的 SHA-256，重新打开输出逐包比对字符，并校验变体序列覆盖。升级发行版时须同步更新源文件摘要和许可证。
4. 一起提交 `assets/fonts` 和 `assets/css/font-faces.css`。文件名包含字体内容哈希，旧页面可能继续引用旧分包，升级后请留出缓存过渡时间。

每个字重先打包首页和界面常用字符，再将其余 GB 2312 一级汉字与其他字符分别分组。调整字号、行距或组件字体时编辑 `assets/css/typography.css`。公共布局异步加载字体声明，首屏可先使用本机字体。首页和内页共享同一声明文件。

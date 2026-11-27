"""Build from Adobe's pinned OTF/SimplifiedChinese files. See docs/typography.md."""
import argparse
import hashlib
import itertools
from io import BytesIO
import shutil
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/fonts"
HASHES = {
    ("Sans", "Regular"): "f1d8611151880c6c336aabeac4640ef434fa13cbfbf1ffe82d0a71b2a5637256",
    ("Sans", "Bold"): "df2b90f5bcc6d01dfc964cec5f6d535d6b6aebd26ed7fd79a9c1b3f2112fcb6b",
    ("Serif", "Regular"): "78aa7a328fd974df2d688c8a9fd74a33d8334dfa84ab24d9d11efb2ffc464117",
    ("Serif", "Bold"): "706b8c0de2deff6cbc0c87e2cdedfd33a78b7ffd76cebb4549012f197ba611fe",
}
# Fixed seed for the shell and high-frequency site vocabulary, independent of builds/posts.
CORE = """高彬斌的博客首页归档分类关于科技人文保持好奇活在想象之外思考喧嚣笔记
记录学习中的发现生活中的思考以及探索新事物的经历读一篇最近全部阅读全文篇文章
搜索输入标题或正文关键词筛选清除日期月份时间范围排序最新最早优先随笔搭建测试
开始结束上一页下一页联系与支持内容使用说明订阅版权至今年月日返回目录阅读分享
点赞写评论一起聊聊欢迎你的邮箱密码登录注册昵称个人资料回复取消提交按热度倒序
你好世界从创建仓库到编写成功上线这是我第一篇也是最初练习在这里开始写正文
电脑端无法直接分享到微信请复制链接后粘贴系统找到加载失败暂无可以本节图像关闭
这那他她它们有了和是为上下左右多少大大小前后看去来对什么把还都说能着而得地
如之其于以或并将由所此更被已且可每当时给让再里间做需常用会只但性进过成同
跳即不公字阿数管理员应该稀古怪吧谁问麻烦吱声谢燃尽累死没"""


def variations(font):
    return {(selector, code) for table in font["cmap"].tables if table.format == 14
            for selector, entries in table.uvsDict.items() for code, _ in entries}


def chunks(points):
    core = set(map(ord, CORE)) | set(range(0x20, 0x100)) | set(range(0x2000, 0x2070))
    core |= set(range(0x3000, 0x3040)) | set(range(0xff01, 0xff60)) | set(map(ord, "↗↘←→"))
    common = set(map(ord, bytes(b for row in range(0xb0, 0xd8) for col in range(0xa1, 0xff)
                               for b in (row, col)).decode("gb2312", errors="ignore")))
    groups = [sorted(points & core)]
    for chars, size in [(points & (common - core), 640), (points - core - common, 1800)]:
        ordered = sorted(chars)
        groups.extend(ordered[i:i+size] for i in range(0, len(ordered), size))
    return groups


def build(cache, family, weight):
    src = cache / f"SourceHan{family}SC-{weight}.otf"
    assert hashlib.sha256(src.read_bytes()).hexdigest() == HASHES[family, weight], src
    with TTFont(src) as original:
        points = set(original.getBestCmap())
        uv = variations(original)
    groups = chunks(points)
    owners = {c: i for i, group in enumerate(groups) for c in group}
    ranges = [[] for _ in groups]
    for owner, run in itertools.groupby(sorted(points), key=owners.get):
        seq = list(run)
        ranges[owner].append(f"U+{seq[0]:X}" + (f"-{seq[-1]:X}" if len(seq)>1 else ""))
    name = f"Robin {family} SC"
    rules = []
    covered = set()
    variants = set()
    for i, group in enumerate(groups):
        with TTFont(src, recalcTimestamp=False) as font:
            options = subset.Options()
            options.layout_features = ["*"]
            job = subset.Subsetter(options=options)
            job.populate(unicodes=set(group) | {selector for selector, _ in uv})
            job.subset(font)
            for table in font["cmap"].tables:
                if table.isUnicode() and table.format != 14:
                    # Layout closure may retain encoded aliases (e.g. paired punctuation).
                    for alias in table.cmap.keys() - set(group):
                        del table.cmap[alias]
            ps = f"Robin{family}SC-{weight}-{i}"
            for record in font["name"].names:
                value = {1:name, 2:weight, 3:ps, 4:f"{name} {weight}", 6:ps,
                         16:name, 17:weight}.get(record.nameID)
                if value:
                    record.string = value.encode(record.getEncoding())
            cff = font["CFF "].cff
            cff.fontNames[0] = ps
            top = cff.topDictIndex[0]
            top.FamilyName, top.FullName = name, f"{name} {weight}"
            for index, fd in enumerate(top.FDArray):
                fd.FontName = f"{ps}-{index}"
            font.flavor = "woff2"
            data = BytesIO()
            font.save(data)
            payload = data.getvalue()
        with TTFont(BytesIO(payload)) as check:
            mapped = set(check.getBestCmap())
            assert mapped == set(group) and covered.isdisjoint(mapped), (mapped-set(group), set(group)-mapped)
            covered.update(mapped)
            variants.update(variations(check))
        digest = hashlib.sha256(payload).hexdigest()[:16]
        filename = f"{family.lower()}-{weight.lower()}-{digest}.woff2"
        (OUT / filename).write_bytes(payload)
        rules.append(f'@font-face{{font-family:"{name}";font-style:normal;font-weight:'
                     f'{400 if weight == "Regular" else 700};font-display:swap;'
                     f'src:url("../fonts/{filename}") format("woff2");'
                     f'unicode-range:{",".join(ranges[i])}}}')
    assert covered == points and variants == uv
    print(f"{name} {weight}: {len(points)} characters, {len(uv)} variations, {len(groups)} files", flush=True)
    return rules


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("sources", type=Path)
    cache = parser.parse_args().sources
    OUT.mkdir(parents=True, exist_ok=True)
    for family in ("Sans", "Serif"):
        shutil.copyfile(cache / f"{family}-LICENSE.txt", OUT / f"{family}-LICENSE.txt")
    with ProcessPoolExecutor(max_workers=4) as pool:
        jobs = [pool.submit(build, cache, *key) for key in HASHES]
        rules = [rule for job in jobs for rule in job.result()]
    (ROOT / "assets/css/font-faces.css").write_text("\n".join(rules)+"\n", encoding="utf-8", newline="\n")

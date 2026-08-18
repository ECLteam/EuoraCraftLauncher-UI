#!/usr/bin/env python3
"""校验 zh-CN.json 与 en-US.json 的键集合完全一致。

用法：
    python scripts/check-i18n-keys.py

退出码：
    0  — 两个 locale 键集合一致
    1  — 存在差异（输出缺失键清单）
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

LOCALES_DIR = Path(__file__).resolve().parents[1] / "src" / "i18n" / "locales"
LOCALE_FILES = ("zh-CN.json", "en-US.json")


def flatten_keys(obj: object, prefix: str = "") -> set[str]:
    """将嵌套 JSON 对象展开为点分路径键集合（数组视为叶子值）。"""
    keys: set[str] = set()
    if not isinstance(obj, dict):
        return keys
    for key, value in obj.items():
        path = f"{prefix}.{key}" if prefix else str(key)
        if isinstance(value, dict):
            keys |= flatten_keys(value, path)
        else:
            keys.add(path)
    return keys


def main() -> int:
    locales: dict[str, dict] = {}
    for name in LOCALE_FILES:
        path = LOCALES_DIR / name
        if not path.is_file():
            print(f"错误：找不到 locale 文件 {path}")
            return 1
        locales[name] = json.loads(path.read_text(encoding="utf-8"))

    zh_keys = flatten_keys(locales["zh-CN.json"])
    en_keys = flatten_keys(locales["en-US.json"])

    only_zh = sorted(zh_keys - en_keys)
    only_en = sorted(en_keys - zh_keys)

    if only_zh or only_en:
        print("i18n 键集合不一致：")
        for key in only_zh:
            print(f"  en-US.json 缺少: {key}")
        for key in only_en:
            print(f"  zh-CN.json 缺少: {key}")
        return 1

    print(f"OK：两个 locale 键集合一致（共 {len(zh_keys)} 个键）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
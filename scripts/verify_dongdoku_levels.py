#!/usr/bin/env python3
"""找咚 (Dongdoku) 关卡数据完整性校验。

跑法（无第三方依赖，从 fzd-archive/ 目录执行）：
    python3 scripts/verify_dongdoku_levels.py

逐关穷举求解，确认每一关：
  1. 有解；
  2. 解唯一（游戏用 solution 字段判定落子对错，多解会把玩家推出的合法替代解误判为失误）；
  3. 数据里声明的 solution 就是穷举出来的那个解；
  4. region id 恰好是 0..size-1。
非零退出码表示有关卡不合格。
"""
import glob
import json
import os
import sys


def solve_all(regions, size, limit=2):
    """穷举：每行/每列/每领地恰好一个咚，且咚之间八向不相邻。最多返回 limit 个解。"""
    sols, used_col, used_reg, placed = [], set(), set(), []

    def bt(r):
        if len(sols) >= limit:
            return
        if r == size:
            sols.append(sorted(placed))
            return
        for c in range(size):
            if c in used_col:
                continue
            reg = regions[r][c]
            if reg in used_reg:
                continue
            # 只有上一行可能与本行八向相邻
            if placed and placed[-1][0] == r - 1 and abs(placed[-1][1] - c) <= 1:
                continue
            used_col.add(c)
            used_reg.add(reg)
            placed.append((r, c))
            bt(r + 1)
            placed.pop()
            used_col.discard(c)
            used_reg.discard(reg)
            if len(sols) >= limit:
                return

    bt(0)
    return sols


def main():
    data_dir = os.path.join('public', 'data', 'dongdoku')
    packs = sorted(glob.glob(os.path.join(data_dir, 'pack_*.json')))
    if not packs:
        print(f'找不到关卡数据：{data_dir}/pack_*.json（请在 fzd-archive/ 下运行）')
        return 2

    levels = {}
    for f in packs:
        with open(f, encoding='utf-8') as fh:
            levels.update(json.load(fh))

    no_solution, multi_solution, mismatch, bad_regions = [], [], [], []

    for lid_s, lv in sorted(levels.items(), key=lambda kv: int(kv[0])):
        lid, size, regions = int(lid_s), lv['size'], lv['regions']

        if {x for row in regions for x in row} != set(range(size)):
            bad_regions.append(lid)

        sols = solve_all(regions, size, limit=2)
        if not sols:
            no_solution.append(lid)
            continue
        if len(sols) > 1:
            multi_solution.append(lid)
        if sorted((s['row'], s['col']) for s in lv['solution']) != sols[0]:
            mismatch.append(lid)

    total = len(levels)
    problems = [
        ('无解', no_solution),
        ('多解', multi_solution),
        ('声明的 solution 与穷举结果不符', mismatch),
        ('region id 不是 0..size-1', bad_regions),
    ]

    print(f'已校验 {total} 关')
    for label, ids in problems:
        print(f'  {label}: {len(ids)}' + (f' -> {ids[:20]}' if ids else ''))

    if any(ids for _, ids in problems):
        return 1
    print('全部通过：每关都唯一可解，且与声明的 solution 一致。')
    return 0


if __name__ == '__main__':
    sys.exit(main())

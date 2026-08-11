#!/usr/bin/env python3
"""체육관 로고 전처리 — 흰 배경 제거 + 다듬기 + PNG 출력.

로고 원본(사진/캡처)을 받아서 사이트 카드에 바로 쓸 수 있는 투명 PNG 로 만든다.

  python3 tools/make-gym-logo.py <원본> [-o assets/workout/img/tgc-logo.png]

하는 일:
  1. 네 모서리에서 flood fill 로 '바깥 흰 배경'만 골라 투명하게 만든다.
     로고 안쪽의 밝은 색은 모서리와 이어져 있지 않으므로 건드리지 않는다.
  2. 경계 픽셀은 흰색에 가까운 정도만큼 반투명하게 만들어 계단 현상을 줄인다.
  3. 내용물 기준으로 잘라내고 정사각 캔버스 가운데에 놓는다.
  4. JPEG 링잉 노이즈를 줄이기 위해 살짝 median 을 걸고, LANCZOS 로 리샘플한다.
  5. @1x / @2x 두 벌을 저장한다.

의존성: Pillow, numpy   (pip install Pillow numpy)

한계: 원본에 없는 디테일을 만들어 내지는 못한다. 흐릿한 원본은 흐릿하게 나온다.
      진짜 초해상도가 필요하면 Real-ESRGAN 같은 별도 모델을 써야 한다.
"""

from __future__ import annotations

import argparse
import sys
from collections import deque
from pathlib import Path

try:
    import numpy as np
    from PIL import Image, ImageFilter
except ImportError:
    sys.exit("Pillow 와 numpy 가 필요합니다:  pip install Pillow numpy")


def flood_background(rgb: np.ndarray, tolerance: int) -> np.ndarray:
    """네 모서리에서 시작해 비슷한 색으로 이어진 영역을 True 로 표시한다.

    단순 '밝은 픽셀 = 배경' 방식과 달리, 로고 안쪽의 흰색(글자 테두리 등)은
    바깥과 이어져 있지 않으므로 살아남는다.
    """
    h, w = rgb.shape[:2]
    visited = np.zeros((h, w), dtype=bool)
    seeds = [(0, 0), (0, w - 1), (h - 1, 0), (h - 1, w - 1)]

    # 모서리 색의 평균을 배경 기준색으로 삼는다
    ref = np.mean([rgb[y, x].astype(np.int16) for y, x in seeds], axis=0)

    queue = deque()
    for y, x in seeds:
        if not visited[y, x]:
            visited[y, x] = True
            queue.append((y, x))

    while queue:
        y, x = queue.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                if np.abs(rgb[ny, nx].astype(np.int16) - ref).max() <= tolerance:
                    visited[ny, nx] = True
                    queue.append((ny, nx))
    return visited


def soften_edges(rgb: np.ndarray, bg: np.ndarray, tolerance: int) -> np.ndarray:
    """경계 픽셀의 알파를 '배경색에 얼마나 가까운가'로 정해 계단을 줄인다."""
    h, w = bg.shape
    alpha = np.where(bg, 0, 255).astype(np.float32)

    ref = np.array([255.0, 255.0, 255.0])
    corner = rgb[0, 0].astype(np.float32)
    if corner.max() < 200:            # 배경이 흰색이 아닌 경우 모서리 색을 쓴다
        ref = corner

    # 배경으로 잡히진 않았지만 배경과 맞닿은 픽셀만 손본다
    padded = np.pad(bg, 1, constant_values=False)
    touches_bg = (
        padded[:-2, 1:-1] | padded[2:, 1:-1] | padded[1:-1, :-2] | padded[1:-1, 2:]
    )
    edge = (~bg) & touches_bg

    dist = np.abs(rgb.astype(np.float32) - ref).max(axis=2)
    ramp = np.clip(dist / max(tolerance, 1), 0.0, 1.0) * 255.0
    alpha[edge] = ramp[edge]
    return alpha.astype(np.uint8)


def trim(img: Image.Image, pad_ratio: float) -> Image.Image:
    """알파 기준으로 잘라내고 정사각 캔버스 가운데에 놓는다."""
    bbox = img.getchannel("A").getbbox()
    if bbox:
        img = img.crop(bbox)

    side = max(img.size)
    pad = int(side * pad_ratio)
    canvas = Image.new("RGBA", (side + pad * 2, side + pad * 2), (0, 0, 0, 0))
    canvas.paste(img, ((canvas.width - img.width) // 2, (canvas.height - img.height) // 2))
    return canvas


def main() -> int:
    ap = argparse.ArgumentParser(description="체육관 로고 배경 제거 + PNG 변환")
    ap.add_argument("source", type=Path, help="원본 이미지 (jpg/png/webp)")
    ap.add_argument("-o", "--out", type=Path,
                    default=Path("assets/workout/img/tgc-logo.png"),
                    help="출력 경로 (기본: assets/workout/img/tgc-logo.png)")
    ap.add_argument("--size", type=int, default=512, help="출력 한 변 픽셀 (기본 512)")
    ap.add_argument("--tolerance", type=int, default=32,
                    help="배경으로 볼 색 차이 허용치 0-255 (기본 32). 흰 테두리가 남으면 올린다")
    ap.add_argument("--pad", type=float, default=0.03, help="여백 비율 (기본 0.03)")
    ap.add_argument("--denoise", type=int, default=3,
                    help="median 필터 크기, 홀수. 0 이면 끔 (기본 3)")
    ap.add_argument("--no-2x", action="store_true", help="@2x 파일을 만들지 않는다")
    args = ap.parse_args()

    if not args.source.exists():
        return f"원본을 찾을 수 없습니다: {args.source}"

    img = Image.open(args.source).convert("RGB")
    print(f"원본        : {args.source}  {img.width}x{img.height}")

    if args.denoise and args.denoise >= 3:
        img = img.filter(ImageFilter.MedianFilter(size=args.denoise | 1))

    rgb = np.array(img)
    bg = flood_background(rgb, args.tolerance)
    print(f"배경 픽셀   : {bg.sum() / bg.size:.1%}")

    alpha = soften_edges(rgb, bg, args.tolerance)
    rgba = Image.fromarray(np.dstack([rgb, alpha]), mode="RGBA")
    rgba = trim(rgba, args.pad)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    targets = [(args.out, args.size)]
    if not args.no_2x:
        targets.append((args.out.with_name(args.out.stem + "@2x" + args.out.suffix),
                        args.size * 2))

    for path, size in targets:
        rgba.resize((size, size), Image.LANCZOS).save(path, "PNG", optimize=True)
        print(f"저장        : {path}  {size}x{size}  ({path.stat().st_size / 1024:.0f} KB)")

    print("\n_config.yml 의 workout.gym.logo 에 아래를 넣으면 적용됩니다:")
    print(f'  logo: "/{args.out.as_posix()}"')
    return 0


if __name__ == "__main__":
    sys.exit(main())

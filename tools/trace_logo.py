"""Трассирует вордмарк Remy из превью CorelDRAW в SVG.

Почему так: клиент отдал только .cdr (бинарный CorelDRAW X7+), конвертера
в системе нет. Внутри архива лежит превью 470x256 PNG без альфы — это
единственный доступный растр логотипа. Апскейлим Lanczos x4, бинаризуем,
трассируем potrace, дальше подчищаем.

Когда клиент пришлёт SVG/AI/EPS — этот скрипт больше не нужен, просто
положить настоящий вектор в assets/logo-remy.svg.
"""
import os
import sys
import zipfile

import numpy as np
import potrace
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ASSETS = os.path.join(ROOT, "assets")
DOWNLOADS = r"C:\Users\user\Downloads"

SCALE = 3
THRESHOLD = 160


def preview_from_cdr(zip_path):
    """Достаёт previews/thumbnail.png из .cdr (это zip-контейнер)."""
    with zipfile.ZipFile(zip_path) as z:
        for name in ("previews/thumbnail.png", "previews/page1.png"):
            if name in z.namelist():
                with z.open(name) as f:
                    return Image.open(f).convert("L")
    raise RuntimeError("no preview in %s" % zip_path)


def to_bitmap(img):
    big = img.resize((img.width * SCALE, img.height * SCALE), Image.LANCZOS)
    # ВАЖНО: potrace.Bitmap сам бинаризует (data > 255*blacklevel) и потом
    # инвертирует, поэтому подаём СЫРОЙ grayscale, а не готовую маску.
    # Подать уже бинаризованный массив = получить залитый прямоугольник.
    return np.array(big, dtype=np.uint8), big.size


def trace(bitmap):
    bmp = potrace.Bitmap(bitmap, blacklevel=THRESHOLD / 255.0)
    return bmp.trace(turdsize=3, alphamax=1.34, opticurve=True, opttolerance=1.5)


def path_d(path, scale):
    """Кривые potrace -> SVG path data, координаты делим обратно на SCALE."""
    def pt(p):
        return "%.1f %.1f" % (p.x / scale, p.y / scale)

    out = []
    for curve in path:
        out.append("M " + pt(curve.start_point))
        for seg in curve:
            if seg.is_corner:
                out.append("L " + pt(seg.c))
                out.append("L " + pt(seg.end_point))
            else:
                out.append("C %s %s %s" % (pt(seg.c1), pt(seg.c2), pt(seg.end_point)))
        out.append("Z")
    return " ".join(out)


SVG = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
       'role="img" aria-label="Remy Boutique Floral">\n'
       '  <title>Remy Boutique Floral</title>\n'
       '  <path fill="{fill}" fill-rule="evenodd" d="{d}"/>\n'
       '</svg>\n')


def main():
    src = os.path.join(DOWNLOADS, "remy_red_logo.cdr.zip")
    if not os.path.exists(src):
        print("missing %s" % src, file=sys.stderr)
        return 1

    img = preview_from_cdr(src)
    bitmap, big_size = to_bitmap(img)
    path = trace(bitmap)
    d = path_d(path, SCALE)

    os.makedirs(ASSETS, exist_ok=True)
    variants = [
        ("logo-remy.svg", "#711339"),        # бордо — по светлому фону
        ("logo-remy-peach.svg", "#F9CEAE"),  # персик — по бордовому
        ("logo-remy-current.svg", "currentColor"),
    ]
    for name, fill in variants:
        svg = SVG.format(w=img.width, h=img.height, fill=fill, d=d)
        with open(os.path.join(ASSETS, name), "w", encoding="utf-8") as f:
            f.write(svg)
        print("%s  %.1f KB" % (name, os.path.getsize(os.path.join(ASSETS, name)) / 1024))

    n = sum(1 for _ in path)
    print("\nviewBox 0 0 %d %d, %d subpaths, traced from %dx%d"
          % (img.width, img.height, n, big_size[0], big_size[1]))
    return 0


if __name__ == "__main__":
    sys.exit(main())

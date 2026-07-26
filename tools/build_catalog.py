"""Готовит карточки каталога из исходных кадров Instagram.

Цены на сайте берутся не с потолка: они вожжены в сами кадры Remy
(«- 34 000»), то есть это их собственные опубликованные цены. Здесь
эти надписи срезаются — цена уходит в текст карточки, где её можно
поправить в одном месте, а не перерисовывать картинку.

Кроп у каждого кадра свой: подпись сидит на разной высоте. Значения
выставлены по контакт-листу, не на глаз.

Квадрат, а не портрет: после среза верха высоты остаётся 400–550px,
и портрет 4:5 пришлось бы тянуть по ширине. Апскейл запрещён.
"""
import os

from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, "assets", "bouquets", "_source")
OUT = os.path.join(ROOT, "assets", "catalog")

MAX_PX = 480

# ключ исходника -> сколько срезать сверху (доля высоты)
ITEMS = [
    ("01", 0.26),
    ("03", 0.37),
    ("02", 0.29),
    ("07", 0.28),
    ("09", 0.28),
    ("04", 0.24),
    ("10", 0.19),
    ("06", 0.25),
]


def main():
    os.makedirs(OUT, exist_ok=True)
    total = 0
    for key, crop in ITEMS:
        src = os.path.join(SRC, "bouquet-%s.webp" % key)
        if not os.path.exists(src):
            print("SKIP missing", src)
            continue
        im = Image.open(src).convert("RGB")
        w, h = im.size
        im = im.crop((0, int(h * crop), w, h))

        side = min(im.size)
        left = (im.width - side) // 2
        sq = im.crop((left, 0, left + side, side))
        if sq.width > MAX_PX:
            sq = sq.resize((MAX_PX, MAX_PX), Image.LANCZOS)

        # стоп-кадры видео мягкие из-за межкадрового сжатия
        sq = sq.filter(ImageFilter.UnsharpMask(radius=1.4, percent=72, threshold=3))

        base = os.path.join(OUT, "b-%s" % key)
        sq.save(base + ".avif", "AVIF", quality=58)
        sq.save(base + ".webp", "WEBP", quality=76, method=6)
        sq.resize((20, 20), Image.LANCZOS).save(base + "-lqip.webp", "WEBP", quality=45)

        kb = os.path.getsize(base + ".avif") / 1024
        total += kb
        print("b-%s  %sx%s  %5.1f KB" % (key, sq.width, sq.height, kb))
    print("\nвсего %.0f KB" % total)


if __name__ == "__main__":
    main()

"""Собирает финальные ассеты галереи, hero и фона «звёздной доставки».

Отбор сделан глазами по контакт-листам tools/stock-A|B|C.png.
Отбраковано: всё, где в кадре видна упаковка или карточка ЧУЖОГО флориста
(«CHENY FLORAL», «MENSFLORY») и вся сине-подсвеченная сцена — синий вне
палитры бренда и дерётся с бордовым.

Реальные кадры Remy оставлены там, где видны фирменные ленты и логотип:
это доказательство, что букет собран ими, а не картинка из интернета.
"""
import os

from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
STOCK = os.path.join(HERE, "_stock")
OUT = os.path.join(ROOT, "assets", "bouquets")
ASSETS = os.path.join(ROOT, "assets")

# (выходное имя, источник, размер, кроп по вертикали 0..1 — какая часть кадра)
TILES = [
    ("g-01", os.path.join(STOCK, "A-34427286.jpg"), 760, 0.42),
    ("g-03", os.path.join(STOCK, "A-11626588.jpg"), 460, 0.48),
    ("g-05", os.path.join(STOCK, "A-20156577.jpg"), 460, 0.45),
]
# hero страницы и фон блока «звёздная доставка»
HERO = (os.path.join(STOCK, "A-38390245.jpg"), 1200, 1600)
STARS_BG = (os.path.join(STOCK, "B-33406913.jpg"), 900, 1200)


def square(im, size, focus=0.45):
    """Квадратный кроп с фокусом на заданной доле высоты."""
    w, h = im.size
    side = min(w, h)
    top = int((h - side) * focus)
    left = (w - side) // 2
    im = im.crop((left, top, left + side, top + side))
    return im.resize((size, size), Image.LANCZOS)


def save(im, base, q_avif=60, q_webp=80):
    im.save(base + ".avif", "AVIF", quality=q_avif)
    im.save(base + ".webp", "WEBP", quality=q_webp, method=6)
    im.resize((20, 20), Image.LANCZOS).save(base + "-lqip.webp", "WEBP", quality=45)
    return os.path.getsize(base + ".avif") / 1024


def main():
    total = 0
    for name, src, size, focus in TILES:
        im = Image.open(src).convert("RGB")
        sq = square(im, size, focus)
        sq = sq.filter(ImageFilter.UnsharpMask(radius=1.0, percent=40, threshold=3))
        kb = save(sq, os.path.join(OUT, name))
        total += kb
        print("%-7s %sx%s  %5.1f KB" % (name, size, size, kb))

    src, w, h = HERO
    im = Image.open(src).convert("RGB")
    iw, ih = im.size
    scale = max(w / iw, h / ih)
    im = im.resize((int(iw * scale), int(ih * scale)), Image.LANCZOS)
    left = (im.width - w) // 2
    im = im.crop((left, 0, left + w, h))
    kb = save(im, os.path.join(ASSETS, "hero"), q_avif=58, q_webp=78)
    total += kb
    print("%-7s %sx%s  %5.1f KB" % ("hero", w, h, kb))

    src, w, h = STARS_BG
    im = Image.open(src).convert("RGB")
    iw, ih = im.size
    scale = max(w / iw, h / ih)
    im = im.resize((int(iw * scale), int(ih * scale)), Image.LANCZOS)
    left = (im.width - w) // 2
    im = im.crop((left, 0, left + w, h))
    kb = save(im, os.path.join(ASSETS, "stars-bg"), q_avif=52, q_webp=72)
    total += kb
    print("%-7s %sx%s  %5.1f KB" % ("stars", w, h, kb))

    print("\nновых ассетов на %.0f KB (avif)" % total)


if __name__ == "__main__":
    main()

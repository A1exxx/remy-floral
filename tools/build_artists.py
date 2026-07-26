"""Готовит кадры для карточек ролей в блоке «Звёздная доставка».

Отбор по контакт-листу tools/artists-sheet.png (смотрел глазами).
Критерии: тёмный тёплый кадр (ляжет на бордовую панель), премиальный
образ, без читаемого текста и вывесок в кадре. Отбраковано: пурпурная
подсветка (13112775), кадр с вывеской «Gobierno de Puebla» (18657324),
светлый плоский сток.

Юридически: лицензия Pexels запрещает подавать человека так, будто он
одобряет услугу. Поэтому под рельсой на странице стоит строка
«фото иллюстративные — показывают формат вручения».
"""
import os

from PIL import Image, ImageEnhance, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
STOCK = os.path.join(HERE, "_stock")
OUT = os.path.join(ROOT, "assets", "artists")

W, H = 360, 480          # 3:4, с запасом под DPR2 на карточке ~150x200

# (имя, файл, фокус кропа по вертикали 0..1)
CARDS = [
    ("sax", "ART-9002789.jpg", 0.30),
    ("music", "ART-8180738.jpg", 0.34),
    ("actor", "ART-20752500.jpg", 0.22),
    ("host", "ART-26524772.jpg", 0.20),
]


def crop(im, focus):
    """Кроп под 3:4 с фокусом на верхней части кадра — там лицо."""
    tw, th = W, H
    scale = max(tw / im.width, th / im.height)
    im = im.resize((max(tw, int(im.width * scale)), max(th, int(im.height * scale))),
                   Image.LANCZOS)
    left = (im.width - tw) // 2
    top = int((im.height - th) * focus)
    return im.crop((left, top, left + tw, top + th))


def main():
    os.makedirs(OUT, exist_ok=True)
    total = 0
    for name, src, focus in CARDS:
        path = os.path.join(STOCK, src)
        if not os.path.exists(path):
            print("SKIP", src)
            continue
        im = Image.open(path).convert("RGB")
        im = crop(im, focus)
        # чуть приглушаем насыщенность: карточки лежат на бордовом,
        # пёстрый кадр рядом с брендовым полем спорит с ним
        im = ImageEnhance.Color(im).enhance(0.88)
        im = im.filter(ImageFilter.UnsharpMask(radius=1.0, percent=45, threshold=3))

        base = os.path.join(OUT, name)
        im.save(base + ".avif", "AVIF", quality=58)
        im.save(base + ".webp", "WEBP", quality=76, method=6)
        kb = os.path.getsize(base + ".avif") / 1024
        total += kb
        print("%-7s %sx%s  %5.1f KB" % (name, W, H, kb))
    print("\nвсего %.0f KB" % total)


if __name__ == "__main__":
    main()

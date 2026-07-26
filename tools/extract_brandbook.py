"""Достаёт носители фирменного стиля прямо из брендбука.

Почему это лучше стока: все мокапы сняты в бордово-персиковой гамме
бренда, с настоящим логотипом и фирменными дугами. Сток, каким бы
красивым ни был, всегда чуть-чуть не про Remy.

Страницы PDF — цельные картинки 1920x1080, поэтому берём страницу
и вырезаем нужную область.
"""
import os

import fitz
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "assets", "brand")
PDF = r"C:\Users\user\Downloads\Remy Brandbook (2).pdf"

ZOOM = 2.4          # 1920x1080 -> 4608x2592, запас на кроп

# имя, страница PDF (1-based), кроп в долях (x0,y0,x1,y1), выходная ширина
ITEMS = [
    # обложка брендбука: макро бордовой розы — идеальный фон hero
    # левая часть обложки: сама роза, без вшитого логотипа и подписи
    ("rose",     1,  (0.00, 0.00, 0.355, 1.00), 1000),
    # сертификат / подарочный купон
    ("cert",    46,  (0.03, 0.10, 0.99, 0.95), 1100),
    # упаковка
    ("boxes",   30,  (0.10, 0.10, 0.92, 0.96),  900),
    ("bags",    29,  (0.12, 0.12, 0.90, 0.95),  900),
    ("cone",    44,  (0.28, 0.02, 0.72, 1.00),  760),
    ("hatbox",  45,  (0.22, 0.05, 0.80, 1.00),  760),
    ("tissue",  32,  (0.16, 0.12, 0.88, 0.94),  760),
    ("ribbon",  36,  (0.10, 0.14, 0.94, 0.92),  900),
    ("cards",   41,  (0.10, 0.06, 0.92, 0.98),  900),
    ("sign",    42,  (0.14, 0.02, 0.86, 1.00),  760),
    ("shopper", 28,  (0.14, 0.04, 0.84, 1.00),  760),
    ("window",  35,  (0.20, 0.04, 0.95, 0.98),  900),
    ("apron",   27,  (0.22, 0.04, 0.80, 1.00),  760),
    ("car",     37,  (0.06, 0.22, 0.96, 0.86),  900),
]


def main():
    os.makedirs(OUT, exist_ok=True)
    doc = fitz.open(PDF)
    total = 0
    for name, page, box, width in ITEMS:
        pix = doc[page - 1].get_pixmap(matrix=fitz.Matrix(ZOOM, ZOOM))
        im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        w, h = im.size
        im = im.crop((int(w * box[0]), int(h * box[1]),
                      int(w * box[2]), int(h * box[3])))
        ratio = im.height / im.width
        im = im.resize((width, int(width * ratio)), Image.LANCZOS)
        im = im.filter(ImageFilter.UnsharpMask(radius=1.0, percent=35, threshold=3))

        base = os.path.join(OUT, name)
        im.save(base + ".avif", "AVIF", quality=60)
        im.save(base + ".webp", "WEBP", quality=78, method=6)
        im.resize((20, int(20 * ratio)), Image.LANCZOS).save(
            base + "-lqip.webp", "WEBP", quality=45)
        kb = os.path.getsize(base + ".avif") / 1024
        total += kb
        print("%-9s %sx%s  %5.1f KB" % (name, im.width, im.height, kb))
    print("\nвсего %.0f KB" % total)


if __name__ == "__main__":
    main()

"""QR-коды для мероприятия: бордовый на молочном, знак Мүйіз в центре.

Коррекция ошибок H (30%) — код переживёт печать, блики и палец на углу.
Отдельная метка utm_content на каждое место размещения: так видно,
какая точка реально работает.
"""
import os
import sys

import qrcode
from PIL import Image
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.colormasks import SolidFillColorMask
from qrcode.image.styles.moduledrawers.pil import RoundedModuleDrawer

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_brand_assets import rasterize  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ASSETS = os.path.join(ROOT, "assets")

ROSE = (113, 19, 57)
CREAM = (255, 251, 243)

BASE = "https://a1exxx.github.io/remy-floral/"
PLACES = [
    ("vitrina", "витрина / вход"),
    ("stol", "коктейльные столы"),
    ("upakovka", "упаковка и карточка в букете"),
    ("banner", "фотозона / баннер"),
]


def build(url, out_png, px=2000):
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=20,
        border=4,          # тихая зона 4 модуля — меньше нельзя
    )
    qr.add_data(url)
    qr.make(fit=True)

    # fill_color/back_color при StyledPilImage игнорируются — нужен color mask
    img = qr.make_image(
        image_factory=StyledPilImage,
        module_drawer=RoundedModuleDrawer(radius_ratio=1.0),
        color_mask=SolidFillColorMask(back_color=CREAM, front_color=ROSE),
    ).convert("RGB")
    img = img.resize((px, px), Image.LANCZOS)

    # знак в центре: при ECC=H перекрытие до ~20% площади безопасно
    mark_px = int(px * 0.155)
    pad = int(mark_px * 0.42)
    plate = Image.new("RGB", (mark_px + pad * 2, mark_px + pad * 2), CREAM)
    mark = rasterize(os.path.join(ASSETS, "fleur.svg"), mark_px, ROSE)
    plate.paste(mark, (pad, pad), mark)
    img.paste(plate, ((px - plate.width) // 2, (px - plate.height) // 2))

    img.save(out_png, "PNG", optimize=True)
    return qr.version, os.path.getsize(out_png)


def main():
    out_dir = os.path.join(ROOT, "qr")
    os.makedirs(out_dir, exist_ok=True)
    print("QR ведут на %s\n" % BASE)
    for slug, human in PLACES:
        url = "%s?s=%s" % (BASE, slug)   # короткая метка: version ниже, скан надёжнее
        path = os.path.join(out_dir, "qr-%s.png" % slug)
        ver, size = build(url, path)
        print("qr-%-9s  version %-2s  %5.0f KB   %s" % (slug, ver, size / 1024, human))
    print("\nПечать: не мельче 2.5–3 см при сканировании с 20–30 см.")
    print("Перед печатью проверить на трёх разных телефонах.")


if __name__ == "__main__":
    main()

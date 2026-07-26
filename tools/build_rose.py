"""Готовит фон hero — розу с обложки брендбука, без вшитых надписей.

На обложке поверх розы стоят «Remy» и «Brandbook» кремовой краской.
Свой логотип сайт рисует сам и адаптивно, поэтому растровые надписи
надо убрать, иначе на телефоне получится два «Remy» в разных местах
и разного размера.

Как убираем: роза — глубокий красный (зелёный канал низкий), надписи —
кремовые (зелёный канал высокий). Разделяются одним порогом по G,
дальше cv2.inpaint дорисовывает лепестки по краям маски.
"""
import os

import cv2
import fitz
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "assets", "brand")
PDF = r"C:\Users\user\Downloads\Remy Brandbook (2).pdf"

ZOOM = 3.0            # 1920x1080 -> 5760x3240
G_TEXT = 95           # порог по зелёному каналу: выше — это краска, не лепесток
DILATE = 9            # маску расширяем, иначе остаётся кремовый ореол по контуру
WIDTH = 2400          # финальная ширина


def main():
    os.makedirs(OUT, exist_ok=True)
    pix = fitz.open(PDF)[0].get_pixmap(matrix=fitz.Matrix(ZOOM, ZOOM))
    im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    rgb = np.array(im)

    g = rgb[:, :, 1].astype(np.int16)
    b = rgb[:, :, 2].astype(np.int16)
    mask = ((g > G_TEXT) & (b > 60)).astype(np.uint8) * 255

    # Ограничиваем зону поиска: только там, где реально лежат надписи.
    # Иначе в маску попадут светлые блики на лепестках по краям кадра.
    h, w = mask.shape
    zone = np.zeros_like(mask)
    zone[int(h * 0.36):int(h * 0.93), int(w * 0.28):int(w * 0.72)] = 255
    mask = cv2.bitwise_and(mask, zone)
    mask = cv2.dilate(mask, np.ones((DILATE, DILATE), np.uint8), iterations=1)
    print("маска: %d px (%.3f%% кадра)" % (int(mask.sum() / 255),
                                           100.0 * (mask > 0).mean()))

    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    fixed = cv2.inpaint(bgr, mask, 12, cv2.INPAINT_TELEA)
    out = Image.fromarray(cv2.cvtColor(fixed, cv2.COLOR_BGR2RGB))

    ratio = out.height / out.width
    out = out.resize((WIDTH, int(WIDTH * ratio)), Image.LANCZOS)

    base = os.path.join(OUT, "rose")
    out.save(base + ".avif", "AVIF", quality=62)
    out.save(base + ".webp", "WEBP", quality=80, method=6)
    out.resize((24, int(24 * ratio)), Image.LANCZOS).save(
        base + "-lqip.webp", "WEBP", quality=45)
    print("rose %sx%s  %.1f KB avif" % (out.width, out.height,
                                        os.path.getsize(base + ".avif") / 1024))

    # контрольная копия для глаз, в репозиторий не идёт
    out.save(os.path.join(HERE, "_rose-check.png"))


if __name__ == "__main__":
    main()

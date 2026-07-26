"""Готовит финальные тайлы галереи из скачанных кадров.

Почему кроп 26% сверху: исходники — cover-кадры Reels, на них вожжены
оверлеи (цены «- 25 000», подписи рукописным шрифтом) и лица людей.
Срез верхней четверти убирает и то, и другое, а букет остаётся в кадре,
потому что в вертикальном рилсе он всегда в нижних двух третях.

Апскейл запрещён: источник 640x640, тайлы не крупнее 320 CSS-px при DPR2.
"""
import glob
import os

from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(os.path.dirname(HERE), "assets", "bouquets")
CROP_TOP = 0.26
TILE_PX = 420

# У части рилсов подпись с ценой сидит ниже обычного — для них режем больше.
# Значения выставлены по контакт-листу tools/final-tiles.png, не на глаз.
CROP_OVERRIDE = {"03": 0.45}

# Отобраны по контакт-листу: без вожжённого текста и без узнаваемых лиц.
# Порядок = порядок в галерее. 01/11 — бордовый интерьер магазина, самые
# «в палитре», поэтому идут на крупные позиции.
KEEP = ["01", "04", "06", "02", "10", "03", "09", "11"]

ALT = {
    "01": "Композиция из гортензии, подсолнуха и роз в пастельных тонах на бордовом фоне салона Remy",
    "02": "Букет из пионовидных розовых и кремовых роз в матовой упаковке с лентами Remy",
    "03": "Букет из синей гортензии с жёлтыми и белыми розами",
    "04": "Крупный букет из коралловых и персиковых роз с брендированными лентами Remy",
    "06": "Большая авторская композиция из гортензии, лилий, подсолнухов и роз в коробке Remy",
    "09": "Круглый букет из голубой гортензии с жёлтыми и белыми хризантемами",
    "10": "Плотный букет из ярко-розовых кустовых роз с бордовой лентой Remy",
    "11": "Витрина бутика Remy: букеты и шляпные коробки на подсвеченных стеллажах",
}


def main():
    out = []
    for key in KEEP:
        src = os.path.join(SRC, "bouquet-%s.webp" % key)
        if not os.path.exists(src):
            print("SKIP missing", src)
            continue
        im = Image.open(src).convert("RGB")
        w, h = im.size
        im = im.crop((0, int(h * CROP_OVERRIDE.get(key, CROP_TOP)), w, h))
        side = min(im.size)
        # центрируем по горизонтали, берём верх обрезанной области
        left = (im.width - side) // 2
        sq = im.crop((left, 0, left + side, side))

        # 420px: тайл нигде не показывается крупнее 253 CSS-px, при DPR2 это
        # 506px — небольшой downscale незаметен, а апскейла по-прежнему нет.
        if sq.width > TILE_PX:
            sq = sq.resize((TILE_PX, TILE_PX), Image.LANCZOS)

        # Исходники — стоп-кадры видео, они мягкие из-за межкадрового сжатия.
        # Лёгкий unsharp по яркости заметно поднимает воспринимаемую резкость;
        # порог 3 не даёт вытащить шум в тенях.
        sq = sq.filter(ImageFilter.UnsharpMask(radius=1.4, percent=72, threshold=3))

        base = os.path.join(SRC, "tile-%s" % key)
        sq.save(base + ".avif", "AVIF", quality=58)
        sq.save(base + ".webp", "WEBP", quality=76, method=6)
        sq.resize((20, 20), Image.LANCZOS).save(base + "-lqip.webp", "WEBP", quality=45)

        kb = os.path.getsize(base + ".avif") / 1024
        out.append((key, sq.size, kb))
        print("tile-%s  %sx%s  %.1f KB" % (key, sq.width, sq.height, kb))

    total = sum(x[2] for x in out)
    print("\n%d tiles, %.0f KB total webp" % (len(out), total))

    # Исходники НЕ удаляем — подписанные ссылки Instagram истекают ~31.07,
    # перекачать будет нечем. Уносим в _source, он уйдёт в .gitignore.
    src_dir = os.path.join(SRC, "_source")
    os.makedirs(src_dir, exist_ok=True)
    moved = 0
    for f in glob.glob(os.path.join(SRC, "bouquet-*")):
        os.replace(f, os.path.join(src_dir, os.path.basename(f)))
        moved += 1
    print("moved %d source frames to _source/ (kept, not deleted)" % moved)


if __name__ == "__main__":
    main()

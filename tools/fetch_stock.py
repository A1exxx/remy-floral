"""Качает кандидатов со стока Pexels для отбора.

Лицензия Pexels: бесплатно, коммерческое использование разрешено,
атрибуция не требуется. https://www.pexels.com/license/

ВАЖНО про группу B (артисты): нельзя подавать человека с фото так,
будто это реальная знаменитость, которая привезёт букет. Только
абстрактная атмосфера — инструмент, сцена, свет.
"""
import io
import os
import sys
import urllib.request

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "_stock")

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")

TPL = "https://images.pexels.com/photos/{id}/pexels-photo-{id}.{ext}?auto=compress&cs=tinysrgb&w=1600"
TPL_PNG = ("https://images.pexels.com/photos/{id}/pexels-photo-{id}.png"
           "?auto=compress&cs=tinysrgb&fm=jpg&w=1600")

# (группа, id, png?)
ITEMS = [
    # A — букеты
    ("A", 36171905, False), ("A", 34427286, False), ("A", 38390245, False),
    ("A", 11626588, False), ("A", 17705226, False), ("A", 20156577, False),
    ("A", 33886745, True),  ("A", 36399726, False), ("A", 36399735, False),
    ("A", 15801495, False), ("A", 36399732, False), ("A", 36399734, False),
    ("A", 36399741, False), ("A", 36399738, False), ("A", 29713846, False),
    ("A", 33886742, True),
    # B — артисты / сцена
    ("B", 33406913, False), ("B", 33406912, False), ("B", 9831878, False),
    ("B", 7095517, False),  ("B", 17780305, False), ("B", 15129809, False),
    ("B", 6311811, False),  ("B", 4039987, False),  ("B", 6054116, False),
    ("B", 20709592, False),
    # C — витрина
    ("C", 21835295, False), ("C", 18393677, False), ("C", 12189793, False),
    ("C", 38618585, False), ("C", 35055388, False),
]


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def main():
    os.makedirs(OUT, exist_ok=True)
    ok = 0
    for grp, pid, is_png in ITEMS:
        name = "%s-%d.jpg" % (grp, pid)
        path = os.path.join(OUT, name)
        if os.path.exists(path):
            ok += 1
            continue
        url = TPL_PNG.format(id=pid) if is_png else TPL.format(id=pid, ext="jpeg")
        try:
            raw = get(url)
            im = Image.open(io.BytesIO(raw)).convert("RGB")
            im.save(path, "JPEG", quality=92)
            print("%-14s %sx%s  %.0f KB" % (name, im.width, im.height, len(raw) / 1024))
            ok += 1
        except Exception as e:
            print("FAIL %s: %s" % (name, e), file=sys.stderr)
    print("\n%d/%d скачано в %s" % (ok, len(ITEMS), OUT))


if __name__ == "__main__":
    main()

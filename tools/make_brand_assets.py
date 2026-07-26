"""Собирает og:image, favicon и apple-touch-icon из бренд-ассетов."""
import os
import re

import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ASSETS = os.path.join(ROOT, "assets")
FAV = os.path.join(ASSETS, "favicon")

ROSE = (113, 19, 57)
PEACH = (249, 206, 174)
CREAM = (255, 251, 243)
GEORGIA = r"C:\Windows\Fonts\georgia.ttf"


# ── мини-растеризатор SVG-путей (только M/L/C/Z, even-odd) ──────
def _bez(p0, p1, p2, p3, n=18):
    out = []
    for i in range(1, n + 1):
        t = i / n
        mt = 1 - t
        out.append((mt**3*p0[0] + 3*mt*mt*t*p1[0] + 3*mt*t*t*p2[0] + t**3*p3[0],
                    mt**3*p0[1] + 3*mt*mt*t*p1[1] + 3*mt*t*t*p2[1] + t**3*p3[1]))
    return out


_TOK = re.compile(r'[MmLlHhVvCcSsZz]|-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?')


def _subpaths(d):
    """SVG path -> список полигонов. Абсолютные и относительные M/L/H/V/C/S/Z.

    Нужен именно свой: potrace отдаёт «M 1.0 2.0 C ...» с пробелами,
    а руками написанный fleur.svg — компактный «M12 1.6c1.05 1.6...».
    Наивный split() ломается на втором.
    """
    toks = _TOK.findall(d)
    i, n = 0, len(toks)
    pos = (0.0, 0.0)
    start = (0.0, 0.0)
    prev_c2 = None
    cur, subs, cmd = [], [], None

    def num():
        nonlocal i
        v = float(toks[i]); i += 1
        return v

    while i < n:
        if re.match(r'^[A-Za-z]$', toks[i]):
            cmd = toks[i]; i += 1
            if cmd in "Zz":
                if cur:
                    subs.append(cur); cur = []
                pos = start
                continue
        if i >= n:
            break
        rel = cmd.islower()
        if cmd in "Mm":
            x, y = num(), num()
            if rel:
                x += pos[0]; y += pos[1]
            if cur:
                subs.append(cur)
            pos = (x, y); start = pos; cur = [pos]
            cmd = "l" if rel else "L"      # последующие пары = lineto
        elif cmd in "Ll":
            x, y = num(), num()
            if rel:
                x += pos[0]; y += pos[1]
            cur.append((x, y)); pos = (x, y)
        elif cmd in "Hh":
            x = num()
            if rel:
                x += pos[0]
            cur.append((x, pos[1])); pos = (x, pos[1])
        elif cmd in "Vv":
            y = num()
            if rel:
                y += pos[1]
            cur.append((pos[0], y)); pos = (pos[0], y)
        elif cmd in "CcSs":
            if cmd in "Cc":
                a, b = num(), num()
                c1 = (a + pos[0], b + pos[1]) if rel else (a, b)
            else:                           # S: первая опорная — отражение
                c1 = (2*pos[0] - prev_c2[0], 2*pos[1] - prev_c2[1]) if prev_c2 else pos
            a, b = num(), num()
            c2 = (a + pos[0], b + pos[1]) if rel else (a, b)
            a, b = num(), num()
            p3 = (a + pos[0], b + pos[1]) if rel else (a, b)
            cur.extend(_bez(pos, c1, c2, p3))
            prev_c2 = c2; pos = p3
        else:
            i += 1
        if cmd not in "CcSs":
            prev_c2 = None
    if cur:
        subs.append(cur)
    return subs


def rasterize(svg_path, out_w, colour):
    svg = open(svg_path, encoding="utf-8").read()
    vb = [float(x) for x in re.search(r'viewBox="([^"]+)"', svg).group(1).split()]
    w, h = vb[2], vb[3]
    scale = out_w / w
    W, H = int(out_w), int(round(h * scale))

    acc = np.zeros((H, W), dtype=bool)
    for d in re.findall(r'\sd="([^"]+)"', svg):
        for s in _subpaths(d):
            if len(s) < 3:
                continue
            m = Image.new("1", (W, H), 0)
            ImageDraw.Draw(m).polygon([(x*scale, y*scale) for x, y in s], fill=1)
            acc ^= np.array(m, dtype=bool)

    rgba = np.zeros((H, W, 4), dtype=np.uint8)
    rgba[acc] = (colour[0], colour[1], colour[2], 255)
    return Image.fromarray(rgba, "RGBA")


def og_image():
    W, H = 1200, 630
    im = Image.new("RGB", (W, H), PEACH)
    d = ImageDraw.Draw(im)

    # Бордовая дуга — только нижняя треть. Апекс ниже логотипа и подписи,
    # иначе они уходят в заливку того же цвета и пропадают.
    APEX = 452
    d.pieslice([-820, APEX, W + 820, APEX + 1180], 180, 360, fill=ROSE)

    # WhatsApp режет превью по центру -> всё главное в центральных 60%
    logo = rasterize(os.path.join(ASSETS, "logo-remy.svg"), 470, ROSE)
    im.paste(logo, ((W - logo.width) // 2, 82), logo)

    f = ImageFont.truetype(GEORGIA, 38)
    line = "ИСТОРИЯ  БЕСКОНЕЧНОЙ  ЛЮБВИ"
    tw = d.textlength(line, font=f)
    d.text(((W - tw) / 2, 356), line, font=f, fill=ROSE)

    mark = rasterize(os.path.join(ASSETS, "fleur.svg"), 46, PEACH)
    im.paste(mark, ((W - mark.width) // 2, 498), mark)

    f2 = ImageFont.truetype(GEORGIA, 29)
    sub = "Премиальные букеты · Алматы · доставка каждый день"
    tw2 = d.textlength(sub, font=f2)
    d.text(((W - tw2) / 2, 556), sub, font=f2, fill=PEACH)

    p = os.path.join(ASSETS, "og-remy-v1.jpg")
    im.save(p, "JPEG", quality=84, optimize=True, progressive=True)
    print("og-remy-v1.jpg  %.0f KB" % (os.path.getsize(p) / 1024))


def favicons():
    os.makedirs(FAV, exist_ok=True)

    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">'
           '<rect width="24" height="24" rx="4" fill="#711339"/>'
           '<g transform="translate(2.4 2.4) scale(0.8)" fill="#F9CEAE">'
           + "".join(re.findall(r'<path fill="currentColor"[^/]*/>',
                                open(os.path.join(ASSETS, "fleur.svg"), encoding="utf-8").read()))
             .replace('fill="currentColor"', '')
           + "</g></svg>")
    with open(os.path.join(FAV, "favicon.svg"), "w", encoding="utf-8") as f:
        f.write(svg)

    mark = rasterize(os.path.join(ASSETS, "fleur.svg"), 140, PEACH)
    for size, name in ((180, "apple-touch-icon.png"), (512, "icon-512.png"), (192, "icon-192.png")):
        bg = Image.new("RGBA", (size, size), ROSE + (255,))
        m = mark.resize((int(size * 0.62), int(size * 0.62)), Image.LANCZOS)
        bg.paste(m, ((size - m.width) // 2, (size - m.height) // 2), m)
        bg.convert("RGB").save(os.path.join(FAV, name), "PNG", optimize=True)

    manifest = (
        '{\n  "name": "Remy Boutique Floral",\n  "short_name": "Remy",\n'
        '  "start_url": "./",\n  "display": "standalone",\n'
        '  "background_color": "#FFFBF3",\n  "theme_color": "#711339",\n'
        '  "icons": [\n'
        '    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png" },\n'
        '    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png" }\n'
        '  ]\n}\n')
    with open(os.path.join(FAV, "site.webmanifest"), "w", encoding="utf-8") as f:
        f.write(manifest)
    print("favicons + manifest ok")


if __name__ == "__main__":
    og_image()
    favicons()

"""Скачивает cover-кадры Reels @remy_floral и готовит их для галереи.

Зачем скрипт, а не разовая команда: ссылки Instagram подписаны и истекают
(~31.07.2026). Когда клиент пришлёт нормальные фото — заменить URLS на
локальные пути и перегенерировать одной командой.

Выход: assets/bouquets/bouquet-NN.webp (+ .jpg фолбэк), 2 размера.
"""
import io
import os
import sys
import urllib.request

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "assets", "bouquets")

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")

# 12 cover-кадров, полученных из зеркала picnob и проверенных на HTTP 200.
URLS = [
    "https://scontent-ord5-2.cdninstagram.com/v/t51.82787-15/756661940_17898796920510735_8168256803901161003_n.jpg?stp=c0.280.720.720a_dst-jpg_e15_s640x640_tt6&_nc_ht=scontent-ord5-2.cdninstagram.com&_nc_cat=103&_nc_oc=Q6cZ2gGtg1M-IghvVBtvFMF37zJEx-pLq23DKAeTs4cEcZQoCeE4rxMaNRKvKGVtQ5Ts52Uc3JzQwkeGp6Qf4mx3f5B-&_nc_ohc=G7T4U2W8c2gQ7kNvwFgYwE7&_nc_gid=eCHBoYE6tU0MkO7Z9fjZ3Q&edm=APU89FABAAAA&ccb=7-5&oh=00_AQBe0crLhbYVRf0K0ONVQ2MyMLQ5z7I7Kujy--AceDUibQ&oe=6A6BD1D6&_nc_sid=bc0c2c",
    "https://scontent-ord5-2.cdninstagram.com/v/t51.82787-15/757459811_17898796734510735_7601630824533245264_n.jpg?stp=c0.279.720.720a_dst-jpg_e15_s640x640_tt6&_nc_ht=scontent-ord5-2.cdninstagram.com&_nc_cat=103&_nc_oc=Q6cZ2gGtg1M-IghvVBtvFMF37zJEx-pLq23DKAeTs4cEcZQoCeE4rxMaNRKvKGVtQ5Ts52Uc3JzQwkeGp6Qf4mx3f5B-&_nc_ohc=8MLyiXH0tkkQ7kNvwGRlmUe&_nc_gid=eCHBoYE6tU0MkO7Z9fjZ3Q&edm=APU89FABAAAA&ccb=7-5&oh=00_AQAj6G9C9fCVe9eCgx-WRPWYlm7F-Pjf3VSQq3zQ3yeFtA&oe=6A6BF027&_nc_sid=bc0c2c",
    "https://scontent-ord5-2.cdninstagram.com/v/t51.71878-15/757346867_1379703197460233_2991360875659735125_n.jpg?stp=c0.248.640.640a_dst-jpg_e15_tt6&_nc_ht=scontent-ord5-2.cdninstagram.com&_nc_cat=105&_nc_oc=Q6cZ2gGtg1M-IghvVBtvFMF37zJEx-pLq23DKAeTs4cEcZQoCeE4rxMaNRKvKGVtQ5Ts52Uc3JzQwkeGp6Qf4mx3f5B-&_nc_ohc=jA9dTO0yf7cQ7kNvwH1Mo55&_nc_gid=eCHBoYE6tU0MkO7Z9fjZ3Q&edm=APU89FABAAAA&ccb=7-5&oh=00_AQDfg--9ojXTKeZrjkT3rrHYG66tK3u-ipwIFiUVAMs24Q&oe=6A6BEB3C&_nc_sid=bc0c2c",
    "https://scontent-ord5-2.cdninstagram.com/v/t51.82787-15/755195071_17898773742510735_6974623506544341208_n.jpg?stp=c0.279.720.720a_dst-jpg_e15_s640x640_tt6&_nc_ht=scontent-ord5-2.cdninstagram.com&_nc_cat=103&_nc_oc=Q6cZ2gGtg1M-IghvVBtvFMF37zJEx-pLq23DKAeTs4cEcZQoCeE4rxMaNRKvKGVtQ5Ts52Uc3JzQwkeGp6Qf4mx3f5B-&_nc_ohc=YjFpHzdk8RoQ7kNvwHDoSyK&_nc_gid=eCHBoYE6tU0MkO7Z9fjZ3Q&edm=APU89FABAAAA&ccb=7-5&oh=00_AQDsG5F5cH84pyuW7RCGXHBl7XuRmibC0nbMcUP0Ibk4Ww&oe=6A6BF6D6&_nc_sid=bc0c2c",
    "https://scontent-ord5-1.cdninstagram.com/v/t51.71878-15/757416993_1924565391542051_1041819906216882996_n.jpg?stp=c0.248.640.640a_dst-jpg_e15_tt6&_nc_ht=scontent-ord5-1.cdninstagram.com&_nc_cat=111&_nc_oc=Q6cZ2gGtg1M-IghvVBtvFMF37zJEx-pLq23DKAeTs4cEcZQoCeE4rxMaNRKvKGVtQ5Ts52Uc3JzQwkeGp6Qf4mx3f5B-&_nc_ohc=q67G7I5VGfMQ7kNvwH2HceD&_nc_gid=eCHBoYE6tU0MkO7Z9fjZ3Q&edm=APU89FABAAAA&ccb=7-5&oh=00_AQD2UrC9nIWmMTGIglkkCPvSyZcrqtez-mfyhCK6oPmo-A&oe=6A6BD483&_nc_sid=bc0c2c",
    "https://scontent-ord5-2.cdninstagram.com/v/t51.82787-15/753471292_17898761760510735_6663027633323068350_n.jpg?stp=c0.280.720.720a_dst-jpg_e15_s640x640_tt6&_nc_ht=scontent-ord5-2.cdninstagram.com&_nc_cat=103&_nc_oc=Q6cZ2gGtg1M-IghvVBtvFMF37zJEx-pLq23DKAeTs4cEcZQoCeE4rxMaNRKvKGVtQ5Ts52Uc3JzQwkeGp6Qf4mx3f5B-&_nc_ohc=HwVGd-5tfBoQ7kNvwHdZLoI&_nc_gid=eCHBoYE6tU0MkO7Z9fjZ3Q&edm=APU89FABAAAA&ccb=7-5&oh=00_AQB9sugfQlc6SJi9gkifTTvt92yqGq7lZG80T188RY3CSQ&oe=6A6BEB73&_nc_sid=bc0c2c",
    "https://scontent-ord5-2.cdninstagram.com/v/t51.82787-15/755416280_17898761034510735_1292632790890919316_n.jpg?stp=c0.280.720.720a_dst-jpg_e15_s640x640_tt6&_nc_ht=scontent-ord5-2.cdninstagram.com&_nc_cat=103&_nc_oc=Q6cZ2gGtg1M-IghvVBtvFMF37zJEx-pLq23DKAeTs4cEcZQoCeE4rxMaNRKvKGVtQ5Ts52Uc3JzQwkeGp6Qf4mx3f5B-&_nc_ohc=qbUfZ_bRrEAQ7kNvwHxbZ1a&_nc_gid=eCHBoYE6tU0MkO7Z9fjZ3Q&edm=APU89FABAAAA&ccb=7-5&oh=00_AQAJVtcpp9nx-myuYCsKxZ1Vk-AprDFbCi8DysqMuiayhQ&oe=6A6BE38B&_nc_sid=bc0c2c",
    "https://scontent-ord5-1.cdninstagram.com/v/t51.71878-15/757507535_1033569842596410_5462422689820374893_n.jpg?stp=c0.248.640.640a_dst-jpg_e15_tt6&_nc_ht=scontent-ord5-1.cdninstagram.com&_nc_cat=106&_nc_oc=Q6cZ2gGtg1M-IghvVBtvFMF37zJEx-pLq23DKAeTs4cEcZQoCeE4rxMaNRKvKGVtQ5Ts52Uc3JzQwkeGp6Qf4mx3f5B-&_nc_ohc=LVjyUITZV4YQ7kNvwHxh-R6&_nc_gid=eCHBoYE6tU0MkO7Z9fjZ3Q&edm=APU89FABAAAA&ccb=7-5&oh=00_AQD1KZL5bFWNDl9wGglWHM2iixc8BN4LCDMYtDT8zqSCXw&oe=6A6BF2DF&_nc_sid=bc0c2c",
    "https://scontent-ord5-1.cdninstagram.com/v/t51.71878-15/753260209_1048191670937874_4906063975942053917_n.jpg?stp=c0.248.640.640a_dst-jpg_e15_tt6&_nc_ht=scontent-ord5-1.cdninstagram.com&_nc_cat=106&_nc_oc=Q6cZ2gGtg1M-IghvVBtvFMF37zJEx-pLq23DKAeTs4cEcZQoCeE4rxMaNRKvKGVtQ5Ts52Uc3JzQwkeGp6Qf4mx3f5B-&_nc_ohc=wi_0B0HGSJMQ7kNvwFSAMpk&_nc_gid=eCHBoYE6tU0MkO7Z9fjZ3Q&edm=APU89FABAAAA&ccb=7-5&oh=00_AQCiQy9NWhB1LqzRtP3vl7Fny9eY3RoepbQ9Fa888FKvMQ&oe=6A6BD36D&_nc_sid=bc0c2c",
    "https://scontent-ord5-2.cdninstagram.com/v/t51.82787-15/757603132_17898754788510735_7096830620280190737_n.jpg?stp=c0.280.720.720a_dst-jpg_e15_s640x640_tt6&_nc_ht=scontent-ord5-2.cdninstagram.com&_nc_cat=103&_nc_oc=Q6cZ2gGtg1M-IghvVBtvFMF37zJEx-pLq23DKAeTs4cEcZQoCeE4rxMaNRKvKGVtQ5Ts52Uc3JzQwkeGp6Qf4mx3f5B-&_nc_ohc=-FUKf06m6F0Q7kNvwHXThcc&_nc_gid=eCHBoYE6tU0MkO7Z9fjZ3Q&edm=APU89FABAAAA&ccb=7-5&oh=00_AQCPsmCMHQG_fy0O8ypUFiopQe_xfXMSVz0LOfGGqF2lYg&oe=6A6BDA49&_nc_sid=bc0c2c",
    "https://scontent-ord5-1.cdninstagram.com/v/t51.71878-15/756046269_1038438435232434_2752399959638037360_n.jpg?stp=c0.248.640.640a_dst-jpg_e15_tt6&_nc_ht=scontent-ord5-1.cdninstagram.com&_nc_cat=106&_nc_oc=Q6cZ2gGtg1M-IghvVBtvFMF37zJEx-pLq23DKAeTs4cEcZQoCeE4rxMaNRKvKGVtQ5Ts52Uc3JzQwkeGp6Qf4mx3f5B-&_nc_ohc=WQ4StNcGxPwQ7kNvwGpUtC1&_nc_gid=eCHBoYE6tU0MkO7Z9fjZ3Q&edm=APU89FABAAAA&ccb=7-5&oh=00_AQD3RX2U6zAh7aUTcEOWEdO_YvQbzDqM7LfepQY7RGV-yA&oe=6A6BD1BC&_nc_sid=bc0c2c",
    "https://scontent-ord5-3.cdninstagram.com/v/t51.71878-15/754066511_2143602513099163_293811196675024746_n.jpg?stp=c0.248.640.640a_dst-jpg_e15_tt6&_nc_ht=scontent-ord5-3.cdninstagram.com&_nc_cat=107&_nc_oc=Q6cZ2gGtg1M-IghvVBtvFMF37zJEx-pLq23DKAeTs4cEcZQoCeE4rxMaNRKvKGVtQ5Ts52Uc3JzQwkeGp6Qf4mx3f5B-&_nc_ohc=NsiHQgqjcjwQ7kNvwHLhAbk&_nc_gid=eCHBoYE6tU0MkO7Z9fjZ3Q&edm=APU89FABAAAA&ccb=7-5&oh=00_AQBkgF2IdunZ5vtQc7WycNXGYcReBanmoJ22V_j1ThPmFA&oe=6A6BECB0&_nc_sid=bc0c2c",
]


def fetch(url):
    req = urllib.request.Request(url, headers={
        "User-Agent": UA,
        "Accept": "image/avif,image/webp,image/jpeg,*/*",
        "Referer": "https://www.instagram.com/",
    })
    with urllib.request.urlopen(req, timeout=45) as r:
        return r.read()


def main():
    os.makedirs(OUT, exist_ok=True)
    ok = 0
    for i, url in enumerate(URLS, 1):
        name = "bouquet-%02d" % i
        try:
            raw = fetch(url)
            im = Image.open(io.BytesIO(raw)).convert("RGB")
            # Оригинал как есть — 640x640, апскейл запрещён (см. план).
            im.save(os.path.join(OUT, name + ".webp"), "WEBP", quality=82, method=6)
            im.save(os.path.join(OUT, name + ".jpg"), "JPEG", quality=84,
                    optimize=True, progressive=True)
            # LQIP для плейсхолдера обёртки
            im.resize((20, 20), Image.LANCZOS).save(
                os.path.join(OUT, name + "-lqip.webp"), "WEBP", quality=40)
            print("%s  %sx%s  %.1f KB webp" % (
                name, im.width, im.height,
                os.path.getsize(os.path.join(OUT, name + ".webp")) / 1024))
            ok += 1
        except Exception as e:
            print("FAIL %s: %s" % (name, e), file=sys.stderr)
    print("\n%d/%d downloaded" % (ok, len(URLS)))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())

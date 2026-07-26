"""Скачивает PT Serif + Inter с Google Fonts и кладёт локально.

Зачем self-host, а не <link> на fonts.googleapis.com:
1. URL'ы woff2 у Google меняются с версиями — прописывать их руками нельзя,
   они протухают (ровно на этом я и обжёгся).
2. На мероприятии сеть непредсказуема; лишняя цепочка CSS -> woff2
   к стороннему домену это второй шанс всё сломать.
3. Забираем только cyrillic + latin, без греческого и вьетнамского.
"""
import os
import re
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "assets", "fonts")
CSS_OUT = os.path.join(os.path.dirname(HERE), "css", "fonts.css")

API = ("https://fonts.googleapis.com/css2"
       "?family=Inter:wght@400;500"
       "&family=PT+Serif:wght@400;700"
       "&display=swap")

# UA современного Chrome — иначе Google отдаст ttf вместо woff2
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")

KEEP = ("cyrillic", "cyrillic-ext", "latin", "latin-ext")


def get(url, binary=False):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=45) as r:
        data = r.read()
    return data if binary else data.decode("utf-8")


def main():
    os.makedirs(OUT, exist_ok=True)
    css = get(API)

    blocks = re.findall(r"(/\*\s*([a-z-]+)\s*\*/\s*@font-face\s*\{[^}]+\})", css)
    if not blocks:
        raise RuntimeError("не разобрал ответ Google Fonts")

    out_css, seen = [], 0
    for block, subset in blocks:
        if subset not in KEEP:
            continue
        fam = re.search(r"font-family:\s*'([^']+)'", block).group(1)
        weight = re.search(r"font-weight:\s*(\d+)", block).group(1)
        url = re.search(r"url\((https://[^)]+\.woff2)\)", block).group(1)
        rng = re.search(r"unicode-range:\s*([^;]+);", block).group(1).strip()

        name = "%s-%s-%s.woff2" % (fam.lower().replace(" ", ""), weight, subset)
        path = os.path.join(OUT, name)
        if not os.path.exists(path):
            with open(path, "wb") as f:
                f.write(get(url, binary=True))
        seen += 1
        out_css.append(
            "@font-face{\n"
            "  font-family:'%s';font-style:normal;font-weight:%s;font-display:swap;\n"
            "  src:url(../assets/fonts/%s) format('woff2');\n"
            "  unicode-range:%s;\n}\n" % (fam, weight, name, rng))

    with open(CSS_OUT, "w", encoding="utf-8") as f:
        f.write("/* Сгенерировано tools/fetch_fonts.py — руками не править */\n")
        f.write("".join(out_css))

    total = sum(os.path.getsize(os.path.join(OUT, x)) for x in os.listdir(OUT))
    print("%d @font-face, %d файлов, %.0f KB суммарно" % (seen, len(os.listdir(OUT)), total / 1024))
    for x in sorted(os.listdir(OUT)):
        print("  %-34s %5.1f KB" % (x, os.path.getsize(os.path.join(OUT, x)) / 1024))


if __name__ == "__main__":
    main()

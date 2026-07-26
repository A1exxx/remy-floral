"""Скачивает Science Gothic (900, ширина 150%) с Google Fonts к себе.

Зачем не CDN: на открытии магазина сайт не должен зависеть от чужого
сервера, а ещё Google Fonts — это лишний DNS + TLS в критическом пути
LCP, где у нас и так фото розы.

Ширину и вес пиним прямо в запросе: тогда Google отдаёт статический
инстанс вместо вариативного файла — он в несколько раз легче, а других
начертаний нам и не нужно.

Курсива у шрифта нет: наклон делает браузер (font-style: oblique).
"""
import os
import re
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "assets", "fonts")

API = ("https://fonts.googleapis.com/css2"
       "?family=Science+Gothic:wdth,wght@150,900&display=swap")
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"}

# Казахские глифы (Ә Ғ Қ Ң Ө Ү Һ) живут в cyrillic-ext. В текущих
# заголовках их нет, поэтому берём те же подмножества, что и у Inter.
WANT = ("cyrillic", "latin")


def main():
    css = urllib.request.urlopen(
        urllib.request.Request(API, headers=UA), timeout=30).read().decode("utf-8")

    blocks = re.findall(r"/\*\s*([\w-]+)\s*\*/\s*@font-face\s*\{(.*?)\}", css, re.S)
    got = {}
    for name, body in blocks:
        if name not in WANT:
            continue
        url = re.search(r"url\((https://[^)]+)\)", body).group(1)
        rng = re.search(r"unicode-range:\s*([^;]+);", body).group(1).strip()
        data = urllib.request.urlopen(
            urllib.request.Request(url, headers=UA), timeout=30).read()
        path = os.path.join(OUT, "sciencegothic-%s.woff2" % name)
        with open(path, "wb") as f:
            f.write(data)
        got[name] = rng
        print("%-28s %5.1f KB" % (os.path.basename(path), len(data) / 1024))

    missing = [n for n in WANT if n not in got]
    if missing:
        raise SystemExit("Google не отдал подмножества: %s" % ", ".join(missing))

    print("\n--- вставить в css/fonts.css ---")
    for name in WANT:
        print("@font-face{\n"
              "  font-family:'Science Gothic';font-style:normal;\n"
              "  font-weight:900;font-stretch:150%%;font-display:swap;\n"
              "  src:url(../assets/fonts/sciencegothic-%s.woff2) format('woff2');\n"
              "  unicode-range:%s;\n}" % (name, got[name]))


if __name__ == "__main__":
    main()

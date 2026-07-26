"""Собирает шрифты ровно под текст сайта — все три языка сразу.

Зачем не готовые подмножества Google: сайт трёхъязычный, и казахские
ә ғ қ ң ө ү һ живут в отдельном куске cyrillic-ext. Подключать его
целиком — +26 КБ на каждое начертание ради восьми букв.

Здесь используется старый (v1) Google Fonts API с параметром text=:
он отдаёт ОДИН файл, в котором ровно запрошенные знаки. Текст берётся
из самих страниц и из словаря переводов, поэтому промахнуться нельзя.

Если добавили текст на страницу или в js/i18n.js — перезапустить,
иначе новые буквы отрисуются подменным шрифтом.
Скрипт заодно переписывает css/fonts.css.
"""
import glob
import io
import os
import re
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "assets", "fonts")
CSS = os.path.join(ROOT, "css", "fonts.css")

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"}

# семейство в API, css-имя, веса
FAMILIES = [
    # PT Serif 400 и Inter 600 не используются ни одним правилом —
    # не тянем их только ради полноты семейства.
    ("PT+Serif", "PT Serif", [700]),
    ("Inter", "Inter", [400, 500, 700]),
]

# Знаки, которых может не быть в тексте, но которые нужны интерфейсу.
EXTRA = ("₸·—–…«»„“→←↑↓№" "ӘәҒғҚқҢңӨөҮүҰұҺһІі"
         "0123456789+-()/:,.!?%@#&'\"" "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
         "abcdefghijklmnopqrstuvwxyz")


def site_text():
    chunks = []
    for path in (glob.glob(os.path.join(ROOT, "*.html")) +
                 glob.glob(os.path.join(ROOT, "js", "*.js"))):
        chunks.append(io.open(path, encoding="utf-8").read())
    text = "\n".join(chunks)
    text = re.sub(r"<[^>]+>", " ", text)      # теги не рисуются
    return text + EXTRA


def fetch(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40)


def main():
    chars = sorted(set(site_text()) - set("\r\n\t"))
    text = "".join(chars)
    print("уникальных знаков: %d" % len(chars))

    faces, total = [], 0
    for api_name, css_name, weights in FAMILIES:
        for w in weights:
            url = ("https://fonts.googleapis.com/css?family=%s:%d&text=%s"
                   % (api_name, w, urllib.parse.quote(text)))
            css = fetch(url).read().decode("utf-8")
            m = re.search(r"url\((https://[^)]+)\)", css)
            if not m:
                raise SystemExit("Google не отдал файл для %s %d" % (css_name, w))
            data = fetch(m.group(1)).read()

            fname = "site-%s-%d.woff2" % (api_name.replace("+", "").lower(), w)
            with open(os.path.join(OUT, fname), "wb") as f:
                f.write(data)
            kb = len(data) / 1024
            total += kb
            faces.append((css_name, w, fname))
            print("%-26s %5.1f KB" % (fname, kb))

    head = ("/* Сгенерировано tools/subset_site_fonts.py — руками не править.\n"
            "\n"
            "   Шрифты лежат локально: на открытии магазина сайт не должен\n"
            "   зависеть от чужого CDN, а лишний DNS+TLS бьёт по LCP.\n"
            "\n"
            "   В файлах ровно те знаки, что встречаются на страницах на трёх\n"
            "   языках, включая казахские ә ғ қ ң ө ү ұ һ і. Поэтому\n"
            "   unicode-range не нужен, а вес каждого файла — единицы КБ.\n"
            "\n"
            "   Shobhika из брендбука в вебе не существует; её кириллица —\n"
            "   это PT Serif знак в знак, поэтому заголовки набраны им. */\n")
    body = "".join(
        "@font-face{\n"
        "  font-family:'%s';font-style:normal;font-weight:%d;font-display:swap;\n"
        "  src:url(../assets/fonts/%s) format('woff2');\n}\n" % f for f in faces)
    io.open(CSS, "w", encoding="utf-8", newline="").write(head + body)

    print("\nвсего %.0f KB, css/fonts.css перезаписан" % total)


if __name__ == "__main__":
    main()

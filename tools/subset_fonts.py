"""Сабсечет скачанные шрифты под символы, реально встречающиеся на странице.

Полные сабсеты Google Fonts дают ~234 КБ на этой странице. Лендинг-визитка
использует ~150 уникальных символов, поэтому режем по факту: ~40 КБ.

Порядок: fetch_fonts.py -> subset_fonts.py. Если правите тексты в
index.html или js/app.js — прогоните заново, иначе новый символ отвалится
в системный шрифт.
"""
import glob
import os
import re

from fontTools import subset

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
FONTS = os.path.join(ROOT, "assets", "fonts")
CSS_OUT = os.path.join(ROOT, "css", "fonts.css")

# Страховка: весь русский алфавит + латиница + цифры + пунктуация,
# даже если сейчас какой-то буквы на странице нет.
SAFETY = (
    "абвгдеёжзийклмнопрстуфхцчшщъыьэюя"
    "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ"
    "abcdefghijklmnopqrstuvwxyz"
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "0123456789"
    " .,:;!?()[]{}«»\"'—–-…@#№%/\\|+=*&_"
    "→←↑↓·•₸€$₽ №’"
)


def page_chars():
    chars = set(SAFETY)
    for path in (os.path.join(ROOT, "index.html"), os.path.join(ROOT, "js", "app.js")):
        if not os.path.exists(path):
            continue
        txt = open(path, encoding="utf-8").read()
        # убираем разметку и base64/URL-мусор, оставляем видимый текст
        txt = re.sub(r"<script[^>]*>.*?</script>", " ", txt, flags=re.S)
        txt = re.sub(r"<style[^>]*>.*?</style>", " ", txt, flags=re.S)
        txt = re.sub(r"data:[^\"')]+", " ", txt)
        chars |= set(txt)
    return "".join(sorted(c for c in chars if c.isprintable() or c == " "))


def ranges_from_fetch():
    """unicode-range берём из css, который написал fetch_fonts.py.

    Прописывать диапазоны руками нельзя — уже наступал на это со
    ссылками gstatic. Источник истины один: ответ Google Fonts.
    """
    if not os.path.exists(CSS_OUT):
        raise RuntimeError("сначала прогоните tools/fetch_fonts.py")
    css = open(CSS_OUT, encoding="utf-8").read()
    out = {}
    for block in re.findall(r"@font-face\{[^}]+\}", css):
        m_url = re.search(r"fonts/([\w.-]+\.woff2)", block)
        m_rng = re.search(r"unicode-range:([^;]+);", block)
        if m_url and m_rng:
            out[m_url.group(1)] = m_rng.group(1).strip()
    if not out:
        raise RuntimeError("в fonts.css нет unicode-range — он уже урезан, "
                           "перезапустите fetch_fonts.py")
    return out


def main():
    ranges = ranges_from_fetch()
    text = page_chars()
    print("уникальных символов: %d" % len(text))

    kept, out_css = [], []
    for path in sorted(glob.glob(os.path.join(FONTS, "*.woff2"))):
        name = os.path.basename(path)
        # ext-сабсеты не нужны: на странице нет ни расширенной кириллицы,
        # ни восточноевропейской латиницы
        if "-ext" in name:
            os.replace(path, path + ".unused")
            continue
        # Inter вариативный: файлы 400 и 500 побайтово одинаковы и содержат
        # всю ось wght. Держим один на сабсет и объявляем диапазон весов.
        if name.startswith("inter-500"):
            os.replace(path, path + ".unused")
            continue

        before = os.path.getsize(path)
        args = [path, "--text=" + text, "--flavor=woff2", "--layout-features=*",
                "--output-file=" + path, "--no-hinting", "--desubroutinize"]
        subset.main(args)
        after = os.path.getsize(path)
        kept.append((name, before, after))
        print("  %-30s %5.1f -> %5.1f KB" % (name, before / 1024, after / 1024))

        if name.startswith("ptserif"):
            fam = "PT Serif"
            weight = re.search(r"-(\d+)-", name).group(1)
        else:
            fam = "Inter"
            weight = "400 500"          # один вариативный файл на оба веса
        out_css.append(
            "@font-face{\n"
            "  font-family:'%s';font-style:normal;font-weight:%s;font-display:swap;\n"
            "  src:url(../assets/fonts/%s) format('woff2');\n"
            "  unicode-range:%s;\n}\n" % (fam, weight, name, ranges[name]))

    with open(CSS_OUT, "w", encoding="utf-8") as f:
        f.write("/* Сгенерировано tools/subset_fonts.py — руками не править.\n"
                "   Прогон: fetch_fonts.py -> subset_fonts.py.\n"
                "   unicode-range взят из ответа Google Fonts, не из головы. */\n")
        f.write("".join(out_css))

    total = sum(a for _, _, a in kept)
    print("\nитого %d файлов, %.0f KB" % (len(kept), total / 1024))


if __name__ == "__main__":
    main()

"""Проставляет версию у CSS и JS в ссылках на страницах.

Зачем: GitHub Pages отдаёт стили и скрипты с кэшированием, и у
посетителя, который уже открывал сайт, после правки мог остаться
старый файл — вёрстка ехала. Версия в адресе делает файл новым
для браузера ровно тогда, когда он действительно изменился.

Версия — короткий хэш от содержимого самих файлов, поэтому она
не меняется от холостых прогонов.

Запускать перед каждым коммитом, где менялись css/ или js/.
"""
import hashlib
import io
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

ASSETS = ["css/styles.css", "css/fonts.css", "js/app.js", "js/i18n.js"]
PAGES = ["index.html", "catalog.html", "vip.html"]


def main():
    h = hashlib.md5()
    for rel in ASSETS:
        h.update(io.open(os.path.join(ROOT, rel), "rb").read())
    v = h.hexdigest()[:8]

    for page in PAGES:
        path = os.path.join(ROOT, page)
        if not os.path.exists(path):
            continue
        s = io.open(path, encoding="utf-8").read()
        before = s
        s = re.sub(r'(href="css/(?:styles|fonts)\.css)(\?v=[0-9a-f]+)?"',
                   r'\1?v=%s"' % v, s)
        s = re.sub(r'(src="js/(?:app|i18n)\.js)(\?v=[0-9a-f]+)?"',
                   r'\1?v=%s"' % v, s)
        if s != before:
            io.open(path, "w", encoding="utf-8", newline="").write(s)
        print("%-14s -> ?v=%s" % (page, v))


if __name__ == "__main__":
    main()

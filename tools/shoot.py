"""Скриншоты и проверки страницы через Chrome DevTools Protocol.

Зачем не `chrome --screenshot`: у него нет полностраничного захвата,
он не исполняет наш JS по требованию и ломается о `min-height:100dvh`
(в высоком окне hero растягивается на всю страницу).

Использование:
    python tools/shoot.py shot  <url> <out.png> [width] [height] [--full]
    python tools/shoot.py eval  <url> "<js-выражение>" [width] [height]
"""
import json
import os
import subprocess
import sys
import time
import urllib.request

import websocket

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = 9223
PROFILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_cdp_profile")


class Chrome:
    def __init__(self, width=390, height=844, dpr=2):
        self.proc = subprocess.Popen([
            CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
            "--remote-debugging-port=%d" % PORT, "--user-data-dir=" + PROFILE,
            # без этого Chrome отдаёт 403 на WebSocket-handshake
            "--remote-allow-origins=*",
            "--no-first-run", "--no-default-browser-check",
            "--window-size=%d,%d" % (width, height),
            "about:blank",          # без стартовой вкладки нет page-таргета
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        self.width = width
        self.height = height
        self.ws = None
        self.msg_id = 0
        last = None
        for _ in range(60):
            try:
                tabs = json.load(urllib.request.urlopen(
                    "http://127.0.0.1:%d/json" % PORT, timeout=2))
                page = [t for t in tabs if t["type"] == "page"][0]
                self.ws = websocket.create_connection(
                    page["webSocketDebuggerUrl"], timeout=40)
                break
            except Exception as e:
                last = e
                time.sleep(0.25)
        if not self.ws:
            rc = self.proc.poll()
            err = b""
            if rc is not None:
                try:
                    err = self.proc.stderr.read(800)
                except Exception:
                    pass
            raise RuntimeError(
                "Chrome не поднялся на порту %d (rc=%s, last=%r)\n%s"
                % (PORT, rc, last, err.decode("utf-8", "replace")))
        self.send("Page.enable")
        self.send("Runtime.enable")
        self.send("Emulation.setDeviceMetricsOverride", {
            "width": width, "height": height,
            "deviceScaleFactor": dpr, "mobile": width < 700,
        })

    def send(self, method, params=None):
        self.msg_id += 1
        self.ws.send(json.dumps({"id": self.msg_id, "method": method,
                                 "params": params or {}}))
        while True:
            msg = json.loads(self.ws.recv())
            if msg.get("id") == self.msg_id:
                if "error" in msg:
                    raise RuntimeError(msg["error"])
                return msg.get("result", {})

    def goto(self, url, settle=2.6):
        self.send("Page.navigate", {"url": url})
        time.sleep(settle)
        # догоняем ленивые картинки и IntersectionObserver
        self.eval("window.scrollTo(0, document.body.scrollHeight)")
        time.sleep(1.2)
        self.eval("window.scrollTo(0, 0)")
        time.sleep(0.8)

    def eval(self, expr):
        r = self.send("Runtime.evaluate", {
            "expression": expr, "returnByValue": True, "awaitPromise": True})
        return r.get("result", {}).get("value")

    def shot(self, path, full=False):
        params = {"format": "png"}
        if full:
            params["captureBeyondViewport"] = True
            m = self.send("Page.getLayoutMetrics")
            css = m.get("cssContentSize") or m["contentSize"]
            # ширину берём эмулируемую: cssContentSize отдаёт размер
            # содержимого и на мобильной эмуляции уезжает в десктопную
            params["clip"] = {"x": 0, "y": 0, "width": self.width,
                              "height": css["height"], "scale": 1}
        data = self.send("Page.captureScreenshot", params)["data"]
        import base64
        with open(path, "wb") as f:
            f.write(base64.b64decode(data))
        return os.path.getsize(path)

    def close(self):
        try:
            self.ws.close()
        except Exception:
            pass
        self.proc.terminate()


def main():
    mode = sys.argv[1]
    url = sys.argv[2]
    if mode == "shot":
        out = sys.argv[3]
        w = int(sys.argv[4]) if len(sys.argv) > 4 else 390
        h = int(sys.argv[5]) if len(sys.argv) > 5 else 844
        full = "--full" in sys.argv
        c = Chrome(w, h)
        try:
            c.goto(url)
            size = c.shot(out, full=full)
            print("%s  %.0f KB  (%dx%d%s)" % (out, size / 1024, w, h,
                                              ", full" if full else ""))
        finally:
            c.close()
    elif mode == "eval":
        expr = sys.argv[3]
        w = int(sys.argv[4]) if len(sys.argv) > 4 else 390
        h = int(sys.argv[5]) if len(sys.argv) > 5 else 844
        c = Chrome(w, h)
        try:
            c.goto(url)
            print(json.dumps(c.eval(expr), ensure_ascii=False, indent=2))
        finally:
            c.close()


if __name__ == "__main__":
    main()

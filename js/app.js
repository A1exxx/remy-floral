/* ═══════════════════════════════════════════════════════════════
   Remy Boutique Floral
   Бэкенда нет: заказ уходит в WhatsApp предзаполненным сообщением.
   Один файл на все страницы — что не найдено в DOM, просто не строится.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─── ЕДИНСТВЕННОЕ МЕСТО С КОНТАКТАМИ ────────────────────────
     Меняется здесь и больше нигде. Номер подтверждён в 2ГИС
     и в bio/подписях Instagram. */
  var CONTACT = {
    waPhone: '77056666163',        // для wa.me — только цифры, без «+»
    phoneTel: '+77056666163',
    phoneDisplay: '+7 705 666 61 63',
    instagram: 'https://www.instagram.com/remy_floral/',
    gis: 'https://2gis.kz/almaty/firm/70000001115419179'
  };

  /* Если появится Google Форма / Tally — вставить сюда URL,
     форма начнёт слать туда. Пока пусто — уходит в WhatsApp. */
  var FORM_ENDPOINT = '';

  var YM_ID = 0;                   // ← id Яндекс.Метрики, когда заведут

  /* ─── Языки ───────────────────────────────────────────────── */
  var LANGS = ['ru', 'en', 'kk'];
  var lang = 'ru';

  function dict() { return (window.I18N && window.I18N[lang]) || {}; }
  function t(key) {
    var d = dict();
    if (d[key] != null) return d[key];
    var ru = (window.I18N && window.I18N.ru) || {};
    return ru[key] != null ? ru[key] : key;
  }

  function initialLang() {
    try {
      var saved = localStorage.getItem('remy_lang');
      if (saved && LANGS.indexOf(saved) > -1) return saved;
    } catch (e) {}
    try {
      var nav = (navigator.language || '').slice(0, 2).toLowerCase();
      if (nav === 'kk') return 'kk';
      if (nav === 'en') return 'en';
    } catch (e) {}
    return 'ru';   // Алматы — сайт по умолчанию русский
  }

  /* ─── Каталог ─────────────────────────────────────────────────
     ЕДИНСТВЕННОЕ место с ценами. Цифры взяты с публикаций самого
     Remy в Instagram (они вожжены в кадр: «- 34 000»), поэтому это
     не выдумка, но их надо сверять: цветы дорожают и дешевеют.
     Названия описательные — они не могут устареть или соврать.
     Картинки: assets/catalog/b-NN, квадрат ≤480px, апскейл запрещён. */
  var CATALOG = [
    { id: 'b-01', price: 25000,
      ru: 'Гортензия с подсолнухом', en: 'Hydrangea with sunflower', kk: 'Күнбағысты гортензия',
      alt: 'Композиция из гортензии, подсолнуха и кустовых роз в пастельных тонах' },
    { id: 'b-03', price: 28000,
      ru: 'Голубая гортензия и розы', en: 'Blue hydrangea and roses', kk: 'Көк гортензия мен раушан',
      alt: 'Композиция из синей гортензии с жёлтыми и белыми розами' },
    { id: 'b-02', price: 34000,
      ru: 'Кустовая пионовидная роза', en: 'Spray garden roses', kk: 'Бұталы пионтәрізді раушан',
      alt: 'Букет из розовых и кремовых пионовидных роз с лентами Remy' },
    { id: 'b-07', price: 34000,
      ru: 'Пудровые пионовидные розы', en: 'Powder garden roses', kk: 'Пудра түсті пионтәрізді раушан',
      alt: 'Пышный букет из пудрово-розовых пионовидных роз с лентами Remy' },
    { id: 'b-09', price: 42000,
      ru: 'Гортензия и кустовая роза', en: 'Hydrangea and spray rose', kk: 'Гортензия мен бұталы раушан',
      alt: 'Круглый букет из голубой гортензии с жёлтыми и белыми цветами' },
    { id: 'b-04', price: 50000,
      ru: 'Коралловые розы', en: 'Coral roses', kk: 'Маржан түсті раушан',
      alt: 'Крупный букет из коралловых роз с брендированными лентами Remy' },
    { id: 'b-10', price: 73000,
      ru: 'Крупный букет кустовых роз', en: 'Large spray rose bouquet', kk: 'Ірі бұталы раушан шоғы',
      alt: 'Плотный букет из ярко-розовых кустовых роз' },
    { id: 'b-06', price: 74000,
      ru: 'Роскошная композиция', en: 'Grand composition', kk: 'Салтанатты композиция',
      alt: 'Большая авторская композиция из гортензии, лилий, подсолнухов и роз' }
  ];

  /* 25000 -> «25 000 ₸». Неразрывные пробелы: цена не должна рваться
     переносом строки, иначе «25» и «000 ₸» окажутся на разных строках. */
  function money(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₸';
  }

  /* ─── Утилиты ─────────────────────────────────────────────── */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var all = function (s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  };

  function fill(key, vars) {
    var s = t(key);
    for (var k in vars) {
      if (vars.hasOwnProperty(k)) s = s.replace('{' + k + '}', vars[k]);
    }
    return s;
  }

  /* Сообщение — ровно одна строка. Ни города, ни метки QR, ни
     названия букета: заказчик решил, что детали менеджер выяснит
     в переписке. Своя фраза осталась только у VIP и сертификата.
     encodeURIComponent, НЕ encodeURI: иначе «&» обрежет текст. */
  function waLink(kind) {
    var key = kind === 'vip' ? 'waVip' : kind === 'cert' ? 'waCert' : 'waOrder';
    return 'https://wa.me/' + CONTACT.waPhone + '?text=' +
           encodeURIComponent(t('waHello') + ' ' + t(key));
  }

  function goal(name) {
    try { if (window.ym && YM_ID) window.ym(YM_ID, 'reachGoal', name); } catch (e) {}
    try { if (window.gtag) window.gtag('event', name); } catch (e) {}
  }

  function markWa() { try { sessionStorage.setItem('remy_wa', '1'); } catch (e) {} }

  /* ─── Каталог ─────────────────────────────────────────────────
     Вся карточка — одна ссылка, а не «фото + отдельная кнопка»:
     на телефоне промахнуться мимо кнопки внутри плитки легко,
     а по самой плитке — нет. */
  function buildCards(box, limit) {
    if (!box) return;
    var items = limit ? CATALOG.slice(0, limit) : CATALOG;
    /* Только фото и цена. Название убрано: заказчик решил, что
       детали менеджер выясняет в переписке, а карусель должна
       листаться, а не читаться. */
    box.innerHTML = items.map(function (b) {
      var base = 'assets/catalog/' + b.id;
      var name = b[lang] || b.ru;
      return '<a class="card" href="#" data-item="' + name + '" ' +
             'aria-label="' + name + ', ' + money(b.price) + '">' +
        '<span class="card__img" style="background-image:url(' + base + '-lqip.webp)">' +
          '<picture>' +
            '<source srcset="' + base + '.avif" type="image/avif">' +
            '<img src="' + base + '.webp" alt="' + b.alt + '" width="480" height="480" ' +
                 'loading="lazy" decoding="async">' +
          '</picture>' +
        '</span>' +
        '<b class="card__price">' + money(b.price) + '</b>' +
      '</a>';
    }).join('');
  }

  /* Стрелки листания: на мышке свайпа нет, а полосу прокрутки
     мы прячем. Листаем ровно на одну карточку. */
  function wireRail() {
    var rail = $('#catalog');
    if (!rail) return;
    all('[data-rail]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var card = rail.querySelector('.card');
        if (!card) return;
        var step = card.getBoundingClientRect().width + 14;
        rail.scrollBy({ left: btn.getAttribute('data-rail') === 'next' ? step : -step,
                        behavior: 'smooth' });
      });
    });
  }


  /* ─── Подгонка строки бренда ──────────────────────────────────
     Строка обязана оставаться в ОДНУ линию и не обрезаться ни на
     одном экране. Считать кегль в vw нельзя: ширина буквы зависит
     от шрифта, а он грузится позже, и у разных браузеров свои доли
     процента. Поэтому меряем фактическую ширину и подбираем размер.
     Пересчитываем после загрузки шрифтов, на поворот экрана и при
     смене языка — у каждого перевода своя длина. */
  /* Кегль привязан к ШИРИНЕ ЛОГОТИПА, а не к экрану: тогда связка
     «логотип + строка» выглядит одинаково и на телефоне, и на
     мониторе — меняется масштаб, а не пропорции. Сверху всё равно
     стоит ограничение по ширине контейнера, чтобы строка никогда
     не обрезалась. */
  var TITLE_RATIO = 0.082;   // доля от ширины логотипа

  function fitTitle() {
    var el = $('.cover__title');
    if (!el || !el.parentElement) return;
    var avail = el.parentElement.clientWidth;
    if (!avail) return;

    el.style.fontSize = '100px';
    var w = el.scrollWidth;
    el.style.fontSize = '';
    if (!w) return;

    /* 0.94 — запас на кернинг и на округление ширины в разных движках */
    var byBox = 100 * avail * 0.94 / w;
    var mark = $('.cover__mark');
    var markW = mark ? mark.getBoundingClientRect().width : 0;
    var byLogo = markW > 50 ? markW * TITLE_RATIO : byBox;

    el.style.fontSize = Math.max(11, Math.floor(Math.min(byLogo, byBox))) + 'px';
  }

  function watchTitle() {
    if (!$('.cover__title')) return;
    fitTitle();
    /* Шрифт приезжает после первой отрисовки — без этого размер
       остался бы посчитанным по подменному шрифту. */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(fitTitle);
    }
    var t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(fitTitle, 120);
    });
  }

  /* ─── Reveal ──────────────────────────────────────────────── */
  function reveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;
    var showAll = function () {
      Array.prototype.forEach.call(items, function (el) { el.classList.add('is-in'); });
    };
    if (!('IntersectionObserver' in window) ||
        matchMedia('(prefers-reduced-motion: reduce)').matches) { showAll(); return; }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    Array.prototype.forEach.call(items, function (el) { io.observe(el); });

    /* Страховка: в фоновой вкладке observer молчит, и посетитель
       увидел бы пустую страницу. Через 2.5 с показываем всё. */
    setTimeout(function () {
      Array.prototype.forEach.call(items, function (el) {
        if (!el.classList.contains('is-in')) { el.classList.add('is-in'); io.unobserve(el); }
      });
    }, 2500);
  }

  /* ─── Клики по WhatsApp / телефону ────────────────────────── */
  function wireLinks() {
    all('[data-wa]').forEach(function (el) {
      var kind = el.getAttribute('data-wa');
      /* href переписываем ВСЕГДА: у карточки в контактах он уже прописан
         в разметке, и при проверке «только если #» она открывала пустой
         чат — без приветствия, города и метки QR. */
      if (el.tagName === 'A') el.href = waLink(kind);
      if (el._wired) return;
      el._wired = true;
      el.addEventListener('click', function () {
        markWa();
        goal(kind === 'vip' ? 'wa_vip' : 'wa_order');
      });
    });

    all('[data-item]').forEach(function (el) {
      el.href = waLink('order');
      if (el._wired) return;
      el._wired = true;
      el.addEventListener('click', function () { markWa(); goal('wa_item'); });
    });

    all('[data-goal]').forEach(function (a) {
      if (a._wiredGoal) return;
      a._wiredGoal = true;
      a.addEventListener('click', function () { goal(a.getAttribute('data-goal')); });
    });
  }

  /* ─── Форма листа ожидания ───────────────────────────────── */
  function wireForm() {
    var form = $('#waitlist');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = $('#wl');
      var note = $('#wlNote');
      var val = (input.value || '').trim();

      if (val.length < 5) {
        note.textContent = t('wlShort');
        input.focus();
        return;
      }
      goal('waitlist_submit');

      if (FORM_ENDPOINT) {
        fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: new FormData(form)
        }).then(function (r) {
          note.textContent = r.ok ? t('wlDone') : t('wlFail');
          if (r.ok) form.reset();
        }).catch(function () { note.textContent = t('wlFail'); });
        return;
      }

      /* Эндпоинта ещё нет — не делаем вид, что заявка ушла.
         Открываем WhatsApp с уже вписанным контактом. */
      note.textContent = t('wlOpening');
      markWa();
      window.location.href = 'https://wa.me/' + CONTACT.waPhone + '?text=' +
        encodeURIComponent(t('waHello') + ' ' + fill('waWaitlist', { contact: val }));
    });
  }

  /* ─── Переключатель языка ─────────────────────────────────── */
  function applyLang(code, rebuild) {
    lang = LANGS.indexOf(code) > -1 ? code : 'ru';
    try { localStorage.setItem('remy_lang', lang); } catch (e) {}
    document.documentElement.lang = dict()._html || lang;

    all('[data-i18n]').forEach(function (el) {
      var v = t(el.getAttribute('data-i18n'));
      if (v != null) el.textContent = v;
    });
    all('[data-i18n-ph]').forEach(function (el) {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph')));
    });
    all('[data-i18n-aria]').forEach(function (el) {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });

    var cur = $('#langCur');
    if (cur) cur.textContent = dict()._name || lang;
    all('#langMenu button').forEach(function (b) {
      b.setAttribute('aria-current', b.getAttribute('data-lang') === lang ? 'true' : 'false');
    });

    if (rebuild) {
      buildCards($('#cards'), 4);
      buildCards($('#catalog'), 0);
      wireLinks();
      fitTitle();
    }
  }

  function wireLang() {
    var box = $('#lang');
    if (!box) return;
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-lang]');
      if (!b) return;
      applyLang(b.getAttribute('data-lang'), true);
      box.open = false;
    });
    // клик мимо меню закрывает его
    document.addEventListener('click', function (e) {
      if (box.open && !box.contains(e.target)) box.open = false;
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && box.open) { box.open = false; $('.lang__btn', box).focus(); }
    });
  }

  /* ─── Возврат на страницу после WhatsApp ─────────────────── */
  window.addEventListener('pageshow', function () {
    try {
      if (sessionStorage.getItem('remy_wa') !== '1') return;
      sessionStorage.removeItem('remy_wa');   // иначе показывается каждую загрузку
    } catch (e) { return; }
    var box = $('#waReturn');
    if (box) box.hidden = false;
  });

  /* ─── Старт ───────────────────────────────────────────────── */
  function init() {
    lang = initialLang();

    buildCards($('#cards'), 4);        // витрина
    buildCards($('#catalog'), 0);      // полный каталог
    wireRail();
    wireLang();
    applyLang(lang, false);
    wireLinks();
    wireForm();
    watchTitle();
    reveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();

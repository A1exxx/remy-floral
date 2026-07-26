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

  /* ─── Города ──────────────────────────────────────────────────
     mode 'own'  — доставляем сами
     mode 'ask'  — подтверждаем возможность и срок вручную
     acc — винительный падеж, нужен только русскому */
  var CITIES = [
    { name: 'Алматы', acc: 'Алматы', mode: 'own' },
    { name: 'Астана', acc: 'Астану', mode: 'ask' },
    { name: 'Шымкент', acc: 'Шымкент', mode: 'ask' },
    { name: 'Актобе', acc: 'Актобе', mode: 'ask' },
    { name: 'Актау', acc: 'Актау', mode: 'ask' },
    { name: 'Атырау', acc: 'Атырау', mode: 'ask' },
    { name: 'Балхаш', acc: 'Балхаш', mode: 'ask' },
    { name: 'Жанаозен', acc: 'Жанаозен', mode: 'ask' },
    { name: 'Жезказган', acc: 'Жезказган', mode: 'ask' },
    { name: 'Караганда', acc: 'Караганду', mode: 'ask' },
    { name: 'Каскелен', acc: 'Каскелен', mode: 'ask' },
    { name: 'Кокшетау', acc: 'Кокшетау', mode: 'ask' },
    { name: 'Конаев', acc: 'Конаев', mode: 'ask' },
    { name: 'Костанай', acc: 'Костанай', mode: 'ask' },
    { name: 'Кызылорда', acc: 'Кызылорду', mode: 'ask' },
    { name: 'Павлодар', acc: 'Павлодар', mode: 'ask' },
    { name: 'Петропавловск', acc: 'Петропавловск', mode: 'ask' },
    { name: 'Рудный', acc: 'Рудный', mode: 'ask' },
    { name: 'Семей', acc: 'Семей', mode: 'ask' },
    { name: 'Талдыкорган', acc: 'Талдыкорган', mode: 'ask' },
    { name: 'Тараз', acc: 'Тараз', mode: 'ask' },
    { name: 'Темиртау', acc: 'Темиртау', mode: 'ask' },
    { name: 'Туркестан', acc: 'Туркестан', mode: 'ask' },
    { name: 'Уральск', acc: 'Уральск', mode: 'ask' },
    { name: 'Усть-Каменогорск', acc: 'Усть-Каменогорск', mode: 'ask' },
    { name: 'Экибастуз', acc: 'Экибастуз', mode: 'ask' }
  ];

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

  /* ─── Фирменные носители из брендбука ─────────────────────── */
  var PACKS = [
    { id: 'cone',    alt: 'Букет из калл в фирменном бордовом конусе Remy' },
    { id: 'hatbox',  alt: 'Шляпная коробка Remy с красными герберами и лилиями' },
    { id: 'boxes',   alt: 'Фирменные тубусы Remy в бордовом и кремовом' },
    { id: 'bags',    alt: 'Пакеты Remy бордовый и кремовый с фирменными дугами' },
    { id: 'ribbon',  alt: 'Бордовая лента Remy с золотым логотипом' },
    { id: 'tissue',  alt: 'Фирменная упаковочная бумага Remy с узором из дуг' },
    { id: 'shopper', alt: 'Бордовый шоппер Remy с логотипом' }
  ];

  /* ─── Утилиты ─────────────────────────────────────────────── */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var all = function (s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  };

  var _src = null;
  function source() {
    if (_src) return _src;
    try {
      var q = new URLSearchParams(location.search);
      /* ?s=vitrina — короткая метка из печатного QR: чем короче URL,
         тем ниже version кода и надёжнее скан с наклейки 3 см.
         utm_* поддерживаем для ссылок из Instagram и рассылок. */
      var s = q.get('s') || q.get('utm_content') || q.get('utm_source');
      if (s) { _src = s; sessionStorage.setItem('remy_src', s); }
      _src = _src || sessionStorage.getItem('remy_src') || t('waSite');
      return _src;
    } catch (e) { return _src || t('waSite'); }
  }

  /* Порядок строк не случайный: WhatsApp ставит курсор в КОНЕЦ
     префилла, поэтому служебные строки идут первыми, а единственная
     строка под дозаполнение — последней, прямо под курсором. */
  function head(c, extra) {
    var lines = [];
    if (c.city) lines.push(t('waCityLine') + ': ' + c.city);
    if (extra) lines.push(extra);
    lines.push(t('waSrcLine') + ': ' + source());
    return lines.join('\n');
  }

  var KIND = {
    order:    ['waOrder', 'waOrderTail'],
    ask:      ['waAsk', 'waAskTail'],
    vip:      ['waVip', 'waVipTail'],
    today:    ['waToday', 'waTodayTail'],
    cert:     ['waCert', 'waCertTail'],
    item:     ['waItem', 'waItemTail'],
    question: ['waQuestion', 'waQuestionTail']
  };

  /* encodeURIComponent, НЕ encodeURI: иначе «&» обрежет сообщение.
     Кодировать один раз — двойное кодирование покажет «%D0%9F» в чате. */
  function waLink(kind, city, item) {
    var k = KIND[kind] || KIND.question;
    var extra = item ? t('waItemLine') + ': ' + item : null;
    var text = t('waHello') + ' ' + t(k[0]) + '\n' +
               head({ city: city || null }, extra) + '\n\n' + t(k[1]);
    return 'https://wa.me/' + CONTACT.waPhone + '?text=' + encodeURIComponent(text);
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
    box.innerHTML = items.map(function (b) {
      var base = 'assets/catalog/' + b.id;
      var name = b[lang] || b.ru;
      return '<a class="card" href="#" data-item="' + name + ' — ' + money(b.price) + '" ' +
             'aria-label="' + name + ', ' + money(b.price) + '">' +
        '<span class="card__img" style="background-image:url(' + base + '-lqip.webp)">' +
          '<picture>' +
            '<source srcset="' + base + '.avif" type="image/avif">' +
            '<img src="' + base + '.webp" alt="' + b.alt + '" width="480" height="480" ' +
                 'loading="lazy" decoding="async">' +
          '</picture>' +
        '</span>' +
        '<span class="card__name">' + name + '</span>' +
        '<span class="card__foot">' +
          '<b class="card__price">' + money(b.price) + '</b>' +
          '<span class="card__go">' + t('order') + ' →</span>' +
        '</span>' +
      '</a>';
    }).join('');
  }

  function buildPacks() {
    var box = $('#packs');
    if (!box) return;
    box.innerHTML = PACKS.map(function (p) {
      var base = 'assets/brand/' + p.id;
      return '<figure class="pack" style="background-image:url(' + base + '-lqip.webp)">' +
        '<picture>' +
          '<source srcset="' + base + '.avif" type="image/avif">' +
          '<img src="' + base + '.webp" alt="' + p.alt + '" loading="lazy" decoding="async">' +
        '</picture>' +
      '</figure>';
    }).join('');
  }

  /* ─── Селектор города ─────────────────────────────────────── */
  var sel, trigger, note, orderBtn, sheet, list, search, count, ctaCtx;

  function currentCity() {
    if (!sel || !sel.value) return null;
    for (var i = 0; i < CITIES.length; i++) {
      if (CITIES[i].name === sel.value) return CITIES[i];
    }
    return null;
  }

  function cityBtnText(c) {
    var name = lang === 'ru' ? c.acc : c.name;
    return (c.mode === 'own' ? t('cityBtnOwn') : t('cityBtnAsk')).replace('{city}', name);
  }

  /* Каждая ветка проверяет свой элемент отдельно: на главной и на
     vip.html селектора города нет, и обращение к orderBtn роняло бы
     весь скрипт вместе с кнопками заказа. */
  function syncCity() {
    var c = currentCity();
    var noteText = $('#cityNote span');

    if (!c) {
      if (noteText) noteText.textContent = t('noteEmpty');
      if (orderBtn) {
        orderBtn.textContent = t('cityPickFirst');
        orderBtn.setAttribute('aria-disabled', 'true');
        orderBtn.href = '#';
      }
      if (ctaCtx) ctaCtx.textContent = '';
      return;
    }

    if (noteText) noteText.textContent = t(c.mode === 'own' ? 'noteOwn' : 'noteAsk');
    if (orderBtn) {
      orderBtn.setAttribute('aria-disabled', 'false');
      orderBtn.textContent = cityBtnText(c);
      orderBtn.href = waLink(c.mode === 'own' ? 'order' : 'ask', c.name);
    }
    if (trigger) trigger.textContent = c.name;
    if (ctaCtx) ctaCtx.textContent = c.name;

    all('[data-wa]').forEach(function (el) {
      if (el === orderBtn) return;
      if (el.tagName === 'A') el.href = waLink(el.getAttribute('data-wa'), c.name);
    });
    all('[data-item]').forEach(function (el) {
      el.href = waLink('item', c.name, el.getAttribute('data-item'));
    });
    goal(c.mode === 'own' ? 'city_almaty' : 'city_other');
  }

  function buildSelect() {
    sel = $('#city');
    if (!sel) return;
    var keep = sel.value;
    var own = CITIES.filter(function (c) { return c.mode === 'own'; });
    var ask = CITIES.filter(function (c) { return c.mode === 'ask'; });
    var opt = function (c) { return '<option value="' + c.name + '">' + c.name + '</option>'; };
    sel.innerHTML =
      '<option value="" disabled' + (keep ? '' : ' selected') + '>' + t('cityLabel') + '</option>' +
      '<optgroup label="' + t('cityGroupNow') + '">' + own.map(opt).join('') + '</optgroup>' +
      '<optgroup label="' + t('cityGroupAsk') + '">' + ask.map(opt).join('') + '</optgroup>';
    if (keep) sel.value = keep;
    if (!sel._wired) { sel.addEventListener('change', syncCity); sel._wired = true; }
  }

  function renderList(query) {
    var q = (query || '').trim().toLowerCase();
    var match = function (c) { return !q || c.name.toLowerCase().indexOf(q) > -1; };
    var own = CITIES.filter(function (c) { return c.mode === 'own' && match(c); });
    var ask = CITIES.filter(function (c) { return c.mode === 'ask' && match(c); });
    var total = own.length + ask.length;

    if (!total) {
      list.innerHTML = '<p class="sheet__empty">' + t('cityEmpty') + '</p>';
    } else {
      var row = function (c) {
        var chip = c.mode === 'own'
          ? '<span class="opt__chip opt__chip--now">' + t('cityChipNow') + '</span>'
          : '<span class="opt__chip opt__chip--ask">' + t('cityChipAsk') + '</span>';
        var on = sel.value === c.name;
        return '<button type="button" class="opt" role="option" data-city="' + c.name + '" ' +
               'aria-selected="' + (on ? 'true' : 'false') + '">' +
          '<span class="opt__name">' + c.name + '</span>' + chip +
          '<svg class="opt__check" aria-hidden="true"><use href="#i-check"/></svg>' +
        '</button>';
      };
      list.innerHTML =
        (own.length ? '<p class="grp">' + t('cityGroupNow') + '</p>' + own.map(row).join('') : '') +
        (ask.length ? '<p class="grp">' + t('cityGroupAsk') + '</p>' + ask.map(row).join('') : '');
    }
    if (count) count.textContent = total ? total : t('cityEmpty');
  }

  function openSheet() {
    renderList('');
    search.value = '';
    sheet.showModal();
    trigger.setAttribute('aria-expanded', 'true');
    // автофокус в поиск только на десктопе: на мобиле клавиатура закроет список
    if (window.matchMedia('(min-width:1024px)').matches) search.focus();
  }

  function closeSheet() {
    sheet.close();
    trigger.setAttribute('aria-expanded', 'false');
    trigger.focus();
  }

  function buildSheet() {
    trigger = $('#cityTrigger');
    sheet = $('#citySheet');
    list = $('#cityList');
    search = $('#citySearch');
    count = $('#cityCount');
    if (!sel || !trigger || !sheet || typeof sheet.showModal !== 'function') return;

    // апгрейд: нативный select уходит в sr-only, но остаётся источником истины
    sel.classList.add('sr-only');
    sel.setAttribute('tabindex', '-1');
    sel.setAttribute('aria-hidden', 'true');
    trigger.hidden = false;
    trigger.textContent = t('cityLabel');

    trigger.addEventListener('click', openSheet);
    $('#sheetClose').addEventListener('click', closeSheet);
    search.addEventListener('input', function () { renderList(search.value); });
    sheet.addEventListener('cancel', function () {
      trigger.setAttribute('aria-expanded', 'false');
    });
    sheet.addEventListener('click', function (e) {
      if (e.target === sheet) closeSheet();          // тап по scrim
    });
    list.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-city]');
      if (!btn) return;
      sel.value = btn.getAttribute('data-city');
      syncCity();
      closeSheet();
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
      if (el.tagName === 'A') el.href = waLink(kind, null);
      if (el._wired) return;
      el._wired = true;
      el.addEventListener('click', function (e) {
        if (el.getAttribute('aria-disabled') === 'true') {
          e.preventDefault();
          var n = $('#cityNote span');
          if (n) n.textContent = t('cityPickFirst');
          if (trigger) trigger.focus();
          return;
        }
        markWa();
        goal(kind === 'vip' ? 'wa_vip' : 'wa_order');
      });
    });

    all('[data-item]').forEach(function (el) {
      el.href = waLink('item', null, el.getAttribute('data-item'));
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
      var c = currentCity();
      var text = [t('waHello') + ' ' + t('waVip'), '',
        t('waContactLine') + ': ' + val,
        t('waCityLine') + ': ' + (c ? c.name : '—'), '',
        t('waSrcLine') + ': ' + source()].join('\n');
      note.textContent = t('wlOpening');
      markWa();
      window.location.href = 'https://wa.me/' + CONTACT.waPhone + '?text=' + encodeURIComponent(text);
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
      buildSelect();
      if (trigger && !currentCity()) trigger.textContent = t('cityLabel');
      syncCity();
      wireLinks();
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
    orderBtn = $('#orderBtn');
    ctaCtx = $('#ctaCtx');
    lang = initialLang();

    buildCards($('#cards'), 4);        // витрина
    buildCards($('#catalog'), 0);      // полный каталог
    buildPacks();
    buildSelect();
    buildSheet();
    wireLang();
    applyLang(lang, false);
    wireLinks();
    wireForm();
    syncCity();
    reveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();

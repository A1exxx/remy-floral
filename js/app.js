/* ═══════════════════════════════════════════════════════════════
   Remy Boutique Floral — лендинг-визитка
   Бэкенда нет: заказ уходит в WhatsApp предзаполненным сообщением.
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

  /* ─── Города ──────────────────────────────────────────────────
     mode 'own'  — доставляем сами
     mode 'ask'  — подтверждаем возможность и срок вручную
     acc — винительный падеж для «Уточнить доставку в …» */
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

  var NOTE = {
    empty: 'Выберите город — скажем, как быстро сможем привезти.',
    own: 'Доставляем по Алматы сами, каждый день с 10:00 до 00:00.',
    ask: 'Пока мы сами доставляем только по Алматы. В другой город подтверждаем ' +
         'возможность, срок и стоимость вручную — напишите, флорист ответит до любой оплаты.'
  };

  /* ─── Каталог ─────────────────────────────────────────────────
     ЕДИНСТВЕННОЕ место с ценами. Цифры взяты с публикаций самого
     Remy в Instagram (они вожжены в кадр: «- 34 000»), поэтому это
     не выдумка, но их надо сверять: цветы дорожают и дешевеют.
     Названия описательные — они не могут устареть или соврать.
     Порядок = от доступного к премиальному.
     Картинки: assets/catalog/b-NN, квадрат ≤480px, апскейл запрещён. */
  var CATALOG = [
    { id: 'b-01', name: 'Гортензия с подсолнухом', price: 25000,
      alt: 'Композиция из гортензии, подсолнуха и кустовых роз в пастельных тонах' },
    { id: 'b-03', name: 'Голубая гортензия и розы', price: 28000,
      alt: 'Композиция из синей гортензии с жёлтыми и белыми розами' },
    { id: 'b-02', name: 'Кустовая пионовидная роза', price: 34000,
      alt: 'Букет из розовых и кремовых пионовидных роз с лентами Remy' },
    { id: 'b-07', name: 'Пудровые пионовидные розы', price: 34000,
      alt: 'Пышный букет из пудрово-розовых пионовидных роз с лентами Remy' },
    { id: 'b-09', name: 'Гортензия и кустовая роза', price: 42000,
      alt: 'Круглый букет из голубой гортензии с жёлтыми и белыми цветами' },
    { id: 'b-04', name: 'Коралловые розы', price: 50000,
      alt: 'Крупный букет из коралловых роз с брендированными лентами Remy' },
    { id: 'b-10', name: 'Крупный букет кустовых роз', price: 73000,
      alt: 'Плотный букет из ярко-розовых кустовых роз' },
    { id: 'b-06', name: 'Роскошная композиция', price: 74000,
      alt: 'Большая авторская композиция из гортензии, лилий, подсолнухов и роз' }
  ];

  /* 25000 -> «25 000 ₸». Неразрывные пробелы: цена не должна рваться
     переносом строки, иначе «25» и «000 ₸» окажутся на разных строках. */
  function money(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₸';
  }

  /* ─── Утилиты ─────────────────────────────────────────────── */
  var $ = function (s, r) { return (r || document).querySelector(s); };

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
      _src = _src || sessionStorage.getItem('remy_src') || 'сайт';
      return _src;
    } catch (e) { return _src || 'сайт'; }
  }

  /* Порядок строк не случайный: WhatsApp ставит курсор в КОНЕЦ префилла.
     Поэтому служебные строки идут первыми, а единственная строка под
     дозаполнение — последней, прямо под курсором. Раньше пустые «Повод:»
     висели в середине и оставались незаполненными.
     Строку «Город» не печатаем, если город не выбран: «Город: не указан»
     выглядит как ошибка формы. */
  function head(c, extra) {
    var lines = [];
    if (c.city) lines.push('Город: ' + c.city);
    if (extra) lines.push(extra);
    lines.push('Источник: ' + c.src);
    return lines.join('\n');
  }

  var TPL = {
    order: function (c) {
      return 'Здравствуйте, Remy! Хочу заказать букет.\n' + head(c) +
             '\n\nПовод и когда нужно: ';
    },
    ask: function (c) {
      return 'Здравствуйте, Remy! Нужен букет в другой город.\n' + head(c) +
             '\n\nПодскажите, получится ли доставить, за какой срок и сколько будет стоить. Дата: ';
    },
    vip: function (c) {
      return 'Здравствуйте, Remy! Интересует VIP-ДОСТАВКА ЦВЕТОВ — букет привозит знаменитость.\n' +
             head(c, 'Метка: VIP') +
             '\n\nХочу первым узнать имена артистов и цены. Повод: ';
    },
    today: function (c) {
      return 'Здравствуйте, Remy! Покажите, какие букеты есть сегодня.\n' + head(c) +
             '\n\nИщу букет: ';
    },
    /* Заказ конкретной позиции каталога. Цену пишем в сообщение: флорист
       сразу видит, на какую сумму рассчитывает клиент, и поправит её,
       если букет с тех пор подорожал. */
    item: function (c) {
      return 'Здравствуйте, Remy! Хочу букет из каталога.\n' +
             head(c, 'Букет: ' + c.item) +
             '\n\nКогда нужен и кому: ';
    },
    cert: function (c) {
      return 'Здравствуйте, Remy! Хочу подарочный сертификат.\n' + head(c) +
             '\n\nНа какую сумму и когда нужен: ';
    },
    question: function (c) {
      return 'Здравствуйте, Remy! Пишу с сайта.\n' + head(c) +
             '\n\nХочу спросить: ';
    }
  };

  /* encodeURIComponent, НЕ encodeURI: иначе «&» обрежет сообщение.
     Кодировать один раз — двойное кодирование покажет «%D0%9F» в чате. */
  function waLink(kind, city, item) {
    var build = TPL[kind] || TPL.question;
    var text = build({ city: city || null, src: source(), item: item || null });
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
      return '<a class="card" href="#" data-item="' + b.name + ' — ' + money(b.price) + '" ' +
             'aria-label="' + b.name + ', ' + money(b.price) + ' — заказать в WhatsApp">' +
        '<span class="card__img" style="background-image:url(' + base + '-lqip.webp)">' +
          '<picture>' +
            '<source srcset="' + base + '.avif" type="image/avif">' +
            '<img src="' + base + '.webp" alt="' + b.alt + '" width="480" height="480" ' +
                 'loading="lazy" decoding="async">' +
          '</picture>' +
        '</span>' +
        '<span class="card__name">' + b.name + '</span>' +
        '<span class="card__foot">' +
          '<b class="card__price">' + money(b.price) + '</b>' +
          '<span class="card__go">Заказать →</span>' +
        '</span>' +
      '</a>';
    }).join('');
    /* eager/high тут НЕ ставим: карточки гарантированно за фолдом
       (hero занимает 100dvh) и конкурировали бы приоритетом
       с настоящим LCP — фоном hero. Дыру закрывает LQIP. */
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

  /* Каждая ветка проверяет свой элемент отдельно: на catalog.html
     селектора города нет вообще, и обращение к orderBtn роняло бы
     весь скрипт вместе с кнопками заказа. */
  function syncCity() {
    var c = currentCity();
    var noteText = $('#cityNote span');

    if (!c) {
      if (noteText) noteText.textContent = NOTE.empty;
      if (orderBtn) {
        orderBtn.textContent = 'Сначала выберите город';
        orderBtn.setAttribute('aria-disabled', 'true');
        orderBtn.href = '#';
      }
      if (ctaCtx) ctaCtx.textContent = 'Букеты из свежей поставки';
      return;
    }

    if (noteText) noteText.textContent = NOTE[c.mode];
    if (orderBtn) {
      orderBtn.setAttribute('aria-disabled', 'false');
      orderBtn.textContent = c.mode === 'own'
        ? 'Заказать доставку по ' + c.acc
        : 'Уточнить доставку в ' + c.acc;
      orderBtn.href = waLink(c.mode === 'own' ? 'order' : 'ask', c.name);
    }

    if (trigger) trigger.textContent = c.name;
    if (ctaCtx) {
      ctaCtx.textContent = c.mode === 'own'
        ? 'Алматы · доставка сегодня'
        : c.name + ' · уточним срок';
    }
    // общие кнопки и карточки каталога тоже получают город
    Array.prototype.forEach.call(document.querySelectorAll('[data-wa]'), function (el) {
      if (el === orderBtn) return;
      if (el.tagName === 'A') el.href = waLink(el.getAttribute('data-wa'), c.name);
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-item]'), function (el) {
      el.href = waLink('item', c.name, el.getAttribute('data-item'));
    });
    goal(c.mode === 'own' ? 'city_almaty' : 'city_other');
  }

  function buildSelect() {
    sel = $('#city');
    if (!sel) return;
    var own = CITIES.filter(function (c) { return c.mode === 'own'; });
    var ask = CITIES.filter(function (c) { return c.mode === 'ask'; });
    var opt = function (c) { return '<option value="' + c.name + '">' + c.name + '</option>'; };
    sel.innerHTML =
      '<option value="" selected disabled>Выберите город</option>' +
      '<optgroup label="Доставляем сегодня">' + own.map(opt).join('') + '</optgroup>' +
      '<optgroup label="Уточним срок доставки">' + ask.map(opt).join('') + '</optgroup>';
    sel.addEventListener('change', syncCity);
  }

  function renderList(query) {
    var q = (query || '').trim().toLowerCase();
    var match = function (c) { return !q || c.name.toLowerCase().indexOf(q) === 0 || c.name.toLowerCase().indexOf(q) > -1; };
    var own = CITIES.filter(function (c) { return c.mode === 'own' && match(c); });
    var ask = CITIES.filter(function (c) { return c.mode === 'ask' && match(c); });
    var total = own.length + ask.length;

    if (!total) {
      list.innerHTML = '<p class="sheet__empty">Не нашли город — напишите, соберём маршрут.</p>';
    } else {
      var row = function (c) {
        var chip = c.mode === 'own'
          ? '<span class="opt__chip opt__chip--now">в день заказа</span>'
          : '<span class="opt__chip opt__chip--ask">уточним срок</span>';
        var on = sel.value === c.name;
        return '<button type="button" class="opt" role="option" data-city="' + c.name + '" ' +
               'aria-selected="' + (on ? 'true' : 'false') + '">' +
          '<span class="opt__name">' + c.name + '</span>' + chip +
          '<svg class="opt__check" aria-hidden="true"><use href="#i-check"/></svg>' +
        '</button>';
      };
      list.innerHTML =
        (own.length ? '<p class="grp">Доставляем сегодня</p>' + own.map(row).join('') : '') +
        (ask.length ? '<p class="grp">Уточним срок доставки</p>' + ask.map(row).join('') : '');
    }
    if (count) count.textContent = total ? 'Найдено городов: ' + total : 'Ничего не найдено';
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
    if (!trigger || !sheet || typeof sheet.showModal !== 'function') return;

    // апгрейд: нативный select уходит в sr-only, но остаётся источником истины
    sel.classList.add('sr-only');
    sel.setAttribute('tabindex', '-1');
    sel.setAttribute('aria-hidden', 'true');
    trigger.hidden = false;
    trigger.textContent = 'Выберите город';

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

  /* ─── Липкая панель ───────────────────────────────────────── */
  function stickyBar() {
    var bar = $('#ctaBar');
    var top = $('#topbar');
    var sentinel = $('#hero-sentinel');
    if (!sentinel || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (entries) {
      var past = !entries[0].isIntersecting;
      if (bar) bar.classList.toggle('is-in', past);
      // панель наверху становится непрозрачной, только когда под ней
      // уже не бордовое поле — иначе персиковые иконки лягут на молочное
      if (top) top.classList.toggle('is-solid', past);
    }, { rootMargin: '0px' }).observe(sentinel);
    if (bar) {
      bar.addEventListener('transitionend', function () { bar.style.willChange = 'auto'; });
    }
  }

  /* ─── Reveal ──────────────────────────────────────────────── */
  function reveal() {
    var items = document.querySelectorAll('.reveal');
    var showAll = function () {
      Array.prototype.forEach.call(items, function (el) { el.classList.add('is-in'); });
    };

    if (!('IntersectionObserver' in window) ||
        matchMedia('(prefers-reduced-motion: reduce)').matches) {
      showAll();
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    Array.prototype.forEach.call(items, function (el) { io.observe(el); });

    /* Страховка. Видимость контента не должна зависеть от того, что
       observer сработал: в фоновой/незарендеренной вкладке он молчит,
       и посетитель увидит пустую страницу. Через 2.5 с показываем всё,
       что осталось скрытым. В нормальном сценарии IO успевает раньше. */
    setTimeout(function () {
      Array.prototype.forEach.call(items, function (el) {
        if (!el.classList.contains('is-in')) {
          el.classList.add('is-in');
          io.unobserve(el);
        }
      });
    }, 2500);
  }

  /* ─── Клики по WhatsApp / телефону ────────────────────────── */
  function wireLinks() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-wa]'), function (el) {
      var kind = el.getAttribute('data-wa');
      /* href переписываем ВСЕГДА: у карточки в контактах он уже прописан
         в разметке, и при проверке «только если #» она открывала пустой
         чат — без приветствия, города и метки QR. */
      if (el.tagName === 'A') el.href = waLink(kind, null);
      el.addEventListener('click', function (e) {
        if (el.getAttribute('aria-disabled') === 'true') {
          e.preventDefault();
          var n = $('#cityNote span');
          if (n) n.textContent = 'Сначала выберите город — тогда флорист сразу увидит, куда везти.';
          if (trigger) trigger.focus();
          return;
        }
        markWa();
        goal(kind === 'vip' ? 'wa_vip' : 'wa_order');
      });
    });

    /* Карточки каталога. href проставляем сразу, а не только в syncCity:
       город чаще всего не выбран, и без этого карточка вела бы в «#». */
    Array.prototype.forEach.call(document.querySelectorAll('[data-item]'), function (el) {
      el.href = waLink('item', null, el.getAttribute('data-item'));
      el.addEventListener('click', function () { markWa(); goal('wa_item'); });
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-goal]'), function (a) {
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
        note.textContent = 'Впишите номер или ник — иначе мы не сможем ответить.';
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
          note.textContent = r.ok
            ? 'Записали. Вы в списке первых — напишем, как только будут имена и цены.'
            : 'Не отправилось. Напишите нам в WhatsApp — так быстрее.';
          if (r.ok) form.reset();
        }).catch(function () {
          note.textContent = 'Не отправилось. Напишите нам в WhatsApp — так быстрее.';
        });
        return;
      }

      /* Эндпоинта ещё нет — не делаем вид, что заявка ушла.
         Открываем WhatsApp с уже вписанным контактом. */
      var c = currentCity();
      var text = ['Здравствуйте, Remy. Запишите меня в список первых на VIP-ДОСТАВКУ ЦВЕТОВ.', '',
        'Мой контакт: ' + val,
        'Город: ' + (c ? c.name : 'не указан'), '',
        'Метка: VIP / Источник: ' + source()].join('\n');
      note.textContent = 'Открываем WhatsApp — останется нажать «отправить».';
      markWa();
      window.location.href = 'https://wa.me/' + CONTACT.waPhone + '?text=' + encodeURIComponent(text);
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
    buildCards($('#cards'), 4);        // витрина на главной
    buildCards($('#catalog'), 0);      // полный каталог на catalog.html
    buildPacks();
    buildSelect();
    buildSheet();
    wireLinks();
    wireForm();
    syncCity();
    stickyBar();
    reveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();

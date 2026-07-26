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

  /* ─── Галерея ─────────────────────────────────────────────────
     Замена фото: правится только этот массив. Файлы кладутся
     в assets/bouquets/, размер 420x420 (апскейл запрещён). */
  /* Файлы «tile-NN» — реальные кадры Remy (видны фирменные ленты и логотип),
     «g-NN» — премиальный сток под лицензией Pexels. Порядок чередует их,
     чтобы разница в резкости не читалась как «часть фото хуже». */
  var GALLERY = [
    { id: 'g-01', cls: 'tile--hero', w: 760,
      alt: 'Букет из розовых роз на тёмном столе в классическом интерьере' },
    { id: 'tile-04', cls: 'tile--sq',
      alt: 'Крупный букет из коралловых и персиковых роз с брендированными лентами Remy' },
    { id: 'g-03', cls: 'tile--sq', w: 460,
      alt: 'Букет из тёмно-красных роз в кремовой шляпной коробке' },
    { plate: 'Моменты остаются навсегда' },
    /* Реальный кадр бутика стоит в МАЛЕНЬКОМ слоте осознанно: исходник даёт
       473px, а широкий слот требует ~700 — там он выглядел мылом. */
    { id: 'tile-11', cls: 'tile--sq', cap: 'Наш бутик',
      alt: 'Витрина бутика Remy: букеты и шляпные коробки на подсвеченных стеллажах' },
    { id: 'tile-10', cls: 'tile--sq',
      alt: 'Плотный букет из ярко-розовых кустовых роз с бордовой лентой Remy' },
    { id: 'g-07', cls: 'tile--wide', w: 760,
      alt: 'Букет из пудрово-розовых пионов в белом фатине' }
  ];

  /* Карточки ролей, а НЕ портреты конкретных артистов: состав ещё не собран,
     и лицо на карточке обещало бы конкретного человека. Поэтому кадры
     атмосферные — инструмент, сцена, свет. У кого фото нет, показывается
     гравированная арка со знаком. */
  var ARTISTS = [
    { role: 'Саксофон', img: 'sax', alt: 'Саксофонист в костюме играет в тёплом сценическом свете' },
    { role: 'Актёр', img: 'actor', alt: 'Мужчина в тёмном костюме, студийный портрет' },
    { role: 'Музыкант', img: 'music', alt: 'Музыкант с гитарой в тёплом интерьере с цветами' },
    { role: 'Ведущий', img: 'host', alt: 'Мужчина в классическом костюме, студийный портрет' },
    { role: 'Ваш сценарий' }
  ];

  /* ─── Утилиты ─────────────────────────────────────────────── */
  var $ = function (s, r) { return (r || document).querySelector(s); };

  function source() {
    try {
      var q = new URLSearchParams(location.search);
      /* ?s=vitrina — короткая метка из печатного QR: чем короче URL,
         тем ниже version кода и надёжнее скан с наклейки 3 см.
         utm_* поддерживаем для ссылок из Instagram и рассылок. */
      var s = q.get('s') || q.get('utm_content') || q.get('utm_source');
      if (s) sessionStorage.setItem('remy_src', s);
      return sessionStorage.getItem('remy_src') || 'сайт';
    } catch (e) { return 'сайт'; }
  }

  var TPL = {
    order: function (c) {
      return ['Здравствуйте, Remy. Хочу заказать букет.', '',
        'Город: ' + c.city, 'Повод: ', 'Когда нужно: ', '',
        'Источник: ' + c.src].join('\n');
    },
    ask: function (c) {
      return ['Здравствуйте, Remy. Нужен букет в другой город.', '',
        'Город: ' + c.city, 'Дата: ', '',
        'Подскажите, получится ли доставить и сколько это будет стоить.', '',
        'Источник: ' + c.src].join('\n');
    },
    star: function (c) {
      return ['Здравствуйте, Remy. Интересует ЗВЁЗДНАЯ ДОСТАВКА — букет привозит знаменитость.', '',
        'Город: ' + c.city, 'Повод: ', 'Примерная дата: ', '',
        'Хочу первым узнать имена артистов и цены.', '',
        'Метка: STAR / Источник: ' + c.src].join('\n');
    },
    today: function (c) {
      return ['Здравствуйте, Remy. Покажите, какие букеты есть сегодня.', '',
        'Город: ' + c.city, '', 'Источник: ' + c.src].join('\n');
    },
    question: function (c) {
      return 'Здравствуйте, Remy. Подскажите, пожалуйста: \n\nИсточник: ' + c.src;
    }
  };

  /* encodeURIComponent, НЕ encodeURI: иначе «&» обрежет сообщение.
     Кодировать один раз — двойное кодирование покажет «%D0%9F» в чате. */
  function waLink(kind, city) {
    var build = TPL[kind] || TPL.question;
    var text = build({ city: city || 'не указан', src: source() });
    return 'https://wa.me/' + CONTACT.waPhone + '?text=' + encodeURIComponent(text);
  }

  function goal(name) {
    try { if (window.ym && YM_ID) window.ym(YM_ID, 'reachGoal', name); } catch (e) {}
    try { if (window.gtag) window.gtag('event', name); } catch (e) {}
  }

  function markWa() { try { sessionStorage.setItem('remy_wa', '1'); } catch (e) {} }

  /* ─── Галерея ─────────────────────────────────────────────── */
  function buildGallery() {
    var box = $('#mosaic');
    if (!box) return;
    var html = GALLERY.map(function (t) {
      if (t.plate) {
        return '<div class="plate"><p>' + t.plate + '</p></div>';
      }
      var base = 'assets/bouquets/' + t.id;
      var px = t.w || 420;
      var cap = t.cap ? '<figcaption class="tile__cap">' + t.cap + '</figcaption>' : '';
      return '<figure class="tile ' + t.cls + '" style="background-image:url(' + base + '-lqip.webp)">' +
        '<picture>' +
          '<source srcset="' + base + '.avif" type="image/avif">' +
          '<img src="' + base + '.webp" alt="' + t.alt + '" width="' + px + '" height="' + px + '" ' +
               'loading="lazy" decoding="async">' +
        '</picture>' + cap +
      '</figure>';
    }).join('');
    box.innerHTML = html;
    var first = box.querySelector('img');
    if (first) { first.loading = 'eager'; first.setAttribute('fetchpriority', 'high'); }
  }

  /* ─── Карточки артистов ───────────────────────────────────── */
  function buildArtists() {
    var rail = $('#rail');
    if (!rail) return;
    rail.innerHTML = ARTISTS.map(function (a) {
      var inner = a.img
        ? '<span class="acard__arch acard__arch--photo">' +
            '<picture>' +
              '<source srcset="assets/artists/' + a.img + '.avif" type="image/avif">' +
              '<img src="assets/artists/' + a.img + '.webp" alt="' + (a.alt || '') + '" ' +
                   'width="360" height="480" loading="lazy" decoding="async">' +
            '</picture>' +
          '</span>'
        : '<span class="acard__arch"><svg class="mark" aria-hidden="true"><use href="#mark"/></svg></span>';

      var meta = a.img
        ? '<span class="acard__meta"><b>' + a.role + '</b></span>'
        : '<span class="acard__meta"><b>' + a.role + '</b>' +
            '<span class="acard__line"></span>' +
            '<span class="acard__line acard__line--short"></span>' +
          '</span>';

      return '<button type="button" class="acard" role="listitem" data-wa="star" ' +
             'aria-label="' + a.role + ' — формат вручения, написать в WhatsApp">' +
        inner + meta +
      '</button>';
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

  function syncCity() {
    var c = currentCity();
    var noteText = $('#cityNote span');

    if (!c) {
      if (noteText) noteText.textContent = NOTE.empty;
      orderBtn.textContent = 'Сначала выберите город';
      orderBtn.setAttribute('aria-disabled', 'true');
      orderBtn.href = '#';
      if (ctaCtx) ctaCtx.textContent = 'Букеты из свежей поставки';
      return;
    }

    if (noteText) noteText.textContent = NOTE[c.mode];
    orderBtn.setAttribute('aria-disabled', 'false');
    orderBtn.textContent = c.mode === 'own'
      ? 'Заказать доставку по ' + c.acc
      : 'Уточнить доставку в ' + c.acc;
    orderBtn.href = waLink(c.mode === 'own' ? 'order' : 'ask', c.name);

    if (trigger) trigger.textContent = c.name;
    if (ctaCtx) {
      ctaCtx.textContent = c.mode === 'own'
        ? 'Алматы · доставка сегодня'
        : c.name + ' · уточним срок';
    }
    // общие кнопки тоже получают город
    Array.prototype.forEach.call(document.querySelectorAll('[data-wa]'), function (el) {
      var kind = el.getAttribute('data-wa');
      if (el === orderBtn) return;
      if (el.tagName === 'A') el.href = waLink(kind, c.name);
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
      if (el.tagName === 'A' && (!el.getAttribute('href') || el.getAttribute('href') === '#')) {
        el.href = waLink(kind, null);
      }
      el.addEventListener('click', function (e) {
        if (el.getAttribute('aria-disabled') === 'true') {
          e.preventDefault();
          var n = $('#cityNote span');
          if (n) n.textContent = 'Сначала выберите город — тогда флорист сразу увидит, куда везти.';
          if (trigger) trigger.focus();
          return;
        }
        if (el.tagName === 'BUTTON') {           // карточки артистов
          e.preventDefault();
          var c = currentCity();
          markWa(); goal('wa_star');
          window.location.href = waLink('star', c ? c.name : null);
          return;
        }
        markWa();
        goal(kind === 'star' ? 'wa_star' : 'wa_order');
      });
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
      var text = ['Здравствуйте, Remy. Запишите меня в список первых на ЗВЁЗДНУЮ ДОСТАВКУ.', '',
        'Мой контакт: ' + val,
        'Город: ' + (c ? c.name : 'не указан'), '',
        'Метка: STAR / Источник: ' + source()].join('\n');
      note.textContent = 'Открываем WhatsApp — останется нажать «отправить».';
      markWa();
      window.location.href = 'https://wa.me/' + CONTACT.waPhone + '?text=' + encodeURIComponent(text);
    });
  }

  /* ─── Возврат на страницу после WhatsApp ─────────────────── */
  window.addEventListener('pageshow', function () {
    try { if (sessionStorage.getItem('remy_wa') !== '1') return; } catch (e) { return; }
    var box = $('#waReturn');
    if (box) box.hidden = false;
  });

  /* ─── Старт ───────────────────────────────────────────────── */
  function init() {
    orderBtn = $('#orderBtn');
    ctaCtx = $('#ctaCtx');
    buildGallery();
    buildArtists();
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

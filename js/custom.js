/* ============================================================
   custom.js — интерактив по ТЗ клиента (Synesthesia Travel).
   Подключается последним, до </body>. Чистый JS, без зависимостей.
   ============================================================ */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  /* --- п.4 «Форматы»: компактные картхолдеры + кнопка «Развернуть» ---
     У каждого формата прячем детальный текст (.t-card__descr) и
     добавляем кнопку-переключатель. */
  function initFormats() {
    var inners = document.querySelectorAll('#rec667905600 .t688__textwrapper_inner');
    inners.forEach(function (inner) {
      var descr = inner.querySelector('.t-card__descr');
      if (!descr || inner.querySelector('.fmt-toggle')) return;

      // управляем высотой инлайн (перебивает встроенное усечение Тильды t688)
      descr.style.overflow = 'hidden';
      descr.style.transition = 'max-height .55s ease, opacity .4s ease, margin-top .4s ease';
      descr.style.maxHeight = '0px';
      descr.style.opacity = '0';
      descr.style.marginTop = '0';

      var open = false;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'fmt-toggle';
      btn.textContent = 'Развернуть';
      btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', function () {
        open = !open;
        descr.style.maxHeight = open ? (descr.scrollHeight + 80) + 'px' : '0px';
        descr.style.opacity = open ? '1' : '0';
        descr.style.marginTop = open ? '8px' : '0';
        btn.textContent = open ? 'Свернуть' : 'Развернуть';
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      inner.appendChild(btn);
    });
  }

  /* --- п.6.1 «РТБ»: 4 категории выезжают друг за другом по скроллу ---
     добавляем класс .rtb-in блоку при попадании в зону видимости. */
  function initRTB() {
    var block = document.getElementById('rec667908990');
    if (!block) return;
    function reveal() { block.classList.add('rtb-in'); }
    if (!('IntersectionObserver' in window)) { reveal(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { reveal(); io.disconnect(); }
      });
    }, { threshold: 0.2 });
    io.observe(block);
  }

  /* --- п.3.1 «Наши возможности»: карточки сжаты до кнопки «Подробнее» и
     авто-растут при раскрытии. Это zero-блок Тильды (t396): «фигуры»-карточки и
     тексты — отдельные абсолютно-позиционированные элементы. Считаем высоту каждой
     карточки по контенту, двигаем нижний ряд и высоту артборда; при раскрытии плавно
     растим. На десктопе (2 колонки); на узких экранах управление отдаём Тильде. */
  function initPossCards() {
    var root = document.getElementById('rec667862590');
    if (!root) return;
    var artboard = root.querySelector('.t396__artboard');
    var defs = [
      { box: '1649338097371', title: '1649338097365', body: '1649338097348', row: 0 },
      { box: '1700070397684', title: '1700070397727', body: '1700070397734', row: 0 },
      { box: '1700070437044', title: '1700070437066', body: '1700070437071', row: 1 },
      { box: '1700070437078', title: '1700070437097', body: '1700070437101', row: 1 }
    ];
    function el(id) { return root.querySelector('.tn-elem[data-elem-id="' + id + '"]'); }
    var cards = defs.map(function (d) {
      var box = el(d.box), title = el(d.title), body = el(d.body);
      if (!box || !body) return null;
      return {
        box: box, title: title, body: body, row: d.row, open: false,
        rest: body.querySelector('.poss-rest'), toggle: body.querySelector('.poss-toggle')
      };
    }).filter(Boolean);
    if (cards.length < 4 || !artboard) return; // структура иная — не вмешиваемся

    var GAP = 40, BOTTOMPAD = 64, PAD = 30, MINW = 961;
    var px = function (v) { return parseFloat(v) || 0; };
    var saved = false, applied = false, transitioned = false;

    function save() {
      if (saved) return; saved = true;
      cards.forEach(function (c) {
        c.boxTop0 = px(c.box.style.top);
        c.boxCss0 = c.box.style.cssText;
        c.titleOff = c.title ? (px(c.title.style.top) - c.boxTop0) : 0;
        c.bodyOff = px(c.body.style.top) - c.boxTop0;
        c.titleCss0 = c.title ? c.title.style.cssText : '';
        c.bodyCss0 = c.body.style.cssText;
        c.bodyCollapsedH = c.body.getBoundingClientRect().height; // .poss-rest свёрнут в CSS
      });
      artboard._css0 = artboard.style.cssText;
    }
    function restore() {
      cards.forEach(function (c) {
        c.box.style.cssText = c.boxCss0;
        if (c.title) c.title.style.cssText = c.titleCss0;
        c.body.style.cssText = c.bodyCss0;
      });
      artboard.style.cssText = artboard._css0;
      applied = false; transitioned = false;
    }
    function relayout() {
      if (window.innerWidth < MINW) { if (applied) restore(); return; }
      save(); applied = true;
      // общая минимальная высота свёрнутой карточки = по самой высокой (у всех одинаковая)
      var common = 0;
      cards.forEach(function (c) { common = Math.max(common, c.bodyOff + c.bodyCollapsedH + PAD); });
      cards.forEach(function (c) {
        c._h = (c.open && c.rest) ? (c.bodyOff + c.bodyCollapsedH + c.rest.scrollHeight + PAD) : common;
      });
      var row0bottom = 0;
      cards.forEach(function (c) { if (c.row === 0) { c._top = c.boxTop0; row0bottom = Math.max(row0bottom, c._top + c._h); } });
      var row1top = row0bottom + GAP, row1bottom = 0;
      cards.forEach(function (c) { if (c.row === 1) { c._top = row1top; row1bottom = Math.max(row1bottom, c._top + c._h); } });
      cards.forEach(function (c) {
        c.box.style.top = c._top + 'px';
        c.box.style.height = c._h + 'px';
        if (c.title) c.title.style.top = (c._top + c.titleOff) + 'px';
        c.body.style.top = (c._top + c.bodyOff) + 'px';
      });
      artboard.style.height = (row1bottom + BOTTOMPAD) + 'px';
      if (!transitioned) {
        transitioned = true;
        requestAnimationFrame(function () {
          cards.forEach(function (c) {
            c.box.style.transition = 'top .5s ease, height .5s ease';
            if (c.title) c.title.style.transition = 'top .5s ease';
            c.body.style.transition = 'top .5s ease';
          });
          artboard.style.transition = 'height .5s ease';
        });
      }
    }

    cards.forEach(function (c) {
      if (!c.toggle || !c.rest) return;
      function setText() { c.toggle.innerHTML = c.open ? 'Свернуть&nbsp;⌃' : 'Подробнее&nbsp;⌄'; }
      setText();
      function toggle() {
        c.open = !c.open;
        c.rest.style.maxHeight = c.open ? (c.rest.scrollHeight + 60) + 'px' : '0px';
        c.rest.style.opacity = c.open ? '1' : '0';
        c.rest.style.marginTop = c.open ? '8px' : '0';
        setText();
        relayout();
      }
      c.toggle.addEventListener('click', toggle);
      c.toggle.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
    });

    // первичная раскладка — после того как Тильда спозиционировала zero-блок
    function boot() { relayout(); }
    window.addEventListener('load', boot);
    setTimeout(boot, 500);
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(boot, 160); });
  }

  /* generic: добавить класс блоку, когда он попал в зону видимости */
  function revealOnScroll(blockId, cls, threshold) {
    var block = document.getElementById(blockId);
    if (!block) return;
    function on() { block.classList.add(cls); }
    if (!('IntersectionObserver' in window)) { on(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { on(); io.disconnect(); } });
    }, { threshold: threshold || 0.2 });
    io.observe(block);
  }

  /* --- п.2.1 «Зачем мы Вам?»: инфографика факторов выезжает каскадом --- */
  function initWhy() { revealOnScroll('rec759757656', 'why-in', 0.25); }

  /* --- «При разработке маршрута»: journey-шаги выезжают друг за другом --- */
  function initRoute() {
    var items = document.querySelectorAll('#rec759756010 .t565__item');
    items.forEach(function (it, i) { it.style.transitionDelay = (i * 0.17) + 's'; });
    revealOnScroll('rec759756010', 'route-in', 0.2);
  }

  /* --- п.13.1 «Ваша выгода»: тезисы проявляются каскадом по скроллу --- */
  function initVygoda() { revealOnScroll('rec667936408', 'vygoda-in', 0.2); }

  /* --- п.13.1 «Ваша выгода»: спираль перерисована в SVG + вращение «вихрь» ---
     Рисуем коническую спираль (3D-проекция) сегментами с радужным градиентом по длине;
     каждый кадр сдвигаем фазу витка → спираль медленно вращается вокруг вертикали,
     как тонкий смерч. Передние сегменты ярче/толще — для объёма. */
  function initSpiral() {
    var host = document.querySelector('#rec667936408 .tn-elem[data-elem-id="1700085620243"] .tn-atom');
    if (!host || host.querySelector('.syn-spiral')) return;
    var img = host.querySelector('img');

    var VW = 900, VH = 854, cx = 450;
    var rxTop = 358, rxBot = 150, yTop = 250, yBot = 690, squash = 0.27, turns = 4.5;
    var PHASE0 = -Math.PI / 2, SEG = 150, PERIOD = 16000; // мс на полный оборот

    // радужные стопы (как на исходной картинке): cyan→green→yellow→orange→red→violet→beige
    var stops = [
      [0.00, [74, 215, 224]], [0.17, [108, 194, 74]], [0.35, [255, 216, 77]],
      [0.52, [245, 161, 75]], [0.66, [224, 72, 59]], [0.80, [124, 92, 246]],
      [0.92, [176, 123, 232]], [1.00, [231, 220, 192]]
    ];
    function colorAt(t) {
      for (var i = 1; i < stops.length; i++) {
        if (t <= stops[i][0]) {
          var p = stops[i - 1], q = stops[i], f = (t - p[0]) / ((q[0] - p[0]) || 1);
          return 'rgb(' + Math.round(p[1][0] + (q[1][0] - p[1][0]) * f) + ',' +
                          Math.round(p[1][1] + (q[1][1] - p[1][1]) * f) + ',' +
                          Math.round(p[1][2] + (q[1][2] - p[1][2]) * f) + ')';
        }
      }
      return 'rgb(231,220,192)';
    }
    function pt(t, ph) {
      var th = PHASE0 + ph + t * 2 * Math.PI * turns;
      var rx = rxTop - (rxTop - rxBot) * t;
      var yc = yTop + (yBot - yTop) * t;
      return [cx + rx * Math.cos(th), yc + rx * squash * Math.sin(th), Math.sin(th)];
    }

    var svgns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgns, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + VW + ' ' + VH);
    svg.setAttribute('class', 'syn-spiral');
    svg.setAttribute('aria-hidden', 'true');
    var segs = [];
    for (var i = 0; i < SEG; i++) {
      var p = document.createElementNS(svgns, 'path');
      p.setAttribute('stroke', colorAt((i + 0.5) / SEG));
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke-linecap', 'round');
      svg.appendChild(p);
      segs.push(p);
    }
    host.appendChild(svg);
    if (img) img.style.opacity = '0';

    function render(ph) {
      for (var i = 0; i < SEG; i++) {
        var t0 = i / SEG, t1 = (i + 1) / SEG;
        var a = pt(t0, ph), b = pt(t1, ph);
        var depth = (a[2] + b[2]) / 2;            // [-1..1], 1 = ближе к зрителю
        var k = (depth + 1) / 2;
        var seg = segs[i];
        seg.setAttribute('d', 'M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + 'L' + b[0].toFixed(1) + ' ' + b[1].toFixed(1));
        seg.setAttribute('stroke-width', (9 + 6 * k).toFixed(1));
        seg.setAttribute('opacity', (0.45 + 0.55 * k).toFixed(2));
      }
    }

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { render(0); return; }
    var start = null;
    function frame(ts) {
      if (start == null) start = ts;
      render(((ts - start) / PERIOD) * 2 * Math.PI);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* --- п.1/4/7/8/10 «Соцсети в разделах»: клонируем готовый ряд ссылок из
     блока «Контакты» (единый источник URL) в перечисленные разделы. --- */
  function initSocialLinks() {
    var source = document.querySelector('#rec667892274 .t-sociallinks__wrapper');
    if (!source) return;
    // Заголовок, Форматы, Фильм, Отзывы, Конструктор туров
    var targets = ['rec667637152', 'rec667905600', 'rec667890117', 'rec667892990', 'rec759791049'];
    targets.forEach(function (id) {
      var block = document.getElementById(id);
      if (!block || block.querySelector('.syn-soc')) return; // не дублируем
      var box = document.createElement('div');
      box.className = 'syn-soc';
      var ul = source.cloneNode(true);
      // выкидываем текстовые узлы (&nbsp; между <li>) — иначе ломают flex-отступы
      Array.prototype.slice.call(ul.childNodes).forEach(function (n) {
        if (n.nodeType !== 1) ul.removeChild(n);
      });
      ul.setAttribute('aria-label', 'Мы в соцсетях');
      box.appendChild(ul);
      block.appendChild(box);
    });
  }

  /* --- п.4 «Форматы»: одинаковая высота карточек в свёрнутом виде ---
     Заголовки форматов разной длины (1–2 строки) → выравниваем серую плашку
     по самой высокой. При раскрытии карточка растёт сверх min-height. */
  function equalizeFormats() {
    var wraps = document.querySelectorAll('#rec667905600 .t688__textwrapper');
    if (!wraps.length) return;
    wraps.forEach(function (w) { w.style.minHeight = ''; });
    if (window.innerWidth < 961) return; // на узких — колонкой, выравнивать не нужно
    var max = 0;
    wraps.forEach(function (w) { max = Math.max(max, w.getBoundingClientRect().height); });
    wraps.forEach(function (w) { w.style.minHeight = max + 'px'; });
  }

  /* --- Конструктор: заменяем ✅ в плане путешествия на голубые иконки-галочки --- */
  function initChecks() {
    var atom = document.querySelector('#rec759791049 .tn-elem[data-elem-id="1717877104636"] .tn-atom');
    if (!atom || atom.getAttribute('data-syn-checks')) return;
    if (atom.innerHTML.indexOf('✅') === -1) return;
    atom.setAttribute('data-syn-checks', '1');
    atom.innerHTML = atom.innerHTML.replace(/✅\s?/g, '<span class="syn-check" aria-hidden="true"></span>');
  }

  /* --- п.8.1 «Отзывы»: собственный контроллер слайдера t670 ---
     Tilda-слайдер в офлайн-выгрузке не листает. Перехватываем управление:
     снимаем её обработчики со стрелок/точек (клонированием) и сами двигаем ленту.
     Сдвиг считаем в offsetWidth (layout-пиксели) — он не зависит от CSS transform,
     поэтому можно безопасно уменьшить блок масштабом. */
  function initReviewsSlider() {
    var root = document.getElementById('rec667892990');
    if (!root || root.getAttribute('data-syn-slider')) return;
    var wrap = document.getElementById('carousel_667892990');
    if (!wrap) return;
    var items = Array.prototype.filter.call(wrap.children, function (n) {
      return n.classList && n.classList.contains('t-slds__item');
    });
    if (items.length < 4) return; // [клон, 1, 2, 3, клон]
    root.setAttribute('data-syn-slider', '1');
    var REAL = 3, cur = 0;
    function W() { return items[1].offsetWidth; }
    function strip(node) { if (!node) return null; var c = node.cloneNode(true); node.parentNode.replaceChild(c, node); return c; }
    var bullets = Array.prototype.slice.call(root.querySelectorAll('.t-slds__bullet'));
    function go(n, anim) {
      cur = ((n % REAL) + REAL) % REAL;
      wrap.style.transition = anim === false ? 'none' : 'transform .45s ease';
      wrap.style.transform = 'translateX(-' + ((cur + 1) * W()) + 'px)';
      bullets.forEach(function (b, i) {
        var on = (i === cur);
        b.classList.toggle('t-slds__bullet_active', on);
        var btn = b.querySelector('button'); if (btn) btn.setAttribute('aria-current', on ? 'true' : 'false');
      });
      items.forEach(function (it) { it.setAttribute('aria-hidden', 'true'); });
      if (items[cur + 1]) items[cur + 1].setAttribute('aria-hidden', 'false');
    }
    var left = strip(root.querySelector('.t-slds__arrow-left'));
    var right = strip(root.querySelector('.t-slds__arrow-right'));
    if (left) left.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); go(cur - 1); });
    if (right) right.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); go(cur + 1); });
    bullets = bullets.map(function (b) { return strip(b); });
    bullets.forEach(function (b, i) { b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); go(i); }); });
    go(0, false);
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { go(cur, false); }, 150); });
  }
  // запускаем поздно — после инициализации Tilda, чтобы перехватить управление
  window.addEventListener('load', function () { setTimeout(initReviewsSlider, 300); });
  setTimeout(initReviewsSlider, 1200);

  ready(initFormats);
  ready(initRTB);
  ready(initPossCards);
  ready(initWhy);
  ready(initRoute);
  ready(initVygoda);
  ready(initSpiral);
  ready(initSocialLinks);
  ready(initChecks);
  ready(equalizeFormats);
  window.addEventListener('load', equalizeFormats);
  setTimeout(equalizeFormats, 900);
  // пересчёт после подгрузки веб-шрифтов (иначе высоту меряем до переноса заголовка на 2 строки)
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(equalizeFormats); }
  var _eft;
  window.addEventListener('resize', function () { clearTimeout(_eft); _eft = setTimeout(equalizeFormats, 160); });
})();

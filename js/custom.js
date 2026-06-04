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

  /* --- п.3.1 «Наши возможности»: галочки выезжают из краткого объяснения --- */
  function initPossibilities() {
    var toggles = document.querySelectorAll('#rec667862590 .poss-toggle');
    toggles.forEach(function (tg) {
      var rest = tg.nextElementSibling;
      if (!rest || !rest.classList.contains('poss-rest')) return;
      var open = false;
      function set() {
        rest.style.maxHeight = open ? (rest.scrollHeight + 60) + 'px' : '0px';
        rest.style.opacity = open ? '1' : '0';
        rest.style.marginTop = open ? '8px' : '0';
        tg.innerHTML = open ? 'Свернуть&nbsp;⌃' : 'Подробнее&nbsp;⌄';
      }
      set();
      function toggle() { open = !open; set(); }
      tg.addEventListener('click', toggle);
      tg.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
    });
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

  ready(initFormats);
  ready(initRTB);
  ready(initPossibilities);
  ready(initWhy);
  ready(initRoute);
  ready(initVygoda);
  ready(initSpiral);
  ready(initSocialLinks);
})();

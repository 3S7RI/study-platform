/* fx.js — تأثيرات وجماليات المنصة. سكريبت عادي بدون مكتبات، مفيش تغيير في منطق الصفحات.
 * للإيقاف السريع: افتح Console واكتب localStorage.fx_off=1 (والتشغيل: localStorage.removeItem('fx_off')).
 * للإلغاء الكامل: امسح سطري fx.css و fx.js من الصفحات، أو شغّل revert-fx.sh. */
(function () {
  'use strict';
  try { if (localStorage.getItem('fx_off') === '1' || window.FX_OFF) return; } catch (e) {}
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches;
  var COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#818cf8'];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  /* ---------- كونفيتي ---------- */
  function confetti(n) {
    if (reduce) return;
    var cv = document.getElementById('fx-confetti');
    if (!cv) { cv = document.createElement('canvas'); cv.id = 'fx-confetti'; document.body.appendChild(cv); }
    var d = window.devicePixelRatio || 1, w = innerWidth, h = innerHeight;
    cv.width = w * d; cv.height = h * d;
    var g = cv.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0);
    var P = [], total = n || 110;
    for (var i = 0; i < total; i++) {
      var a = -Math.PI / 2 + (Math.random() - .5) * 1.9, v = 8 + Math.random() * 11;
      P.push({ x: w / 2, y: h * .62, vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: 5 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: COLORS[i % COLORS.length] });
    }
    var t0 = performance.now();
    (function loop(t) {
      var dt = t - t0; g.clearRect(0, 0, w, h); var alive = false;
      P.forEach(function (p) {
        p.vy += .28; p.vx *= .992; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        var life = Math.max(0, 1 - dt / 2800);
        if (life > 0 && p.y < h + 30) { alive = true; g.save(); g.globalAlpha = life; g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * .6); g.restore(); }
      });
      if (alive) requestAnimationFrame(loop); else cv.remove();
    })(t0);
  }

  function banner(text) {
    var b = document.createElement('div'); b.className = 'fx-lvl'; b.textContent = text; document.body.appendChild(b);
    requestAnimationFrame(function () { requestAnimationFrame(function () { b.classList.add('in'); }); });
    setTimeout(function () { b.classList.remove('in'); setTimeout(function () { b.remove(); }, 700); }, 3200);
  }

  /* ---------- عدّاد أرقام ---------- */
  function countUp(el) {
    if (reduce || el.dataset.fxDone) return;
    var node = null;
    for (var i = 0; i < el.childNodes.length; i++) { if (el.childNodes[i].nodeType === 3 && /\d/.test(el.childNodes[i].nodeValue)) { node = el.childNodes[i]; break; } }
    if (!node) return;
    var raw = node.nodeValue, num = parseInt(raw.replace(/[^\d]/g, ''), 10);
    if (!num || num < 1) return;
    el.dataset.fxDone = '1';
    var t0 = null, fmt = /,/.test(raw);
    (function step(t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / 1300), v = Math.round(num * (1 - Math.pow(1 - p, 3)));
      node.nodeValue = fmt ? v.toLocaleString('en-US') : String(v);
      if (p < 1) requestAnimationFrame(step); else node.nodeValue = raw;
    })(performance.now());
  }

  /* ---------- ريبل الأزرار (تفويض أحداث، يغطي أي زر حتى لو اتعمل بعدين) ---------- */
  document.addEventListener('pointerdown', function (e) {
    if (reduce) return;
    var b = e.target.closest && e.target.closest('button, .card-btn, a.btn, .btn');
    if (!b || b.disabled || b.dataset.fxNoRip != null) return;
    if (getComputedStyle(b).position === 'static') b.style.position = 'relative';
    b.classList.add('fx-rip');
    var r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2, i = document.createElement('i');
    i.className = 'fx-wave'; i.style.cssText = 'width:' + d + 'px;height:' + d + 'px;left:' + (e.clientX - r.left - d / 2) + 'px;top:' + (e.clientY - r.top - d / 2) + 'px';
    b.appendChild(i); i.addEventListener('animationend', function () { i.remove(); });
  }, { passive: true });

  /* ---------- نبضة اختيار الإجابة ---------- */
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (!t || t.tagName !== 'INPUT' || (t.type !== 'radio' && t.type !== 'checkbox')) return;
    var box = t.closest('label, .option, .opt, .choice, li');
    if (!box) return;
    box.classList.remove('fx-pulse'); void box.offsetWidth; box.classList.add('fx-pulse');
  });

  /* ---------- ميل البطاقات ---------- */
  function tilt(el, max) {
    if (!finePointer || reduce || el.dataset.fxTilt) return;
    el.dataset.fxTilt = '1'; el.classList.add('fx-tilt');
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      el.style.transform = 'perspective(800px) rotateY(' + (-x * max) + 'deg) rotateX(' + (y * max) + 'deg)';
    });
    el.addEventListener('pointerleave', function () { el.style.transform = ''; });
  }

  /* ---------- دخول متتابع ---------- */
  function stagger(list) { list.forEach(function (el, i) { if (el.classList.contains('fx-in')) return; el.style.setProperty('--fx-i', i); el.classList.add('fx-in'); }); }

  /* ---------- شعلة الاستريك ---------- */
  function flames(root) { $$('svg[style*="f97316"]', root).forEach(function (s) { s.classList.add('fx-flame'); }); }

  /* ---------- لوحة المتصدرين ---------- */
  function watchBoard() {
    var body = document.getElementById('lbBody');
    if (!body) return;
    if (/تحميل/.test(body.textContent)) body.innerHTML = '<div class="fx-sk"><div class="l"></div><div class="l"></div><div class="l"></div></div>';
    new MutationObserver(function () {
      var items = $$('.pd, .lb-row', body).filter(function (x) { return x.style.visibility !== 'hidden'; });
      stagger(items); flames(body);
      $$('.pd-pts', body).forEach(countUp);
    }).observe(body, { childList: true });
  }

  /* ---------- نتيجة الامتحان + رسائل المبروك ---------- */
  function watchResults() {
    var res = document.getElementById('gradingResultState'), ok = document.getElementById('successSvgContainer');
    if (res && ok) {
      new MutationObserver(function () {
        if (res.style.display !== 'block' || res.dataset.fxShown) return;
        res.dataset.fxShown = '1';
        setTimeout(function () {
          if (ok.style.display === 'block') confetti(/\(100%\)/.test(res.textContent) ? 220 : 110);
        }, 120);
      }).observe(res, { attributes: true, attributeFilter: ['style'] });
    }
    var tm = document.getElementById('toastMessage');
    if (tm) new MutationObserver(function () { if (/مبروك/.test(tm.textContent)) confetti(150); }).observe(tm, { childList: true, characterData: true, subtree: true });
  }

  /* ---------- مستوى جديد ---------- */
  function checkLevelUp() {
    try {
      var PS = window.PS; if (!PS || !PS.getStudent || !PS.rank) return;
      var s = PS.getStudent(); if (!s) return;
      var email = String(s.email || (PS.email && PS.email()) || '').toLowerCase(); if (!email) return;
      var lv = PS.rank(Math.max(Number(s.totalScore) || 0, Number(s.points) || 0)).level;
      var key = 'fx_lv_' + email, prev = parseInt(localStorage.getItem(key), 10);
      if (!isNaN(prev) && lv > prev) { confetti(160); banner('مبروك! وصلت مستوى Lv.' + lv); }
      if (isNaN(prev) || lv > prev) localStorage.setItem(key, String(lv));
    } catch (e) {}
  }

  /* ---------- خلفية حية (الدخول والترحيب فقط) ---------- */
  function ambient() {
    if (reduce || !/\/(login|welcome)(\.html)?\/?$/.test(location.pathname)) return;
    var cv = document.createElement('canvas'); cv.id = 'fx-ambient'; document.body.insertBefore(cv, document.body.firstChild);
    var g = cv.getContext('2d'), w = 0, h = 0, P = [], raf = 0, vis = !document.hidden;
    function size() { var d = Math.min(window.devicePixelRatio || 1, 2); w = innerWidth; h = innerHeight; cv.width = w * d; cv.height = h * d; g.setTransform(d, 0, 0, d, 0, 0);
      P = []; var n = w < 600 ? 28 : 48; for (var i = 0; i < n; i++) P.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, c: i % 3 }); }
    size(); addEventListener('resize', size);
    var cols = ['#818cf8', '#ec4899', '#10b981'];
    function loop() {
      if (!vis) return; g.clearRect(0, 0, w, h);
      P.forEach(function (p, i) {
        p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > w) p.vx *= -1; if (p.y < 0 || p.y > h) p.vy *= -1;
        g.globalAlpha = .8; g.fillStyle = cols[p.c]; g.beginPath(); g.arc(p.x, p.y, 1.9, 0, 6.3); g.fill();
        for (var j = i + 1; j < P.length; j++) { var q = P[j], dx = p.x - q.x, dy = p.y - q.y, dd = dx * dx + dy * dy;
          if (dd < 9000) { g.globalAlpha = (1 - dd / 9000) * .3; g.strokeStyle = cols[p.c]; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke(); } }
      });
      raf = requestAnimationFrame(loop);
    }
    document.addEventListener('visibilitychange', function () { vis = !document.hidden; cancelAnimationFrame(raf); if (vis) loop(); });
    loop();
  }

  ready(function () {
    var cards = $$('.card[style*="--accent"]');
    stagger(cards); cards.forEach(function (c) { tilt(c, 6); });
    var pc = document.getElementById('profileCardMain'); if (pc) tilt(pc, 3);
    $$('[data-fx-count]').forEach(countUp);
    $$('.tier').forEach(function (t, i) { t.style.setProperty('--fx-i', i); t.classList.add('fx-in'); });
    flames(document); watchBoard(); watchResults(); ambient();
    setTimeout(checkLevelUp, 2500);
  });

  window.FX = { confetti: confetti, banner: banner, countUp: countUp };
})();

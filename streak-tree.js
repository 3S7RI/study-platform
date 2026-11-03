/* streak-tree.js — شجرة الاستريك
 * كل يوم استريك = ورقة جديدة، وعند 365 يوم تكتمل الشجرة (أزهار + ثمار ذهبية + هالة).
 * بعد 365 الاستريك يكمل ولا يتصفّر: الشجرة تفضل مكتملة وكل يوم بتزيد ثمرة ذهبية (لحد 100) ورقم السنة.
 * الشجرة بتتهز بالهواء (حركة خفيفة CSS). الرسم SVG مولّد مرة واحدة بنفس الشكل لكل الطلاب.
 *
 * الاستخدام:  const info = StreakTree.mount(element, days);   // info = { title, desc }
 *            StreakTree.touchCompat(db, email)                // +1 استريك يومي (نسخة firebase compat للشات)
 */
(function (global) {
    'use strict';
    var MAX = 365;
    var W = 300, H = 330, GROUND = 300, CX = 150;

    function mulberry32(a) {
        return function () {
            a |= 0; a = a + 0x6D2B79F5 | 0;
            var t = Math.imul(a ^ a >>> 15, 1 | a);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }
    function f(n) { return Math.round(n * 10) / 10; }

    /* ---------------- بناء هندسة الشجرة (مرة واحدة) ---------------- */
    var GEO = null;
    function build() {
        var rnd = mulberry32(3650);
        var branches = [];
        var MAXD = 4;

        function mk(parent, x, y, ang, len, w, depth) {
            var b = { id: branches.length, parent: parent, x1: x, y1: y, depth: depth, w: w, len: len, children: [], leaves: [], appear: Infinity };
            var a2 = ang + (rnd() - 0.5) * 0.3;
            b.ang = a2;
            b.x2 = x + Math.sin(a2) * len;
            b.y2 = y - Math.cos(a2) * len;
            var off = (rnd() - 0.5) * len * 0.3;
            b.cx = (x + b.x2) / 2 + Math.cos(a2) * off;
            b.cy = (y + b.y2) / 2 + Math.sin(a2) * off;
            branches.push(b);
            if (parent) parent.children.push(b);
            return b;
        }
        function pt(b, t) {
            var u = 1 - t;
            return {
                x: u * u * b.x1 + 2 * u * t * b.cx + t * t * b.x2,
                y: u * u * b.y1 + 2 * u * t * b.cy + t * t * b.y2,
                a: Math.atan2(2 * u * (b.cy - b.y1) + 2 * t * (b.y2 - b.cy), 2 * u * (b.cx - b.x1) + 2 * t * (b.x2 - b.cx))
            };
        }
        function grow(b) {
            if (b.depth >= MAXD) return;
            var n = b.depth === 0 ? 3 : 2 + (rnd() < 0.45 ? 1 : 0);
            var spread = b.depth === 0 ? 0.85 : 0.7;
            var end = pt(b, 1);
            for (var i = 0; i < n; i++) {
                var ang = b.ang + (i - (n - 1) / 2) * spread + (rnd() - 0.5) * 0.25;
                var c = mk(b, end.x, end.y, ang, b.len * (0.7 + rnd() * 0.08), b.w * 0.62, b.depth + 1);
                grow(c);
            }
            if (b.depth >= 1) {
                var m = pt(b, 0.5 + rnd() * 0.15);
                var side = rnd() < 0.5 ? -1 : 1;
                var c2 = mk(b, m.x, m.y, b.ang + side * (0.9 + rnd() * 0.3), b.len * 0.62, b.w * 0.55, b.depth + 1);
                grow(c2);
            }
        }
        var trunk = mk(null, CX, GROUND, 0, 82, 15, 0);
        grow(trunk);

        // توزيع 365 ورقة على الفروع (من العمق 2 وطالع)، الأعمق أكتر أوراق
        var targets = branches.filter(function (b) { return b.depth >= 2; });
        var wts = targets.map(function (b) { return b.depth === 2 ? 2 : b.depth === 3 ? 3.5 : 5.5; });
        var sum = wts.reduce(function (a, c) { return a + c; }, 0);
        var counts = wts.map(function (w) { return Math.floor(w / sum * MAX); });
        var left = MAX - counts.reduce(function (a, c) { return a + c; }, 0);
        for (var i = 0; left > 0; i = (i + 1) % counts.length, left--) counts[i]++;

        var leaves = [];
        targets.forEach(function (b, bi) {
            for (var j = 0; j < counts[bi]; j++) {
                var t = j === 0 ? 1 : 0.3 + rnd() * 0.72;
                var p = pt(b, Math.min(t, 1));
                var side = rnd() < 0.5 ? -1 : 1;
                var d = t > 1 ? 0 : (1.5 + rnd() * 3.5) * side;
                var px = p.x + Math.cos(p.a + Math.PI / 2) * d;
                var py = p.y + Math.sin(p.a + Math.PI / 2) * d;
                var rot = (j === 0 ? p.a : p.a + side * (0.35 + rnd() * 1.0)) * 180 / Math.PI;
                leaves.push({
                    b: b, x: f(px), y: f(py), rot: f(rot),
                    s: f(0.95 + rnd() * 0.45), c: Math.floor(rnd() * 5),
                    key: b.depth * 10 + rnd() * 14, k: 0
                });
            }
        });
        leaves.sort(function (a, c) { return a.key - c.key; });
        leaves.forEach(function (l, i) { l.k = i; l.b.leaves.push(l); });

        // ظهور الفرع = أول ورقة في الفرع أو أولاده
        (function calc(b) {
            var m = Infinity;
            b.leaves.forEach(function (l) { if (l.k < m) m = l.k; });
            b.children.forEach(function (c) { var v = calc(c); if (v < m) m = v; });
            b.appear = b.depth === 0 ? -1 : m;
            return m;
        })(trunk);

        // أزهار (45) وثمار (100) على مواضع أوراق ثابتة
        var blossoms = [], fruits = [];
        for (var q = 0; q < 45; q++) {
            var L = leaves[Math.floor(rnd() * MAX)];
            blossoms.push({ x: f(L.x + (rnd() - 0.5) * 5), y: f(L.y + (rnd() - 0.5) * 5), k: L.k, r: Math.floor(rnd() * 72) });
        }
        for (var q2 = 0; q2 < 100; q2++) {
            var L2 = leaves[Math.floor(rnd() * MAX)];
            fruits.push({ x: f(L2.x + (rnd() - 0.5) * 6), y: f(L2.y + 2 + rnd() * 4) });
        }
        // نجوم لمعان حوالين التاج
        var sparks = [];
        for (var q3 = 0; q3 < 9; q3++) {
            var a = rnd() * Math.PI * 2, r = 95 + rnd() * 40;
            sparks.push({ x: f(CX + Math.cos(a) * r), y: f(165 + Math.sin(a) * r * 0.78), d: f(rnd() * 3), s: f(0.6 + rnd() * 0.7) });
        }
        return { branches: branches, leaves: leaves, blossoms: blossoms, fruits: fruits, sparks: sparks, trunk: trunk };
    }

    /* ---------------- CSS (مرة واحدة) ---------------- */
    function injectCss() {
        if (document.getElementById('st-css')) return;
        var st = document.createElement('style');
        st.id = 'st-css';
        st.textContent =
            '.st-wrap{width:100%;display:flex;flex-direction:column;align-items:center;gap:6px}' +
            '.st-svg{width:100%;max-width:330px;height:auto;display:block;border-radius:14px;overflow:hidden;--st-s1:#0a1030;--st-s2:#233a73;--st-gr1:#1f6f3a;--st-gr2:#0f3d22}' +
            '[data-theme="light"] .st-svg{--st-s1:#7cc8ff;--st-s2:#e8f7ff;--st-gr1:#4cb35c;--st-gr2:#2e8a43}' +
            '.st-sun{display:none}[data-theme="light"] .st-sun{display:inline}[data-theme="light"] .st-night{display:none}' +
            '.st-sw{animation:stSway var(--d,5s) ease-in-out var(--dl,0s) infinite alternate}' +
            '@keyframes stSway{0%{transform:rotate(calc(var(--a,1deg) * -1))}100%{transform:rotate(var(--a,1deg))}}' +
            '.st-grow{transition:transform 1s ease}' +
            '.st-new{transform-origin:0 0;animation:stPop 1.1s ease-out both}' +
            '@keyframes stPop{0%{transform:scale(0)}55%{transform:scale(1.9)}100%{transform:scale(1)}}' +
            '.st-ring{animation:stRing 2s ease-out infinite;transform-origin:0 0}' +
            '@keyframes stRing{0%{transform:scale(.3);opacity:.9}100%{transform:scale(2.6);opacity:0}}' +
            '.st-wind{stroke-dasharray:60 400;animation:stWind var(--d,6s) linear var(--dl,0s) infinite}' +
            '@keyframes stWind{0%{stroke-dashoffset:60;opacity:0}15%{opacity:.5}85%{opacity:.5}100%{stroke-dashoffset:-460;opacity:0}}' +
            '.st-drift{animation:stDrift var(--d,9s) linear var(--dl,0s) infinite}' +
            '@keyframes stDrift{0%{transform:translate(-20px,0) rotate(0deg);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translate(340px,70px) rotate(540deg);opacity:0}}' +
            '.st-aura{animation:stAura 3.5s ease-in-out infinite alternate}' +
            '@keyframes stAura{0%{opacity:.45}100%{opacity:1}}' +
            '.st-spark{animation:stSpark 2.2s ease-in-out var(--dl,0s) infinite;transform-origin:0 0}' +
            '@keyframes stSpark{0%,100%{transform:scale(.2);opacity:.2}50%{transform:scale(1);opacity:1}}' +
            '.st-bar{width:100%;max-width:330px;height:9px;border-radius:6px;background:rgba(127,127,127,.25);overflow:hidden}' +
            '.st-bar i{display:block;height:100%;border-radius:6px;background:linear-gradient(90deg,#4ade80,#facc15);transition:width 1s ease}' +
            '.st-cap{font-size:.72rem;font-weight:700;text-align:center;line-height:1.7}' +
            '@media (prefers-reduced-motion:reduce){.st-svg *{animation:none!important}}';
        document.head.appendChild(st);
    }

    /* ---------------- الرسم ---------------- */
    var GREENS = ['#2b8a3e', '#37b24d', '#40c057', '#69db7c', '#8ce99a'];

    function leafUse(l, cls) {
        return '<g transform="translate(' + l.x + ' ' + l.y + ') rotate(' + l.rot + ') scale(' + l.s + ')"><use href="#stLeaf" class="' + (cls || '') + '" fill="' + GREENS[l.c] + '"/></g>';
    }

    function branchSvg(b, days) {
        if (b.appear >= days) return '';
        var inner = '';
        var barkDark = b.depth <= 1 ? '#5b3a1e' : '#6b4a2b';
        inner += '<path d="M' + f(b.x1) + ' ' + f(b.y1) + ' Q' + f(b.cx) + ' ' + f(b.cy) + ' ' + f(b.x2) + ' ' + f(b.y2) + '" fill="none" stroke="' + barkDark + '" stroke-width="' + f(b.w) + '" stroke-linecap="round"/>';
        if (b.depth === 0) {
            inner += '<path d="M' + f(b.x1 - 2) + ' ' + f(b.y1) + ' Q' + f(b.cx - 2) + ' ' + f(b.cy) + ' ' + f(b.x2 - 1.5) + ' ' + f(b.y2) + '" fill="none" stroke="#8a5a32" stroke-width="3" stroke-linecap="round" opacity=".7"/>';
        }
        var newest = days - 1;
        for (var i = 0; i < b.leaves.length; i++) {
            var l = b.leaves[i];
            if (l.k >= days) continue;
            inner += l.k === newest
                ? '<g transform="translate(' + l.x + ' ' + l.y + ')"><circle r="5" fill="none" stroke="#fde047" stroke-width="1.2" class="st-ring"/></g>' + leafUse(l, 'st-new')
                : leafUse(l);
        }
        for (var j = 0; j < b.children.length; j++) inner += branchSvg(b.children[j], days);
        if (b.depth === 1 || b.depth === 2) {
            var amp = b.depth === 1 ? 1.6 : 2.6;
            var dur = (4 + ((b.id * 37) % 30) / 10).toFixed(1);
            var dl = -(((b.id * 53) % 40) / 10).toFixed(1);
            return '<g class="st-sw" style="transform-origin:' + f(b.x1) + 'px ' + f(b.y1) + 'px;--a:' + amp + 'deg;--d:' + dur + 's;--dl:' + dl + 's">' + inner + '</g>';
        }
        return '<g>' + inner + '</g>';
    }

    function sapling() {
        return '<g class="st-sw" style="transform-origin:150px 300px;--a:3deg;--d:3.6s">' +
            '<path d="M150 300 Q147 288 150 276" fill="none" stroke="#6b4a2b" stroke-width="3" stroke-linecap="round"/>' +
            '<g transform="translate(150 277) rotate(-40) scale(1.1)"><use href="#stLeaf" fill="#69db7c"/></g>' +
            '<g transform="translate(150 280) rotate(-140) scale(1)"><use href="#stLeaf" fill="#40c057"/></g></g>';
    }

    function defs() {
        return '<defs>' +
            '<linearGradient id="stSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--st-s1)"/><stop offset="1" style="stop-color:var(--st-s2)"/></linearGradient>' +
            '<linearGradient id="stGround" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--st-gr1)"/><stop offset="1" style="stop-color:var(--st-gr2)"/></linearGradient>' +
            '<radialGradient id="stAuraG"><stop offset="0" stop-color="#fde047" stop-opacity=".5"/><stop offset=".6" stop-color="#fbbf24" stop-opacity=".18"/><stop offset="1" stop-color="#fbbf24" stop-opacity="0"/></radialGradient>' +
            '<radialGradient id="stFruitG" cx=".35" cy=".3"><stop offset="0" stop-color="#fff7ae"/><stop offset=".55" stop-color="#facc15"/><stop offset="1" stop-color="#d97706"/></radialGradient>' +
            '<g id="stLeaf"><path d="M0 0C2-4.2 8-4.6 12 0C8 4.6 2 4.2 0 0Z"/><path d="M1 0L10 0" stroke="rgba(0,0,0,.28)" stroke-width=".6" fill="none"/></g>' +
            '<g id="stBlossom"><circle cx="0" cy="-2.3" r="1.9"/><circle cx="2.2" cy="-.7" r="1.9"/><circle cx="1.4" cy="1.9" r="1.9"/><circle cx="-1.4" cy="1.9" r="1.9"/><circle cx="-2.2" cy="-.7" r="1.9"/><circle r="1.1" fill="#f59e0b"/></g>' +
            '<path id="stStar" d="M0-5L1.2-1.2L5 0L1.2 1.2L0 5L-1.2 1.2L-5 0L-1.2-1.2Z"/>' +
            '</defs>';
    }

    function background(days) {
        var s = '<rect width="' + W + '" height="' + H + '" fill="url(#stSky)"/>';
        // ليل: نجوم وقمر | نهار: شمس
        s += '<g class="st-night" fill="#fff"><circle cx="30" cy="30" r="1.1"/><circle cx="80" cy="55" r="1"/><circle cx="120" cy="22" r="1.3"/><circle cx="205" cy="40" r="1"/><circle cx="250" cy="70" r="1.2"/><circle cx="270" cy="25" r="1"/><circle cx="55" cy="110" r="0.9"/><circle cx="235" cy="120" r="0.9"/>' +
            '<circle cx="245" cy="45" r="14" fill="#fef9c3" opacity=".95"/><circle cx="251" cy="41" r="12" style="fill:var(--st-s1)"/></g>';
        s += '<g class="st-sun"><circle cx="248" cy="48" r="20" fill="#fde68a" opacity=".55"/><circle cx="248" cy="48" r="13" fill="#fbbf24"/></g>';
        if (days >= MAX) s += '<circle class="st-aura" cx="150" cy="170" r="140" fill="url(#stAuraG)"/>';
        // الأرض
        s += '<ellipse cx="150" cy="318" rx="190" ry="40" fill="url(#stGround)"/>';
        s += '<path d="M60 304q3-9 6 0M72 306q2-7 5 0M230 305q3-9 6 0M245 307q2-7 5 0M120 309q2-6 4 0M190 309q2-6 4 0" fill="none" stroke="#2f9e44" stroke-width="1.4" stroke-linecap="round"/>';
        return s;
    }

    function weather() {
        // خطوط رياح وأوراق سايبة بتتطاير
        var s = '';
        var ys = [70, 118, 170];
        for (var i = 0; i < ys.length; i++) {
            s += '<path class="st-wind" d="M-30 ' + ys[i] + 'c40-12 70 12 110 0s70-10 110 2" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round" style="--d:' + (5.5 + i * 1.3) + 's;--dl:-' + (i * 1.7) + 's"/>';
        }
        for (var j = 0; j < 3; j++) {
            s += '<g transform="translate(0 ' + (95 + j * 48) + ')"><g class="st-drift" style="--d:' + (8 + j * 2.5) + 's;--dl:-' + (j * 3.1) + 's;transform-origin:0 0"><use href="#stLeaf" fill="' + GREENS[(j * 2) % 5] + '" transform="scale(.7)"/></g></g>';
        }
        return s;
    }

    function finale(days) {
        var s = '';
        // أزهار: من يوم 120 لحد 365
        var nb = Math.max(0, Math.min(45, Math.floor((days - 120) / (MAX - 120) * 45) + (days >= MAX ? 1 : 0)));
        var bs = '';
        for (var i = 0; i < GEO.blossoms.length && i < nb; i++) {
            var b = GEO.blossoms[i];
            if (b.k >= days) continue;
            bs += '<g transform="translate(' + b.x + ' ' + b.y + ') rotate(' + b.r + ')"><use href="#stBlossom" fill="#fbcfe8"/></g>';
        }
        s += bs;
        // ثمار ذهبية: 12 عند 365 ثم ثمرة كل يوم لحد 100
        if (days >= MAX) {
            var nf = Math.min(100, 12 + (days - MAX));
            for (var k = 0; k < nf; k++) {
                var fr = GEO.fruits[k];
                s += '<g transform="translate(' + fr.x + ' ' + fr.y + ')"><circle r="3.1" fill="url(#stFruitG)"/><circle cx="-1" cy="-1.1" r=".8" fill="#fff" opacity=".85"/></g>';
            }
            for (var m = 0; m < GEO.sparks.length; m++) {
                var sp = GEO.sparks[m];
                s += '<g transform="translate(' + sp.x + ' ' + sp.y + ') scale(' + sp.s + ')"><use href="#stStar" class="st-spark" fill="#fff7ae" style="--dl:-' + sp.d + 's"/></g>';
            }
        }
        return s;
    }

    function stage(days) {
        if (days <= 0) return { title: 'بذرة جاهزة تنتظر أول يوم 🌱', desc: 'ادخل المنصة النهاردة وهتطلع أول ورقة في شجرتك' };
        if (days < 7) return { title: 'نبتة صغيرة بتكبر 🌿', desc: 'أول أوراقك طلعت، كمّل كل يوم' };
        if (days < 30) return { title: 'شتلة قوية 🌱', desc: 'فروعك بدأت تتفرع وتتزين بالأوراق' };
        if (days < 100) return { title: 'شجرة صغيرة نشيطة 🌳', desc: 'جذعك بقى ثابت وأوراقك كتير' };
        if (days < 200) return { title: 'شجرة يانعة 🌳', desc: 'التاج بدأ يكبر ويتملي بالخضرة' };
        if (days < 300) return { title: 'شجرة مزهرة 🌸', desc: 'الأزهار بدأت تظهر بين الأوراق' };
        if (days < MAX) return { title: 'شجرة عملاقة قربت تكتمل ✨', desc: 'قربت جداً من الشكل النهائي' };
        var y = Math.floor(days / MAX);
        return { title: 'شجرة مكتملة 🏆' + (y >= 2 ? ' • السنة ' + (y + 1) : ''), desc: 'اكتملت شجرتك! والاستريك بيكمّل معاك طول العمر' };
    }

    function mount(el, days) {
        if (!el) return stage(days);
        injectCss();
        if (!GEO) GEO = build();
        days = Math.max(0, Math.floor(Number(days) || 0));
        var shown = Math.min(days, MAX);
        var scale = days <= 0 ? 1 : 0.52 + 0.30 * Math.pow(shown / MAX, 0.55);
        var body = days <= 0 ? sapling() : branchSvg(GEO.trunk, shown) + finale(days);
        var svg = '<svg class="st-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMax meet" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="شجرة الاستريك: ' + days + ' يوم">' +
            defs() + background(days) +
            '<g class="st-grow" style="transform-origin:150px 300px;transform:scale(' + f(scale) + ')">' +
            '<g class="st-sw" style="transform-origin:150px 300px;--a:.7deg;--d:6.5s">' + body + '</g></g>' +
            weather() + '</svg>';
        var info = stage(days);
        var pct = Math.min(100, Math.round(shown / MAX * 100));
        var cap = days >= MAX
            ? '🏆 ' + Math.floor(days / MAX) + (Math.floor(days / MAX) === 1 ? ' سنة' : ' سنة') + ' كاملة • ' + days + ' يوم' + (days < MAX + 100 ? ' • ثمار ذهبية: ' + Math.min(100, 12 + (days - MAX)) : '')
            : 'ورقة ' + shown + ' من ' + MAX + ' • باقي ' + (MAX - shown) + ' يوم على اكتمال الشجرة';
        el.innerHTML = '<div class="st-wrap">' + svg + '<div class="st-bar"><i style="width:' + pct + '%"></i></div><div class="st-cap">' + cap + '</div></div>';
        return info;
    }

    /* ---------------- الاستريك اليومي (firebase compat للشات) ---------------- */
    function cairoDay(ts) {
        return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ts || Date.now()));
    }
    function touchCompat(db, email) {
        try {
            var key = String(email || '').toLowerCase().trim();
            if (!key) return Promise.resolve(null);
            var today = cairoDay();
            try { if (localStorage.getItem('streak_done_' + key) === today) return Promise.resolve(null); } catch (e) {}
            var ref = db.collection('students').doc(key);
            return db.runTransaction(function (tx) {
                return tx.get(ref).then(function (snap) {
                    if (!snap.exists) return null;
                    var d = snap.data();
                    var cur = Number(d.streak) || 0;
                    if (d.lastActiveDay === today) return { streak: cur, changed: false };
                    var n = cur + 1;
                    tx.update(ref, { streak: n, longestStreak: Math.max(Number(d.longestStreak) || 0, n), lastActiveDay: today });
                    return { streak: n, changed: true };
                });
            }).then(function (res) {
                if (res) { try { localStorage.setItem('streak_done_' + key, today); localStorage.setItem('chat_streak', String(res.streak)); } catch (e) {} }
                return res;
            }).catch(function () { return null; });
        } catch (e) { return Promise.resolve(null); }
    }

    global.StreakTree = { mount: mount, stage: stage, touchCompat: touchCompat, cairoDay: cairoDay, MAX: MAX };
})(window);

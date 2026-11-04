/* tour.js — الجولة التعريفية التفاعلية لمنصة رحلة دراسية
 * بتشتغل في main.html لما الرابط يكون main.html?tour=1 (بعد التسجيل مباشرة).
 * - بتنوّر على العناصر الحقيقية في الصفحة وتقول للطالب «اضغط هنا وده بيعمل كذا».
 * - في الآخر شاشة ترحيب + موسيقى مولّدة بالكود (Web Audio، من غير أي ملفات صوت).
 * - بتتحفظ «خلصت» لكل طالب في localStorage، والتخطي متاح في أي لحظة (Esc كمان).
 */
(function () {
    'use strict';
    if (window.__psTourLoaded) return;
    window.__psTourLoaded = true;

    var params = new URLSearchParams(location.search);
    if (params.get('tour') !== '1') return;
    if (window.PS && PS.isAdminSession && PS.isAdminSession()) return;

    var REDUCE = false;
    try { REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

    function studentKey() { try { return (PS.email() || PS.studentId() || 'guest'); } catch (e) { return 'guest'; } }
    function markDone() {
        try { localStorage.setItem('ps_tour_done_' + studentKey(), '1'); } catch (e) {}
        try { history.replaceState(null, '', location.pathname); } catch (e) {}
    }

    /* ------------------------------ الخطوات ------------------------------ */
    var STEPS = [
        { sel: ['.profile-nav-btn'], title: 'ملفك الشخصي', text: 'اضغط هنا تفتح بروفايلك: صورتك ونقاطك ومستواك وأصحابك، ومن هنا برضه بتفعّل اشتراك VIP بالكود.' },
        { sel: ['.nav-notif-btn'], title: 'الإشعارات', text: 'اضغط هنا تشوف رسايل الإدارة والتنبيهات المهمة. الرقم الأحمر معناه إن فيه إشعار جديد.' },
        { sel: ['#themeToggleBtn'], title: 'الوضع الليلي والفاتح', text: 'اضغط هنا تبدّل بين الوضع الداكن والفاتح على حسب اللي يريّح عينيك.' },
        { sel: ['#cardFiles'], title: 'الحصص', text: 'اضغط هنا تدخل على حصصك: فيديوهات وملازم وملخصات، وكل حصة ليها امتحان. كل ما تذاكر بتكسب نقاط.' },
        { sel: ['#cardExams'], title: 'الامتحانات الشاملة', text: 'اضغط هنا تحل امتحانات شاملة على المنهج وتشوف درجتك ومحاولاتك المتبقية.' },
        { sel: ['#cardChat'], title: 'الدردشة', text: 'اضغط هنا تدخل شات زمايلك. الولاد في شات الولاد والبنات في شات البنات، وبتشوف الشجرة بتاعة الاستريك كمان.' },
        { sel: ['#cardStats'], title: 'إحصائياتك', text: 'اضغط هنا تشوف تقدمك بالأرقام: نقاطك وترتيبك ووقت مذاكرتك وحصصك وامتحاناتك.' },
        { sel: ['#cardForum'], title: 'المنتدى', text: 'اضغط هنا تسأل أي سؤال وتجاوب على زمايلك، وسؤالك بيظهر بعد ما الإدارة توافق عليه.' },
        { sel: ['#cardWeekly'], title: 'المنافسة الأسبوعية', text: 'اضغط هنا تدخل المنافسة. نقاط الامتحانات بتدخلك السباق، وأفضل الطلبة بيكسبوا أيام VIP هدية كل أسبوع.' },
        { sel: ['#cardMistakes'], title: 'أخطائي', text: 'اضغط هنا تراجع الأسئلة اللي غلطت فيها في الامتحانات عشان متغلطش فيها تاني.' },
        { sel: ['#cardInvites'], title: 'نظام الدعوات', text: 'اضغط هنا تاخد كود الدعوة بتاعك. كل صاحب بتدعوه بيقرّبك من أيام اشتراك مجانية.' },
        { sel: ['#leaderboardSection .lb-head', '#leaderboardSection'], title: 'لوحة المتصدرين', text: 'هنا أفضل 20 طالب في المنصة. ذاكر واجمع نقاط وشوف اسمك بيطلع إزاي بين الأوائل.' },
        { sel: ['#ai-toggle-btn'], title: 'المساعد الذكي', text: 'اضغط هنا تسأل «مستر» في أي مادة أو أي حاجة في المنصة، وهيشرحلك خطوة بخطوة.' }
    ];

    /* ------------------------------ الستايل ------------------------------ */
    var css = '' +
        '#pst-root{position:fixed;inset:0;z-index:2147483000;direction:rtl;font-family:"Segoe UI",Tahoma,Arial,sans-serif;opacity:0;transition:opacity .35s ease}' +
        '#pst-root.on{opacity:1}' +
        '#pst-block{position:absolute;inset:0;background:transparent}' +
        '#pst-hole{position:absolute;border-radius:14px;box-shadow:0 0 0 9999px rgba(2,6,23,.82);pointer-events:none;' +
            'transition:top .55s cubic-bezier(.65,0,.25,1),left .55s cubic-bezier(.65,0,.25,1),width .55s cubic-bezier(.65,0,.25,1),height .55s cubic-bezier(.65,0,.25,1),opacity .3s}' +
        '#pst-hole::before{content:"";position:absolute;inset:-4px;border-radius:18px;border:2px solid var(--primary,#6366f1);animation:pstRing 1.6s ease-in-out infinite}' +
        '#pst-tap{position:absolute;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:rgba(255,255,255,.9);pointer-events:none;' +
            'animation:pstTap 1.5s ease-out infinite;transition:top .55s cubic-bezier(.65,0,.25,1),left .55s cubic-bezier(.65,0,.25,1),opacity .3s}' +
        '@keyframes pstRing{0%,100%{transform:scale(1);opacity:.95}50%{transform:scale(1.045);opacity:.45}}' +
        '@keyframes pstTap{0%{transform:scale(.4);opacity:.95}70%{transform:scale(2.4);opacity:0}100%{opacity:0}}' +
        '#pst-card{position:absolute;width:340px;max-width:calc(100vw - 24px);box-sizing:border-box;background:var(--bg-card,#1e293b);color:var(--text-main,#f8fafc);' +
            'border:1px solid var(--border-color,#334155);border-radius:18px;padding:16px 16px 14px;box-shadow:0 18px 50px rgba(0,0,0,.5);' +
            'transition:top .55s cubic-bezier(.65,0,.25,1),left .55s cubic-bezier(.65,0,.25,1),opacity .25s,transform .25s}' +
        '#pst-card.swap{opacity:0;transform:translateY(6px)}' +
        '#pst-arrow{position:absolute;width:14px;height:14px;background:var(--bg-card,#1e293b);border:1px solid var(--border-color,#334155);transform:rotate(45deg);transition:left .55s cubic-bezier(.65,0,.25,1)}' +
        '#pst-card h3{margin:0 0 6px;font-size:1.05rem;font-weight:800;display:flex;align-items:center;gap:8px}' +
        '#pst-card h3 i{flex:none;min-width:26px;height:26px;border-radius:50%;background:var(--primary,#6366f1);color:#fff;font:800 .78rem/26px Arial;text-align:center;font-style:normal;padding:0 4px;box-sizing:border-box}' +
        '#pst-card p{margin:0 0 14px;font-size:.9rem;line-height:1.85;color:var(--text-muted,#94a3b8)}' +
        '#pst-bar{height:4px;border-radius:4px;background:var(--border-color,#334155);margin-bottom:12px;overflow:hidden}' +
        '#pst-bar b{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--primary,#6366f1),#22d3ee);border-radius:4px;transition:width .5s ease}' +
        '.pst-row{display:flex;align-items:center;gap:8px}' +
        '.pst-btn{border:none;border-radius:11px;padding:9px 16px;font:700 .85rem "Segoe UI",Tahoma,Arial,sans-serif;cursor:pointer;transition:transform .15s,background .2s}' +
        '.pst-btn:active{transform:scale(.96)}' +
        '.pst-next{background:var(--primary,#6366f1);color:#fff;flex:1}.pst-next:hover{background:var(--primary-hover,#4f46e5)}' +
        '.pst-prev{background:transparent;color:var(--text-main,#f8fafc);border:1px solid var(--border-color,#334155)}' +
        '.pst-skip{background:none;border:none;color:var(--text-muted,#94a3b8);font:600 .78rem "Segoe UI",Tahoma,Arial,sans-serif;cursor:pointer;padding:6px 4px;margin-inline-start:auto}' +
        '.pst-skip:hover{color:var(--text-main,#f8fafc);text-decoration:underline}' +
        '.pst-count{font-size:.74rem;color:var(--text-muted,#94a3b8);min-width:38px;text-align:center}' +
        /* شاشة الترحيب */
        '#pst-final{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:16px;background:radial-gradient(circle at 50% 28%,rgba(79,70,229,.5),rgba(79,70,229,0) 62%),#0b1020;opacity:0;pointer-events:none;transition:opacity .6s ease}' +
        '#pst-final.on{opacity:1;pointer-events:auto}' +
        '#pst-fbox{width:100%;max-width:440px;text-align:center;color:#f8fafc;transform:translateY(18px) scale(.96);transition:transform .7s cubic-bezier(.2,.9,.3,1.2)}' +
        '#pst-final.on #pst-fbox{transform:none}' +
        '#pst-fbox .pst-logo{width:84px;height:84px;margin:0 auto 14px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#6366f1,#22d3ee);box-shadow:0 0 0 0 rgba(99,102,241,.6);animation:pstPulse 2.2s ease-out infinite}' +
        '@keyframes pstPulse{0%{box-shadow:0 0 0 0 rgba(99,102,241,.55)}100%{box-shadow:0 0 0 34px rgba(99,102,241,0)}}' +
        '#pst-fbox h2{margin:0 0 10px;font-size:1.55rem;font-weight:900;line-height:1.5}' +
        '#pst-fbox h2 span{background:linear-gradient(90deg,#a5b4fc,#22d3ee);-webkit-background-clip:text;background-clip:text;color:transparent}' +
        '#pst-fbox p{margin:0 0 14px;color:#cbd5e1;line-height:1.9;font-size:.95rem}' +
        '#pst-trial{display:none;margin:0 0 14px;padding:10px 14px;border-radius:12px;background:rgba(16,185,129,.14);border:1px solid #10b981;color:#6ee7b7;font-size:.88rem;line-height:1.7}' +
        '#pst-quote{margin:0 0 20px;padding:12px 14px;border-radius:12px;background:rgba(255,255,255,.06);font-size:.88rem;color:#e2e8f0;line-height:1.8}' +
        '#pst-go{width:100%;padding:13px;font-size:1rem;border-radius:14px;background:linear-gradient(90deg,#6366f1,#22d3ee);color:#0f172a;border:none;font-weight:900;cursor:pointer;font-family:inherit;transition:transform .15s}' +
        '#pst-go:active{transform:scale(.97)}' +
        '#pst-mute{position:absolute;top:14px;left:14px;width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center}' +
        '#pst-intro{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(2,6,23,.86);transition:opacity .4s}' +
        '#pst-intro.off{opacity:0;pointer-events:none}' +
        '#pst-ibox{width:100%;max-width:380px;background:var(--bg-card,#1e293b);color:var(--text-main,#f8fafc);border:1px solid var(--border-color,#334155);border-radius:22px;padding:26px 20px 20px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.55);animation:pstIn .6s cubic-bezier(.2,.9,.3,1.2)}' +
        '@keyframes pstIn{from{opacity:0;transform:translateY(24px) scale(.94)}to{opacity:1;transform:none}}' +
        '#pst-ibox h2{margin:0 0 8px;font-size:1.35rem;font-weight:900}' +
        '#pst-ibox p{margin:0 0 20px;color:var(--text-muted,#94a3b8);font-size:.93rem;line-height:1.9}' +
        '#pst-ibox .pst-row{flex-direction:column}' +
        '#pst-ibox .pst-next{width:100%;padding:12px;font-size:.95rem}' +
        '@media (max-width:520px){#pst-card{padding:14px 14px 12px}#pst-fbox h2{font-size:1.3rem}}' +
        (REDUCE ? '#pst-hole,#pst-card,#pst-arrow,#pst-tap{transition:none!important}#pst-hole::before,#pst-tap,#pst-fbox .pst-logo{animation:none!important}' : '');

    /* ------------------------------ البناء ------------------------------ */
    var root, hole, tap, card, arrow, introEl, finalEl, bar, steps = [], idx = -1, busy = false, ended = false;

    function el(tag, attrs, html) {
        var e = document.createElement(tag);
        if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
        if (html !== undefined) e.innerHTML = html;
        return e;
    }
    function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

    function findTarget(sel) {
        for (var i = 0; i < sel.length; i++) {
            var n = document.querySelector(sel[i]);
            if (n) {
                var r = n.getBoundingClientRect();
                var cs = getComputedStyle(n);
                if (r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none') return n;
            }
        }
        return null;
    }

    function build() {
        var st = el('style'); st.id = 'pst-style'; st.textContent = css; document.head.appendChild(st);

        root = el('div', { id: 'pst-root', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'جولة تعريفية' });
        root.appendChild(el('div', { id: 'pst-block' }));
        hole = el('div', { id: 'pst-hole' }); root.appendChild(hole);
        tap = el('div', { id: 'pst-tap' }); root.appendChild(tap);
        arrow = el('div', { id: 'pst-arrow' });
        card = el('div', { id: 'pst-card', 'aria-live': 'polite' },
            '<div id="pst-bar"><b></b></div><h3><i id="pst-n">1</i><span id="pst-t"></span></h3><p id="pst-p"></p>' +
            '<div class="pst-row"><button class="pst-btn pst-prev" id="pst-prev" type="button">السابق</button>' +
            '<span class="pst-count" id="pst-c"></span>' +
            '<button class="pst-btn pst-next" id="pst-next" type="button">التالي</button>' +
            '<button class="pst-skip" id="pst-skip" type="button">تخطي</button></div>');
        card.appendChild(arrow);
        card.style.opacity = '0';
        root.appendChild(card);
        bar = card.querySelector('#pst-bar b');

        var name = firstName();
        introEl = el('div', { id: 'pst-intro' },
            '<div id="pst-ibox"><h2>أهلاً بيك' + (name ? ' يا ' + esc(name) : '') + '!</h2>' +
            '<p>تعالى نعمل جولة سريعة (أقل من دقيقة) أوريك فيها كل حاجة في المنصة وأقولك تضغط فين وده بيعمل إيه.</p>' +
            '<div class="pst-row"><button class="pst-btn pst-next" id="pst-start" type="button">يلا نبدأ الجولة</button>' +
            '<button class="pst-skip" id="pst-iskip" type="button" style="margin:8px 0 0">تخطي، هستكشف لوحدي</button></div></div>');
        root.appendChild(introEl);

        finalEl = el('div', { id: 'pst-final' },
            '<button id="pst-mute" type="button" aria-label="كتم الموسيقى"></button>' +
            '<div id="pst-fbox"><div class="pst-logo"><svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg></div>' +
            '<h2>أهلاً بيك يا <span id="pst-fname"></span> في عالمك الجديد!</h2>' +
            '<p>خلصنا الجولة. كل اللي عليك دلوقتي إنك تبدأ، وأنا واثق إنك هتوصل للقمة.</p>' +
            '<div id="pst-trial"></div><div id="pst-quote"></div>' +
            '<button id="pst-go" type="button">ابدأ رحلتك</button></div>');
        root.appendChild(finalEl);

        document.body.appendChild(root);
        requestAnimationFrame(function () { root.classList.add('on'); });

        card.querySelector('#pst-next').onclick = next;
        card.querySelector('#pst-prev').onclick = prev;
        card.querySelector('#pst-skip').onclick = skipAll;
        introEl.querySelector('#pst-start').onclick = function () { introEl.classList.add('off'); start(); };
        introEl.querySelector('#pst-iskip').onclick = skipAll;
        finalEl.querySelector('#pst-go').onclick = closeAll;
        setMuteIcon();
        finalEl.querySelector('#pst-mute').onclick = toggleMute;

        document.addEventListener('keydown', onKey, true);
        window.addEventListener('resize', reposition);
        window.addEventListener('scroll', reposition, { passive: true });
    }

    function firstName() {
        try { var s = PS.getStudent() || {}; return String(s.fullName || s.name || '').trim().split(/\s+/)[0] || ''; } catch (e) { return ''; }
    }

    /* ------------------------------ التنقل ------------------------------ */
    function usable() {
        steps = STEPS.filter(function (s) { return !!findTarget(s.sel); });
    }

    function start() { usable(); if (!steps.length) { showFinal(); return; } go(0); }

    function go(i) {
        if (busy || ended) return;
        if (i >= steps.length) { showFinal(); return; }
        busy = true;
        idx = i;
        var s = steps[i], target = findTarget(s.sel);
        if (!target) { busy = false; go(i + 1); return; }
        card.classList.add('swap');
        scrollTo(target, function () {
            fill(s, i);
            place(target);
            card.style.opacity = '1';
            card.classList.remove('swap');
            setTimeout(function () { busy = false; try { card.querySelector('#pst-next').focus({ preventScroll: true }); } catch (e) {} }, REDUCE ? 0 : 420);
        });
    }
    function next() { if (busy) return; if (idx >= steps.length - 1) showFinal(); else go(idx + 1); }
    function prev() { if (busy || idx <= 0) return; go(idx - 1); }

    function fill(s, i) {
        card.querySelector('#pst-n').textContent = String(i + 1);
        card.querySelector('#pst-t').textContent = s.title;
        card.querySelector('#pst-p').textContent = s.text;
        card.querySelector('#pst-c').textContent = (i + 1) + ' / ' + steps.length;
        card.querySelector('#pst-prev').style.visibility = i === 0 ? 'hidden' : 'visible';
        card.querySelector('#pst-next').textContent = i === steps.length - 1 ? 'إنهاء الجولة' : 'التالي';
        bar.style.width = Math.round(((i + 1) / steps.length) * 100) + '%';
    }

    function scrollTo(target, done) {
        var r = target.getBoundingClientRect(), vh = window.innerHeight;
        var narrow = window.innerWidth <= 560;
        var want = narrow ? vh * 0.28 : vh * 0.38; // مكان مركز العنصر على الشاشة
        var dy = (r.top + Math.min(r.height, vh * 0.5) / 2) - want;
        if (Math.abs(dy) < 4) { done(); return; }
        try { window.scrollBy({ top: dy, behavior: REDUCE ? 'auto' : 'smooth' }); } catch (e) { window.scrollBy(0, dy); }
        var t0 = Date.now(), last = -1, same = 0;
        (function wait() {
            var y = window.scrollY;
            same = (y === last) ? same + 1 : 0; last = y;
            if (same >= 4 || Date.now() - t0 > 900) { done(); return; }
            setTimeout(wait, 40);
        })();
    }

    function place(target) {
        if (!target || !root) return;
        var r = target.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight, pad = 6;
        var top = Math.max(4, r.top - pad), left = Math.max(4, r.left - pad);
        var w = Math.min(vw - 8, r.width + pad * 2), h = Math.min(r.height + pad * 2, Math.max(60, vh - top - 8));
        hole.style.top = top + 'px'; hole.style.left = left + 'px'; hole.style.width = w + 'px'; hole.style.height = h + 'px';
        tap.style.top = (top + Math.min(h, 200) / 2) + 'px'; tap.style.left = (left + w / 2) + 'px';

        var cw = card.offsetWidth, ch = card.offsetHeight, gap = 18;
        var below = vh - (top + h) - gap, above = top - gap;
        var cx = left + w / 2, cl = Math.min(Math.max(12, cx - cw / 2), vw - cw - 12), ct, arrowTop;
        if (below >= ch + 8 || below >= above) {
            ct = Math.min(top + h + gap, vh - ch - 8);
            arrowTop = -8; arrow.style.borderRight = 'none'; arrow.style.borderBottom = 'none'; arrow.style.borderLeft = ''; arrow.style.borderTop = '';
        } else {
            ct = Math.max(8, top - ch - gap);
            arrowTop = ch - 7; arrow.style.borderLeft = 'none'; arrow.style.borderTop = 'none'; arrow.style.borderRight = ''; arrow.style.borderBottom = '';
        }
        card.style.top = ct + 'px'; card.style.left = cl + 'px';
        arrow.style.top = arrowTop + 'px';
        arrow.style.left = Math.min(Math.max(14, cx - cl - 7), cw - 28) + 'px';
    }

    var rp = 0;
    function reposition() {
        if (rp || idx < 0 || ended || finalEl.classList.contains('on')) return;
        rp = requestAnimationFrame(function () {
            rp = 0;
            var s = steps[idx]; if (!s) return;
            var t = findTarget(s.sel); if (t) place(t);
        });
    }

    function onKey(e) {
        if (ended) return;
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); skipAll(); return; }
        if (finalEl.classList.contains('on') || introEl && !introEl.classList.contains('off')) return;
        if (e.key === 'ArrowLeft' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); next(); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); prev(); }
    }

    /* ------------------------------ الترحيب ------------------------------ */
    var QUOTES = [
        '«النجاح ليس صدفة، بل هو عمل جاد وصبر وتعلّم مستمر.»',
        '«اليوم خطوة جديدة نحو حلمك، استمر ولا تتوقف أبداً!»',
        '«كل ما تتعلمه اليوم هو سلاحك الأقوى لمستقبلك.»',
        '«العظمة تبدأ بخطوة صغيرة، وهذه هي خطوتك الأولى نحو القمة.»'
    ];

    function showFinal() {
        if (ended) return;
        busy = false;
        hole.style.opacity = '0'; tap.style.opacity = '0'; card.style.opacity = '0'; card.style.pointerEvents = 'none';
        finalEl.querySelector('#pst-fname').textContent = firstName() || 'بطل';
        finalEl.querySelector('#pst-quote').textContent = QUOTES[Math.floor(Math.random() * QUOTES.length)];
        try {
            var s = PS.getStudent() || {}, exp = Date.parse(s.subscriptionExpiry || ''), hrs = Math.ceil((exp - Date.now()) / 3600000);
            if (s.accountType === 'trial' && hrs > 0) {
                var n = finalEl.querySelector('#pst-trial');
                n.textContent = 'هديناك تجربة مجانية بكل مميزات VIP، باقي حوالي ' + hrs + ' ساعة. استمتع بيها!';
                n.style.display = 'block';
            }
        } catch (e) {}
        finalEl.classList.add('on');
        markDone();
        setTimeout(function () { confetti3(); music.play(); }, 250);
        try { finalEl.querySelector('#pst-go').focus({ preventScroll: true }); } catch (e) {}
    }

    function closeAll() {
        if (ended) return;
        ended = true;
        music.stop(true);
        markDone();
        document.removeEventListener('keydown', onKey, true);
        window.removeEventListener('resize', reposition);
        window.removeEventListener('scroll', reposition);
        root.classList.remove('on');
        setTimeout(function () {
            if (root && root.parentNode) root.parentNode.removeChild(root);
            var st = document.getElementById('pst-style'); if (st) st.remove();
            try { window.scrollTo({ top: 0, behavior: REDUCE ? 'auto' : 'smooth' }); } catch (e) { window.scrollTo(0, 0); }
        }, 400);
    }
    function skipAll() { markDone(); closeAll(); }

    /* ------------------------------ Confetti ------------------------------ */
    function confetti3() {
        if (REDUCE) return;
        function fire() {
            try {
                if (typeof window.confetti !== 'function') return;
                window.confetti({ particleCount: 110, spread: 80, origin: { y: 0.62 }, zIndex: 2147483600 });
                setTimeout(function () { window.confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, zIndex: 2147483600 }); window.confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, zIndex: 2147483600 }); }, 450);
            } catch (e) {}
        }
        if (typeof window.confetti === 'function') { fire(); return; }
        var s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
        s.onload = fire; s.onerror = function () {};
        document.head.appendChild(s);
    }

    /* ------------------------------ الموسيقى (Web Audio) ------------------------------
     * ألحان هادية: C – G – Am – F مرتين بأربيجيو ناعم + بادّ + ريفيرب مولّد، وتنتهي بنجمة صاعدة. */
    var muted = false;
    try { muted = localStorage.getItem('ps_tour_muted') === '1'; } catch (e) {}

    var music = (function () {
        var ctx = null, master = null, started = false, timers = [];
        var N = { A3: 220, B3: 246.94, C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, C6: 1046.5, E6: 1318.5, G6: 1568 };
        var PAD = { C: [130.81, 196, 261.63, 329.63], G: [98, 196, 246.94, 293.66], Am: [110, 220, 261.63, 329.63], F: [87.31, 174.61, 261.63, 349.23] };
        var ARP = {
            C:  ['C4', 'E4', 'G4', 'C5', 'E5', 'C5', 'G4', 'E4'],
            G:  ['B3', 'D4', 'G4', 'B4', 'D5', 'B4', 'G4', 'D4'],
            Am: ['A3', 'C4', 'E4', 'A4', 'C5', 'A4', 'E4', 'C4'],
            F:  ['A3', 'C4', 'F4', 'A4', 'C5', 'A4', 'F4', 'C4']
        };
        var PROG = ['C', 'G', 'Am', 'F', 'C', 'G', 'Am', 'F'];
        var EIGHTH = 0.34;

        function impulse(c, sec) {
            var len = Math.floor(c.sampleRate * sec), buf = c.createBuffer(2, len, c.sampleRate);
            for (var ch = 0; ch < 2; ch++) {
                var d = buf.getChannelData(ch);
                for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4);
            }
            return buf;
        }
        function tone(freq, t, dur, type, vol, dest) {
            var o = ctx.createOscillator(), g = ctx.createGain();
            o.type = type; o.frequency.setValueAtTime(freq, t);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            o.connect(g); g.connect(dest);
            o.start(t); o.stop(t + dur + 0.05);
        }
        function pad(chord, t, dur, dest) {
            PAD[chord].forEach(function (f) {
                var o = ctx.createOscillator(), g = ctx.createGain();
                o.type = 'triangle'; o.frequency.setValueAtTime(f, t);
                g.gain.setValueAtTime(0.0001, t);
                g.gain.linearRampToValueAtTime(0.05, t + 0.5);
                g.gain.linearRampToValueAtTime(0.035, t + dur - 0.4);
                g.gain.linearRampToValueAtTime(0.0001, t + dur);
                o.connect(g); g.connect(dest);
                o.start(t); o.stop(t + dur + 0.05);
            });
        }

        return {
            play: function () {
                if (started) return;
                try {
                    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
                    ctx = new AC();
                    if (ctx.state === 'suspended') ctx.resume();
                    started = true;
                    master = ctx.createGain();
                    master.gain.value = muted ? 0 : 0.55;
                    var verb = ctx.createConvolver(); verb.buffer = impulse(ctx, 2.4);
                    var wet = ctx.createGain(); wet.gain.value = 0.38;
                    var dry = ctx.createGain(); dry.gain.value = 0.9;
                    var bus = ctx.createGain();
                    bus.connect(dry); bus.connect(verb); verb.connect(wet);
                    dry.connect(master); wet.connect(master); master.connect(ctx.destination);

                    var t0 = ctx.currentTime + 0.1, bar = EIGHTH * 8;
                    PROG.forEach(function (ch, b) {
                        var tb = t0 + b * bar;
                        pad(ch, tb, bar + 0.3, bus);
                        ARP[ch].forEach(function (nn, k) {
                            var tt = tb + k * EIGHTH, accent = (k === 0 ? 1.25 : 1);
                            tone(N[nn], tt, 0.9, 'sine', 0.11 * accent, bus);
                            tone(N[nn] * 2, tt, 0.5, 'triangle', 0.025 * accent, bus);
                        });
                    });
                    // الختام: مقام C ممتد + نجوم صاعدة
                    var te = t0 + PROG.length * bar;
                    pad('C', te, 4.2, bus);
                    [['C5', 0], ['E5', 0.18], ['G5', 0.36], ['C6', 0.54], ['E6', 0.78], ['G6', 1.02]].forEach(function (p) {
                        tone(N[p[0]], te + p[1], 2.2, 'sine', 0.09, bus);
                    });
                    timers.push(setTimeout(function () { music.stop(false); }, (PROG.length * bar + 5) * 1000));
                } catch (e) { started = false; }
            },
            setMuted: function (m) {
                if (!ctx || !master) return;
                try { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(m ? 0 : 0.55, ctx.currentTime, 0.12); } catch (e) {}
            },
            stop: function (fast) {
                timers.forEach(clearTimeout); timers = [];
                if (!ctx) return;
                var c = ctx; ctx = null; started = false;
                try {
                    if (master) { master.gain.cancelScheduledValues(c.currentTime); master.gain.setTargetAtTime(0, c.currentTime, fast ? 0.15 : 0.5); }
                    setTimeout(function () { try { c.close(); } catch (e) {} }, fast ? 700 : 2500);
                } catch (e) {}
            }
        };
    })();

    function setMuteIcon() {
        var b = finalEl && finalEl.querySelector('#pst-mute'); if (!b) return;
        b.setAttribute('aria-label', muted ? 'تشغيل الموسيقى' : 'كتم الموسيقى');
        b.innerHTML = muted
            ? '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>'
            : '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
    }
    function toggleMute() {
        muted = !muted;
        try { localStorage.setItem('ps_tour_muted', muted ? '1' : '0'); } catch (e) {}
        music.setMuted(muted); setMuteIcon();
    }

    /* ------------------------------ التشغيل ------------------------------ */
    function boot() {
        // نستنى الصفحة تستقر (الـ auth وبناء الواجهة) قبل ما نبدأ
        setTimeout(function () {
            if (!document.body || document.getElementById('ps-maint')) return; // وضع الصيانة: مفيش جولة
            build();
        }, 900);
    }
    if (document.readyState === 'complete') boot(); else window.addEventListener('load', boot);
})();

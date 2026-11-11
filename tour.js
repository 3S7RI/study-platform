/* tour.js — الجولة التعريفية التفاعلية لمنصة رحلة دراسية
 * جزءين: (1) الجولة المنوّرة: بتشتغل في main.html لما الرابط يكون main.html?tour=1 (بعد التسجيل مباشرة).
 *        (2) «دليل المنصة»: زرار دايم في الهيدر فيه شرح تفصيلي لكل الميزات + تقدّم محفوظ + تلميح يومي لحد ما الطالب يخلّص كل المواضيع.
 * - بتنوّر على العناصر الحقيقية في الصفحة وتقول للطالب «اضغط هنا وده بيعمل كذا».
 * - في الآخر شاشة ترحيب + موسيقى مولّدة بالكود (Web Audio، من غير أي ملفات صوت).
 * - بتتحفظ «خلصت» لكل طالب في localStorage، والتخطي متاح في أي لحظة (Esc كمان).
 */
(function () {
    'use strict';
    if (window.__psTourLoaded) return;
    window.__psTourLoaded = true;

    var params = new URLSearchParams(location.search);
    var TOUR = params.get('tour') === '1';
    if (window.PS && PS.isAdminSession && PS.isAdminSession()) return;

    var REDUCE = false;
    try { REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

    function studentKey() { try { return (PS.email() || PS.studentId() || 'guest'); } catch (e) { return 'guest'; } }
    function markDone() {
        try { localStorage.setItem('ps_tour_done_' + studentKey(), '1'); } catch (e) {}
        if (TOUR) { try { history.replaceState(null, '', location.pathname); } catch (e) {} }
    }

    /* ------------------------------ الخطوات ------------------------------ */
    var STEPS = [
        { topic: 'profile', sel: ['.profile-nav-btn'], title: 'ملفك الشخصي ومستواك', text: 'اضغط هنا تفتح بروفايلك: صورتك ونقاطك وأصحابك. مستواك من Lv.1 لحد Lv.50 بيتحسب من نقاطك، وكل فئة ليها إطار مميز حوالين صورتك. ومن البروفايل برضه بتفعّل كود VIP.' },
        { topic: 'basics', sel: ['.nav-notif-btn'], title: 'الإشعارات', text: 'اضغط هنا تشوف رسايل الإدارة والتنبيهات المهمة. الرقم الأحمر معناه إن فيه إشعار جديد.' },
        { topic: 'basics', sel: ['#themeToggleBtn'], title: 'الوضع الليلي والفاتح', text: 'اضغط هنا تبدّل بين الوضع الداكن والفاتح على حسب اللي يريّح عينيك.' },
        { topic: 'lessons', sel: ['#cardFiles'], title: 'الحصص', text: 'اضغط هنا تدخل على حصصك: كل حصة فيها فيديو وملزمة وملخص وامتحان. عدد مرات دخولك لكل حصة بيزيد حسب باقتك، وكل ما تذاكر بتكسب نقاط.' },
        { topic: 'exams', sel: ['#cardExams'], title: 'الامتحانات الشاملة', text: 'اضغط هنا تحل امتحانات شاملة على المنهج وتشوف درجتك ومحاولاتك المتبقية.' },
        { topic: 'streak', sel: ['#cardChat'], title: 'الدردشة وشجرة الاستريك', text: 'اضغط هنا تدخل شات زمايلك (الولاد مع الولاد والبنات مع البنات). وهناك هتشوف شجرة الاستريك: كل يوم بتدخل فيه بتطلع ليها ورقة جديدة، ومبيتصفّرش أبداً.' },
        { topic: 'stats', sel: ['#cardStats'], title: 'إحصائياتك', text: 'اضغط هنا تشوف تقدمك بالأرقام: نقاطك وترتيبك ووقت مذاكرتك، وباقي كام دخول لكل حصة، ودرجات امتحاناتك، وعدّاد اشتراكك.' },
        { topic: 'forum', sel: ['#cardForum'], title: 'المنتدى', text: 'اضغط هنا تسأل أي سؤال وتجاوب على زمايلك. سؤالك بيظهر بعد ما الإدارة توافق عليه.' },
        { topic: 'weekly', sel: ['#cardWeekly'], title: 'المنافسات والمنافسة الأسبوعية', text: 'اضغط هنا تدخل ساحة المنافسات. منافسة الأسبوع بتبدأ السبت وتخلص الجمعة، ونقاط امتحانات الحصص هي اللي بتدخلك السباق، وأفضل الطلبة بيكسبوا أيام اشتراك هدية.' },
        { topic: 'exams', sel: ['#cardMistakes'], title: 'أخطائي', text: 'اضغط هنا تراجع كل سؤال غلطت فيه في الامتحانات عشان متغلطش فيه تاني.' },
        { topic: 'invites', sel: ['#cardInvites'], title: 'نظام الدعوات', text: 'اضغط هنا تاخد كود الدعوة بتاعك. كل صاحب بتدعوه بيقرّبك من أيام اشتراك مجانية.' },
        { topic: 'leaderboard', sel: ['#leaderboardSection .lb-head', '#leaderboardSection'], title: 'لوحة المتصدرين', text: 'هنا أفضل 20 طالب في المنصة. لو انت برّه أول 20 هتشوف ترتيبك وباقيلك كام نقطة تدخل. ذاكر واجمع نقاط.' },
        { topic: 'ai', sel: ['#ai-toggle-btn'], title: 'المساعد الذكي «مستر»', text: 'الأيقونة دي بتفتح المساعد الذكي: اسأله في أي مادة وهيشرحلك خطوة بخطوة، وتقدر تسحبها لأي مكان. عدد أسئلتك اليومي بيزيد حسب باقتك.' },
        { topic: 'report', sel: ['#ps-rep-btn'], title: 'الإبلاغ عن مشكلة', text: 'زرار العلم ⚑ تحت أيقونة المساعد مباشرة. لو حاجة مش شغالة اضغط عليه واكتب المشكلة، والصفحة وبياناتك بتتبعت تلقائي وبتوصل للإدارة.' },
                { topic: null, sel: ['#psg-btn'], title: 'دليل المنصة', text: 'ده زرار «الدليل»: فيه شرح تفصيلي لكل حاجة في المنصة (الباقات، النقاط، المنافسة، الاستريك...). هفضل معاك وأفكّرك بحاجة جديدة كل يوم لحد ما تعرف المنصة كلها.' }
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
    var root, hole, tap, card, arrow, introEl, finalEl, bar, steps = [], idx = -1, busy = false, ended = false, single = false;

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
            '<p>تعالى نعمل جولة سريعة أوريك فيها أهم الأماكن وأقولك تضغط فين وده بيعمل إيه. وبعدها هتلاقي زرار «الدليل» معاك بالتفصيل لكل حاجة، وهفضل أفكّرك لحد ما تعرف المنصة تمام.</p>' +
            '<div class="pst-row"><button class="pst-btn pst-next" id="pst-start" type="button">يلا نبدأ الجولة</button>' +
            '<button class="pst-skip" id="pst-iskip" type="button" style="margin:8px 0 0">تخطي، هستكشف لوحدي</button></div></div>');
        root.appendChild(introEl);

        finalEl = el('div', { id: 'pst-final' },
            '<button id="pst-mute" type="button" aria-label="كتم الموسيقى"></button>' +
            '<div id="pst-fbox"><div class="pst-logo"><svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg></div>' +
            '<h2>أهلاً بيك يا <span id="pst-fname"></span> في عالمك الجديد!</h2>' +
            '<p>خلصنا الجولة السريعة. افتح زرار «الدليل» في أي وقت عشان تقرأ الشرح التفصيلي لكل ميزة، وأنا هفضل أفكّرك بحاجة جديدة كل يوم لحد ما تعرف المنصة كلها. وأنا واثق إنك هتوصل للقمة.</p>' +
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
        if (i >= steps.length) { if (single) closeAll(); else showFinal(); return; }
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
    function next() { if (busy) return; if (idx >= steps.length - 1) { if (single) closeAll(); else showFinal(); } else go(idx + 1); }
    function prev() { if (busy || idx <= 0) return; go(idx - 1); }

    function fill(s, i) {
        card.querySelector('#pst-n').textContent = String(i + 1);
        card.querySelector('#pst-t').textContent = s.title;
        card.querySelector('#pst-p').textContent = s.text;
        card.querySelector('#pst-c').textContent = (i + 1) + ' / ' + steps.length;
        card.querySelector('#pst-prev').style.visibility = i === 0 ? 'hidden' : 'visible';
        card.querySelector('#pst-next').textContent = i === steps.length - 1 ? (single ? 'تمام' : 'إنهاء الجولة') : 'التالي';
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
        markSeen(steps.map(function (x) { return x.topic; }));
        updateBtn();
        markDone();
        setTimeout(function () { confetti3(); music.play(); }, 250);
        try { finalEl.querySelector('#pst-go').focus({ preventScroll: true }); } catch (e) {}
    }

    function closeAll() {
        if (ended) return;
        ended = true;
        var wasSingle = single;
        music.stop(true);
        if (!wasSingle) markDone();
        document.removeEventListener('keydown', onKey, true);
        window.removeEventListener('resize', reposition);
        window.removeEventListener('scroll', reposition);
        root.classList.remove('on');
        setTimeout(function () {
            if (root && root.parentNode) root.parentNode.removeChild(root);
            var st = document.getElementById('pst-style'); if (st) st.remove();
            if (!wasSingle) { try { window.scrollTo({ top: 0, behavior: REDUCE ? 'auto' : 'smooth' }); } catch (e) { window.scrollTo(0, 0); } }
            root = null; single = false; // جاهز لتنوير جديد من الدليل
            if (wasSingle) { ended = false; busy = false; idx = -1; }
        }, 400);
    }
    function skipAll() { if (!single) markDone(); closeAll(); }

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

    /* ================================================================
     * دليل المنصة (Hub): شرح تفصيلي لكل ميزة + تقدّم محفوظ + تلميح يومي.
     * بيفضل مع الطالب لحد ما يعلّم كل المواضيع «فهمت». الحالة في localStorage لكل طالب.
     * ================================================================ */
    var IC = {
        user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
        bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
        bolt: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
        flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
        book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5V22h16"/>',
        check: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
        chart: '<path d="M18 20V10M12 20V4M6 20v-6"/>',
        trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0z"/>',
        cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
        star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
        key: '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3"/>',
        bot: '<rect x="3" y="8" width="18" height="12" rx="3"/><path d="M12 8V4M8 14h.01M16 14h.01"/>',
        flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
        chat: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
        help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>',
        users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
        gift: '<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
        phone: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
        card: '<rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/>'
    };
    function icon(k) { return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IC[k] || IC.help) + '</svg>'; }

    // sel = عنصر في الصفحة الرئيسية نقدر ننوّر عليه («وريني»)، href = الصفحة اللي الميزة فيها
    var TOPICS = [
        { id: 'profile', g: 'البداية', ic: 'user', title: 'ملفك الشخصي ومستوياتك', sel: ['.profile-nav-btn'], href: 'profile.html', pts: [
            'من هنا بتفتح بروفايلك: صورتك واسمك ونقاطك ومستواك وأصحابك.',
            'مستواك بيتحسب من نقاطك، من Lv.1 لحد Lv.50. كل ما نقاطك تزيد مستواك بيعلى.',
            'كل فئة من المستويات ليها إطار مختلف حوالين صورتك: مستكشف، مجتهد، متميز، محترف، خبير، أسطورة، وإمبراطور (أقوى إطار).',
            'كل 5 مستويات بتفتح ميزة شكلية جديدة، منها: صورة خلفية للبروفايل عند Lv.30، ولقب مخصص عند Lv.35، ولون للبروفايل عند Lv.45.',
            'اضغط «مميزات المستويات» جوه البروفايل تشوف إيه اللي اتفتح وإيه اللي لسه مقفول.' ] },
        { id: 'basics', g: 'البداية', ic: 'bell', title: 'الإشعارات والوضع الليلي', sel: ['.nav-notif-btn'], pts: [
            'الجرس فوق فيه رسايل الإدارة والتنبيهات المهمة. الرقم الأحمر معناه إن فيه إشعار جديد ماقريتوش.',
            'زرار الشمس/القمر بيبدّل بين الوضع الداكن والفاتح، واختيارك بيتحفظ.',
            'قبل ما اشتراكك يخلص بيومين هيظهرلك شريط تنبيه في الصفحة الرئيسية عشان تجدّد في الوقت المناسب.' ] },
        { id: 'lessons', g: 'المذاكرة', ic: 'book', title: 'الحصص (فيديو وملزمة وملخص وامتحان)', sel: ['#cardFiles'], href: 'files.html', pts: [
            'كل حصة فيها فيديو شرح وملزمة وملخص وامتحان خاص بيها.',
            'عدد مرات دخولك لكل حصة محدود وبيزيد حسب باقتك: Plus = 5 مرات، Pro = 8، Elite = 15. وفي صفحة «إحصائياتي» بتشوف باقي كام دخول لكل حصة.',
            'امتحان الحصة ليه عدد محاولات حدده المعلم، وPro بياخد محاولة زيادة وElite محاولتين زيادة.',
            'النقاط: كل ما تذاكر وتحل بتكسب نقاط ومستواك بيعلى.' ] },
        { id: 'points', g: 'المذاكرة', ic: 'bolt', title: 'النقاط: بتيجي منين وإزاي بتتحسب', sel: ['#cardFiles'], href: 'files.html', pts: [
            'نقاطك بتيجي من الحصص والملازم والملخصات وامتحانات الحصص والامتحانات الشاملة.',
            'نقاط امتحان الحصة بتتحسب حسب درجتك: كل ما درجتك أعلى كل ما النقاط أكتر، وفيه مكافأة إضافية لو جبت الدرجة النهائية.',
            'لو أعدت امتحان الحصة، بتاخد الفرق بس لو درجتك اتحسنت عن قبل. يعني الإعادة من غير تحسن مفيهاش نقاط جديدة.',
            'النقاط دي هي اللي بتحدد مستواك وترتيبك في لوحة المتصدرين.' ] },
        { id: 'exams', g: 'المذاكرة', ic: 'check', title: 'الامتحانات الشاملة وكراسة الأخطاء', sel: ['#cardExams', '#cardMistakes'], href: 'exams.html', pts: [
            'الامتحانات الشاملة بتغطي المنهج كله، وبتشوف حالتها ومحاولاتك المتبقية ودرجتك المعتمدة.',
            '«أخطائي»: كل سؤال غلطت فيه في أي امتحان بيتسجل هناك، راجعه قبل الامتحان الجاي عشان متغلطش فيه تاني.',
            'كل ما تراجع أخطائك أكتر، درجتك في الامتحانات الجاية بتتحسن.' ] },
        { id: 'stats', g: 'المذاكرة', ic: 'chart', title: 'إحصائياتك ووقت مذاكرتك', sel: ['#cardStats'], href: 'stats.html', pts: [
            'صفحة إحصائياتك فيها: مستواك وترتيبك العام، واشتراكك وعدّاد تنازلي لحد ما يخلص.',
            'تفاصيل كل حصة: دخلت كام مرة وباقي كام، ودرجات امتحانات الحصص ومتوسطك وأعلى درجة.',
            'الامتحانات الشاملة والاستريك والمنتدى والأصحاب كلهم في نفس الصفحة.',
            'وقت المذاكرة بيتعد بس لما المنصة تكون ظاهرة قدامك على الشاشة، فمفيش وقت بيتحسب وانت مش بتذاكر.',
            'باقة Plus بتديك إحصائيات أساسية، وPro وElite بتفتح التفاصيل الكاملة.' ] },
        { id: 'streak', g: 'التحفيز', ic: 'flame', title: 'الاستريك وشجرة الاستريك', sel: ['#cardChat'], pts: [
            'كل يوم بتدخل فيه المنصة (بتوقيت القاهرة) بيزيد الاستريك بتاعك +1، ومفيش حاجة بتصفّره أبداً.',
            'شجرة الاستريك بتظهر في الدردشة: كل يوم بتطلعلها ورقة جديدة وبتكبر وتتفرع.',
            'عند 365 يوم الشجرة بتكتمل بالأزهار والثمار الذهبية.',
            'وبعد كده بيفضل الاستريك يكمّل، وكل يوم بتزيد ثمرة ذهبية جديدة (لحد 100) مع عدّاد السنين.' ] },
        { id: 'leaderboard', g: 'التحفيز', ic: 'trophy', title: 'لوحة المتصدرين', sel: ['#leaderboardSection .lb-head', '#leaderboardSection'], pts: [
            'أفضل 20 طالب في المنصة بنقاطهم: منصة للأول والتاني والتالت، وتحتهم باقي القايمة.',
            'لو انت برّه أول 20 بتشوف ترتيبك وباقيلك كام نقطة تدخل.',
            'اللوحة بتتحدّث كل 5 دقايق، وزرار التحديث فوق ليها (مرة كل دقيقة بالكتير).',
            'لو قفلت المقارنة من إعداداتك، اسمك بيظهر للناس «طالب مخفي».' ] },
        { id: 'weekly', g: 'التحفيز', ic: 'cal', title: 'المنافسة الأسبوعية', sel: ['#cardWeekly'], href: 'weekly.html', pts: [
            'كل أسبوع بيبدأ السبت 12 بالليل وبيخلص الجمعة 12 بالليل (بتوقيت القاهرة)، وفيه عدّاد تنازلي في الصفحة.',
            'اللي بيدخلك السباق هو نقاط امتحانات الحصص بس. فتح الفيديو أو الملزمة أو الملخص مبيدخلش في المنافسة.',
            'أفضل الطلاب بيكسبوا أيام اشتراك هدية: المركزين الأول والتاني بياخدوا Pro، والباقي Plus، وعدد الأيام بتحدده الإدارة.',
            'الفايزين بيتسجلوا في «لوحة الشرف». ادخل من كارت «المنافسات» وبعدين «منافسة الأسبوع».' ] },
        { id: 'plans', g: 'الاشتراك', ic: 'star', title: 'الباقات: Plus وPro وElite وباقة الشلة', href: 'subscribe.html', pts: [
            'فيه 3 باقات: Plus (الأساسية)، Pro (الأشهر)، Elite (الأقوى). كل باقة بتزوّد دخول الحصص ومحاولات الامتحانات وأسئلة المساعد الذكي اليومية.',
            'المدد: 7 أيام أو 28 يوم أو 3 شهور، وكل ما المدة أطول التوفير أكبر. والعروض والخصومات بتظهر في صفحة الاشتراك.',
            'باقة الشلة: 3 أو 5 طلاب بيشتركوا مع بعض في Pro بسعر أقل للفرد. القايد بيكتب IDs أصحابه (STU-0001...) والكل بيتفعّل بعد موافقة الإدارة.',
            'عندك كود خصم؟ اكتبه في صفحة الاشتراك قبل ما تأكد الطلب.',
            'الدفع: اتصالات كاش أو فوري، أو فيزا/تحويل بنكي (InstaPay لما يتاح). حوّل المبلغ بالظبط واكتب بياناتك، والإدارة بتراجع وتفعّل.',
            'مسموح بطلب واحد معلّق في المرة. وأيام اشتراكك الجديدة بتتضاف على الأيام المتبقية، ولو رقّيت باقتك الأيام بتتحول للباقة الأعلى.' ] },
        { id: 'trial', g: 'الاشتراك', ic: 'key', title: 'التجربة المجانية وتفعيل الكود', href: 'profile.html', pts: [
            'أول ما عملت حسابك أخدت تجربة مجانية 24 ساعة بمميزات Pro، ومرة واحدة لكل إيميل ولكل رقم تليفون.',
            'عندك كود VIP؟ ادخل بروفايلك واكتب الكود في خانة التفعيل وهيتفعّل اشتراكك فوراً.',
            'لو كتبت الكود غلط 3 مرات بيتقفل التفعيل 30 دقيقة، فراجع الكود كويس قبل ما تكتبه.',
            'لو اشتراكك لسه شغال وفعّلت كود جديد، الأيام بتتضاف على المتبقي ومبتضيعش.' ] },
        { id: 'ai', g: 'أدوات', ic: 'bot', title: 'المساعد الذكي «مستر»', sel: ['#ai-toggle-btn'], pts: [
            'الأيقونة العايمة في الشمال تحت (فوق زرار الإبلاغ): اضغط عليها تفتح الشات، وتقدر تسحبها لأي مكان يريّحك.',
            'اسأله في أي مادة وهيشرحلك خطوة بخطوة، أو اسأله عن أي حاجة في المنصة (الأسعار، النقاط، المنافسة...).',
            'عدد أسئلتك اليومي بيعتمد على باقتك: 15 للحساب المجاني، 30 Plus، 60 Pro، و120 Elite، وبتشوف الباقي جوه الشات.',
            'اكتب سؤالك بشكل محدد (اسم الدرس والجزء اللي مش فاهمه) تاخد إجابة أدق.',
            'تقدر ترجع لمحادثاتك القديمة من قايمة المحادثات جوه الشات.' ] },
        { id: 'report', g: 'أدوات', ic: 'flag', title: 'الإبلاغ عن مشكلة', sel: ['#ps-rep-btn'], pts: [
            'زرار العلم ⚑ تحت أيقونة المساعد الذكي مباشرة. اضغط عليه لو حاجة مش شغالة.',
            'اكتب المشكلة بوضوح (مثال: «الفيديو مش بيشتغل في حصة كذا»). الصفحة اللي انت فيها وبياناتك بتتبعت تلقائي.',
            'البلاغ بيوصل لصفحة «بلاغات الطلاب» عند الإدارة وبيتراجع.',
            'مسموح بلاغ واحد كل دقيقة. ولو ظهرلك إن جلسة الدخول انتهت، اعمل تسجيل خروج وادخل تاني وابعت البلاغ.' ] },
        { id: 'chat', g: 'التواصل', ic: 'chat', title: 'الدردشة', sel: ['#cardChat'], pts: [
            'الولاد بيدخلوا شات الولاد والبنات شات البنات (المنصة بتحوّلك تلقائياً للشات الصح).',
            'تقدر تعمل منشن لزميلك، وزرار «منشن الكل» للإدارة بس لما الإدارة تفعّل التقييد.',
            'الإدارة ممكن تقفل الدردشة مؤقتاً أو تمسح الرسايل القديمة تلقائياً، فلو الشات مقفول هتظهرلك رسالة بالسبب.',
            'شجرة الاستريك بتظهر هنا.' ] },
        { id: 'forum', g: 'التواصل', ic: 'help', title: 'المنتدى', sel: ['#cardForum'], href: 'forum.html', pts: [
            'اسأل أي سؤال في المنهج وجاوب على أسئلة زمايلك.',
            'سؤالك بيظهر للناس بعد ما الإدارة توافق عليه، فمتقلقش لو مظهرش فوراً.' ] },
        { id: 'friends', g: 'التواصل', ic: 'users', title: 'الأصدقاء والـ ID بتاعك', sel: ['.profile-nav-btn'], href: 'profile.html', pts: [
            'كل طالب ليه رقم ثابت شكله STU-0001. بتلاقي رقمك في بروفايلك.',
            'أصحابك بيضيفوك بالـ ID ده، وبتحتاجه كمان في باقة الشلة.',
            'من بروفايلك تشوف قايمة أصحابك وتدخل على بروفايل أي صديق منهم.' ] },
        { id: 'invites', g: 'التواصل', ic: 'gift', title: 'نظام الدعوات', sel: ['#cardInvites'], href: 'invites.html', pts: [
            'خد كود الدعوة بتاعك من صفحة الدعوات وابعته لأصحابك.',
            'كل صاحب يسجّل بالكود بيقرّبك من أيام اشتراك مجانية (باقة Plus).',
            'فيه مستويات جوايز: كل ما عدد اللي دعيتهم يزيد، تقدر تستلم جايزة جديدة من نفس الصفحة.' ] },
        { id: 'parent', g: 'أدوات', ic: 'phone', title: 'تقرير ولي الأمر', href: 'profile.html', pts: [
            'اكتب رقم ولي أمرك في بروفايلك (خانة رقم هاتف ولي الأمر).',
            'الإدارة بتبعتله تقرير بسيط على واتساب: حالتك بالألوان، ووقت مذاكرتك، وامتحاناتك.',
            'التقرير ليه رابط فيه زرار «اسمع التقرير» بصوت، مناسب لو ولي الأمر مش بيقرأ كتير.' ] },
        { id: 'app', g: 'أدوات', ic: 'card', title: 'تثبيت التطبيق وإشعارات الموبايل', sel: ['#psAppCard'], href: 'profile.html', pts: [
            'تقدر تثبّت المنصة كتطبيق على موبايلك: افتح «الملف الشخصي» وهتلاقي كارت «تثبيت التطبيق والإشعارات» ظاهر دايماً: اضغط «ثبّت التطبيق» (على أندرويد والكمبيوتر). لو الزرار مش ظاهر هتلاقي الخطوات مكتوبة جواه.',
            'على آيفون: من متصفح Safari اضغط زرار المشاركة ثم «إضافة إلى الشاشة الرئيسية».',
            'فعّل الإشعارات من نفس الكارت (زرار «فعّل الإشعارات») عشان توصلك تنبيهات الامتحانات والمنافسات حتى والتطبيق مقفول. على آيفون الإشعارات بتشتغل بس لو ضفت المنصة للشاشة الرئيسية (iOS 16.4 فما فوق).',
            'التطبيق بيحتاج نت عشان يفتح.' ] }
    ];

    var GKEY = function () { return 'ps_guide_' + studentKey(); };
    function gLoad() { try { var o = JSON.parse(localStorage.getItem(GKEY())); return (o && typeof o === 'object') ? o : {}; } catch (e) { return {}; } }
    function gSave(o) { try { localStorage.setItem(GKEY(), JSON.stringify(o)); } catch (e) {} }
    function gDoneCount(o) { return TOPICS.filter(function (t) { return o.done && o.done[t.id]; }).length; }
    function markSeen(ids) {
        var o = gLoad(); o.seen = o.seen || {};
        ids.forEach(function (id) { if (id) o.seen[id] = 1; });
        gSave(o);
    }
    function today() { try { return new Date(Date.now() + 2 * 3600000).toISOString().slice(0, 10); } catch (e) { return ''; } }

    var hubCss = '' +
        '#psg-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:6px;height:38px;padding:0 12px;border-radius:20px;border:1px solid var(--border-color,#334155);background:var(--th-bg,rgba(255,255,255,.04));color:var(--text-main,#f8fafc);cursor:pointer;font:800 .78rem "Segoe UI",Tahoma,Arial,sans-serif}' +
        '#psg-btn:hover{border-color:var(--primary,#6366f1);background:var(--hover-bg,rgba(99,102,241,.1))}' +
        '#psg-btn .psg-n{background:var(--primary,#6366f1);color:#fff;border-radius:20px;padding:1px 7px;font-size:.68rem}' +
        '#psg-btn.psg-ok .psg-n{background:#10b981}' +
        '@media(max-width:480px){#psg-btn{padding:0 9px}#psg-btn>span:not(.psg-n){display:none}}' +
        '#psg-btn.psg-pulse::after{content:"";position:absolute;top:-2px;right:-2px;width:10px;height:10px;border-radius:50%;background:#f59e0b;box-shadow:0 0 0 0 rgba(245,158,11,.7);animation:psgP 1.8s infinite}' +
        '@keyframes psgP{0%{box-shadow:0 0 0 0 rgba(245,158,11,.6)}100%{box-shadow:0 0 0 10px rgba(245,158,11,0)}}' +
        '#psg-fab{position:fixed;top:12px;left:12px;z-index:99980}' +
        '#psg-ov{position:fixed;inset:0;z-index:2147482000;display:none;align-items:flex-end;justify-content:center;background:rgba(2,6,23,.7);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);direction:rtl;font-family:"Segoe UI",Tahoma,Arial,sans-serif}' +
        '#psg-ov.on{display:flex}' +
        '#psg-sheet{width:100%;max-width:600px;max-height:88vh;display:flex;flex-direction:column;background:var(--bg-card,#1e293b);color:var(--text-main,#f8fafc);border:1px solid var(--border-color,#334155);border-radius:26px 26px 0 0;box-shadow:0 -20px 60px rgba(0,0,0,.5);animation:psgUp .35s cubic-bezier(.2,.9,.3,1) both}' +
        '@keyframes psgUp{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}' +
        '@media(min-width:640px){#psg-ov{align-items:center}#psg-sheet{border-radius:26px;max-height:84vh}}' +
        '.psg-hd{padding:16px 18px 12px;border-bottom:1px solid var(--border-color,#334155)}' +
        '.psg-hd-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}' +
        '.psg-hd h2{margin:0;font-size:1.12rem;font-weight:900}' +
        '.psg-x{width:32px;height:32px;border-radius:50%;border:1px solid var(--border-color,#334155);background:transparent;color:var(--text-main,#f8fafc);cursor:pointer;font-size:1rem}' +
        '.psg-prog{height:8px;border-radius:8px;background:var(--border-color,#334155);overflow:hidden}' +
        '.psg-prog b{display:block;height:100%;width:0;border-radius:8px;background:linear-gradient(90deg,var(--primary,#6366f1),#22d3ee);transition:width .5s ease}' +
        '.psg-sub{margin:8px 0 0;font-size:.8rem;color:var(--text-muted,#94a3b8);line-height:1.7}' +
        '.psg-chips{display:flex;gap:6px;margin-top:10px}' +
        '.psg-chip{border:1px solid var(--border-color,#334155);background:transparent;color:var(--text-muted,#94a3b8);border-radius:20px;padding:5px 13px;font:700 .76rem "Segoe UI",Tahoma,Arial,sans-serif;cursor:pointer}' +
        '.psg-chip.on{background:var(--primary,#6366f1);border-color:var(--primary,#6366f1);color:#fff}' +
        '.psg-list{overflow-y:auto;padding:12px 14px 18px;flex:1}' +
        '.psg-g{margin:12px 4px 6px;font-size:.74rem;font-weight:800;color:var(--text-muted,#94a3b8);letter-spacing:.3px}' +
        '.psg-it{border:1px solid var(--border-color,#334155);border-radius:16px;margin-bottom:8px;background:var(--th-bg,rgba(255,255,255,.03));overflow:hidden}' +
        '.psg-it.done{border-color:rgba(16,185,129,.5)}' +
        '.psg-row{width:100%;display:flex;align-items:center;gap:11px;padding:11px 12px;background:none;border:none;color:inherit;cursor:pointer;text-align:right;font:inherit}' +
        '.psg-ic{flex:none;width:38px;height:38px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:rgba(99,102,241,.16);color:var(--primary,#818cf8)}' +
        '.psg-it.done .psg-ic{background:rgba(16,185,129,.16);color:#10b981}' +
        '.psg-tt{flex:1;font-weight:800;font-size:.9rem;line-height:1.5}' +
        '.psg-tag{font-size:.68rem;font-weight:800;padding:2px 9px;border-radius:20px;white-space:nowrap}' +
        '.psg-tag.ok{background:rgba(16,185,129,.16);color:#10b981}.psg-tag.seen{background:rgba(56,189,248,.16);color:#38bdf8}' +
        '.psg-body{display:none;padding:2px 14px 14px}' +
        '.psg-it.open .psg-body{display:block}' +
        '.psg-body ul{margin:0 0 12px;padding:0 18px 0 0;list-style:none}' +
        '.psg-body li{position:relative;padding:4px 14px 4px 0;font-size:.86rem;line-height:1.85;color:var(--text-muted,#cbd5e1)}' +
        '.psg-body li::before{content:"";position:absolute;right:-2px;top:.95em;width:6px;height:6px;border-radius:50%;background:var(--primary,#6366f1)}' +
        '.psg-acts{display:flex;gap:7px;flex-wrap:wrap}' +
        '.psg-a{border:1px solid var(--border-color,#334155);background:transparent;color:var(--text-main,#f8fafc);border-radius:11px;padding:8px 14px;font:800 .8rem "Segoe UI",Tahoma,Arial,sans-serif;cursor:pointer;text-decoration:none;display:inline-block}' +
        '.psg-a.pri{background:var(--primary,#6366f1);border-color:var(--primary,#6366f1);color:#fff}' +
        '.psg-a.ok{background:#10b981;border-color:#10b981;color:#fff}' +
        '.psg-end{margin:8px 0 14px;padding:14px;border-radius:16px;text-align:center;background:linear-gradient(135deg,rgba(16,185,129,.2),rgba(34,211,238,.15));border:1px solid rgba(16,185,129,.5);font-weight:800;line-height:1.8}' +
        '#psg-nudge{position:fixed;left:12px;right:12px;top:64px;margin:0 auto;max-width:430px;z-index:99985;direction:rtl;font-family:"Segoe UI",Tahoma,Arial,sans-serif;background:var(--bg-card,#1e293b);color:var(--text-main,#f8fafc);border:1px solid var(--primary,#6366f1);border-radius:18px;padding:13px 14px;box-shadow:0 14px 40px rgba(0,0,0,.45);animation:psgUp .4s ease both}' +
        '#psg-nudge b{display:block;font-size:.86rem;margin-bottom:4px}#psg-nudge span{display:block;font-size:.8rem;line-height:1.7;color:var(--text-muted,#94a3b8);margin-bottom:10px}' +
        (REDUCE ? '#psg-sheet,#psg-nudge,#psg-btn.psg-pulse::after{animation:none!important}' : '');

    var hubEl = null, hubFilter = 'all', openId = null;

    function ensureHubStyle() {
        if (document.getElementById('psg-style')) return;
        var st = el('style'); st.id = 'psg-style'; st.textContent = hubCss; document.head.appendChild(st);
    }

    function updateBtn() {
        var b = document.getElementById('psg-btn'); if (!b) return;
        var o = gLoad(), n = gDoneCount(o), all = TOPICS.length, ok = n >= all;
        if (ok) { // الطالب فهم كل المواضيع: زرار الدليل يختفي خلاص
            var fab = document.getElementById('psg-fab');
            if (fab && fab.parentNode) fab.parentNode.removeChild(fab); else if (b.parentNode) b.parentNode.removeChild(b);
            return;
        }
        b.querySelector('.psg-n').textContent = ok ? '✓' : (n + '/' + all);
        b.classList.toggle('psg-ok', ok);
        b.classList.toggle('psg-pulse', !ok);
        b.title = ok ? 'دليل المنصة (خلّصته كله)' : 'دليل المنصة: تعرّفت على ' + n + ' من ' + all;
    }

    function injectBtn() {
        if (document.getElementById('psg-btn')) return;
        if (gDoneCount(gLoad()) >= TOPICS.length) return; // خلّص الدليل كله: مفيش زرار
        ensureHubStyle();
        var b = el('button', { id: 'psg-btn', type: 'button', 'aria-label': 'دليل المنصة' },
            '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5V22h16"/></svg><span>الدليل</span><span class="psg-n">0/0</span>');
        var host = document.querySelector('.header-right-side');
        if (host) host.appendChild(b); else { b.id = 'psg-btn'; var w = el('div', { id: 'psg-fab' }); w.appendChild(b); document.body.appendChild(w); }
        b.onclick = function () { openHub(); };
        updateBtn();
    }

    function buildHub() {
        ensureHubStyle();
        hubEl = el('div', { id: 'psg-ov', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'دليل المنصة' },
            '<div id="psg-sheet"><div class="psg-hd"><div class="psg-hd-top"><h2>دليل رحلة دراسية</h2><button class="psg-x" type="button" id="psg-close" aria-label="إغلاق">✕</button></div>' +
            '<div class="psg-prog"><b id="psg-pb"></b></div><p class="psg-sub" id="psg-sub"></p>' +
            '<div class="psg-chips"><button class="psg-chip on" data-f="all" type="button">الكل</button><button class="psg-chip" data-f="todo" type="button">لسه</button><button class="psg-chip" data-f="done" type="button">خلّصت</button></div></div>' +
            '<div class="psg-list" id="psg-list"></div></div>');
        document.body.appendChild(hubEl);
        hubEl.addEventListener('click', function (e) { if (e.target === hubEl) closeHub(); });
        hubEl.querySelector('#psg-close').onclick = closeHub;
        hubEl.querySelectorAll('.psg-chip').forEach(function (c) {
            c.onclick = function () {
                hubFilter = c.getAttribute('data-f');
                hubEl.querySelectorAll('.psg-chip').forEach(function (x) { x.classList.toggle('on', x === c); });
                renderHub();
            };
        });
    }

    function renderHub() {
        var o = gLoad(), n = gDoneCount(o), all = TOPICS.length;
        hubEl.querySelector('#psg-pb').style.width = Math.round(n / all * 100) + '%';
        hubEl.querySelector('#psg-sub').textContent = n >= all
            ? 'ممتاز! عرفت كل حاجة في المنصة. الدليل هنا لو احتجت ترجع لأي نقطة.'
            : 'تعرّفت على ' + n + ' من ' + all + ' موضوع. اقرأ كل موضوع واضغط «فهمت» لحد ما تخلّص الدليل كله، وأنا معاك لحد ما تعرف المنصة تمام.';
        var list = hubEl.querySelector('#psg-list'); list.innerHTML = '';
        if (n >= all) list.appendChild(el('div', { 'class': 'psg-end' }, 'مبروك! خلّصت دليل المنصة كله. دلوقتي إنت جاهز تستخدمها بأقصى استفادة.'));
        var lastG = '', shown = 0;
        TOPICS.forEach(function (t) {
            var done = !!(o.done && o.done[t.id]), seen = !!(o.seen && o.seen[t.id]);
            if (hubFilter === 'todo' && done) return;
            if (hubFilter === 'done' && !done) return;
            shown++;
            if (t.g !== lastG) { lastG = t.g; list.appendChild(el('div', { 'class': 'psg-g' }, esc(t.g))); }
            var it = el('div', { 'class': 'psg-it' + (done ? ' done' : '') + (openId === t.id ? ' open' : ''), 'data-id': t.id });
            it.innerHTML = '<button type="button" class="psg-row"><span class="psg-ic">' + icon(t.ic) + '</span><span class="psg-tt">' + esc(t.title) + '</span>' +
                (done ? '<span class="psg-tag ok">✓ فهمت</span>' : (seen ? '<span class="psg-tag seen">شفته في الجولة</span>' : '')) + '</button>' +
                '<div class="psg-body"><ul>' + t.pts.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul><div class="psg-acts"></div></div>';
            var acts = it.querySelector('.psg-acts');
            if (t.sel && onPageTarget(t)) {
                var s = el('button', { type: 'button', 'class': 'psg-a pri' }, 'وريني مكانه'); s.onclick = function () { spotlightTopic(t); }; acts.appendChild(s);
            }
            if (t.href) { var a = el('a', { 'class': 'psg-a', href: t.href }, 'افتح الصفحة'); acts.appendChild(a); }
            var d = el('button', { type: 'button', 'class': 'psg-a ' + (done ? '' : 'ok') }, done ? 'رجّعه لـ «لسه»' : 'فهمت ✓');
            d.onclick = function () {
                var st = gLoad(); st.done = st.done || {};
                if (done) delete st.done[t.id]; else st.done[t.id] = 1;
                gSave(st); updateBtn();
                if (!done) { // افتح الموضوع اللي بعده تلقائياً
                    var i = TOPICS.indexOf(t), nx = TOPICS.slice(i + 1).concat(TOPICS.slice(0, i)).filter(function (x) { return !(st.done && st.done[x.id]); })[0];
                    openId = nx ? nx.id : null;
                }
                renderHub();
                var op = list.querySelector('.psg-it.open'); if (op && !done) { try { op.scrollIntoView({ block: 'nearest', behavior: REDUCE ? 'auto' : 'smooth' }); } catch (e) {} }
            };
            acts.appendChild(d);
            it.querySelector('.psg-row').onclick = function () { openId = (openId === t.id) ? null : t.id; renderHub(); };
            list.appendChild(it);
        });
        if (!shown && n < all) list.appendChild(el('div', { 'class': 'psg-g' }, 'مفيش مواضيع هنا.'));
    }

    function onPageTarget(t) { return !!findTarget(t.sel); }

    function openHub(topicId) {
        if (!hubEl) buildHub();
        if (topicId) openId = topicId;
        else { var o = gLoad(); var nx = TOPICS.filter(function (t) { return !(o.done && o.done[t.id]); })[0]; openId = nx ? nx.id : null; }
        hubFilter = 'all';
        hubEl.querySelectorAll('.psg-chip').forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-f') === 'all'); });
        renderHub();
        hubEl.classList.add('on');
        document.body.style.overflow = 'hidden';
        var op = hubEl.querySelector('.psg-it.open'); if (op) { try { op.scrollIntoView({ block: 'center' }); } catch (e) {} }
    }
    function closeHub() {
        if (!hubEl) return;
        hubEl.classList.remove('on'); document.body.style.overflow = '';
        updateBtn();
    }

    // نوّر على عنصر واحد في الصفحة (وضع single من نفس محرك الجولة)
    function spotlightTopic(t) {
        closeHub();
        if (root && !ended) return;
        single = true; ended = false; busy = false; idx = -1;
        build();
        introEl.classList.add('off');
        steps = [{ sel: t.sel, title: t.title, text: t.pts[0] }];
        go(0);
    }

    // تلميح يومي خفيف لحد ما الطالب يخلّص الدليل
    function maybeNudge() {
        var o = gLoad(); if (gDoneCount(o) >= TOPICS.length) return;
        o.nudge = o.nudge || {};
        if (o.nudge.day === today()) return;
        if (document.getElementById('pst-root') || document.getElementById('psg-ov') && document.getElementById('psg-ov').classList.contains('on')) return;
        if (document.getElementById('ps-maint') || document.getElementById('psIntro')) return;
        var pending = TOPICS.filter(function (t) { return !(o.done && o.done[t.id]); });
        if (!pending.length) return;
        var li = TOPICS.map(function (t) { return t.id; }).indexOf(o.nudge.last);
        var pick = pending.filter(function (t) { return TOPICS.indexOf(t) > li; })[0] || pending[0];
        o.nudge.day = today(); o.nudge.last = pick.id; gSave(o);
        ensureHubStyle();
        var n = el('div', { id: 'psg-nudge', role: 'status' },
            '<b>هل تعرف: ' + esc(pick.title) + '؟</b><span>' + esc(pick.pts[0]) + '</span>' +
            '<div class="psg-acts"><button type="button" class="psg-a pri" id="psg-nu-go">اعرف أكتر</button><button type="button" class="psg-a" id="psg-nu-x">بعدين</button></div>');
        document.body.appendChild(n);
        var kill = function () { if (n.parentNode) n.parentNode.removeChild(n); };
        n.querySelector('#psg-nu-go').onclick = function () { kill(); openHub(pick.id); };
        n.querySelector('#psg-nu-x').onclick = kill;
        setTimeout(kill, 15000);
    }

    /* ------------------------------ التشغيل ------------------------------ */
    function boot() {
        // نستنى الصفحة تستقر (الـ auth وبناء الواجهة) قبل ما نبدأ
        setTimeout(function () {
            if (!document.body || document.getElementById('ps-maint')) return; // وضع الصيانة: مفيش جولة ولا دليل
            injectBtn();
            if (TOUR) { build(); return; }
            if (params.get('guide') === '1') { openHub(); return; }
            setTimeout(maybeNudge, 7000);
        }, 900);
    }
    if (document.readyState === 'complete') boot(); else window.addEventListener('load', boot);
})();

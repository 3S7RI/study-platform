/* levels.js — نظام المستويات والتأثيرات لمنصة رحلة دراسية
 * سكريبت عادي (غير module) يُحمَّل بعد session.js ويعرّف المتغير العام LV.
 *
 *  - المستوى (Lv.1 → Lv.50) محسوب من النقاط totalScore فقط (لا حقل جديد في Firestore).
 *  - الرتب الخمس (ضعيف ← أسطوري) زي ما هي من session.js / student-service.js ولم تتغير.
 *  - كل مميزات المستويات تجميلية وفعلية: إطار الصورة، الهالة، الجزيئات، التاج، تأثير الاسم،
 *    خلفية بطاقة البروفايل، واللقب. بتظهر في البروفايل ولوحة المتصدرين والإحصائيات.
 *
 * المعادلة: النقاط المطلوبة للوصول لمستوى n  =  10 × (n-1)²
 *   Lv.2 = 10 ، Lv.5 = 160 ، Lv.10 = 810 ، Lv.20 = 3610 ، Lv.30 = 8410 ، Lv.50 = 24010
 */
(function (global) {
    'use strict';

    var MAX_LEVEL = 50;
    var K = 10;

    function pointsFor(n) { return Math.round(K * Math.pow(Math.max(1, n) - 1, 2)); }
    function levelOf(score) {
        var s = Math.max(0, Number(score) || 0);
        return Math.min(MAX_LEVEL, Math.floor(Math.sqrt(s / K)) + 1);
    }

    /* ===== الفئات (Tiers): كل فئة ليها تأثير بصري مختلف ===== */
    var TIERS = [
        { id: 1, min: 1,  name: 'مستكشف',   icon: '🌱', c1: '#94a3b8', c2: '#64748b', text: '#e2e8f0' },
        { id: 2, min: 5,  name: 'مجتهد',    icon: '📘', c1: '#e2e8f0', c2: '#60a5fa', text: '#dbeafe' },
        { id: 3, min: 10, name: 'متميز',    icon: '🔥', c1: '#fde047', c2: '#f59e0b', text: '#fef3c7' },
        { id: 4, min: 15, name: 'محترف',    icon: '💎', c1: '#22d3ee', c2: '#3b82f6', text: '#cffafe' },
        { id: 5, min: 20, name: 'خبير',     icon: '🔮', c1: '#c084fc', c2: '#6366f1', text: '#f3e8ff' },
        { id: 6, min: 30, name: 'أسطورة',   icon: '👑', c1: '#f472b6', c2: '#a855f7', text: '#fce7f3' },
        { id: 7, min: 40, name: 'إمبراطور', icon: '🏆', c1: '#fbbf24', c2: '#ec4899', text: '#fef9c3' }
    ];

    function tierOf(level) {
        var t = TIERS[0];
        for (var i = 0; i < TIERS.length; i++) { if (level >= TIERS[i].min) t = TIERS[i]; }
        return t;
    }

    /* ===== مميزات المستويات (كلها تجميلية وفعلية في المنصة) ===== */
    var PERKS = [
        { lvl: 1,  icon: '🛡️', title: 'إطار المستكشف',        desc: 'إطار رمادي هادي حوالين صورتك.' },
        { lvl: 3,  icon: '🏅', title: 'شارة المستوى',          desc: 'شارة Lv. بلون فئتك بتظهر جنب اسمك في كل مكان.' },
        { lvl: 5,  icon: '🥈', title: 'إطار فضي لامع',         desc: 'إطار فضي بلمعة متحركة + لقب «مجتهد».' },
        { lvl: 10, icon: '🔥', title: 'وهج ذهبي نابض',         desc: 'إطار ذهبي بوهج بينبض + لمعة على اسمك + لقب «متميز».' },
        { lvl: 15, icon: '💎', title: 'هالة الألماس',          desc: 'هالة سماوية متحركة + خلفية مميزة لبطاقة البروفايل + لقب «محترف».' },
        { lvl: 20, icon: '🔮', title: 'جزيئات متطايرة',        desc: 'جزيئات بتدور حوالين صورتك + اسمك بتدرج ألوان + لقب «خبير».' },
        { lvl: 25, icon: '✨', title: 'اسم متحرك',             desc: 'ألوان اسمك بتتحرك وتلمع بشكل مستمر.' },
        { lvl: 30, icon: '👑', title: 'تاج الأسطورة',          desc: 'إطار قوس قزح دوّار + تاج فوق صورتك + لقب «أسطورة».' },
        { lvl: 40, icon: '🌌', title: 'عرش الإمبراطور',        desc: 'خلفية فضائية بنجوم متلألئة + إطار كوني + لقب «إمبراطور».' },
        { lvl: 50, icon: '🏆', title: 'القمة',                 desc: 'أعلى مستوى في المنصة: كل التأثيرات مفتوحة وبأقوى شكل.' }
    ];

    function info(score) {
        var s = Math.max(0, Number(score) || 0);
        var lvl = levelOf(s);
        var cur = pointsFor(lvl);
        var maxed = lvl >= MAX_LEVEL;
        var next = maxed ? null : pointsFor(lvl + 1);
        var pct = maxed ? 100 : Math.max(0, Math.min(100, Math.round(((s - cur) / (next - cur)) * 100)));
        var nextPerk = null;
        for (var i = 0; i < PERKS.length; i++) { if (PERKS[i].lvl > lvl) { nextPerk = PERKS[i]; break; } }
        return {
            score: s, level: lvl, tier: tierOf(lvl),
            cur: cur, next: next, pct: pct, maxed: maxed,
            toNext: maxed ? 0 : Math.max(0, next - s),
            nextPerk: nextPerk,
            nextPerkPoints: nextPerk ? Math.max(0, pointsFor(nextPerk.lvl) - s) : 0
        };
    }

    /* ===== CSS مشترك (بيتحقن مرة واحدة) ===== */
    var CSS = [
        '@keyframes lvSpin{to{transform:rotate(360deg)}}',
        '@keyframes lvPulse{0%,100%{box-shadow:0 0 calc(var(--s)*.12) var(--g1)}50%{box-shadow:0 0 calc(var(--s)*.3) var(--g2)}}',
        '@keyframes lvShimmer{0%{background-position:0% 50%}100%{background-position:200% 50%}}',
        '@keyframes lvFloat{0%,100%{transform:translateX(-50%) translateY(0) rotate(-6deg)}50%{transform:translateX(-50%) translateY(-4px) rotate(6deg)}}',
        '@keyframes lvTwinkle{0%,100%{opacity:.15}50%{opacity:1}}',
        '@keyframes lvStarDrift{from{background-position:0 0,0 0,0 0}to{background-position:120px 80px,-90px 60px,60px -70px}}',

        '.lv-avatar{position:relative;width:var(--s,96px);height:var(--s,96px);flex-shrink:0;--b:max(3px,calc(var(--s)*.045));--g1:rgba(148,163,184,.4);--g2:rgba(148,163,184,.7)}',
        '.lv-avatar>img{position:absolute;inset:var(--b);width:calc(100% - var(--b)*2);height:calc(100% - var(--b)*2);border-radius:50%;object-fit:cover;background:#334155;z-index:3;display:block}',
        '.lv-ring{position:absolute;inset:0;border-radius:50%;z-index:1}',
        '.lv-orbit{position:absolute;inset:0;z-index:4;pointer-events:none;animation:lvSpin 7s linear infinite}',
        '.lv-orbit i{position:absolute;left:50%;top:50%;width:max(4px,calc(var(--s)*.06));height:max(4px,calc(var(--s)*.06));margin:calc(var(--s)*-.03) 0 0 calc(var(--s)*-.03);border-radius:50%;transform:rotate(var(--a)) translateY(calc(var(--s)/-2 - var(--s)*.05));background:var(--dot,#fff);box-shadow:0 0 8px var(--dot,#fff)}',
        '.lv-crown{position:absolute;left:50%;top:calc(var(--s)*-.27);font-size:calc(var(--s)*.34);line-height:1;z-index:6;transform:translateX(-50%);animation:lvFloat 3s ease-in-out infinite;filter:drop-shadow(0 2px 6px rgba(0,0,0,.5))}',
        '.lv-extra{position:absolute;z-index:7}',

        /* الفئة 1: مستكشف */
        '.lv-t1 .lv-ring{background:linear-gradient(135deg,#94a3b8,#475569)}',
        /* الفئة 2: مجتهد (فضي لامع) */
        '.lv-t2 .lv-ring{background:linear-gradient(120deg,#f1f5f9,#60a5fa,#e2e8f0,#94a3b8,#f1f5f9);background-size:250% 250%;animation:lvShimmer 3.5s linear infinite;box-shadow:0 0 calc(var(--s)*.14) rgba(147,197,253,.55)}',
        /* الفئة 3: متميز (ذهبي نابض) */
        '.lv-t3{--g1:rgba(251,191,36,.45);--g2:rgba(251,191,36,.95)}',
        '.lv-t3 .lv-ring{background:linear-gradient(135deg,#fef08a,#f59e0b,#b45309,#fde047);animation:lvPulse 2.2s ease-in-out infinite}',
        /* الفئة 4: محترف (ألماس) */
        '.lv-t4{--g1:rgba(34,211,238,.5);--g2:rgba(59,130,246,.95)}',
        '.lv-t4 .lv-ring{background:conic-gradient(from 0deg,#22d3ee,#3b82f6,#e0f2fe,#22d3ee);animation:lvSpin 6s linear infinite,lvPulse 2.4s ease-in-out infinite}',
        /* الفئة 5: خبير (جزيئات) */
        '.lv-t5{--g1:rgba(168,85,247,.5);--g2:rgba(99,102,241,1);--dot:#e9d5ff}',
        '.lv-t5 .lv-ring{background:conic-gradient(from 0deg,#6366f1,#a855f7,#22d3ee,#6366f1);animation:lvSpin 4.5s linear infinite,lvPulse 2.2s ease-in-out infinite}',
        /* الفئة 6: أسطورة (قوس قزح + تاج) */
        '.lv-t6{--g1:rgba(244,114,182,.55);--g2:rgba(168,85,247,1);--dot:#fbcfe8}',
        '.lv-t6 .lv-ring{background:conic-gradient(from 0deg,#ef4444,#f59e0b,#fde047,#22c55e,#06b6d4,#6366f1,#d946ef,#ef4444);animation:lvSpin 3.2s linear infinite,lvPulse 2s ease-in-out infinite}',
        /* الفئة 7: إمبراطور (كوني) */
        '.lv-t7{--g1:rgba(251,191,36,.6);--g2:rgba(236,72,153,1);--dot:#fef08a}',
        '.lv-t7 .lv-ring{background:conic-gradient(from 0deg,#fbbf24,#ec4899,#7c3aed,#22d3ee,#fbbf24,#ec4899,#fbbf24);animation:lvSpin 2.4s linear infinite,lvPulse 1.6s ease-in-out infinite}',
        '.lv-t7 .lv-orbit{animation-duration:4.5s}',
        '.lv-spark{position:absolute;z-index:6;font-size:calc(var(--s)*.18);animation:lvTwinkle 1.8s ease-in-out infinite;pointer-events:none}',

        /* شارة المستوى */
        '.lv-badge{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:.72rem;font-weight:800;white-space:nowrap;border:1px solid rgba(255,255,255,.22);color:#fff;line-height:1.5}',
        '.lv-badge b{font-size:.74rem;font-weight:900;letter-spacing:.3px}',
        '.lv-bt1{background:linear-gradient(135deg,#475569,#1e293b);color:#e2e8f0}',
        '.lv-bt2{background:linear-gradient(135deg,#475569,#1d4ed8);color:#dbeafe}',
        '.lv-bt3{background:linear-gradient(135deg,#b45309,#78350f);color:#fef3c7;box-shadow:0 0 10px rgba(251,191,36,.35)}',
        '.lv-bt4{background:linear-gradient(135deg,#0e7490,#1d4ed8);color:#cffafe;box-shadow:0 0 12px rgba(34,211,238,.4)}',
        '.lv-bt5{background:linear-gradient(135deg,#6d28d9,#3730a3);color:#f3e8ff;box-shadow:0 0 14px rgba(168,85,247,.5)}',
        '.lv-bt6{background:linear-gradient(135deg,#be185d,#6d28d9);color:#fce7f3;box-shadow:0 0 16px rgba(244,114,182,.55)}',
        '.lv-bt7{background:linear-gradient(135deg,#d97706,#be185d,#6d28d9);color:#fef9c3;box-shadow:0 0 18px rgba(251,191,36,.6)}',

        /* تأثيرات الاسم */
        '.lv-name-t3{background:linear-gradient(100deg,currentColor 40%,#fde047 50%,currentColor 60%);background-size:250% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:lvShimmer 3.2s linear infinite}',
        '.lv-name-t4{background:linear-gradient(100deg,currentColor 40%,#67e8f9 50%,currentColor 60%);background-size:250% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:lvShimmer 3s linear infinite}',
        '.lv-name-t5{background:linear-gradient(90deg,#a78bfa,#22d3ee,#a78bfa);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}',
        '.lv-name-t6,.lv-name-t7{background:linear-gradient(90deg,#f472b6,#fbbf24,#22d3ee,#a78bfa,#f472b6);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:lvShimmer 3.5s linear infinite}',
        '.lv-name-t7{background-image:linear-gradient(90deg,#fde047,#fb7185,#c084fc,#fde047,#fb7185)}',

        /* خلفية بطاقة البروفايل حسب الفئة */
        '.lv-card-t4{background-image:radial-gradient(120% 60% at 50% 0%,rgba(34,211,238,.16),transparent 70%)!important}',
        '.lv-card-t5{background-image:radial-gradient(120% 60% at 50% 0%,rgba(168,85,247,.22),transparent 70%),radial-gradient(80% 50% at 50% 100%,rgba(99,102,241,.14),transparent 70%)!important}',
        '.lv-card-t6{background-image:radial-gradient(120% 60% at 20% 0%,rgba(244,114,182,.22),transparent 65%),radial-gradient(120% 60% at 80% 0%,rgba(99,102,241,.25),transparent 65%)!important}',
        '.lv-card-t7{background-color:#0b1020!important;background-image:radial-gradient(2px 2px at 20px 30px,#fff,transparent),radial-gradient(1.5px 1.5px at 90px 80px,#fde68a,transparent),radial-gradient(2px 2px at 150px 20px,#fbcfe8,transparent),radial-gradient(120% 60% at 50% 0%,rgba(251,191,36,.18),transparent 70%),radial-gradient(100% 60% at 50% 100%,rgba(124,58,237,.28),transparent 70%)!important;background-size:170px 110px,170px 110px,170px 110px,100% 100%,100% 100%!important;animation:lvStarDrift 40s linear infinite;border-color:rgba(251,191,36,.45)!important}',

        /* شريط التقدم */
        '.lv-xp{width:100%;text-align:right}',
        '.lv-xp-top{display:flex;justify-content:space-between;align-items:center;font-size:.74rem;font-weight:700;margin-bottom:5px;gap:8px}',
        '.lv-xp-bar{height:9px;border-radius:9px;background:rgba(148,163,184,.22);overflow:hidden;position:relative}',
        '.lv-xp-fill{height:100%;border-radius:9px;background:linear-gradient(90deg,var(--c1),var(--c2));box-shadow:0 0 10px var(--c2);transition:width .8s ease}',
        '.lv-xp-note{font-size:.7rem;opacity:.75;margin-top:5px}',

        /* قائمة المميزات */
        '.lv-perk{display:flex;gap:10px;align-items:center;padding:9px 10px;border-radius:12px;border:1px solid rgba(148,163,184,.25);margin-bottom:7px;background:rgba(148,163,184,.06)}',
        '.lv-perk.on{border-color:rgba(16,185,129,.5);background:rgba(16,185,129,.09)}',
        '.lv-perk.lock{opacity:.6}',
        '.lv-perk-ic{font-size:1.4rem;width:34px;text-align:center;flex-shrink:0}',
        '.lv-perk-t{font-size:.82rem;font-weight:800}',
        '.lv-perk-d{font-size:.72rem;opacity:.8;line-height:1.5;margin-top:2px}',
        '.lv-perk-l{margin-right:auto;font-size:.7rem;font-weight:800;padding:2px 8px;border-radius:10px;background:rgba(99,102,241,.2);white-space:nowrap}',

        '@media (prefers-reduced-motion:reduce){.lv-ring,.lv-orbit,.lv-crown,.lv-spark,.lv-name-t3,.lv-name-t4,.lv-name-t6,.lv-name-t7,.lv-card-t7{animation:none!important}}'
    ].join('\n');

    var injected = false;
    function injectCss() {
        if (injected) return;
        injected = true;
        try {
            var st = document.createElement('style');
            st.id = 'lv-shared-css';
            st.textContent = CSS;
            (document.head || document.documentElement).appendChild(st);
        } catch (e) {}
    }

    function escAttr(v) { return String(v === undefined || v === null ? '' : v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

    /** صورة بإطار المستوى. opts: {id, extra(html), alt} */
    function avatar(src, level, size, opts) {
        injectCss();
        opts = opts || {};
        level = Math.max(1, Math.min(MAX_LEVEL, Number(level) || 1));
        size = size || 96;
        var t = tierOf(level);
        var orbit = '';
        if (t.id >= 5) {
            var dots = t.id === 5 ? 3 : (t.id === 6 ? 5 : 7);
            orbit = '<span class="lv-orbit">';
            for (var i = 0; i < dots; i++) orbit += '<i style="--a:' + Math.round((360 / dots) * i) + 'deg"></i>';
            orbit += '</span>';
        }
        var crown = t.id >= 6 ? '<span class="lv-crown">👑</span>' : '';
        var sparks = '';
        if (t.id === 7) {
            sparks = '<span class="lv-spark" style="top:-4%;right:-6%">✨</span><span class="lv-spark" style="bottom:2%;left:-8%;animation-delay:.9s">✨</span>';
        }
        return '<div class="lv-avatar lv-t' + t.id + '" style="--s:' + size + 'px">' +
            '<span class="lv-ring"></span>' + orbit +
            '<img' + (opts.id ? ' id="' + escAttr(opts.id) + '"' : '') + ' src="' + escAttr(src) + '" alt="' + escAttr(opts.alt || 'صورة الطالب') + '" loading="lazy">' +
            crown + sparks + (opts.extra || '') +
            '</div>';
    }

    function badge(level) {
        injectCss();
        level = Math.max(1, Math.min(MAX_LEVEL, Number(level) || 1));
        var t = tierOf(level);
        return '<span class="lv-badge lv-bt' + t.id + '"><b>Lv.' + level + '</b><span>' + t.icon + ' ' + t.name + '</span></span>';
    }

    function nameClass(level) {
        var t = tierOf(Number(level) || 1).id;
        if (t >= 6) return t === 7 ? 'lv-name-t7' : 'lv-name-t6';
        if (t === 5) return (Number(level) >= 25) ? 'lv-name-t6' : 'lv-name-t5';
        if (t === 4) return 'lv-name-t4';
        if (t === 3) return 'lv-name-t3';
        return '';
    }

    function cardClass(level) {
        var t = tierOf(Number(level) || 1).id;
        return t >= 4 ? 'lv-card-t' + t : '';
    }

    /** شريط التقدم نحو المستوى الجاي */
    function progressHtml(score) {
        injectCss();
        var i = info(score);
        var t = i.tier;
        var note = i.maxed
            ? '🏆 وصلت لأعلى مستوى في المنصة!'
            : 'باقي ' + i.toNext + ' نقطة للمستوى ' + (i.level + 1) +
              (i.nextPerk ? ' • أقرب ميزة: ' + i.nextPerk.icon + ' ' + i.nextPerk.title + ' (Lv.' + i.nextPerk.lvl + ')' : '');
        return '<div class="lv-xp" style="--c1:' + t.c1 + ';--c2:' + t.c2 + '">' +
            '<div class="lv-xp-top"><span>Lv.' + i.level + '</span><span>' + i.score + (i.next ? ' / ' + i.next : '') + ' نقطة</span><span>' + (i.maxed ? 'MAX' : 'Lv.' + (i.level + 1)) + '</span></div>' +
            '<div class="lv-xp-bar"><div class="lv-xp-fill" style="width:' + i.pct + '%"></div></div>' +
            '<div class="lv-xp-note">' + note + '</div></div>';
    }

    /** قائمة مميزات كل المستويات (المفتوح والمقفول) */
    function perksHtml(level) {
        injectCss();
        level = Number(level) || 1;
        return PERKS.map(function (p) {
            var on = level >= p.lvl;
            return '<div class="lv-perk ' + (on ? 'on' : 'lock') + '">' +
                '<div class="lv-perk-ic">' + (on ? p.icon : '🔒') + '</div>' +
                '<div><div class="lv-perk-t">' + p.title + '</div><div class="lv-perk-d">' + p.desc + '</div></div>' +
                '<div class="lv-perk-l">' + (on ? 'مفتوحة ✅' : 'Lv.' + p.lvl + ' • ' + pointsFor(p.lvl) + ' نقطة') + '</div></div>';
        }).join('');
    }

    /** اسم مختصر للعرض العام: الاسم الأول + أول حرف من الثاني */
    function shortName(full) {
        var parts = String(full || '').trim().split(/\s+/).filter(Boolean);
        if (!parts.length) return 'طالب';
        return parts[0] + (parts[1] ? ' ' + parts[1].charAt(0) + '.' : '');
    }

    global.LV = {
        MAX_LEVEL: MAX_LEVEL, TIERS: TIERS, PERKS: PERKS,
        pointsFor: pointsFor, levelOf: levelOf, tierOf: tierOf, info: info,
        injectCss: injectCss, avatar: avatar, badge: badge,
        nameClass: nameClass, cardClass: cardClass,
        progressHtml: progressHtml, perksHtml: perksHtml, shortName: shortName
    };
    injectCss();
})(window);

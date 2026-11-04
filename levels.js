/* levels.js — نظام المستويات والتأثيرات لمنصة رحلة دراسية
 * سكريبت عادي (غير module) يُحمَّل بعد session.js ويعرّف المتغير العام LV.
 *
 *  - المستوى (Lv.1 → Lv.50) محسوب من النقاط totalScore فقط (لا حقل جديد في Firestore).
 *  - الرتب الخمس القديمة (ضعيف ← أسطوري) اتشالت من العرض: المستوى (Lv.1-50) هو الأساس.
 *  - كل الأيقونات SVG (LV.icon) بدل الإيموجي.
 *  - مميزات كل 5 مستويات: خلفية صورة (30)، لقب مخصص (35)، لون البروفايل (45).
 *  - كل مميزات المستويات تجميلية وفعلية: إطار الصورة، الهالة، الجزيئات، التاج، تأثير الاسم،
 *    خلفية بطاقة البروفايل، واللقب. بتظهر في البروفايل ولوحة المتصدرين والإحصائيات.
 *
 * المعادلة: النقاط المطلوبة للوصول لمستوى n  =  25 × (n-1)^1.6 (مقرّبة لأقرب 5)
 *   Lv.2 = 25 ، Lv.5 = 230 ، Lv.10 = 840 ، Lv.20 = 2780 ، Lv.30 = 5470 ، Lv.50 = 12600
 */
(function (global) {
    'use strict';

    var MAX_LEVEL = 50;
    var K = 25, P = 1.6;

    /* منحنى مستويات متدرّج: لازم يفضل متطابق مع session.js و student-service.js */
    function pointsFor(n) { return Math.round(K * Math.pow(Math.max(1, n) - 1, P) / 5) * 5; }
    function levelOf(score) {
        var s = Math.max(0, Number(score) || 0), l = 1;
        while (l < MAX_LEVEL && s >= pointsFor(l + 1)) l++;
        return l;
    }

    /* ===== أيقونات SVG (بدل الإيموجي) — stroke بلون النص الحالي ===== */
    var ICONS = {
        sprout: '<path d="M12 21v-8"/><path d="M12 13c0-4 3-6 7-6 0 4-3 6-7 6zM12 15c0-3-2-5-6-5 0 3 2 5 6 5z"/>',
        book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M19 19v2H6"/>',
        flame: '<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z"/>',
        gem: '<path d="M6 3h12l3 6-9 12L3 9z"/><path d="M3 9h18M9 3l3 18M15 3l-3 18"/>',
        orb: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
        crown: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>',
        trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v4M8 21h8M9 17h6"/>',
        shield: '<path d="M12 3l8 3v6c0 4.5-3.2 8.2-8 9-4.8-.8-8-4.5-8-9V6z"/>',
        medal: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14.5L7 21l5-3 5 3-1.5-6.5"/>',
        star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
        moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
        image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 9"/>',
        tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.2"/>',
        palette: '<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.5-2-.6-1.2.2-2.5 1.6-2.5H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',
        lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
        check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
        settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
        users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
        inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1z"/>',
        search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
        card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
        copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
        camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
        logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
        bolt: '<path d="M13 2L3 14h9l-1 8 10-12h-9z"/>',
        gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v9H5v-9M7.5 8a2.5 2.5 0 1 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 1 1 0 5"/>',
        save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
        trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/>',
        alert: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/>',
        info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
        chevron: '<path d="M9 6l6 6-6 6"/>',
        user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
        message: '<path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.4A8 8 0 1 1 21 12z"/>',
        send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>',
        ban: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
        x: '<path d="M18 6L6 18M6 6l12 12"/>',
        folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
        chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>'
    };
    function svg(name, size) {
        var s = size || '1em';
        return '<svg class="lv-i" viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || ICONS.star) + '</svg>';
    }

    /* ===== الفئات (Tiers): كل فئة ليها تأثير بصري مختلف ===== */
    var TIERS = [
        { id: 1, min: 1,  name: 'مستكشف',   icon: svg('sprout'), c1: '#94a3b8', c2: '#64748b', text: '#e2e8f0' },
        { id: 2, min: 5,  name: 'مجتهد',    icon: svg('book'), c1: '#e2e8f0', c2: '#60a5fa', text: '#dbeafe' },
        { id: 3, min: 10, name: 'متميز',    icon: svg('flame'), c1: '#fde047', c2: '#f59e0b', text: '#fef3c7' },
        { id: 4, min: 15, name: 'محترف',    icon: svg('gem'), c1: '#22d3ee', c2: '#3b82f6', text: '#cffafe' },
        { id: 5, min: 20, name: 'خبير',     icon: svg('orb'), c1: '#c084fc', c2: '#6366f1', text: '#f3e8ff' },
        { id: 6, min: 30, name: 'أسطورة',   icon: svg('crown'), c1: '#f472b6', c2: '#a855f7', text: '#fce7f3' },
        { id: 7, min: 40, name: 'إمبراطور', icon: svg('trophy'), c1: '#fbbf24', c2: '#ec4899', text: '#fef9c3' }
    ];

    function tierOf(level) {
        var t = TIERS[0];
        for (var i = 0; i < TIERS.length; i++) { if (level >= TIERS[i].min) t = TIERS[i]; }
        return t;
    }

    /* ===== مميزات المستويات (كلها تجميلية وفعلية في المنصة) ===== */
    var PERKS = [
        { lvl: 1,  icon: svg('shield'),  title: 'إطار المستكشف',      desc: 'إطار هادي حوالين صورتك من أول يوم.' },
        { lvl: 5,  icon: svg('medal'),   title: 'إطار فضي لامع',      desc: 'إطار فضي بلمعة متحركة + لقب «مجتهد».' },
        { lvl: 10, icon: svg('flame'),   title: 'وهج ذهبي نابض',      desc: 'إطار ذهبي بوهج بينبض + لمعة على اسمك + لقب «متميز».' },
        { lvl: 15, icon: svg('gem'),     title: 'هالة الألماس',       desc: 'هالة سماوية متحركة + خلفية مميزة لبطاقة البروفايل + لقب «محترف».' },
        { lvl: 20, icon: svg('orb'),     title: 'جزيئات متطايرة',     desc: 'جزيئات بتدور حوالين صورتك + اسمك بتدرج ألوان + لقب «خبير».' },
        { lvl: 25, icon: svg('star'),    title: 'اسم متحرك',          desc: 'ألوان اسمك بتتحرك وتلمع بشكل مستمر.' },
        { lvl: 30, icon: svg('image'),   title: 'صورة خلفية للبروفايل', desc: 'تاج + إطار قوس قزح، وتقدر ترفع صورة خلفية خاصة بيك ورا صورتك (من زر التعديل).' },
        { lvl: 35, icon: svg('tag'),     title: 'لقب من اختيارك',     desc: 'اكتب لقبك الخاص (لحد 20 حرف) وبيظهر تحت اسمك بدل لقب المستوى.' },
        { lvl: 40, icon: svg('moon'),    title: 'عرش الإمبراطور',     desc: 'خلفية فضائية بنجوم متلألئة + إطار كوني + لقب «إمبراطور».' },
        { lvl: 45, icon: svg('palette'), title: 'لون البروفايل',      desc: 'اختار لون البروفايل والإطار والتقدم اللي يعجبك.' },
        { lvl: 50, icon: svg('trophy'),  title: 'القمة',              desc: 'أعلى مستوى في المنصة: كل التأثيرات والمميزات مفتوحة بأقوى شكل.' }
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
        '.lv-i{width:1em;height:1em;flex-shrink:0;vertical-align:-.14em}',
        '.lv-crown{color:#fbbf24}.lv-crown .lv-i{width:1em;height:1em;fill:rgba(251,191,36,.55);stroke-width:2.2}',
        '.lv-spark{color:#fde68a}.lv-spark .lv-i{fill:currentColor}',
        '.lv-perk-ic .lv-i{width:20px;height:20px}',
        '.lv-perk-l{display:flex;align-items:center;gap:4px}',
        '.lv-badge .lv-i{margin-inline-end:2px}',
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
        '.lv-crown{position:absolute;left:50%;top:calc(var(--s)*-.36);font-size:max(18px,calc(var(--s)*.5));line-height:1;z-index:8;transform:translateX(-50%);animation:lvFloat 3s ease-in-out infinite;filter:drop-shadow(0 2px 6px rgba(0,0,0,.5))}',
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
        var crown = t.id >= 6 ? '<span class="lv-crown">' + svg('crown') + '</span>' : '';
        var sparks = '';
        if (t.id === 7) {
            sparks = '<span class="lv-spark" style="top:-4%;right:-6%">' + svg('star') + '</span><span class="lv-spark" style="bottom:2%;left:-8%;animation-delay:.9s">' + svg('star') + '</span>';
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
            ? 'وصلت لأعلى مستوى في المنصة'
            : 'باقي ' + i.toNext + ' نقطة للمستوى ' + (i.level + 1) +
              (i.nextPerk ? ' • أقرب ميزة: ' + i.nextPerk.title + ' (Lv.' + i.nextPerk.lvl + ')' : '');
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
                '<div class="lv-perk-ic">' + (on ? p.icon : svg('lock')) + '</div>' +
                '<div><div class="lv-perk-t">' + p.title + '</div><div class="lv-perk-d">' + p.desc + '</div></div>' +
                '<div class="lv-perk-l">' + (on ? svg('check') + ' مفتوحة' : 'Lv.' + p.lvl + ' • ' + pointsFor(p.lvl) + ' نقطة') + '</div></div>';
        }).join('');
    }

    /** اسم مختصر للعرض العام: الاسم الأول + أول حرف من الثاني */
    function shortName(full) {
        var parts = String(full || '').trim().split(/\s+/).filter(Boolean);
        if (!parts.length) return 'طالب';
        return parts[0] + (parts[1] ? ' ' + parts[1].charAt(0) + '.' : '');
    }

    global.LV = {
        icon: svg, ICONS: ICONS,
        MAX_LEVEL: MAX_LEVEL, TIERS: TIERS, PERKS: PERKS,
        pointsFor: pointsFor, levelOf: levelOf, tierOf: tierOf, info: info,
        injectCss: injectCss, avatar: avatar, badge: badge,
        nameClass: nameClass, cardClass: cardClass,
        progressHtml: progressHtml, perksHtml: perksHtml, shortName: shortName
    };
    injectCss();
})(window);

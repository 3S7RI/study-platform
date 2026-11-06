/* ======================================================================
 * plans.js — نظام الباقات (Plus / Pro / Elite)
 * سكريبت عادي (مش module) بيعمل window.PSPlans، ولازم يتحمّل قبل session.js.
 * الإعدادات الافتراضية تحت، والأدمن يعدّلها من admin-plans.html (وثيقة config/plans).
 * ====================================================================== */
(function (global) {
    'use strict';
    var DAY = 86400000;
    var LS_KEY = 'ps_plans_cfg';

    var DEFAULTS = {
        legacyTier: 'pro',          // اشتراكات VIP القديمة (من غير planTier) بتتعامل كأنها Pro لحد ما تنتهي
        trial: { tier: 'pro' },     // التجربة المجانية 24 ساعة بتفتح Pro
        free: { aiDaily: 15 },
        promo: { enabled: false, percent: 0, label: '', endsAt: 0, tiers: [] }, // عرض عام: خصم % على الكل أو على باقات محددة
        tiers: {
            plus: {
                name: 'Plus', rank: 1, color: '#38bdf8', badge: '', base28: 79,
                limits: { lessonBonus: 0, examBonus: 0, aiDaily: 30 },
                features: [
                    { t: 'دخول الحصة (فيديو / ملزمة / ملخص): 5 مرات لكل حصة' },
                    { t: 'محاولات امتحان الحصة حسب إعداد المعلم' },
                    { t: 'الامتحانات الشاملة' },
                    { t: 'المساعد الذكي: 30 سؤال يومياً' },
                    { t: 'الشات والمنتدى' },
                    { t: 'كراسة الأخطاء' },
                    { t: 'إحصائيات أساسية' },
                    { t: 'منافسات الـ VIP' },
                    { t: 'دعم عادي' }
                ]
            },
            pro: {
                name: 'Pro', rank: 2, color: '#fbbf24', badge: 'PRO', popular: true, base28: 119,
                limits: { lessonBonus: 3, examBonus: 1, aiDaily: 60 },
                features: [
                    { t: 'دخول الحصة: 8 مرات لكل حصة' },
                    { t: '+1 محاولة زيادة في كل امتحان حصة' },
                    { t: 'الامتحانات الشاملة' },
                    { t: 'المساعد الذكي: 60 سؤال يومياً' },
                    { t: 'الشات والمنتدى + شارة Pro' },
                    { t: 'كراسة الأخطاء' },
                    { t: 'إحصائيات كاملة' },
                    { t: 'منافسات الـ VIP' },
                    { t: 'دعم بأولوية' }
                ]
            },
            elite: {
                name: 'Elite', rank: 3, color: '#a78bfa', badge: 'ELITE', base28: 179,
                limits: { lessonBonus: 10, examBonus: 2, aiDaily: 120 },
                features: [
                    { t: 'دخول الحصة: 15 مرة لكل حصة' },
                    { t: '+2 محاولة زيادة في كل امتحان حصة' },
                    { t: 'الامتحانات الشاملة' },
                    { t: 'المساعد الذكي: 120 سؤال يومياً' },
                    { t: 'الشات والمنتدى + شارة Elite' },
                    { t: 'كراسة الأخطاء' },
                    { t: 'إحصائيات كاملة + مقارنة بالمتصدرين' },
                    { t: 'منافسات الـ VIP' },
                    { t: 'دعم مباشر على واتساب' }
                ]
            }
        },
        // باقة الشلة: مجموعة طلاب (الليدر + أصحابه) بتشتري Pro بسعر مخفّض للفرد. كل عضو بياخد مميزات Pro كاملة.
        // الأسعار تقدر تتعدل من config/plans (حقل groups) من غير تعديل الكود.
        groups: [
            { id: 'grp3_28', tier: 'pro', size: 3, days: 28, price: 249, label: 'شلة 3 طلاب - 28 يوم' },
            { id: 'grp5_28', tier: 'pro', size: 5, days: 28, price: 379, label: 'شلة 5 طلاب - 28 يوم' },
            { id: 'grp3_90', tier: 'pro', size: 3, days: 90, price: 649, label: 'شلة 3 طلاب - 3 شهور' },
            { id: 'grp5_90', tier: 'pro', size: 5, days: 90, price: 949, label: 'شلة 5 طلاب - 3 شهور' }
        ],
        options: [
            { id: 'plus_7',    tier: 'plus',  days: 7,   price: 25,  label: '7 أيام' },
            { id: 'plus_28',   tier: 'plus',  days: 28,  price: 79,  label: '28 يوم' },
            { id: 'plus_90',   tier: 'plus',  days: 90,  price: 199, label: '3 شهور' },
            { id: 'pro_7',     tier: 'pro',   days: 7,   price: 39,  label: 'أسبوع الامتحانات (7 أيام)' },
            { id: 'pro_28',    tier: 'pro',   days: 28,  price: 119, label: '28 يوم' },
            { id: 'pro_90',    tier: 'pro',   days: 90,  price: 299, label: '3 شهور' },
            { id: 'pro_150',   tier: 'pro',   days: 150, price: 449, label: 'حتى آخر الترم (150 يوم)' },
            { id: 'elite_28',  tier: 'elite', days: 28,  price: 179, label: '28 يوم' },
            { id: 'elite_90',  tier: 'elite', days: 90,  price: 449, label: '3 شهور' },
            { id: 'elite_150', tier: 'elite', days: 150, price: 649, label: 'حتى آخر الترم (150 يوم)' }
        ]
    };

    function clone(o) { return JSON.parse(JSON.stringify(o)); }
    function merge(base, over) {
        if (!over || typeof over !== 'object') return base;
        Object.keys(over).forEach(function (k) {
            var v = over[k];
            if (Array.isArray(v)) base[k] = clone(v);
            else if (v && typeof v === 'object' && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) merge(base[k], v);
            else base[k] = v;
        });
        return base;
    }

    var cfg = clone(DEFAULTS);
    try { var cached = global.localStorage.getItem(LS_KEY); if (cached) merge(cfg, JSON.parse(cached)); } catch (e) {}

    var P = {
        DEFAULTS: DEFAULTS,
        config: function () { return cfg; },
        /** يدمج إعدادات جاية من Firestore ويحفظ نسخة محلية للصفحات اللي مش بتقرأ Firestore */
        setConfig: function (over) {
            cfg = merge(clone(DEFAULTS), over || {});
            try { global.localStorage.setItem(LS_KEY, JSON.stringify(over || {})); } catch (e) {}
            return cfg;
        },
        /** getDoc/doc من firebase-firestore بتتبعت من الصفحة */
        refresh: function (db, getDoc, doc) {
            return getDoc(doc(db, 'config', 'plans')).then(function (s) { if (s.exists()) P.setConfig(s.data()); return cfg; }).catch(function () { return cfg; });
        },
        tiers: function () { return Object.keys(cfg.tiers).sort(function (a, b) { return cfg.tiers[a].rank - cfg.tiers[b].rank; }); },
        tier: function (k) { return cfg.tiers[k] || null; },
        rank: function (k) { return cfg.tiers[k] ? Number(cfg.tiers[k].rank) || 0 : 0; },

        /** الاشتراك ساري؟ */
        isActive: function (d) {
            if (!d) return false;
            if (d.subscriptionExpiry) { var t = new Date(d.subscriptionExpiry).getTime(); return !isNaN(t) && t > Date.now(); }
            return d.isSubscribed === true || d.accountType === 'vip' || d.accountType === 'trial';
        },
        /** مفتاح الباقة الحالية للطالب: plus / pro / elite أو null لو مجاني */
        tierOf: function (d) {
            if (!P.isActive(d)) return null;
            if (d.accountType === 'trial') return cfg.trial.tier;
            if (d.planTier && cfg.tiers[d.planTier]) return d.planTier;
            return cfg.legacyTier;
        },
        hasTier: function (d, min) { return P.rank(P.tierOf(d)) >= P.rank(min); },
        /** حدود الطالب الحالية */
        limits: function (d) {
            var k = P.tierOf(d);
            var l = k ? cfg.tiers[k].limits : { lessonBonus: 0, examBonus: 0, aiDaily: cfg.free.aiDaily };
            return { lessonBonus: Number(l.lessonBonus) || 0, examBonus: Number(l.examBonus) || 0, aiDaily: Number(l.aiDaily) || 0, tier: k };
        },

        /** سعر الخيار بعد العرض العام (promo) — بيرجّع { price, original, promoPct } */
        priceOf: function (opt) {
            var pr = cfg.promo || {}, pct = 0;
            if (pr.enabled && Number(pr.percent) > 0 && (!pr.endsAt || Number(pr.endsAt) > Date.now()) &&
                (!pr.tiers || !pr.tiers.length || pr.tiers.indexOf(opt.tier) !== -1)) pct = Math.min(90, Number(pr.percent));
            var price = pct ? Math.max(1, Math.round(opt.price * (100 - pct) / 100)) : opt.price;
            return { price: price, original: opt.price, promoPct: pct };
        },
        /** نسبة التوفير مقارنة بالشراء بمدة أقصر في نفس الباقة */
        discountOf: function (opt) {
            var t = cfg.tiers[opt.tier]; if (!t) return 0;
            var ref = 0;
            if (opt.days > 28) ref = (Number(t.base28) / 28) * opt.days;
            else if (opt.days === 28) {
                var wk = cfg.options.filter(function (o) { return o.tier === opt.tier && o.days === 7; })[0];
                if (wk) ref = wk.price * 4;
            }
            if (!ref || opt.price >= ref) return 0;
            return Math.round((1 - opt.price / ref) * 100);
        },
        optionsOf: function (tier) { return cfg.options.filter(function (o) { return o.tier === tier; }).sort(function (a, b) { return a.days - b.days; }); },
        optionById: function (id) { return cfg.options.filter(function (o) { return o.id === id; })[0] || P.groupById(id); },
        groups: function () { return (cfg.groups || []).slice().sort(function (a, b) { return a.size - b.size || a.days - b.days; }); },
        groupById: function (id) { return (cfg.groups || []).filter(function (o) { return o.id === id; })[0] || null; },
        /** نسبة توفير الشلة مقارنة بشراء كل عضو لنفسه Pro بنفس المدة (بسعر الـ 28 يوم الأساسي) */
        groupDiscountOf: function (g) {
            var t = cfg.tiers[g.tier]; if (!t) return 0;
            var same = cfg.options.filter(function (o) { return o.tier === g.tier && o.days === g.days; })[0];
            var ind = (same ? Number(same.price) : (Number(t.base28) / 28) * g.days) * g.size;
            return ind > g.price ? Math.round((1 - g.price / ind) * 100) : 0;
        },
        daysText: function (n) { return n === 7 ? '7 أيام' : n === 28 ? '28 يوم' : n === 90 ? '3 شهور' : n === 150 ? 'حتى آخر الترم' : n + ' يوم'; },

        /**
         * يحسب حقول التحديث لمنح اشتراك (باقة + أيام) على وثيقة الطالب.
         * - مفيش اشتراك ساري: الباقة الجديدة من دلوقتي.
         * - نفس الباقة: الأيام بتتضاف على المتبقي.
         * - ترقية: الأيام المتبقية بتتحوّل لأيام في الباقة الأعلى بنسبة سعر الـ 28 يوم، وبعدين بتتضاف الأيام الجديدة.
         * - باقة أقل من الحالية: مفيش تنزيل. الأيام الجديدة بتتحوّل بنفس النسبة وبتتضاف (أو بتتضاف كما هي لو opts.raw للجوايز).
         */
        grant: function (st, tier, days, opts) {
            opts = opts || {};
            var now = Date.now();
            if (!cfg.tiers[tier]) tier = 'plus';
            days = Number(days) || 0;
            var curExp = 0;
            if (st && st.subscriptionExpiry) { var c = new Date(st.subscriptionExpiry).getTime(); if (!isNaN(c) && c > now) curExp = c; }
            var isTrial = st && st.accountType === 'trial';
            var curTier = (curExp && !isTrial) ? P.tierOf(st) : null;
            var outTier = tier, expiry;
            if (!curTier) {
                expiry = (curExp || now) + days * DAY;
            } else if (curTier === tier) {
                expiry = curExp + days * DAY;
            } else if (P.rank(tier) > P.rank(curTier)) {
                var ratio = Number(cfg.tiers[curTier].base28) / Number(cfg.tiers[tier].base28);
                expiry = now + (curExp - now) * ratio + days * DAY;
            } else {
                outTier = curTier;
                var r2 = opts.raw ? 1 : Number(cfg.tiers[tier].base28) / Number(cfg.tiers[curTier].base28);
                expiry = curExp + days * r2 * DAY;
            }
            return {
                isSubscribed: true, accountType: 'vip', planTier: outTier,
                subscriptionExpiry: new Date(Math.round(expiry)).toISOString(),
                subscriptionActivatedAt: new Date().toISOString(),
                lastPlanDays: days, lastPlanTier: tier
            };
        },
        badgeHtml: function (d) {
            var k = P.tierOf(d); if (!k || !cfg.tiers[k].badge) return '';
            var t = cfg.tiers[k];
            return '<span style="display:inline-block;padding:1px 8px;border-radius:999px;font-size:.62rem;font-weight:900;letter-spacing:.5px;margin-inline-start:6px;vertical-align:middle;color:#0b1020;background:' + t.color + ';">' + t.badge + '</span>';
        }
    };
    global.PSPlans = P;
})(typeof window !== 'undefined' ? window : globalThis);

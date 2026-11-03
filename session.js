/* session.js — الجلسة الموحدة لمنصة رحلة دراسية
 * سكريبت عادي (غير module): يُحمَّل في <head> قبل أي سكريبت آخر.
 * - جلسة الطالب محفوظة في localStorage لمدة 48 ساعة من آخر تسجيل دخول فعلي.
 * - الأدمن لا تُحفظ جلسته (يبقى في sessionStorage كما كان).
 * - معرّف الطالب في كل المنصة هو studentId (STU-0001...) وليس uid.
 */
(function (global) {
    'use strict';

    var SESSION_MS = 48 * 60 * 60 * 1000;
    var LS = null, SS = null;
    try { LS = global.localStorage; } catch (e) {}
    try { SS = global.sessionStorage; } catch (e) {}

    function lsGet(k) { try { return LS ? LS.getItem(k) : null; } catch (e) { return null; } }
    function lsSet(k, v) { try { if (LS) LS.setItem(k, v); } catch (e) {} }
    function lsDel(k) { try { if (LS) LS.removeItem(k); } catch (e) {} }
    function ssGet(k) { try { return SS ? SS.getItem(k) : null; } catch (e) { return null; } }

    // نفس حدود الرتب في كل الصفحات: ضعيف < 500 ≤ متوسط < 1500 ≤ قوي < 3000 ≤ قوي جداً < 5000 ≤ أسطوري
    var RANKS = [
        { key: 'weak',        min: 0,    label: 'ضعيف',      frame: 'frame-weak' },
        { key: 'medium',      min: 500,  label: 'متوسط',     frame: 'frame-medium' },
        { key: 'strong',      min: 1500, label: 'قوي',       frame: 'frame-strong' },
        { key: 'very-strong', min: 3000, label: 'قوي جداً',  frame: 'frame-legendary' },
        { key: 'legendary',   min: 5000, label: 'أسطوري',    frame: 'frame-legendary' }
    ];

    function rankOf(score) {
        var s = Number(score) || 0, r = RANKS[0];
        for (var i = 0; i < RANKS.length; i++) { if (s >= RANKS[i].min) r = RANKS[i]; }
        return r;
    }

    function parse(raw) { try { return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }

    var PS = {
        SESSION_MS: SESSION_MS,
        RANKS: RANKS,
        rank: rankOf,

        isAdminSession: function () {
            return ssGet('isAdmin') === 'true' || ssGet('isAdminLoggedIn') === 'true';
        },

        loginTime: function () {
            var t = parseInt(lsGet('platform_login_time'), 10);
            return isNaN(t) ? 0 : t;
        },

        /** يُستدعى مرة واحدة عند تسجيل الدخول/التسجيل الفعلي فقط */
        startSession: function () { lsSet('platform_login_time', String(Date.now())); },

        /** هل الجلسة سارية (أقل من 48 ساعة)؟ */
        isFresh: function () {
            var t = PS.loginTime();
            return t > 0 && (Date.now() - t) <= SESSION_MS;
        },

        /** قراءة قيمة من localStorage ثم sessionStorage (للتوافق مع القديم) */
        get: function (k) { var v = lsGet(k); return v !== null && v !== undefined ? v : ssGet(k); },

        getStudent: function () {
            return parse(lsGet('studentUser')) || parse(lsGet('currentUser')) ||
                   parse(lsGet('cachedStudentProfile')) || parse(ssGet('studentUser')) || parse(ssGet('currentUser'));
        },
        email: function () {
            var s = PS.getStudent();
            return String((s && s.email) || lsGet('currentStudentEmail') || '').toLowerCase().trim();
        },
        studentId: function () {
            var s = PS.getStudent();
            return String((s && (s.studentId || s.id)) || lsGet('currentStudentId') || '').trim();
        },

        isVip: function (d) {
            d = d || PS.getStudent();
            if (!d) return false;
            if (d.subscriptionExpiry) { return new Date(d.subscriptionExpiry).getTime() > Date.now(); }
            return d.isSubscribed === true || d.accountType === 'vip';
        },

        /** يحفظ بيانات الطالب في كل المفاتيح التي تقرأها صفحات المنصة (كلها في localStorage) */
        saveStudent: function (data) {
            if (!data) return;
            var email = String(data.email || '').toLowerCase().trim();
            var sid = String(data.studentId || data.id || '').trim();
            var score = Number(data.totalScore !== undefined ? data.totalScore : data.points) || 0;
            var r = rankOf(score);
            var json = JSON.stringify(data);
            lsSet('platform_user_type', 'student');
            lsSet('isAdmin', 'false');
            lsSet('currentStudentEmail', email);
            lsSet('currentStudentId', sid);
            if (data.uid) lsSet('currentStudentUid', data.uid);
            lsSet('studentUser', json);
            lsSet('currentUser', json);
            lsSet('cachedStudentProfile', json);
            lsSet('student_profile_cache', json);
            if (email) lsSet('profile_' + email, json);
            // هوية الشات = studentId
            lsSet('chat_uid', sid);
            lsSet('chat_name', data.fullName || data.name || '');
            lsSet('chat_rank', r.key);
            lsSet('chat_points', String(score));
            lsSet('chat_gender', data.gender || 'male');
            lsSet('chat_frame', r.frame);
            var av = data.profileImage || data.avatar || '';
            if (av) lsSet('chat_avatar', av);
        },

        /** يمسح بيانات الطالب فقط (ويُبقي الثيم وإعدادات الشات الشخصية) */
        clearStudent: function () {
            var email = PS.email();
            ['platform_login_time', 'platform_user_type', 'isAdmin', 'currentStudentEmail', 'currentStudentId',
             'currentStudentUid', 'studentUser', 'currentUser', 'cachedStudentProfile', 'student_profile_cache',
             'chat_uid', 'chat_name', 'chat_rank', 'chat_points', 'chat_gender', 'chat_frame', 'chat_avatar',
             'chat_streak'].forEach(lsDel);
            if (email) lsDel('profile_' + email);
        },

        /**
         * حارس الصفحات المحمية.
         * opts.vip      : يتطلب اشتراك VIP (الأدمن مستثنى)
         * opts.redirect : صفحة الدخول (الافتراضي login.html)
         * @returns {boolean} true لو مسموح
         */
        guard: function (opts) {
            opts = opts || {};
            if (PS.isAdminSession()) return true;
            var login = opts.redirect || 'login.html';
            if (!PS.isFresh() || !PS.email() || !PS.studentId()) {
                PS.clearStudent();
                global.location.replace(login);
                return false;
            }
            if (opts.vip && !PS.isVip()) {
                try { global.sessionStorage.setItem('vipRequiredNotice', '1'); } catch (e) {}
                global.location.replace('profile.html');
                return false;
            }
            return true;
        }
    };

    /* ===== أدوات تعقيم النصوص (منع حقن HTML/JS في الدردشة والمنتدى) ===== */
    var ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    PS.esc = function (t) {
        return String(t === undefined || t === null ? '' : t).replace(/[&<>"']/g, function (c) { return ESC_MAP[c]; });
    };
    /** آمن للاستخدام داخل HTML وداخل نص بين علامتي ' ' في onclick (نستبدل ' بـ ’ ونحذف \ وفواصل الأسطر) */
    PS.safeText = function (t) {
        return PS.esc(t).replace(/&#39;/g, '\u2019').replace(/[\\\r\n\u2028\u2029]/g, ' ');
    };
    PS.safeId = function (t) { return String(t === undefined || t === null ? '' : t).replace(/[^A-Za-z0-9_\-@.]/g, ''); };
    /** روابط http/https/data:image/audio/blob فقط، مع تهريب الرموز الخطرة */
    PS.safeUrl = function (u) {
        u = String(u === undefined || u === null ? '' : u).trim();
        if (!/^(https?:\/\/|data:(image|audio|video|application\/pdf)[\/;]|blob:)/i.test(u)) return '';
        return u.replace(/'/g, '%27').replace(/"/g, '%22').replace(/</g, '%3C').replace(/>/g, '%3E').replace(/\\/g, '%5C').replace(/\s/g, '%20');
    };

    /* ===== تتبع وقت المذاكرة الفعلي =====
     * بيعدّ الثواني اللي المنصة ظاهرة فيها على الشاشة (التبويب مفتوح ومش مخفي) لأي صفحة طالب.
     * التخزين محلي في localStorage، ودالة syncStudyTime في student-service.js بتبعت الفرق
     * لـ Firestore (studySeconds) بـ increment، فمفيش تضارب بين أكتر من جهاز. */
    PS.timeKeys = function () {
        var sid = PS.studentId();
        return sid ? { total: 'ps_time_' + sid, synced: 'ps_time_synced_' + sid } : null;
    };
    PS.localStudySeconds = function () {
        var k = PS.timeKeys(); if (!k) return 0;
        return parseInt(lsGet(k.total), 10) || 0;
    };
    PS.unsyncedStudySeconds = function () {
        var k = PS.timeKeys(); if (!k) return 0;
        var t = parseInt(lsGet(k.total), 10) || 0, s = parseInt(lsGet(k.synced), 10) || 0;
        return Math.max(0, t - s);
    };
    PS.markStudySynced = function (upToSeconds) {
        var k = PS.timeKeys(); if (!k) return;
        lsSet(k.synced, String(upToSeconds));
    };
    (function startStudyTimer() {
        var TICK = 5000, last = Date.now();
        function tick() {
            var now = Date.now(), elapsed = now - last;
            last = now;
            try {
                if (document.visibilityState !== 'visible') return;
                if (PS.isAdminSession() || !PS.isFresh()) return;
                var k = PS.timeKeys(); if (!k) return;
                // نتجاهل أي قفزة كبيرة (جهاز نام/تبويب اتجمّد) عشان الوقت يفضل حقيقي
                var add = Math.min(Math.round(elapsed / 1000), 10);
                if (add <= 0) return;
                lsSet(k.total, String((parseInt(lsGet(k.total), 10) || 0) + add));
            } catch (e) {}
        }
        try {
            setInterval(tick, TICK);
            document.addEventListener('visibilitychange', function () { last = Date.now(); });
        } catch (e) {}
    })();

    global.PS = PS;
})(window);

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

    // المستوى (1-50) محسوب من النقاط بنفس معادلة levels.js: 25000 × ((n-1)/49)^1.7
    function lvPoints(n) { return Math.round(25000 * Math.pow(Math.max(1, n) - 1, 1.7) / Math.pow(49, 1.7) / 5) * 5; }
    function levelNum(score) {
        var s = Math.max(0, Number(score) || 0), l = 1;
        while (l < 50 && s >= lvPoints(l + 1)) l++;
        return l;
    }

    // أسماء الرتب القديمة (ضعيف..أسطوري) اتشالت من العرض: label بقى "Lv.N".
    // المفاتيح (key/frame) فضلت داخلية عشان الصفحات القديمة ماتبوظش.
    function rankOf(score) {
        var s = Number(score) || 0, r = RANKS[0];
        for (var i = 0; i < RANKS.length; i++) { if (s >= RANKS[i].min) r = RANKS[i]; }
        var lv = levelNum(s);
        return { key: r.key, min: r.min, frame: r.frame, level: lv, label: 'Lv.' + lv };
    }

    function parse(raw) { try { return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }

    var PS = {
        SESSION_MS: SESSION_MS,
        RANKS: RANKS,
        rank: rankOf,
        levelOf: levelNum,

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
            if (data.isBanned === true) { PS.banExit(); return; }
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

        /** حساب محظور: نمسح الجلسة ونوديه لصفحة الحظر */
        banExit: function () {
            try { global.sessionStorage.setItem('ps_banned', '1'); } catch (e) {}
            PS.clearStudent();
            if (!/banned\.html$/.test(global.location.pathname)) global.location.replace('banned.html');
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
            var cached = PS.getStudent();
            if ((cached && cached.isBanned === true) || ssGet('ps_banned') === '1') { PS.banExit(); return false; }
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

    /* ===== تسجيل أخطاء الصفحات (لوحة صحة المنصة) =====
     * بيبعت لـ Firestore REST في collection اسمها errorLogs. أقصى 3 أخطاء لكل تحميل صفحة، ومن غير تكرار.
     * لو قواعد Firestore مش بتسمح بالإنشاء بيفشل بصمت ومفيش أي تأثير على الطالب. */
    (function errorReporter() {
        var sent = 0, seen = {};
        function report(msg, src, line) {
            try {
                msg = String(msg || '').slice(0, 300);
                if (!msg || sent >= 3 || seen[msg]) return;
                if (/ResizeObserver|Script error\.?$/i.test(msg)) return;
                seen[msg] = 1; sent++;
                var f = function (v) { return { stringValue: String(v == null ? '' : v).slice(0, 300) }; };
                var body = { fields: {
                    page: f(location.pathname.split('/').pop() || 'index.html'),
                    msg: f(msg), src: f(String(src || '').split('/').pop()), line: f(line || ''),
                    ua: f((navigator.userAgent || '').slice(0, 120)),
                    t: f(new Date().toISOString())
                } };
                fetch('https://firestore.googleapis.com/v1/projects/study-trip-1/databases/(default)/documents/errorLogs?key=AIzaSyBORRXM-bw9Svp4QS8_1OWUGGbhJToQM6U', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true
                }).catch(function () {});
            } catch (e) {}
        }
        window.addEventListener('error', function (e) { report(e.message, e.filename, e.lineno); });
        window.addEventListener('unhandledrejection', function (e) { report('Promise: ' + (e.reason && (e.reason.message || e.reason)), '', ''); });
    })();

    /* ===== إعدادات الموقع من الأدمن (وضع الصيانة + إعلان) + تنبيه الاشتراك + زر الإبلاغ =====
     * القراءة بـ Firestore REST من وثيقة config/site، ومخزّنة 5 دقايق في localStorage
     * (قراءة واحدة لكل طالب كل 5 دقايق بالكتير). لو فشلت القراءة الموقع يشتغل عادي. */
    (function siteExtras() {
        var FS = 'https://firestore.googleapis.com/v1/projects/study-trip-1/databases/(default)/documents/';
        var KEY = 'AIzaSyBORRXM-bw9Svp4QS8_1OWUGGbhJToQM6U';
        var page = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '') || 'index';
        var STUDENT_PAGES = ['index', 'login', 'welcome', 'main', 'profile', 'stats', 'files', 'files-lesson-view', 'lesson-exam',
            'exams', 'forum', 'chat-boys', 'chat-girls', 'subscribe', 'weekly', 'competitions', 'invites', 'mistakes'];
        var REPORT_PAGES = ['main', 'profile', 'stats', 'files', 'files-lesson-view', 'exams', 'forum', 'subscribe', 'weekly', 'competitions', 'invites', 'mistakes'];
        if (STUDENT_PAGES.indexOf(page) < 0) return;

        function today() {
            try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date()); } catch (e) { return new Date().toISOString().slice(0, 10); }
        }
        function el(html) { var d = document.createElement('div'); d.innerHTML = html; return d.firstChild; }
        function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

        function parseCfg(j) {
            var f = (j && j.fields) || {}, o = {};
            Object.keys(f).forEach(function (k) {
                var v = f[k]; o[k] = v.booleanValue !== undefined ? v.booleanValue : (v.stringValue !== undefined ? v.stringValue : (v.integerValue !== undefined ? Number(v.integerValue) : ''));
            });
            return o;
        }
        function getCfg(cb) {
            var cached = parse(lsGet('ps_site_cfg'));
            if (cached && Date.now() - cached.t < 5 * 60 * 1000) { cb(cached.d); return; }
            var done = false;
            function fin(d) { if (done) return; done = true; cb(d); }
            try {
                fetch(FS + 'config/site?key=' + KEY).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
                    var d = j ? parseCfg(j) : (cached ? cached.d : {});
                    if (j) lsSet('ps_site_cfg', JSON.stringify({ t: Date.now(), d: d }));
                    fin(d);
                }).catch(function () { fin(cached ? cached.d : {}); });
                setTimeout(function () { fin(cached ? cached.d : {}); }, 4000);
            } catch (e) { fin({}); }
        }

        function showMaintenance(msg) {
            ready(function () {
                if (document.getElementById('ps-maint')) return;
                var m = el('<div id="ps-maint" dir="rtl" style="position:fixed;inset:0;z-index:2147483647;background:#0f172a;color:#f8fafc;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;font-family:Segoe UI,Tahoma,sans-serif">' +
                    '<div style="font-size:3rem;margin-bottom:10px">🛠️</div><h2 style="margin-bottom:10px;font-size:1.4rem">المنصة في صيانة بسيطة</h2>' +
                    '<p style="max-width:420px;line-height:1.9;color:#cbd5e1">' + PS.esc(msg || 'بنعمل تحديثات سريعة وهنرجع حالاً. شكراً لصبرك.') + '</p>' +
                    '<button onclick="localStorage.removeItem(\'ps_site_cfg\');location.reload()" style="margin-top:18px;padding:10px 22px;border:none;border-radius:12px;background:#22d3ee;color:#0f172a;font-weight:800;cursor:pointer">تحديث الصفحة</button></div>');
                document.body.appendChild(m);
                document.documentElement.style.overflow = 'hidden';
            });
        }

        function banner(id, html, bg) {
            ready(function () {
                if (document.getElementById(id)) return;
                var b = el('<div id="' + id + '" dir="rtl" style="position:relative;z-index:9998;background:' + bg + ';color:#fff;padding:10px 40px 10px 14px;text-align:center;font:700 .85rem/1.7 Segoe UI,Tahoma,sans-serif">' + html +
                    '<button aria-label="إغلاق" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;color:#fff;font-size:1.2rem;cursor:pointer">✕</button></div>');
                b.querySelector('button').onclick = function () { b.remove(); };
                document.body.insertBefore(b, document.body.firstChild);
            });
        }

        // 1) وضع الصيانة + الإعلان
        if (!PS.isAdminSession()) {
            getCfg(function (c) {
                if (c.maintenance === true) { showMaintenance(c.maintenanceMsg); return; }
                if (page === 'main' && c.announcement) {
                    var aid = 'ann_' + String(c.announcementId || c.announcement).slice(0, 40);
                    if (lsGet('ps_ann_seen') !== aid) {
                        banner('ps-ann', '📢 ' + PS.esc(c.announcement), '#4f46e5');
                        ready(function () { var x = document.querySelector('#ps-ann button'); if (x) x.addEventListener('click', function () { lsSet('ps_ann_seen', aid); }); });
                    }
                }
            });
        }

        // 2) تنبيه قرب انتهاء الاشتراك/التجربة (من البيانات المحفوظة، من غير أي قراءة)
        if ((page === 'main' || page === 'profile') && !PS.isAdminSession() && PS.isFresh()) {
            try {
                var st = PS.getStudent();
                var t = st && st.subscriptionExpiry ? new Date(st.subscriptionExpiry).getTime() : 0;
                var left = t - Date.now();
                if (t && left > 0 && left <= 48 * 3600 * 1000 && lsGet('ps_exp_seen') !== today()) {
                    var hrs = Math.max(1, Math.ceil(left / 3600000));
                    var when = hrs >= 24 ? 'بعد حوالي يوم' : 'بعد ' + hrs + ' ساعة تقريباً';
                    var what = st.accountType === 'trial' ? 'التجربة المجانية' : 'اشتراكك';
                    banner('ps-exp', '⏳ ' + what + ' هيخلص ' + when + '. <a href="subscribe.html" style="color:#fde047;text-decoration:underline">جدّد دلوقتي</a>', '#b45309');
                    ready(function () { var x = document.querySelector('#ps-exp button'); if (x) x.addEventListener('click', function () { lsSet('ps_exp_seen', today()); }); });
                }
            } catch (e) {}
        }

        // 3) زر "بلّغ عن مشكلة"
        if (REPORT_PAGES.indexOf(page) >= 0 && !PS.isAdminSession() && PS.isFresh()) {
            ready(function () {
                var btn = el('<button id="ps-rep-btn" title="بلّغ عن مشكلة" aria-label="بلّغ عن مشكلة" style="position:fixed;bottom:25px;left:20px;z-index:99990;width:44px;height:44px;border-radius:50%;border:1px solid #334155;background:#1e293b;color:#f8fafc;font-size:1.2rem;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.35)">⚑</button>');
                var box = el('<div id="ps-rep" dir="rtl" style="display:none;position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.6);align-items:center;justify-content:center;padding:16px;font-family:Segoe UI,Tahoma,sans-serif">' +
                    '<div style="background:#1e293b;color:#f8fafc;border:1px solid #334155;border-radius:16px;padding:18px;width:100%;max-width:380px">' +
                    '<h3 style="margin-bottom:6px;font-size:1rem">بلّغ عن مشكلة</h3><p style="font-size:.75rem;color:#94a3b8;margin-bottom:10px;line-height:1.7">اكتب المشكلة اللي واجهتك وهنراجعها (الصفحة وبياناتك بتتبعت تلقائي).</p>' +
                    '<textarea id="ps-rep-t" maxlength="500" rows="4" placeholder="مثال: الفيديو مش بيشتغل في حصة كذا" style="width:100%;padding:10px;border-radius:10px;border:1px solid #334155;background:#0f172a;color:#f8fafc;font:inherit;resize:vertical"></textarea>' +
                    '<div id="ps-rep-m" style="font-size:.78rem;min-height:20px;margin:6px 0"></div>' +
                    '<div style="display:flex;gap:8px"><button id="ps-rep-s" style="flex:1;padding:9px;border:none;border-radius:10px;background:#22d3ee;color:#0f172a;font-weight:800;cursor:pointer">إرسال</button>' +
                    '<button id="ps-rep-c" style="padding:9px 16px;border:1px solid #334155;border-radius:10px;background:none;color:#f8fafc;cursor:pointer">إلغاء</button></div></div></div>');
                document.body.appendChild(btn); document.body.appendChild(box);
                var msg = function (t, c) { var m = document.getElementById('ps-rep-m'); m.textContent = t; m.style.color = c || '#94a3b8'; };
                btn.onclick = function () { box.style.display = 'flex'; msg(''); };
                document.getElementById('ps-rep-c').onclick = function () { box.style.display = 'none'; };
                document.getElementById('ps-rep-s').onclick = function () {
                    var txt = document.getElementById('ps-rep-t').value.trim();
                    if (txt.length < 5) { msg('اكتب وصف أوضح شوية.', '#fbbf24'); return; }
                    var last = parseInt(lsGet('ps_rep_last'), 10) || 0;
                    if (Date.now() - last < 60000) { msg('استنى دقيقة قبل ما تبعت بلاغ تاني.', '#fbbf24'); return; }
                    var s2 = PS.getStudent() || {};
                    var f = function (v) { return { stringValue: String(v == null ? '' : v).slice(0, 500) }; };
                    var body = { fields: { text: f(txt), page: f(page + '.html'), studentId: f(PS.studentId()), name: f(s2.fullName || s2.name || ''),
                        ua: f((navigator.userAgent || '').slice(0, 150)), t: f(new Date().toISOString()), status: f('new') } };
                    msg('جاري الإرسال...');
                    fetch(FS + 'problemReports?key=' + KEY, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
                        .then(function (r) {
                            if (!r.ok) throw new Error('x');
                            lsSet('ps_rep_last', String(Date.now()));
                            document.getElementById('ps-rep-t').value = '';
                            msg('وصلنا بلاغك، شكراً ليك ✔', '#34d399');
                            setTimeout(function () { box.style.display = 'none'; }, 1400);
                        }).catch(function () { msg('مقدرناش نبعت البلاغ دلوقتي، جرّب بعد شوية.', '#f87171'); });
                };
            });
        }
    })();

    global.PS = PS;
})(window);

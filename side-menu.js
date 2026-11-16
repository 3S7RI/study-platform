/* side-menu.js — القايمة الجانبية المنسدلة لصفحات الطالب.
 * زرار ☰ في الهيدر بيفتح قايمة من الجنب، مقسّمة لأقسام بتتفتح وتتقفل.
 * لإضافة أي حاجة مستقبلاً: ضيف سطر في المصفوفة MENU تحت (قسم جديد أو عنصر جديد في قسم).
 *   عنصر عادي:  { t: 'الاسم', href: 'page.html', ic: 'اسم الأيقونة' }
 *   عنصر بحدث:  { t: 'الاسم', action: 'logout' | 'guide' | 'chat', ic: '...' }
 *   لو عايز العنصر يظهر قريباً بس: زوّد soon: true (بيظهر معطّل بشارة «قريباً»).
 * الأيقونات: home book edit chart chat forum trophy bolt gift star atom user help shield logout list
 */
(function () {
    'use strict';
    if (window.__psSideMenu) return;
    window.__psSideMenu = true;

    var MENU = [
        { title: 'الدراسة', open: true, items: [
            { t: 'الصفحة الرئيسية', href: 'main.html', ic: 'home' },
            { t: 'الحصص والشروحات', href: 'files.html', ic: 'book' },
            { t: 'الامتحانات الشاملة', href: 'exams.html', ic: 'edit' },
            { t: 'أخطائي', href: 'mistakes.html', ic: 'list' }
        ] },
        { title: 'التفاعل والمنافسة', items: [
            { t: 'الدردشة العامة', action: 'chat', ic: 'chat' },
            { t: 'منتدى الأسئلة', href: 'forum.html', ic: 'forum' },
            { t: 'المنافسات', href: 'competitions.html', ic: 'trophy' },
            { t: 'منافسة الأسبوع', href: 'weekly.html', ic: 'bolt' },
            { t: 'إحصائياتي', href: 'stats.html', ic: 'chart' }
        ] },
        { title: 'حسابي', items: [
            { t: 'الملف الشخصي', href: 'profile.html', ic: 'user' },
            { t: 'باقات الاشتراك', href: 'packages.html', ic: 'star' },
            { t: 'نظام الدعوات', href: 'invites.html', ic: 'gift' }
        ] },
        { title: 'غير ذلك', items: [
            { t: 'الجدول الدوري', href: 'periodic-table.html', ic: 'atom' }
        ] },
        { title: 'مساعدة', items: [
            { t: 'دليل المنصة', action: 'guide', ic: 'help' },
            { t: 'سياسة الخصوصية', href: 'privacy.html', ic: 'shield' },
            { t: 'تسجيل الخروج', action: 'logout', ic: 'logout', danger: true }
        ] }
    ];

    var P = {
        home: '<path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
        book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
        edit: '<path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
        chart: '<path d="M18 20V10M12 20V4M6 20v-6"/>',
        chat: '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7A8.4 8.4 0 1 1 21 11.5z"/>',
        forum: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
        trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.7V17c0 .6-.5 1-1 1.2-1.1.5-2 2-2 3.8M14 14.7V17c0 .6.5 1 1 1.2 1.1.5 2 2 2 3.8M18 2H6v7a6 6 0 0 0 12 0z"/>',
        bolt: '<path d="M13 2L3 14h9l-1 8 10-12h-9z"/>',
        gift: '<path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
        star: '<path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9-5-4.9 6.9-1z"/>',
        atom: '<circle cx="12" cy="12" r="1.5"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>',
        user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
        help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
        shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
        logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
        list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'
    };
    function icon(n) {
        return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[n] || P.list) + '</svg>';
    }
    function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

    var CSS =
        '#psm-btn{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;border:1px solid var(--border-color,#334155);background:var(--th-bg,rgba(255,255,255,.03));color:var(--text-main,#f8fafc);cursor:pointer;padding:0;flex:none}' +
        '#psm-btn:hover{border-color:var(--primary,#6366f1);background:var(--hover-bg,rgba(99,102,241,.08))}' +
        '#psm-ov{position:fixed;inset:0;z-index:2147482000;background:rgba(2,6,23,.6);opacity:0;pointer-events:none;transition:opacity .22s}' +
        '#psm-ov.on{opacity:1;pointer-events:auto}' +
        '#psm-pn{position:absolute;top:0;bottom:0;right:0;width:min(78vw,290px);background:var(--bg-card,#1e293b);color:var(--text-main,#f8fafc);border-left:1px solid var(--border-color,#334155);box-shadow:-10px 0 30px rgba(0,0,0,.35);transform:translateX(100%);transition:transform .25s cubic-bezier(.2,.8,.2,1);display:flex;flex-direction:column;direction:rtl;font-family:"Segoe UI",Tahoma,sans-serif}' +
        '#psm-ov.on #psm-pn{transform:none}' +
        '#psm-hd{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid var(--border-color,#334155)}' +
        '#psm-hd b{font-size:.95rem;font-weight:800}' +
        '#psm-x{width:28px;height:28px;border-radius:50%;border:none;background:var(--th-bg,rgba(255,255,255,.06));color:var(--text-main,#f8fafc);cursor:pointer;font-size:.9rem;padding:0}' +
        '#psm-body{flex:1;overflow-y:auto;padding:6px 8px 14px;-webkit-overflow-scrolling:touch}' +
        '.psm-sec{margin-top:4px}' +
        '.psm-st{width:100%;display:flex;align-items:center;justify-content:space-between;padding:9px 8px;background:none;border:none;color:var(--text-muted,#94a3b8);font:inherit;font-size:.74rem;font-weight:800;cursor:pointer;letter-spacing:.3px}' +
        '.psm-st svg{transition:transform .2s}' +
        '.psm-sec.open .psm-st svg{transform:rotate(180deg)}' +
        '.psm-list{display:none;flex-direction:column;gap:2px}' +
        '.psm-sec.open .psm-list{display:flex}' +
        '.psm-it{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:10px;border:none;background:none;color:var(--text-main,#f8fafc);text-decoration:none;font:inherit;font-size:.84rem;font-weight:700;cursor:pointer;text-align:right;width:100%}' +
        '.psm-it:hover,.psm-it.cur{background:var(--hover-bg,rgba(99,102,241,.1))}' +
        '.psm-it.cur{color:var(--primary,#6366f1)}' +
        '.psm-it.danger{color:#f87171}' +
        '.psm-it.soon{opacity:.5;pointer-events:none}' +
        '.psm-it em{margin-inline-start:auto;font-style:normal;font-size:.62rem;padding:1px 8px;border-radius:999px;background:var(--border-color,#334155);color:var(--text-muted,#94a3b8)}';

    function run(action) {
        close();
        if (action === 'chat') {
            if (typeof window.goToChat === 'function') window.goToChat();
            else { var g = ''; try { g = localStorage.getItem('chat_gender'); } catch (e) {} location.href = g === 'female' ? 'chat-girls.html' : 'chat-boys.html'; }
        } else if (action === 'guide') {
            var b = document.getElementById('psg-btn');
            if (b) b.click(); else location.href = 'main.html?guide=1';
        } else if (action === 'logout') {
            if (!confirm('تسجيل الخروج؟')) return;
            try { PS.clearStudent(); sessionStorage.clear(); } catch (e) {}
            Promise.all([
                import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js'),
                import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js')
            ]).then(function (m) { return m[1].signOut(m[1].getAuth(m[0].getApp())); })
              .catch(function () {}).then(function () { location.href = 'login.html'; });
        }
    }

    var ov, btn;
    function open() { ov.classList.add('on'); btn.setAttribute('aria-expanded', 'true'); }
    function close() { if (ov) ov.classList.remove('on'); if (btn) btn.setAttribute('aria-expanded', 'false'); }

    function build() {
        if (document.getElementById('psm-btn')) return;
        var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

        btn = document.createElement('button');
        btn.id = 'psm-btn'; btn.type = 'button'; btn.title = 'القائمة'; btn.setAttribute('aria-label', 'القائمة'); btn.setAttribute('aria-expanded', 'false');
        btn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
        var host = document.querySelector('.header-right-side');
        if (host) host.insertBefore(btn, host.firstChild);
        else { btn.style.cssText += ';position:fixed;top:10px;right:10px;z-index:99990'; document.body.appendChild(btn); }

        var here = (location.pathname.split('/').pop() || 'main.html');
        var html = '';
        MENU.forEach(function (g, gi) {
            var hasCur = g.items.some(function (x) { return x.href === here; });
            html += '<div class="psm-sec' + ((g.open || hasCur) ? ' open' : '') + '"><button type="button" class="psm-st"><span>' + esc(g.title) + '</span>' +
                '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button><div class="psm-list">';
            g.items.forEach(function (x, xi) {
                var cls = 'psm-it' + (x.danger ? ' danger' : '') + (x.soon ? ' soon' : '') + (x.href === here ? ' cur' : '');
                var inner = icon(x.ic) + '<span>' + esc(x.t) + '</span>' + (x.soon ? '<em>قريباً</em>' : '');
                if (x.href && !x.soon) html += '<a class="' + cls + '" href="' + esc(x.href) + '">' + inner + '</a>';
                else html += '<button type="button" class="' + cls + '"' + (x.action ? ' data-act="' + esc(x.action) + '"' : '') + '>' + inner + '</button>';
            });
            html += '</div></div>';
        });

        ov = document.createElement('div');
        ov.id = 'psm-ov';
        ov.innerHTML = '<aside id="psm-pn" role="dialog" aria-label="القائمة"><div id="psm-hd"><b>القائمة</b><button type="button" id="psm-x" aria-label="إغلاق">✕</button></div><div id="psm-body">' + html + '</div></aside>';
        document.body.appendChild(ov);

        btn.addEventListener('click', open);
        ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
        ov.querySelector('#psm-x').addEventListener('click', close);
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
        ov.querySelector('#psm-body').addEventListener('click', function (e) {
            var t = e.target;
            while (t && t !== ov && !(t.classList && (t.classList.contains('psm-st') || t.classList.contains('psm-it')))) t = t.parentNode;
            if (!t || t === ov) return;
            if (t.classList.contains('psm-st')) { t.parentNode.classList.toggle('open'); return; }
            var act = t.getAttribute('data-act');
            if (act) run(act);
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();

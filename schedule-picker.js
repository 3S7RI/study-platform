/* schedule-picker.js — منتقي جدولة بشكل «منبه» (يوم / شهر / سنة / ساعة / دقيقة / ص-م) + زرار تفعيل.
 * الاستخدام: أضف الخاصية data-ps-schedule على <input type="datetime-local"> الموجود،
 * وحمّل السكريبت ده. الحقل الأصلي بيتخبّى ويفضل بيحمل القيمة بنفس الصيغة (YYYY-MM-DDTHH:mm)،
 * فأي كود بيقرا input.value أو بيكتب فيه شغال زي ما هو من غير تعديل.
 * - الزرار مقفول = value فاضية = مفيش جدولة (متاح على طول).
 * - الزرار مفعّل = بيظهر المنتقي وبتتحفظ القيمة.
 * لما الحالة تتغيّر بيطلق حدث 'change' على الحقل الأصلي، و 'ps-schedule-toggle' (detail: {enabled}). */
(function () {
    'use strict';

    var MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    var DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function daysIn(y, m) { return new Date(y, m, 0).getDate(); } // m = 1..12

    function injectCss() {
        if (document.getElementById('ps-sched-css')) return;
        var s = document.createElement('style');
        s.id = 'ps-sched-css';
        s.textContent =
            '.pss{border:1px solid var(--border-color,#334155);border-radius:14px;padding:12px;background:var(--th-bg,rgba(255,255,255,.03))}' +
            '.pss-top{display:flex;align-items:center;justify-content:space-between;gap:10px}' +
            '.pss-top b{font-size:.85rem;color:var(--text-main,#f8fafc)}' +
            '.pss-sw{position:relative;width:48px;height:27px;border-radius:999px;border:none;cursor:pointer;background:var(--border-color,#334155);transition:background .2s;flex:none;padding:0}' +
            '.pss-sw::after{content:"";position:absolute;top:3px;right:3px;width:21px;height:21px;border-radius:50%;background:#fff;transition:transform .2s;box-shadow:0 1px 4px rgba(0,0,0,.4)}' +
            '.pss-sw.on{background:var(--success,#10b981)}' +
            '.pss-sw.on::after{transform:translateX(-21px)}' +
            '.pss-body{display:none;margin-top:12px}' +
            '.pss.on .pss-body{display:block}' +
            '.pss-clock{display:flex;direction:ltr;align-items:center;justify-content:center;gap:6px;margin-bottom:10px}' +
            '.pss-clock select{width:auto!important;min-width:64px;text-align:center;font-size:1.5rem!important;font-weight:800;padding:6px 4px!important;border-radius:12px;cursor:pointer;text-align-last:center}' +
            '.pss-clock .pss-colon{font-size:1.6rem;font-weight:800;color:var(--text-muted,#94a3b8)}' +
            '.pss-date{display:flex;gap:8px;flex-wrap:wrap}' +
            '.pss-date select{flex:1;min-width:80px;cursor:pointer}' +
            '.pss-quick{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}' +
            '.pss-quick button{padding:5px 12px;border-radius:999px;border:1px solid var(--border-color,#334155);background:none;color:var(--text-main,#f8fafc);cursor:pointer;font-size:.76rem;font-weight:700}' +
            '.pss-quick button:hover{border-color:var(--primary,#6366f1);color:var(--primary,#6366f1)}' +
            '.pss-sum{margin-top:10px;padding:8px 12px;border-radius:10px;background:color-mix(in srgb,var(--primary,#6366f1) 12%,transparent);color:var(--text-main,#f8fafc);font-weight:700;font-size:.82rem;text-align:center;line-height:1.7}' +
            '.pss-sum.warn{background:rgba(245,158,11,.15);color:#f59e0b}';
        document.head.appendChild(s);
    }

    function opt(v, label, sel) {
        var o = document.createElement('option');
        o.value = String(v); o.textContent = label;
        if (sel) o.selected = true;
        return o;
    }

    function mount(input) {
        if (!input || input._pss) return;
        input._pss = true;
        injectCss();

        var internal = String(input.value || '');   // الصيغة: YYYY-MM-DDTHH:mm أو ''
        input.style.display = 'none';
        var labelEl = input.previousElementSibling;  // لو في label قبل الحقل نخفيه عشان العنوان يبقى في الصندوق
        var title = (labelEl && labelEl.tagName === 'LABEL') ? labelEl.textContent.replace(/\s+/g, ' ').trim() : 'تفعيل الجدولة';
        if (labelEl && labelEl.tagName === 'LABEL') labelEl.style.display = 'none';

        var box = document.createElement('div');
        box.className = 'pss';
        box.innerHTML =
            '<div class="pss-top"><b></b><button type="button" class="pss-sw" aria-label="تفعيل الجدولة"></button></div>' +
            '<div class="pss-body">' +
              '<div class="pss-clock"><select class="pss-h"></select><span class="pss-colon">:</span><select class="pss-mi"></select><select class="pss-ap"></select></div>' +
              '<div class="pss-date"><select class="pss-d"></select><select class="pss-mo"></select><select class="pss-y"></select></div>' +
              '<div class="pss-quick"><button type="button" data-q="today">اليوم</button><button type="button" data-q="tomorrow">بكرة</button><button type="button" data-q="week">بعد أسبوع</button></div>' +
              '<div class="pss-sum"></div>' +
            '</div>';
        box.querySelector('.pss-top b').textContent = title.replace(/[:：]\s*$/, '');
        input.parentNode.insertBefore(box, input);

        var sw = box.querySelector('.pss-sw'), sum = box.querySelector('.pss-sum');
        var selH = box.querySelector('.pss-h'), selMi = box.querySelector('.pss-mi'), selAp = box.querySelector('.pss-ap');
        var selD = box.querySelector('.pss-d'), selMo = box.querySelector('.pss-mo'), selY = box.querySelector('.pss-y');

        var st = { on: false, y: 0, mo: 1, d: 1, h24: 9, mi: 0 };

        function defaults() {
            var n = new Date(Date.now() + 3600000);
            st.y = n.getFullYear(); st.mo = n.getMonth() + 1; st.d = n.getDate(); st.h24 = n.getHours(); st.mi = Math.ceil(n.getMinutes() / 5) * 5;
            if (st.mi >= 60) { st.mi = 0; st.h24 = (st.h24 + 1) % 24; }
        }
        function parse(v) {
            var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(String(v || ''));
            if (!m) return false;
            st.y = +m[1]; st.mo = +m[2]; st.d = +m[3]; st.h24 = +m[4]; st.mi = +m[5];
            return true;
        }
        function build() {
            var y0 = new Date().getFullYear();
            if (st.y && (st.y < y0 || st.y > y0 + 3)) { /* سنة قديمة محفوظة: نفضّلها في القائمة */ }
            var years = [];
            for (var y = Math.min(y0, st.y || y0); y <= Math.max(y0 + 2, st.y || y0); y++) years.push(y);
            selY.innerHTML = ''; years.forEach(function (y) { selY.appendChild(opt(y, y, y === st.y)); });
            selMo.innerHTML = ''; MONTHS.forEach(function (n, i) { selMo.appendChild(opt(i + 1, n, i + 1 === st.mo)); });
            selD.innerHTML = ''; for (var d = 1; d <= daysIn(st.y, st.mo); d++) selD.appendChild(opt(d, d, d === st.d));
            var h12 = st.h24 % 12 === 0 ? 12 : st.h24 % 12;
            selH.innerHTML = ''; for (var h = 1; h <= 12; h++) selH.appendChild(opt(h, pad(h), h === h12));
            selMi.innerHTML = ''; for (var m = 0; m < 60; m++) selMi.appendChild(opt(m, pad(m), m === st.mi));
            selAp.innerHTML = ''; selAp.appendChild(opt('am', 'ص', st.h24 < 12)); selAp.appendChild(opt('pm', 'م', st.h24 >= 12));
        }
        function toValue() { return st.y + '-' + pad(st.mo) + '-' + pad(st.d) + 'T' + pad(st.h24) + ':' + pad(st.mi); }
        function render() {
            sw.classList.toggle('on', st.on);
            box.classList.toggle('on', st.on);
            if (!st.on) return;
            var dt = new Date(st.y, st.mo - 1, st.d, st.h24, st.mi);
            var h12 = st.h24 % 12 === 0 ? 12 : st.h24 % 12;
            var txt = 'هيفتح يوم ' + DAYS_AR[dt.getDay()] + ' ' + st.d + ' ' + MONTHS[st.mo - 1] + ' ' + st.y + ' الساعة ' + h12 + ':' + pad(st.mi) + (st.h24 < 12 ? ' صباحاً' : ' مساءً');
            var past = dt.getTime() <= Date.now();
            sum.className = 'pss-sum' + (past ? ' warn' : '');
            sum.textContent = past ? txt + ' — الميعاد ده عدّى، فهيفتح على طول.' : txt;
        }
        function commit(fire) {
            internal = st.on ? toValue() : '';
            render();
            if (fire) {
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.dispatchEvent(new CustomEvent('ps-schedule-toggle', { bubbles: true, detail: { enabled: st.on } }));
            }
        }
        function readSelects() {
            st.y = +selY.value; st.mo = +selMo.value;
            var maxD = daysIn(st.y, st.mo);
            st.d = Math.min(+selD.value || 1, maxD);
            var h12 = +selH.value % 12; st.h24 = h12 + (selAp.value === 'pm' ? 12 : 0);
            st.mi = +selMi.value;
        }
        function syncFromValue(v) {
            internal = String(v || '');
            if (parse(internal)) st.on = true; else { st.on = false; defaults(); }
            build(); render();
            input.dispatchEvent(new CustomEvent('ps-schedule-toggle', { detail: { enabled: st.on } }));
        }

        // الكود الموجود بيعمل input.value = '...' فنخلّي الكتابة تحدّث المنتقي، والقراءة ترجّع القيمة الحالية
        Object.defineProperty(input, 'value', {
            configurable: true,
            get: function () { return internal; },
            set: function (v) { syncFromValue(v); }
        });

        sw.addEventListener('click', function () {
            st.on = !st.on;
            if (st.on && !parse(internal)) { defaults(); }
            build(); commit(true);
        });
        [selY, selMo].forEach(function (s) { s.addEventListener('change', function () { readSelects(); build(); commit(true); }); });
        [selD, selH, selMi, selAp].forEach(function (s) { s.addEventListener('change', function () { readSelects(); commit(true); }); });

        box.querySelector('.pss-quick').addEventListener('click', function (e) {
            var q = e.target && e.target.getAttribute && e.target.getAttribute('data-q');
            if (!q) return;
            var add = q === 'today' ? 0 : q === 'tomorrow' ? 1 : 7;
            var n = new Date(Date.now() + add * 86400000);
            st.y = n.getFullYear(); st.mo = n.getMonth() + 1; st.d = n.getDate();
            build(); commit(true);
        });

        title = title || 'تفعيل الجدولة';
        syncFromValue(internal);
        input._pssApi = { isOn: function () { return st.on; } };
    }

    function init() {
        var list = document.querySelectorAll('input[data-ps-schedule]');
        for (var i = 0; i < list.length; i++) mount(list[i]);
    }
    window.PSSchedule = { mount: mount, init: init };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

/* intro.js — إنترو احترافي لمنصة رحلة دراسية
 * - ملف واحد مستقل: ضيف <script src="intro.js"></script> في <head> أي صفحة.
 * - بيظهر مرة واحدة لكل جلسة متصفح، وفيه زرار «تخطي» (أو اضغط في أي مكان / Esc).
 * - بيحترم prefers-reduced-motion، وبيشتغل بالثيم الغامق والفاتح.
 * - للتجربة: افتح الصفحة بـ ?intro=1 عشان يظهر حتى لو شفته قبل كده.
 */
(function () {
    'use strict';
    if (window.__psIntro) return;
    window.__psIntro = true;

    var KEY = 'ps_intro_seen';
    var force = /[?&]intro=1/.test(location.search);
    try { if (!force && sessionStorage.getItem(KEY)) return; } catch (e) {}

    var REDUCE = false;
    try { REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    var TOTAL = REDUCE ? 1200 : 3600;

    var css = [
        '#psIntro{position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;',
        'background:radial-gradient(circle at 50% 40%,#312e81 0%,#1e1b4b 38%,#0b1020 100%);color:#f8fafc;direction:rtl;overflow:hidden;',
        'font-family:"Segoe UI",Tahoma,Geneva,Verdana,sans-serif;transition:opacity .6s ease,transform .6s ease}',
        '#psIntro.out{opacity:0;transform:scale(1.06);pointer-events:none}',
        '#psIntro .orb{position:absolute;border-radius:50%;filter:blur(70px);opacity:.45;animation:psFloat 6s ease-in-out infinite}',
        '#psIntro .o1{width:340px;height:340px;background:#6366f1;top:-80px;right:-60px}',
        '#psIntro .o2{width:300px;height:300px;background:#a855f7;bottom:-90px;left:-70px;animation-delay:-3s}',
        '#psIntro .stars{position:absolute;inset:0;background-image:radial-gradient(1.5px 1.5px at 20% 30%,#fff9,transparent),radial-gradient(1.5px 1.5px at 70% 20%,#fff9,transparent),radial-gradient(1px 1px at 40% 75%,#fff8,transparent),radial-gradient(1.5px 1.5px at 85% 65%,#fff9,transparent),radial-gradient(1px 1px at 10% 80%,#fff8,transparent);animation:psTw 3s ease-in-out infinite alternate}',
        '#psIntro .logoWrap{position:relative;width:150px;height:150px;opacity:0;transform:scale(.4) rotate(-12deg);animation:psPop .9s cubic-bezier(.2,1.4,.4,1) .25s forwards}',
        '#psIntro .ring{position:absolute;inset:-14px;border-radius:50%;border:2px solid transparent;border-top-color:#a5b4fc;border-right-color:#c084fc;animation:psSpin 2.2s linear infinite}',
        '#psIntro .ring.r2{inset:-28px;border-top-color:transparent;border-bottom-color:#6366f1;border-left-color:#4ade80;animation-duration:3.4s;animation-direction:reverse;opacity:.7}',
        '#psIntro .logo{width:100%;height:100%;border-radius:50%;object-fit:cover;background:#fff;box-shadow:0 0 0 4px #ffffff22,0 0 50px #6366f1aa,0 20px 50px #0008}',
        '#psIntro h1{font-size:2rem;font-weight:800;letter-spacing:.5px;margin-top:22px;opacity:0;transform:translateY(16px);animation:psUp .7s ease 1.1s forwards;',
        'background:linear-gradient(90deg,#c7d2fe,#fff,#e9d5ff);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}',
        '#psIntro p{font-size:1.05rem;color:#a5b4fc;opacity:0;transform:translateY(12px);animation:psUp .7s ease 1.5s forwards}',
        '#psIntro .bar{width:min(220px,60vw);height:4px;border-radius:4px;background:#ffffff22;overflow:hidden;margin-top:14px;opacity:0;animation:psUp .5s ease 1.7s forwards}',
        '#psIntro .bar i{display:block;height:100%;width:0;border-radius:4px;background:linear-gradient(90deg,#6366f1,#4ade80);animation:psLoad ' + ((TOTAL - 1900) / 1000) + 's ease-in-out 1.8s forwards}',
        '#psIntro .skip{position:absolute;top:18px;left:18px;background:#ffffff14;border:1px solid #ffffff33;color:#e0e7ff;padding:8px 16px;border-radius:30px;font-size:.85rem;font-weight:700;cursor:pointer;opacity:0;animation:psUp .5s ease .8s forwards}',
        '#psIntro .skip:hover{background:#ffffff26}',
        '@keyframes psPop{to{opacity:1;transform:scale(1) rotate(0)}}',
        '@keyframes psUp{to{opacity:1;transform:translateY(0)}}',
        '@keyframes psSpin{to{transform:rotate(360deg)}}',
        '@keyframes psLoad{to{width:100%}}',
        '@keyframes psFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(24px)}}',
        '@keyframes psTw{from{opacity:.4}to{opacity:1}}',
        '@media (prefers-reduced-motion:reduce){#psIntro *{animation-duration:.01s!important;animation-delay:0s!important}}'
    ].join('');

    var root = document.createElement('div');
    root.id = 'psIntro';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', 'مقدمة منصة رحلة دراسية');
    root.innerHTML =
        '<style>' + css + '</style>' +
        '<div class="orb o1"></div><div class="orb o2"></div><div class="stars"></div>' +
        '<button class="skip" type="button">تخطي ⏭</button>' +
        '<div class="logoWrap"><div class="ring r2"></div><div class="ring"></div><img class="logo" src="logo-study-trip.png" alt="رحلة دراسية"></div>' +
        '<h1>رحلة دراسية</h1><p>رحلتك للتفوق تبدأ من هنا ✨</p><div class="bar"><i></i></div>';

    var done = false, timer = null;
    function finish() {
        if (done) return; done = true;
        clearTimeout(timer);
        try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
        document.removeEventListener('keydown', onKey);
        root.classList.add('out');
        setTimeout(function () {
            if (root.parentNode) root.parentNode.removeChild(root);
            document.documentElement.style.overflow = '';
        }, 650);
    }
    function onKey(e) { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') finish(); }

    function mount() {
        document.documentElement.style.overflow = 'hidden';
        document.body.appendChild(root);
        root.addEventListener('click', finish);
        document.addEventListener('keydown', onKey);
        timer = setTimeout(finish, TOTAL);
    }

    // نحط الإنترو بأسرع وقت ممكن عشان ميبانش وميض للصفحة تحته
    if (document.body) mount();
    else document.addEventListener('DOMContentLoaded', mount);
})();

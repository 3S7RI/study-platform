(function() {
    // 1. حقن الواجهة والتصميم (CSS و HTML) أوتوماتيكياً
    const widgetHTML = `
    <div id="ai-widget-container" class="ai-widget-container">
        <button id="ai-toggle-btn" class="ai-toggle-btn" aria-label="مساعد المنصة الذكي">
            <img src="logo-Ai.png" alt="Study Trip AI" class="ai-logo-img">
            <span class="ai-badge-online"></span>
        </button>

        <div id="ai-chat-box" class="ai-chat-box hidden">
            <div class="ai-chat-header">
                <div class="ai-header-info">
                    <img src="logo-Ai.png" alt="AI" class="ai-mini-logo">
                    <div>
                        <h4>مساعد رحلة دراسية</h4>
                        <span class="ai-status">متصل الآن • 3rd Prep AI</span>
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:2px;">
                    <button id="ai-chats-btn" class="ai-close-btn" title="دردشاتي" style="font-size:13px;display:flex;align-items:center;gap:4px;padding:4px 8px;border:1px solid #334155;border-radius:14px;margin-left:6px;"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z"/></svg><span id="ai-chats-count">دردشاتي</span></button>
                    <button id="ai-close-btn" class="ai-close-btn">&times;</button>
                </div>
            </div>
            <div id="ai-chats-panel" class="ai-chats-panel" style="display:none;"></div>

            <div id="ai-chat-messages" class="ai-chat-messages">
                <div class="ai-msg bot-msg">
                    <p>أهلاً بيك يا بطل! <svg class="ic" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-0.125em;flex-shrink:0;color:#fbbf24" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg> أنا مساعدك الذكي في منصة <strong>رحلة دراسية</strong>. اسألني عن المنصة، أو عن أي درس أو مسألة في المنهج، وهجاوبك خطوة بخطوة! <svg class="ic" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-0.125em;flex-shrink:0" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></p>
                    <span class="msg-time">الآن</span>
                </div>
            </div>

            <div id="ai-usage" class="ai-usage" style="display:none;"></div>

            <div class="ai-quick-chips">
                <button onclick="sendQuickPrompt('ازاي أفعل الـ VIP؟')"><svg class="ic" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-0.125em;flex-shrink:0;color:#22d3ee" aria-hidden="true"><path d="M6 3h12l4 6-10 13L2 9z"/><path d="M2 9h20"/></svg> تفعيل الـ VIP</button>
                <button onclick="sendQuickPrompt('نظام النقاط والمستويات')"><svg class="ic" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-0.125em;flex-shrink:0;color:#fbbf24" aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-1.04 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98 1.04 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0z"/></svg> نظام النقاط</button>
                <button onclick="sendQuickPrompt('فين قناة اليوتيوب؟')"><svg class="ic" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-0.125em;flex-shrink:0" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg> القنوات الرسمية</button>
                <button onclick="sendQuickPrompt('التواصل مع الدعم')"><svg class="ic" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-0.125em;flex-shrink:0" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg> الدعم الفني</button>
                <button onclick="sendQuickPrompt('ازاي أنظم مذاكرتي؟')">نظّم مذاكرتي</button>
                <button onclick="sendQuickPrompt('أسعار الاشتراك وطرق الدفع')">الأسعار والدفع</button>
            </div>

            <div class="ai-chat-input-area">
                <input type="text" id="ai-user-input" placeholder="اكتب سؤالك هنا بحرية تامة..." />
                <button id="ai-send-btn">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
                </button>
            </div>
        </div>
    </div>
    `;

    const widgetCSS = `
    .ai-widget-container { position: fixed; bottom: 25px; right: 25px; z-index: 99999; font-family: 'Segoe UI', Tahoma, sans-serif; direction: rtl; cursor: grab; user-select: none; touch-action: none; }
    .ai-widget-container:active { cursor: grabbing; }
    .ai-toggle-btn { width: 70px; height: 70px; border-radius: 50%; background: #1e293b; border: 2px solid #3b82f6; cursor: pointer; box-shadow: 0 10px 25px rgba(0,0,0,0.3); position: relative; display: flex; align-items: center; justify-content: center; padding: 0; overflow: visible !important; }
    .ai-toggle-btn:hover { transform: scale(1.06); box-shadow: 0 12px 30px rgba(59, 130, 246, 0.4); }
    .ai-logo-img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
    .ai-badge-online { position: absolute; bottom: 2px; right: -2px; width: 16px; height: 16px; background-color: #10b981; border: 2.5px solid #0f172a; border-radius: 50%; z-index: 30; pointer-events: none; box-shadow: 0 0 6px rgba(16, 185, 129, 0.8); }
    .ai-chat-box { position: absolute; bottom: 85px; right: 0; width: 360px; height: 500px; background: #0f172a; border: 1px solid #334155; border-radius: 20px; box-shadow: 0 15px 35px rgba(0,0,0,0.4); display: flex; flex-direction: column; overflow: hidden; transition: all 0.3s ease; cursor: default; }
    .ai-chat-box.hidden { opacity: 0; pointer-events: none; transform: translateY(20px) scale(0.95); }
    .ai-chat-header { background: #1e293b; padding: 15px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #334155; }
    .ai-header-info { display: flex; align-items: center; gap: 10px; }
    .ai-mini-logo { width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 1px solid #3b82f6; }
    .ai-header-info h4 { margin: 0; color: #f8fafc; font-size: 15px; }
    .ai-status { font-size: 11px; color: #94a3b8; }
    .ai-close-btn { background: none; border: none; color: #94a3b8; font-size: 24px; cursor: pointer; }
    .ai-chat-messages { flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; background: #0b0f19; }
    .ai-msg { max-width: 82%; padding: 10px 14px; border-radius: 14px; font-size: 13.5px; line-height: 1.5; word-wrap: break-word; color: #f1f5f9; }
    .bot-msg { background: #1e293b; align-self: flex-start; border-top-right-radius: 4px; border: 1px solid #334155; }
    .user-msg { background: #3b82f6; color: #fff; align-self: flex-end; border-top-left-radius: 4px; }
    .msg-time { display: block; font-size: 9px; margin-top: 4px; color: #cbd5e1; text-align: left; }
    .ai-quick-chips { padding: 8px 12px; display: flex; gap: 6px; overflow-x: auto; background: #111827; border-top: 1px solid #1f2937; }
    .ai-quick-chips::-webkit-scrollbar { height: 4px; }
    .ai-quick-chips::-webkit-scrollbar-thumb { background: #374151; border-radius: 2px; }
    .ai-quick-chips button { background: #1f2937; border: 1px solid #374151; color: #93c5fd; padding: 6px 12px; border-radius: 20px; font-size: 11.5px; cursor: pointer; white-space: nowrap; }
    .ai-quick-chips button:hover { background: #3b82f6; color: #fff; }
    .ai-chat-input-area { padding: 12px; background: #1e293b; display: flex; gap: 8px; border-top: 1px solid #334155; }
    .ai-chat-input-area input { flex: 1; background: #0f172a; border: 1px solid #334155; padding: 10px 14px; border-radius: 10px; color: #fff; font-size: 13px; outline: none; }
    .ai-chat-input-area button { background: #3b82f6; border: none; width: 40px; height: 40px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #fff; }
    .ai-msg p { margin: 0; }
    .ai-msg code { background: rgba(255,255,255,0.1); padding: 1px 5px; border-radius: 4px; direction: ltr; unicode-bidi: embed; }
    .ai-msg a { word-break: break-all; }
    .ai-li { padding-right: 14px; position: relative; margin: 3px 0; }
    .ai-li::before { content: "•"; position: absolute; right: 2px; color: #60a5fa; }
    .ai-typing { display: inline-flex; gap: 4px; padding: 4px 2px; }
    .ai-typing i { width: 7px; height: 7px; border-radius: 50%; background: #94a3b8; animation: aiDot 1.2s infinite ease-in-out; }
    .ai-typing i:nth-child(2) { animation-delay: .18s; } .ai-typing i:nth-child(3) { animation-delay: .36s; }
    @keyframes aiDot { 0%, 80%, 100% { opacity: .25; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-3px); } }
    .ai-chat-input-area button:disabled { opacity: .5; cursor: not-allowed; }
    .ai-msg { user-select: text; }
    .ai-chats-panel { position: absolute; top: 69px; left: 0; right: 0; bottom: 0; background: #0b0f19; z-index: 6; overflow-y: auto; padding: 12px; border-radius: 0 0 20px 20px; }
    .ai-cp-title { color: #f8fafc; font-weight: 800; font-size: 14px; margin-bottom: 4px; }
    .ai-cp-sub { color: #94a3b8; font-size: 11.5px; line-height: 1.7; margin-bottom: 10px; }
    .ai-cp-new { width: 100%; background: #3b82f6; color: #fff; border: none; border-radius: 10px; padding: 10px; font-weight: 800; font-size: 13px; cursor: pointer; margin-bottom: 10px; }
    .ai-cp-new:disabled { background: #334155; color: #94a3b8; cursor: not-allowed; }
    .ai-cp-item { display: flex; align-items: center; gap: 8px; background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 9px 10px; margin-bottom: 8px; }
    .ai-cp-item.cur { border-color: #3b82f6; }
    .ai-cp-main { flex: 1; min-width: 0; cursor: pointer; }
    .ai-cp-main b { display: block; color: #f1f5f9; font-size: 12.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ai-cp-main small { color: #94a3b8; font-size: 10.5px; }
    .ai-cp-del { background: transparent; border: 1px solid #ef4444; color: #ef4444; border-radius: 8px; padding: 4px 9px; font-size: 11.5px; cursor: pointer; font-weight: 700; }
    .ai-cp-warn { background: rgba(251,191,36,.1); border: 1px solid rgba(251,191,36,.4); color: #fbbf24; border-radius: 10px; padding: 8px 10px; font-size: 11.5px; line-height: 1.7; margin-bottom: 10px; }
    .ai-usage { padding: 8px 14px 9px; background: #0f172a; border-top: 1px solid #1f2937; }
    .ai-usage-row { display: flex; justify-content: space-between; align-items: center; font-size: 11.5px; color: #94a3b8; margin-bottom: 5px; }
    .ai-usage-row b { color: #93c5fd; font-size: 12px; }
    .ai-usage-bar { height: 5px; background: #1e293b; border-radius: 4px; overflow: hidden; }
    .ai-usage-bar i { display: block; height: 100%; background: #3b82f6; border-radius: 4px; transition: width .4s ease; }
    .ai-usage.low .ai-usage-row b { color: #fbbf24; } .ai-usage.low .ai-usage-bar i { background: #fbbf24; }
    .ai-usage.out .ai-usage-row b { color: #f87171; } .ai-usage.out .ai-usage-bar i { background: #ef4444; }
    .ai-usage-note { margin-top: 6px; font-size: 11px; line-height: 1.6; color: #fca5a5; }
    @media(max-width: 480px) { .ai-chat-box { width: 90vw; right: -10px; height: 450px; } }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.innerText = widgetCSS;
    document.head.appendChild(styleSheet);

    const wrapper = document.createElement("div");
    wrapper.innerHTML = widgetHTML;
    document.body.appendChild(wrapper);

    // 2. البرمجة والتحكم في السحب والفتح والإرسال
    const container = document.getElementById('ai-widget-container');
    const toggleBtn = document.getElementById('ai-toggle-btn');
    const chatBox = document.getElementById('ai-chat-box');
    const closeBtn = document.getElementById('ai-close-btn');
    const sendBtn = document.getElementById('ai-send-btn');
    const userInput = document.getElementById('ai-user-input');
    const chatMessages = document.getElementById('ai-chat-messages');

    // خاصية السحب والإفلات للزرار العائم
    let isDragging = false, startX, startY, hasMoved = false;

    function startDrag(e) {
        isDragging = true;
        hasMoved = false;
        const p = e.touches ? e.touches[0] : e;
        startX = p.clientX;
        startY = p.clientY;
        const rect = container.getBoundingClientRect();
        container.style.bottom = 'auto';
        container.style.right = 'auto';
        container.style.left = rect.left + 'px';
        container.style.top = rect.top + 'px';
    }

    function doDrag(e) {
        if (!isDragging) return;
        const p = e.touches ? e.touches[0] : e;
        const dx = p.clientX - startX;
        const dy = p.clientY - startY;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) hasMoved = true;
        container.style.left = (container.offsetLeft + dx) + 'px';
        container.style.top = (container.offsetTop + dy) + 'px';
        startX = p.clientX;
        startY = p.clientY;
    }

    function stopDrag() { isDragging = false; }

    container.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
    container.addEventListener('touchstart', startDrag, {passive: true});
    document.addEventListener('touchmove', doDrag, {passive: true});
    document.addEventListener('touchend', stopDrag);

    toggleBtn.addEventListener('click', () => {
        if (!hasMoved) {
            chatBox.classList.toggle('hidden');
            if (!chatBox.classList.contains('hidden') && SID) {
                if (usageDay && usageDay !== cairoDayStr()) loadUsage(); else renderUsage();
            }
        }
    });

    closeBtn.addEventListener('click', () => chatBox.classList.add('hidden'));

    window.sendQuickPrompt = function(text) {
        if (userInput) {
            userInput.value = text;
            sendUserMessage();
        }
    };

    // 3. المحرك الذكي المفتوح للردود (بدون قيود وبدون رسائل موحدة معفنة)
    function legacyFaq(query) {
        const q = query.toLowerCase();

        // الروابط والخدمات الخاصة بمنصتك
        if (q.includes('vip') || q.includes('تفعيل')) {
            return `<svg class="ic" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-0.125em;flex-shrink:0;color:#22d3ee" aria-hidden="true"><path d="M6 3h12l4 6-10 13L2 9z"/><path d="M2 9h20"/></svg> <strong>تفعيل اشتراك الـ VIP:</strong><br>ادخل على ملفك الشخصي <svg class="ic" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-0.125em;flex-shrink:0" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>، انزل عند خانة "تفعيل اشتراك الـ VIP"، اكتب الكود واضغط تفعيل <svg class="ic" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-0.125em;flex-shrink:0;color:#fbbf24" aria-hidden="true"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>.<br>لو مش معاك كود، تواصل فوراً مع الدعم: <a href="https://wa.me/201038783039" target="_blank" style="color:#60a5fa;">واتساب الدعم</a>`;
        }
        if (q.includes('نقاط') || q.includes('مستويات')) {
            return `<svg class="ic" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-0.125em;flex-shrink:0;color:#fbbf24" aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-1.04 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98 1.04 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0z"/></svg> <strong>نظام النقاط والمستويات:</strong><br>كل ما تحضر حصص وتجاوز امتحانات بتجمع نقاط تطلعك من (ضعيف <svg class="ic" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-0.125em;flex-shrink:0;color:#ef4444" aria-hidden="true"><circle cx="12" cy="12" r="6" fill="currentColor" stroke="none"/></svg>) لحد ما توصل لـ (أسطوري <svg class="ic" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-0.125em;flex-shrink:0;color:#fbbf24" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>)!`;
        }
        if (q.includes('يوتيوب') || q.includes('قناة') || q.includes('تليجرام') || q.includes('انستغرام') || q.includes('قنوات')) {
            return `<svg class="ic" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-0.125em;flex-shrink:0" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg> <strong>قنواتنا الرسمية يا بطل:</strong><br>
            • يوتيوب: <a href="https://youtube.com/@study_tripp?si=IWKOjS9PMBa-Oru5" target="_blank" style="color:#60a5fa;">اضغط هنا</a><br>
            • تيليجرام: <a href="https://t.me/Study_tripp" target="_blank" style="color:#60a5fa;">اضغط هنا</a><br>
            • واتساب: <a href="https://whatsapp.com/channel/0029Vb8LoLC0rGiRfVLpmf0u" target="_blank" style="color:#60a5fa;">اضغط هنا</a><br>
            • انستغرام: <a href="https://instagram.com/study_tripp?psln=MXFvZnN1cGFscmx3cA%3D%3D" target="_blank" style="color:#60a5fa;">اضغط هنا</a>`;
        }
        if (q.includes('دعم') || q.includes('تواصل')) {
            return `<svg class="ic" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-0.125em;flex-shrink:0" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg> <strong>التواصل والدعم الفني:</strong><br>
            • واتساب: <a href="https://wa.me/201038783039" target="_blank" style="color:#60a5fa;">01038783039</a><br>
            • تيليجرام: <a href="https://t.me/A_S_H_RE" target="_blank" style="color:#60a5fa;">@A_S_H_RE</a>`;
        }

        // لأي سؤال تاني (أكاديمي، عام، أو بحثي)، يدي إجابة تفصيلية مفتوحة ومفيدة فوراً
        return `<svg class="ic" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-0.125em;flex-shrink:0" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> بخصوص سؤالك عن (<strong>${query}</strong>):<br>أنا جاهز أساعدك وأشرحهالك بالتفصيل! تقدر تسألني في أي قاعدة نحوية، مصطلح علمي، مسألة رياضية، أو تاريخ، وهبسطهالك فوراً كأن مستر معاك خطوة بخطوة <svg class="ic" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-0.125em;flex-shrink:0" aria-hidden="true"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>.`;
    }


    // ===== المساعد الذكي: بيكلّم Worker منفصل للمساعد (ai-worker.js) والمفاتيح محفوظة هناك =====
    const AI_ENDPOINT = 'https://study-ai.mohamad91xm.workers.dev/chat'; // Worker منفصل (ai-worker.js)
    const QUICK_FAQ = ['ازاي أفعل الـ VIP؟', 'نظام النقاط والمستويات', 'فين قناة اليوتيوب؟', 'التواصل مع الدعم'];
    const history = [];      // آخر الرسائل (user / assistant) اللي بتتبعت للـ AI
    let transcript = [];     // المحادثة كلها للحفظ: { r:'u'|'b', c:نص, h:true لو HTML جاهز }
    let busy = false;

    function esc(t) {
        return String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    // تنسيق آمن لرد الـ AI: escape الأول وبعدين bold / code / روابط / نقط
    function formatAi(text) {
        let h = esc(text);
        h = h.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
        h = h.replace(/`([^`\n]+)`/g, '<code>$1</code>');
        h = h.replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)\]،؟])/g, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:#60a5fa;">$1</a>');
        const out = h.split('\n').map(line => {
            const m = line.match(/^\s*(?:[-•*]|\d+[.)])\s+(.*)$/);
            const hd = line.match(/^\s*#{1,4}\s+(.*)$/);
            if (m) return '<div class="ai-li">' + m[1] + '</div>';
            if (hd) return '<strong>' + hd[1] + '</strong><br>';
            return line.trim() === '' ? '<div style="height:6px"></div>' : line + '<br>';
        }).join('');
        return out.replace(/(<br>)+$/, '');
    }

    function appendMessage(content, sender, isHtml) {
        if (!chatMessages) return null;
        const msgDiv = document.createElement('div');
        msgDiv.className = `ai-msg ${sender === 'user' ? 'user-msg' : 'bot-msg'}`;
        const p = document.createElement('p');
        if (isHtml) p.innerHTML = content; else p.textContent = content;   // رسالة الطالب دايماً نص عادي (منع XSS)
        const t = document.createElement('span');
        t.className = 'msg-time';
        t.textContent = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
        msgDiv.appendChild(p);
        msgDiv.appendChild(t);
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return msgDiv;
    }

    function toMs(v) {
        if (!v) return 0;
        if (typeof v === 'number') return v;
        if (typeof v.toMillis === 'function') return v.toMillis();
        if (typeof v.seconds === 'number') return v.seconds * 1000;
        const n = Date.parse(v);
        return isNaN(n) ? 0 : n;
    }

    // بيانات بسيطة عن الطالب الحالي (اسمه الأول ونقاطه…) عشان الرد يبقى شخصي ودقيق
    function studentContext() {
        try {
            const d = (window.PS && PS.getStudent && PS.getStudent()) || null;
            if (!d) return null;
            const points = Math.max(Number(d.totalScore) || 0, Number(d.points) || 0);
            const exp = toMs(d.subscriptionExpiry);
            const active = d.isSubscribed === true && exp > Date.now();
            return {
                name: String(d.fullName || d.name || '').trim().split(/\s+/)[0] || '',
                points: points,
                level: window.LV ? LV.levelOf(points) : undefined,
                rank: window.PS && PS.rank ? PS.rank(points).label : '',
                streak: Number(d.streak) || 0,
                plan: d.accountType === 'trial' ? (active ? 'تجربة مجانية' : 'مجاني') : (active ? 'VIP' : 'مجاني'),
                daysLeft: active ? Math.max(0, Math.ceil((exp - Date.now()) / 86400000)) : undefined
            };
        } catch (e) { return null; }
    }

    const SUPPORT_HTML = '<br>لو المشكلة مستمرة كلّم الدعم: <a href="https://wa.me/201038783039" target="_blank" rel="noopener noreferrer" style="color:#60a5fa;">واتساب 01038783039</a>';

    async function askAi() {
        let ok = false;
        const typing = appendMessage('<span class="ai-typing"><i></i><i></i><i></i></span>', 'bot', true);
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 45000);
        try {
            const res = await fetch(AI_ENDPOINT, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ messages: history.slice(-8), ctx: studentContext() }),
                signal: ctrl.signal
            });
            let data = {};
            try { data = await res.json(); } catch (e) {}
            let html;
            // تشخيص للمطور: بيظهر في Console المتصفح (F12) لو الـ AI مش شغال
            if (!(res.ok && data.reply)) console.warn('[AI] status', res.status, data);
            if (res.ok && data.reply) {
                history.push({ role: 'assistant', content: data.reply });
                transcript.push({ r: 'b', c: data.reply });
                ok = true;
                html = formatAi(data.reply);
            } else if (res.status === 429) {
                history.pop();
                html = data.error === 'daily_limit'
                    ? 'وصلت للحد اليومي من الأسئلة من الشبكة دي، جرّب تاني بكرة.' + SUPPORT_HTML
                    : 'بتسأل بسرعة! استنى نص دقيقة وكمّل.';
            } else if (res.status === 503) {
                history.pop();
                html = 'المساعد الذكي غير متاح دلوقتي.' + SUPPORT_HTML;
            } else {
                history.pop();
                html = 'حصلت مشكلة وأنا بجهّز الرد، جرّب تبعت سؤالك تاني.' + SUPPORT_HTML;
            }
            typing.querySelector('p').innerHTML = html;
        } catch (e) {
            history.pop();
            typing.querySelector('p').innerHTML = (e && e.name === 'AbortError' ? 'الرد اتأخر أوي.' : 'مفيش اتصال بالمساعد دلوقتي، اتأكد من النت.') + ' جرّب تاني.' + SUPPORT_HTML;
        } finally {
            clearTimeout(timer);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        return ok;
    }

    function setBusy(b) {
        busy = b;
        const locked = b || limitReached();
        if (sendBtn) sendBtn.disabled = locked;
        if (userInput) userInput.disabled = locked;
        if (!locked && userInput && !chatBox.classList.contains('hidden')) userInput.focus();
    }

    async function sendUserMessage() {
        if (busy) return;
        const text = userInput.value.trim().slice(0, 1000);
        if (!text) return;
        const isFaq = QUICK_FAQ.indexOf(text) !== -1;

        // الحد اليومي (الأسئلة السريعة مش بتتحسب)
        if (!isFaq && limitReached()) { renderUsage(); appendMessage(limitMsg(), 'bot', true); return; }

        // أول رسالة في دردشة جديدة: لازم يكون فيه مكان (حد أقصى 5 دردشات محفوظة)
        if (SID && !chatId) {
            await loadChats();
            if (savedChats.length >= MAX_CHATS) { openPanel(true); return; }
            chatId = SID + '_' + Date.now();
        }

        // حجز سؤال من الحد اليومي (Transaction) قبل ما نبعت للـ AI
        if (!isFaq) {
            setBusy(true);
            const got = await reserveSlot();
            if (!got) { setBusy(false); appendMessage(limitMsg(), 'bot', true); return; }
        }

        appendMessage(text, 'user', false);
        userInput.value = '';
        transcript.push({ r: 'u', c: text });

        // الأسئلة السريعة (الأزرار) بترد فوراً من غير AI
        if (isFaq) {
            const faq = legacyFaq(text);
            setTimeout(() => appendMessage(faq, 'bot', true), 250);
            transcript.push({ r: 'b', c: faq, h: true });
            saveChat();
            return;
        }

        history.push({ role: 'user', content: text });
        if (history.length > 10) history.splice(0, history.length - 10);
        const ok = await askAi();
        if (!ok) { transcript.pop(); await refundSlot(); } else saveChat();   // لو الرد فشل السؤال مش بيتحسب
        setBusy(false);
    }

    if (sendBtn) sendBtn.addEventListener('click', sendUserMessage);
    if (userInput) {
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendUserMessage();
        });
    }

    // ===== نظام الدردشات المحفوظة (حد أقصى 5 لكل طالب) — Firestore: aiChats/{studentId}_{timestamp} =====
    const MAX_CHATS = 5;
    const FS_VER = '10.8.0';
    const FB_CFG = { apiKey: "AIzaSyBORRXM-bw9Svp4QS8_1OWUGGbhJToQM6U", authDomain: "study-trip-1.firebaseapp.com", projectId: "study-trip-1", storageBucket: "study-trip-1.firebasestorage.app", messagingSenderId: "632096690853", appId: "1:632096690853:web:f9622d14de73a761dcf34c" };
    const WELCOME_HTML = chatMessages ? chatMessages.innerHTML : '';
    const SID = (function () { try { if (window.PS && !PS.isAdminSession() && PS.studentId()) return String(PS.studentId()).toUpperCase(); } catch (e) {} return ''; })();
    let chatId = null, savedChats = [], chatsLoaded = false, fsCache = null;

    async function fsApi() {
        if (fsCache) return fsCache;
        const A = await import('https://www.gstatic.com/firebasejs/' + FS_VER + '/firebase-app.js');
        const F = await import('https://www.gstatic.com/firebasejs/' + FS_VER + '/firebase-firestore.js');
        let app; try { app = A.getApp('ai-chats'); } catch (e) { app = A.initializeApp(FB_CFG, 'ai-chats'); }
        fsCache = { F, db: F.getFirestore(app) };
        return fsCache;
    }

    async function loadChats(force) {
        if (!SID) return [];
        if (chatsLoaded && !force) return savedChats;
        try {
            const { F, db } = await fsApi();
            const snap = await F.getDocs(F.query(F.collection(db, 'aiChats'), F.where('studentId', '==', SID)));
            savedChats = []; snap.forEach(d => savedChats.push({ id: d.id, ...d.data() }));
            savedChats.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
            chatsLoaded = true;
        } catch (e) { console.warn('[AI] chats load', e); }
        updateCount();
        return savedChats;
    }

    function updateCount() {
        const el = document.getElementById('ai-chats-count');
        if (el && SID) el.textContent = 'دردشاتي ' + (chatsLoaded ? savedChats.length + '/' + MAX_CHATS : '');
    }

    async function saveChat() {
        if (!SID || !chatId || !transcript.length) return;
        try {
            const { F, db } = await fsApi();
            const firstUser = transcript.find(m => m.r === 'u');
            const messages = transcript.slice(-60).map(m => ({ r: m.r, c: String(m.c).slice(0, 4000), h: m.h === true }));
            const data = { studentId: SID, title: String(firstUser ? firstUser.c : 'دردشة').slice(0, 40), messages, updatedAt: Date.now() };
            await F.setDoc(F.doc(db, 'aiChats', chatId), data, { merge: true });
            const i = savedChats.findIndex(c => c.id === chatId);
            if (i >= 0) savedChats[i] = { id: chatId, ...data }; else savedChats.unshift({ id: chatId, ...data });
            savedChats.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
            updateCount();
        } catch (e) { console.warn('[AI] chat save', e); }
    }

    function renderTranscript() {
        chatMessages.innerHTML = WELCOME_HTML;
        transcript.forEach(m => {
            if (m.r === 'u') appendMessage(m.c, 'user', false);
            else appendMessage(m.h ? m.c : formatAi(m.c), 'bot', true);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function startNewChat() {
        chatId = null; transcript = []; history.length = 0;
        chatMessages.innerHTML = WELCOME_HTML;
        closePanel();
        if (userInput) userInput.focus();
    }

    async function openChat(id) {
        const c = savedChats.find(x => x.id === id); if (!c) return;
        chatId = id;
        transcript = (c.messages || []).map(m => ({ r: m.r, c: m.c, h: m.h === true }));
        history.length = 0;
        transcript.slice(-10).forEach(m => { if (!m.h) history.push({ role: m.r === 'u' ? 'user' : 'assistant', content: m.c }); });
        while (history.length && history[0].role !== 'user') history.shift();
        renderTranscript();
        closePanel();
    }

    async function deleteChat(id) {
        if (!confirm('تحذف الدردشة دي نهائياً؟')) return;
        try {
            const { F, db } = await fsApi();
            await F.deleteDoc(F.doc(db, 'aiChats', id));
            savedChats = savedChats.filter(c => c.id !== id);
            if (chatId === id) { chatId = null; transcript = []; history.length = 0; chatMessages.innerHTML = WELCOME_HTML; }
            updateCount();
            openPanel(false);
        } catch (e) { console.warn('[AI] chat delete', e); }
    }

    const panel = document.getElementById('ai-chats-panel');
    function closePanel() { if (panel) panel.style.display = 'none'; }
    async function openPanel(limitHit) {
        if (!panel) return;
        panel.style.display = 'block';
        if (!SID) { panel.innerHTML = '<div class="ai-cp-title">دردشاتي</div><div class="ai-cp-sub">لازم تسجل دخول كطالب عشان دردشاتك تتحفظ.</div>'; return; }
        panel.innerHTML = '<div class="ai-cp-sub">جاري التحميل...</div>';
        await loadChats();
        const full = savedChats.length >= MAX_CHATS;
        panel.innerHTML = '<div class="ai-cp-title">دردشاتي (' + savedChats.length + '/' + MAX_CHATS + ')</div>' +
            (limitHit ? '<div class="ai-cp-warn">وصلت للحد الأقصى (' + MAX_CHATS + ' دردشات). احذف دردشة عشان تقدر تبدأ واحدة جديدة، وبعدها ابعت سؤالك تاني.</div>' : '<div class="ai-cp-sub">دردشاتك بتتحفظ تلقائي وتقدر ترجعلها في أي وقت. لو عايز تحفظ أكتر من ' + MAX_CHATS + ' لازم تحذف واحدة.</div>') +
            '<button class="ai-cp-new" id="ai-cp-new"' + (full ? ' disabled' : '') + '>+ دردشة جديدة' + (full ? ' (احذف واحدة الأول)' : '') + '</button>' +
            (savedChats.length ? savedChats.map(c => '<div class="ai-cp-item' + (c.id === chatId ? ' cur' : '') + '"><div class="ai-cp-main" data-open="' + esc(c.id) + '"><b>' + esc(c.title || 'دردشة') + '</b><small>' + new Date(c.updatedAt || 0).toLocaleString('ar-EG', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) + ' · ' + (c.messages ? c.messages.length : 0) + ' رسالة</small></div><button class="ai-cp-del" data-del="' + esc(c.id) + '">حذف</button></div>').join('') : '<div class="ai-cp-sub">مفيش دردشات محفوظة لسه.</div>');
    }

    const chatsBtn = document.getElementById('ai-chats-btn');
    if (chatsBtn) chatsBtn.addEventListener('click', (e) => { e.stopPropagation(); (panel.style.display === 'block') ? closePanel() : openPanel(false); });
    chatsBtn && chatsBtn.addEventListener('mousedown', (e) => e.stopPropagation());
    if (panel) {
        panel.addEventListener('mousedown', (e) => e.stopPropagation());
        panel.addEventListener('click', (e) => {
            if (e.target.id === 'ai-cp-new') { if (!e.target.disabled) startNewChat(); return; }
            const o = e.target.closest('[data-open]'); if (o) { openChat(o.getAttribute('data-open')); return; }
            const d = e.target.closest('[data-del]'); if (d) deleteChat(d.getAttribute('data-del'));
        });
    }

    // ===== الحد اليومي لأسئلة المساعد — Firestore: aiUsage/{studentId} = { studentId, day, count, updatedAt } =====
    // عدّل الأرقام هنا بس. اليوم بتوقيت القاهرة وبيتجدد 12 بالليل. الأدمن مالوش حد.
    const AI_LIMITS = { free: 15, trial: 15, vip: 40 };
    let usedToday = 0, usageDay = '', usageReady = false;
    const INPUT_PLACEHOLDER = userInput ? userInput.placeholder : '';

    function cairoDayStr() {
        try { return new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' }); }
        catch (e) { return new Date().toISOString().slice(0, 10); }
    }
    function isVipNow() { const c = studentContext(); return !!(c && c.plan === 'VIP'); }
    function dailyLimit() {
        const c = studentContext();
        return c && c.plan === 'VIP' ? AI_LIMITS.vip : (c && c.plan === 'تجربة مجانية' ? AI_LIMITS.trial : AI_LIMITS.free);
    }
    function limitReached() { return !!SID && usageReady && usedToday >= dailyLimit(); }

    function limitMsg() {
        return 'وصلت للحد اليومي من أسئلة المساعد (' + dailyLimit() + ' سؤال). بيتجدد الساعة 12 بالليل بتوقيت القاهرة، والأزرار السريعة لسه شغالة.' +
            (isVipNow() ? '' : '<br>مشتركين الـ VIP حدهم اليومي ' + AI_LIMITS.vip + ' سؤال.');
    }

    function renderUsage() {
        const el = document.getElementById('ai-usage');
        if (!el) return;
        if (!SID || !usageReady) { el.style.display = 'none'; return; }
        const lim = dailyLimit(), left = Math.max(0, lim - usedToday);
        const pct = Math.min(100, Math.round((usedToday / lim) * 100));
        el.style.display = 'block';
        el.className = 'ai-usage' + (left === 0 ? ' out' : left <= 3 ? ' low' : '');
        el.innerHTML = '<div class="ai-usage-row"><span>أسئلتك النهارده</span><b>متبقي ' + left + ' من ' + lim + '</b></div>' +
            '<div class="ai-usage-bar"><i style="width:' + pct + '%"></i></div>' +
            (left === 0 ? '<div class="ai-usage-note">خلصت أسئلة النهارده. بيتجدد الساعة 12 بالليل بتوقيت القاهرة.</div>' : '');
        if (userInput) userInput.placeholder = left === 0 ? 'خلصت حدك اليومي، بيتجدد بكرة' : INPUT_PLACEHOLDER;
        setBusy(busy);
    }

    async function loadUsage() {
        if (!SID) return;
        try {
            const { F, db } = await fsApi();
            const snap = await F.getDoc(F.doc(db, 'aiUsage', SID));
            const d = snap.exists() ? snap.data() : null;
            usageDay = cairoDayStr();
            usedToday = d && d.day === usageDay ? (Number(d.count) || 0) : 0;
            usageReady = true;
        } catch (e) { console.warn('[AI] usage load', e); }   // لو فشل (مثلاً القواعد لسه متضافتش) المساعد يكمّل عادي من غير حد
        renderUsage();
    }

    // بيحجز سؤال واحد (+1) لو لسه فيه رصيد. بيرجّع false بس لو الحد خلص فعلاً.
    async function reserveSlot() {
        if (!SID) return true;
        try {
            const { F, db } = await fsApi();
            const ref = F.doc(db, 'aiUsage', SID), day = cairoDayStr(), lim = dailyLimit();
            const r = await F.runTransaction(db, async (tx) => {
                const s = await tx.get(ref);
                const d = s.exists() ? s.data() : {};
                const cur = d.day === day ? (Number(d.count) || 0) : 0;
                if (cur >= lim) return { ok: false, count: cur };
                tx.set(ref, { studentId: SID, day: day, count: cur + 1, updatedAt: Date.now() });
                return { ok: true, count: cur + 1 };
            });
            usageDay = day; usedToday = r.count; usageReady = true;
            renderUsage();
            return r.ok;
        } catch (e) { console.warn('[AI] usage reserve', e); return true; }
    }

    // لو الرد فشل بنرجّع السؤال للطالب
    async function refundSlot() {
        if (!SID || !usageReady) return;
        try {
            const { F, db } = await fsApi();
            const ref = F.doc(db, 'aiUsage', SID), day = cairoDayStr();
            const n = await F.runTransaction(db, async (tx) => {
                const s = await tx.get(ref);
                const d = s.exists() ? s.data() : null;
                if (!d || d.day !== day || !(Number(d.count) > 0)) return null;
                tx.set(ref, { studentId: SID, day: day, count: Number(d.count) - 1, updatedAt: Date.now() });
                return Number(d.count) - 1;
            });
            if (n !== null) usedToday = n;
        } catch (e) { console.warn('[AI] usage refund', e); }
        renderUsage();
    }

    if (SID) loadUsage().catch(() => {});
    if (SID) loadChats().catch(() => {});
})();

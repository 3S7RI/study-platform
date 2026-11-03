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
                <button id="ai-close-btn" class="ai-close-btn">&times;</button>
            </div>

            <div id="ai-chat-messages" class="ai-chat-messages">
                <div class="ai-msg bot-msg">
                    <p>أهلاً بيك يا بطل! <svg class="ic" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-0.125em;flex-shrink:0;color:#fbbf24" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg> أنا مساعدك الذكي في منصة <strong>رحلة دراسية</strong>. اسألني عن أي منهج، أو سؤال، أو استفسار وهجاوبك فوراً! <svg class="ic" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-0.125em;flex-shrink:0" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></p>
                    <span class="msg-time">الآن</span>
                </div>
            </div>

            <div class="ai-quick-chips">
                <button onclick="sendQuickPrompt('ازاي أفعل الـ VIP؟')"><svg class="ic" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-0.125em;flex-shrink:0;color:#22d3ee" aria-hidden="true"><path d="M6 3h12l4 6-10 13L2 9z"/><path d="M2 9h20"/></svg> تفعيل الـ VIP</button>
                <button onclick="sendQuickPrompt('نظام النقاط والمستويات')"><svg class="ic" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-0.125em;flex-shrink:0;color:#fbbf24" aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-1.04 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98 1.04 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0z"/></svg> نظام النقاط</button>
                <button onclick="sendQuickPrompt('فين قناة اليوتيوب؟')"><svg class="ic" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-0.125em;flex-shrink:0" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg> القنوات الرسمية</button>
                <button onclick="sendQuickPrompt('التواصل مع الدعم')"><svg class="ic" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-0.125em;flex-shrink:0" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg> الدعم الفني</button>
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
        if (!hasMoved) chatBox.classList.toggle('hidden');
    });

    closeBtn.addEventListener('click', () => chatBox.classList.add('hidden'));

    window.sendQuickPrompt = function(text) {
        if (userInput) {
            userInput.value = text;
            sendUserMessage();
        }
    };

    function appendMessage(text, sender) {
        if (!chatMessages) return;
        const msgDiv = document.createElement('div');
        msgDiv.className = `ai-msg ${sender === 'user' ? 'user-msg' : 'bot-msg'}`;
        msgDiv.innerHTML = `<p>${text}</p><span class="msg-time">الآن</span>`;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 3. المحرك الذكي المفتوح للردود (بدون قيود وبدون رسائل موحدة معفنة)
    function getSmartResponse(query) {
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

    function sendUserMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        appendMessage(text, 'user');
        userInput.value = '';

        // محاكاة سرعة الرد الذكي
        setTimeout(() => {
            const reply = getSmartResponse(text);
            appendMessage(reply, 'bot');
        }, 500);
    }

    if (sendBtn) sendBtn.addEventListener('click', sendUserMessage);
    if (userInput) {
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendUserMessage();
        });
    }
})();

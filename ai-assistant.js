(function() {
    // 1. حقن الـ HTML والـ CSS مباشرة في الصفحة أوتوماتيكياً
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
                    <p>أهلاً بيك يا بطل! 🌟 أنا مساعدك الذكي في منصة <strong>رحلة دراسية</strong>. جاهز أساعدك في منهج 3 إعدادي، أسألك، أو أدعمك نفسياً. تسألني عن إيه النهاردة؟ 📚</p>
                    <span class="msg-time">الآن</span>
                </div>
            </div>

            <div class="ai-quick-chips">
                <button onclick="sendQuickPrompt('💎 ازاي أفعل الـ VIP؟')">💎 تفعيل الـ VIP</button>
                <button onclick="sendQuickPrompt('🏆 نظام النقاط والمستويات')">🏆 نظام النقاط</button>
                <button onclick="sendQuickPrompt('📺 فين قناة اليوتيوب؟')">📺 القنوات الرسمية</button>
                <button onclick="sendQuickPrompt('📞 التواصل مع الدعم')">📞 الدعم الفني</button>
            </div>

            <div class="ai-chat-input-area">
                <input type="text" id="ai-user-input" placeholder="اكتب سؤالك (التيار الكهربي، صيغة المبالغة...)" />
                <button id="ai-send-btn">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
                </button>
            </div>
        </div>
    </div>
    `;

    const widgetCSS = `
    .ai-widget-container { position: fixed; bottom: 25px; right: 25px; z-index: 99999; font-family: 'Cairo', sans-serif; direction: rtl; }
    .ai-toggle-btn { width: 65px; height: 65px; border-radius: 50%; background: #1e293b; border: 2px solid #3b82f6; cursor: pointer; box-shadow: 0 8px 20px rgba(0,0,0,0.25); position: relative; transition: transform 0.3s ease; display: flex; align-items: center; justify-content: center; padding: 0; overflow: hidden; }
    .ai-toggle-btn:hover { transform: scale(1.08); }
    .ai-logo-img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
    .ai-badge-online { position: absolute; bottom: 5px; right: 5px; width: 14px; height: 14px; background-color: #10b981; border: 2px solid #fff; border-radius: 50%; }
    .ai-chat-box { position: absolute; bottom: 80px; right: 0; width: 360px; height: 500px; background: #0f172a; border: 1px solid #334155; border-radius: 20px; box-shadow: 0 15px 35px rgba(0,0,0,0.4); display: flex; flex-direction: column; overflow: hidden; transition: all 0.3s ease; }
    .ai-chat-box.hidden { opacity: 0; pointer-events: none; transform: translateY(20px) scale(0.95); }
    .ai-chat-header { background: #1e293b; padding: 15px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #334155; }
    .ai-header-info { display: flex; align-items: center; gap: 10px; }
    .ai-mini-logo { width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 1px solid #3b82f6; }
    .ai-header-info h4 { margin: 0; color: #f8fafc; font-size: 15px; }
    .ai-status { font-size: 11px; color: #94a3b8; }
    .ai-close-btn { background: none; border: none; color: #94a3b8; font-size: 24px; cursor: pointer; }
    .ai-chat-messages { flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; background: #0b0f19; }
    .ai-msg { max-width: 82%; padding: 10px 14px; border-radius: 14px; font-size: 13.5px; line-height: 1.5; word-wrap: break-word; }
    .bot-msg { background: #1e293b; color: #f1f5f9; align-self: flex-start; border-top-right-radius: 4px; border: 1px solid #334155; }
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

    // حقن التصميم والـ HTML في الصفحة
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = widgetCSS;
    document.head.appendChild(styleSheet);

    const div = document.createElement("div");
    div.innerHTML = widgetHTML;
    document.body.appendChild(div);

    // 2. البرمجة والتحكم في فتح/قفل الشات وإرسال الرسائل الذكية
    const toggleBtn = document.getElementById('ai-toggle-btn');
    const chatBox = document.getElementById('ai-chat-box');
    const closeBtn = document.getElementById('ai-close-btn');
    const sendBtn = document.getElementById('ai-send-btn');
    const userInput = document.getElementById('ai-user-input');
    const chatMessages = document.getElementById('ai-chat-messages');

    toggleBtn.addEventListener('click', () => {
        chatBox.classList.toggle('hidden');
    });

    closeBtn.addEventListener('click', () => {
        chatBox.classList.add('hidden');
    });

    window.sendQuickPrompt = function(text) {
        userInput.value = text;
        sendUserMessage();
    };

    function appendMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `ai-msg ${sender === 'user' ? 'user-msg' : 'bot-msg'}`;
        msgDiv.innerHTML = `<p>${text}</p><span class="msg-time">الآن</span>`;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // محرك الردود الذكية (روابطك، قنواتك، دعمك، ومنهج 3 إعدادي)
    function getBotResponse(query) {
        query = query.toLowerCase();

        if (query.includes('vip') || query.includes('تفعيل')) {
            return `💎 <strong>تفعيل اشتراك الـ VIP:</strong><br>ادخل على ملفك الشخصي ⚙️، انزل عند خانة "تفعيل اشتراك الـ VIP"، اكتب الكود واضغط تفعيل ⚡.<br>لو مش معاك كود، تواصل فوراً مع الدعم: <a href="https://wa.me/201038783039" target="_blank" style="color:#60a5fa;">واتساب الدعم</a>[span_0](start_span)[span_0](end_span)`;
        }
        if (query.includes('نقاط') || query.includes('مستويات')) {
            return `🏆 <strong>نظام النقاط والمستويات:</strong><br>كل ما تحضر حصص وتجاوز امتحانات بتجمع نقاط تطلعك من (مبتدئ 🔴) لحد ما توصل لـ (أسطوري 🌟) بإطار متحرك!`;
        }
        if (query.includes('يوتيوب') || query.includes('قناة') || query.includes('تليجرام') || query.includes('انستغرام') || query.includes('قنوات')) {
            return `📺 <strong>قنواتنا الرسمية يا بطل:</strong><br>
            • يوتيوب: <a href="https://youtube.com/@study_tripp?si=IWKOjS9PMBa-Oru5" target="_blank" style="color:#60a5fa;">اضغط هنا</a>[span_1](start_span)[span_1](end_span)<br>
            • تيليجرام: <a href="https://t.me/Study_tripp" target="_blank" style="color:#60a5fa;">اضغط هنا</a>[span_2](start_span)[span_2](end_span)<br>
            • واتساب: <a href="https://whatsapp.com/channel/0029Vb8LoLC0rGiRfVLpmf0u" target="_blank" style="color:#60a5fa;">اضغط هنا</a>[span_3](start_span)[span_3](end_span)<br>
            • انستغرام: <a href="https://instagram.com/study_tripp?psln=MXFvZnN1cGFscmx3cA%3D%3D" target="_blank" style="color:#60a5fa;">اضغط هنا</a>[span_4](start_span)[span_4](end_span)`;
        }
        if (query.includes('دعم') || query.includes('تواصل')) {
            return `📞 <strong>التواصل والدعم الفني:</strong><br>
            • واتساب شخصي: <a href="https://wa.me/201038783039" target="_blank" style="color:#60a5fa;">01038783039</a>[span_5](start_span)[span_5](end_span)<br>
            • تيليجرام شخصي: <a href="https://t.me/A_S_H_RE" target="_blank" style="color:#60a5fa;">@A_S_H_RE</a>[span_6](start_span)[span_6](end_span)`;
        }
        if (query.includes('تيار') || query.includes('كهربي') || query.includes('علوم') || query.includes('صيغة') || query.includes('مبالغة') || query.includes('منهج')) {
            return `📚 <strong>سؤال ممتاز يا وحش!</strong><br>بخصوص المناهج (زي التيار الكهربي أو صيغة المبالغة وكل دروس 3 إعدادي): أنا جاهز أشرحها لك خطوة بخطوة أو أعملك كويز سريع عليها. اسألني في السؤال بالتحديد أو المفهوم اللي واقف قدامك وهبسطهالك فوراً! 🚀`;
        }

        // الرد الافتراضي التحفيزي العام
        return `يا هلا بيك يا بطل! 💡 أنا معاك ومتابعك. اسألني عن أي درس في منهج 3 إعدادي، أو عن نظام النقاط، أو تواصل مع مستر أحمد عبر الدعم الفني المباشر. كمل وشد حيلك! 💪✨`;
    }

    window.sendUserMessage = function() {
        const text = userInput.value.trim();
        if (!text) return;

        appendMessage(text, 'user');
        userInput.value = '';

        // محاكاة تفكير البوت بذكاء
        setTimeout(() => {
            const reply = getBotResponse(text);
            appendMessage(reply, 'bot');
        }, 600);
    };

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendUserMessage();
        }
    });

    sendBtn.addEventListener('click', sendUserMessage);
})();

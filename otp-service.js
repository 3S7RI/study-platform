// otp-service.js - خدمة إرسال التحقق عبر بريد Brevo الإلكتروني

export const dailyMessages = [
    "اقترب من الله يفتح لك أبواباً لم تكن تدور في خلدك، فالتوفيق بيده وحده.",
    "لا تحزن إن ضاقت بك الأمور، فرب العزة يخبئ لك الفرج الأعظم في أوقات الشدة.",
    "من ترك شيئاً لله، عوضه الله خيراً منه، واصل السعي وربك الكريم لن يضيع تعبك.",
    "النجاح ليس نهاية المطاف، والفشل ليس نهاية الحياة، بل هو مجرد خطوة نحو خبرة أعمق.",
    "اصبر لمرارة العلم، فإن عاقبته أحلى من العسل، وأنت الآن تصنع مستقبلك بنفسك.",
    "استعن بالله ولا تعجز، فكل خطوة تخطوها في طريق العلم والاجتهاد تكتب في ميزان حسناتك.",
    "استعينوا على قضاء حوائجكم بالكتمان والتوكل الصادق، فالله لا يخيب ظن عبد دعاه باصطبار.",
    "إن مع العسر يسراً، ثق تماماً أن كل تعب وسهر تعانيه اليوم ستجني ثماره قريباً جداً.",
    "توكل على الحي الذي لا يموت، واجعل هدفك واجتاز مرحلة التالتة إعدادي بتفوق مبهر.",
    "عقلك هذا كنز، وكل معلومة جديدة تستوعبها الآن تقربك أكثر نحو حلمك الكبير."
];

export async function sendEmailOtpProcess(emailInput, findStudentFunc, dbInstance) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailInput)) {
        return { success: false, message: 'أدخل بريد إلكتروني صحيح أولاً' };
    }

    try {
        const existingStudent = await findStudentFunc(dbInstance, emailInput);
        if (existingStudent) {
            return { success: false, message: 'هذا البريد الإلكتروني مسجل بحساب طالب بالفعل!' };
        }

        const generatedEmailOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const randomMessageIndex = Math.floor(Math.random() * dailyMessages.length);
        const selectedDailyMessage = dailyMessages[randomMessageIndex];
        
        const BREVO_API_KEY = "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";

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: { name: "منصة رحلة دراسية 🎓", email: "studytrip@studytrip.online" },
                to: [{ email: emailInput }],
                subject: "كود التحقق الخاص بك - منصة رحلة دراسية",
                htmlContent: `
                    <div style="direction: rtl; text-align: right; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px 25px; background: linear-gradient(135deg, #0f172a, #1e1b4b, #311042); border-radius: 20px; color: #f8fafc; max-width: 540px; margin: auto;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h2 style="color: #ffffff; font-size: 26px; font-weight: 800; margin: 0 0 8px 0;">منصة رحلة دراسية 🎓</h2>
                            <p style="color: #94a3b8; font-size: 15px; margin: 0;">بوابتك نحو التفوق والوصول للقمة</p>
                        </div>
                        <div style="background: rgba(30, 41, 59, 0.9); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 20px; padding: 30px 20px; text-align: center;">
                            <h3 style="color: #f8fafc; font-size: 20px; font-weight: 700; margin-bottom: 15px;">مرحباً بك، زائرنا المتميز 👋</h3>
                            <p style="color: #cbd5e1; font-size: 15px; line-height: 1.7; margin-bottom: 25px;">
                                يسعدنا انضمامك إلى عائلة <strong>منصة رحلة دراسية</strong>. لإتمام عملية تسجيل حسابك الجديد، يرجى استخدام كود التحقق أدناه:
                            </p>
                            <div style="background: rgba(15, 23, 42, 0.95); border: 2.5px solid #6366f1; color: #38bdf8; padding: 20px 30px; display: inline-block; font-size: 38px; font-weight: 900; border-radius: 18px; letter-spacing: 10px; margin: 15px 0;">
                                ${generatedEmailOtp}
                            </div>
                            <p style="color: #94a3b8; font-size: 13px; margin-top: 20px;">هذا الكود صالح لمدة دقائق معدودة، ولا تقم بمشاركته مع أي شخص نهائياً.</p>
                        </div>
                        <div style="margin-top: 30px; background: rgba(16, 185, 129, 0.12); border-right: 5px solid #10b981; padding: 20px; border-radius: 12px;">
                            <p style="color: #34d399; font-size: 14px; font-weight: 700; margin: 0 0 8px 0;">💡 رسالة اليوم لك:</p>
                            <p style="color: #e2e8f0; font-size: 14.5px; margin: 0; line-height: 1.7;">"${selectedDailyMessage}"</p>
                        </div>
                    </div>
                `
            })
        });

        if (response.ok) {
            return { success: true, otp: generatedEmailOtp };
        } else {
            return { success: false, message: 'فشل الإرسال، تأكد من تفعيل إيميل المرسل في حساب Brevo' };
        }
    } catch (error) {
        return { success: false, message: 'حدث خطأ غير متوقع أثناء إرسال البريد' };
    }
}

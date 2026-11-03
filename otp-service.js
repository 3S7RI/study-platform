// otp-service.js - إرسال والتحقق من كود البريد عبر Cloudflare Worker (مفتاح Brevo محفوظ كسر هناك)

export const OTP_WORKER_URL = "https://otp.mohamad91xm.workers.dev";

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

        const response = await fetch(OTP_WORKER_URL + '/send', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ email: emailInput, type: 'student' })
        });

        if (response.status === 429) {
            const rl = await response.json().catch(() => ({}));
            if (rl.error === 'daily_limit') {
                return { success: false, dailyLimit: true, message: 'وصلت للحد الأقصى (5 أكواد في اليوم) لنفس الإيميل، جرّب تاني بكرة' };
            }
            const wait = Number(rl.retryAfter) > 0 ? Number(rl.retryAfter) : 90;
            return { success: false, retryAfter: wait, message: 'استنى ' + wait + ' ثانية قبل ما تطلب كود تاني' };
        }
        if (!response.ok) {
            return { success: false, message: 'فشل الإرسال، حاول مرة أخرى بعد قليل' };
        }
        const data = await response.json();
        // الكود نفسه مش بيرجع للمتصفح، بس إثبات (exp + sig) للتحقق لاحقاً
        return { success: true, proof: { exp: data.exp, sig: data.sig } };
    } catch (error) {
        return { success: false, message: 'حدث خطأ غير متوقع أثناء إرسال البريد' };
    }
}

export async function verifyEmailOtp(emailInput, code, proof) {
    try {
        if (!proof) return false;
        const response = await fetch(OTP_WORKER_URL + '/verify', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ email: emailInput, code, exp: proof.exp, sig: proof.sig })
        });
        if (!response.ok) return false;
        const data = await response.json();
        return data.ok === true;
    } catch (error) {
        return false;
    }
}

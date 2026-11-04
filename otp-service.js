// otp-service.js - إرسال والتحقق من كود البريد عبر Cloudflare Worker (مفتاح Brevo محفوظ كسر هناك)

export const OTP_WORKER_URL = "https://otp.mohamad91xm.workers.dev";

async function post(path, payload, ms = 20000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try {
        return await fetch(OTP_WORKER_URL + path, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload),
            signal: ctrl.signal
        });
    } finally { clearTimeout(t); }
}

// findStudentFunc اختيارية: index.html بيعمل فحص "الإيميل مسجل" قبل النداء ده أصلاً
export async function sendEmailOtpProcess(emailInput, findStudentFunc, dbInstance) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailInput)) {
        return { success: false, message: 'أدخل بريد إلكتروني صحيح أولاً' };
    }

    let response;
    try {
        response = await post('/send', { email: emailInput, type: 'student' });
    } catch (error) {
        const timeout = error && error.name === 'AbortError';
        return {
            success: false,
            message: timeout
                ? 'الاتصال بطيء وخدمة الإرسال مردّتش في الوقت المناسب، جرّب تاني بعد شوية (ENET-T)'
                : 'تعذر الاتصال بخدمة الإرسال. تأكد من الإنترنت وإن الموقع مفتوح من www.studytrip.online، وجرّب تاني (ENET)'
        };
    }

    if (response.status === 429) {
        const rl = await response.json().catch(() => ({}));
        if (rl.error === 'daily_limit') {
            return { success: false, dailyLimit: true, message: 'وصلت للحد الأقصى (5 أكواد في اليوم) لنفس الإيميل، جرّب تاني بكرة' };
        }
        const wait = Number(rl.retryAfter) > 0 ? Number(rl.retryAfter) : 90;
        return { success: false, retryAfter: wait, message: 'استنى ' + wait + ' ثانية قبل ما تطلب كود تاني' };
    }
    if (response.status === 403) {
        return { success: false, message: 'افتح المنصة من الرابط الرسمي www.studytrip.online وجرّب تاني (E403)' };
    }
    if (response.status === 400) {
        return { success: false, message: 'البريد الإلكتروني غير صالح، راجع الإيميل اللي كتبته (E400)' };
    }
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const code = err.status ? 'E' + err.status : 'E' + response.status;
        return { success: false, message: 'مشكلة مؤقتة في خدمة الإيميل، جرّب تاني بعد دقيقة. لو اتكررت ابعت للإدارة الكود ده: ' + code };
    }

    try {
        const data = await response.json();
        // الكود نفسه مش بيرجع للمتصفح، بس إثبات (exp + sig) للتحقق لاحقاً
        return { success: true, proof: { exp: data.exp, sig: data.sig } };
    } catch (error) {
        return { success: false, message: 'رد غير متوقع من خدمة الإرسال، جرّب تاني (E-PARSE)' };
    }
}

/** نسخة بتفرّق بين "الكود غلط" و"الكود انتهى" و"محاولات كتير" و"مشكلة اتصال" */
export async function verifyEmailOtpDetailed(emailInput, code, proof) {
    if (!proof) return { ok: false, reason: 'no_proof' };
    try {
        const response = await post('/verify', { email: emailInput, code, exp: proof.exp, sig: proof.sig });
        const data = await response.json().catch(() => ({}));
        if (data.ok === true) return { ok: true };
        if (data.error === 'expired') return { ok: false, reason: 'expired' };
        if (data.error === 'too_many_attempts' || response.status === 429) return { ok: false, reason: 'too_many' };
        if (!response.ok) return { ok: false, reason: 'server' };
        return { ok: false, reason: 'wrong', left: data.left };
    } catch (error) {
        return { ok: false, reason: 'network' };
    }
}

export async function verifyEmailOtp(emailInput, code, proof) {
    return (await verifyEmailOtpDetailed(emailInput, code, proof)).ok;
}

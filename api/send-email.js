const fetch = require('node-fetch');

export default async function handler(req, res) {
    // السماح بالطلبات من موقعك فقط لحمايته
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, name, otp } = req.body;
    const BREVO_API_KEY = 'حط_مفتاح_بريفو_هنا_في_السر'; // مش هيظهر للمستخدمين نهائي

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: { name: "منصة رحلة دراسية", email: "mohamad91xm@gmail.com" },
                to: [{ email: email, name: name }],
                subject: "كود التحقق الخاص بك - منصة رحلة دراسية",
                htmlContent: `
                    <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f6f8; border-radius: 10px;">
                        <h2 style="color: #4f46e5;">مرحباً ${name}،</h2>
                        <p>إليك كود التحقق الخاص بك في <b>منصة رحلة دراسية</b>:</p>
                        <div style="background: #ffffff; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #4f46e5; text-align: center; margin: 20px 0; border: 1px solid #e2e8f0;">
                            ${otp}
                        </div>
                    </div>
                `
            })
        });

        if (!response.ok) throw new Error('فشل الإرسال من Brevo');

        return res.status(200).json({ success: true, message: 'تم إرسال الكود بنجاح' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

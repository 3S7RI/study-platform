const fetch = require('node-fetch');

export default async function handler(req, res) {
    // السماح بالطلبات من أي مصدر لتجنب مشاكل CORS
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
    
    // مفتاح بريفو الخاص بك مضاف هنا بأمان داخل السيرفر
    const BREVO_API_KEY = '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';

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
                        <p>شكراً لتسجيلك في <b>منصة رحلة دراسية</b>. لإتمام عملية التحقق، يرجى استخدام كود الـ OTP التالي:</p>
                        <div style="background: #ffffff; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #4f46e5; text-align: center; margin: 20px 0; border: 1px solid #e2e8f0;">
                            ${otp}
                        </div>
                        <p style="color: #64748b; font-size: 14px;">هذا الكود صالح لفترة قصيرة، يرجى عدم مشاركته مع أي شخص.</p>
                    </div>
                `
            })
        });

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'فشل إرسال الإيميل من سيرفر Brevo');
        }

        return res.status(200).json({ success: true, message: 'تم إرسال الكود بنجاح' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

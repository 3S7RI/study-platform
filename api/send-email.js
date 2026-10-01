import SibApiV3Sdk from 'sib-api-v3-sdk';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, name, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'البريد الإلكتروني وكود التحقق مطلوبان' });
  }

  try {
    let defaultClient = SibApiV3Sdk.ApiClient.instance;
    let apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;

    let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.subject = "كود التحقق الخاص بك - منصة رحلة دراسية";
    sendSmtpEmail.htmlContent = `
      <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f7; border-radius: 10px;">
        <h2 style="color: #4f46e5;">مرحباً ${name || 'بهاء'}،</h2>
        <p>شكراً لتسجيلك في <b>منصة رحلة دراسية</b>.</p>
        <p>كود التحقق الخاص بك هو:</p>
        <div style="font-size: 24px; font-weight: bold; color: #10b981; background: #fff; padding: 10px 20px; display: inline-block; border-radius: 8px; border: 1px solid #ddd; letter-spacing: 5px;">
          ${otp}
        </div>
        <p style="margin-top: 20px; color: #666;">هذا الكود صالح لفترة قصيرة، لا تقم بمشاركته مع أي شخص.</p>
      </div>
    `;
    sendSmtpEmail.sender = { name: "منصة رحلة دراسية", email: "noreply@studytrip.com" };
    sendSmtpEmail.to = [{ email: email, name: name || 'طالب' }];

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    return res.status(200).json({ success: true, message: 'تم إرسال الكود بنجاح' });

  } else (error) {
    console.error("Brevo Error:", error);
    return res.status(500).json({ error: error.message || 'فشل إرسال الإيميل' });
  }
}

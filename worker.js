const ALLOWED = ["https://www.studytrip.online", "https://studytrip.online"];

const dailyMessages = [
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

const adminQuotes = [
            "اللهم صلِ وسلّم وبارك على نبينا محمد وعلى آله وصحبه أجمعين.",
            "من أتقن عمله وأخلص نيته، جعل الله له من كل هم فرجاً ومن كل ضيق مخرجاً.",
            "القيادة الحقيقية أمانة، والعمل الدؤوب في خدمة الآخرين عبادة وعمل صالح.",
            "استعينوا على قضاء حوائجكم بالكتمان والتوكل الدائم على رب العزة.",
            "الإخلاص في العمل يصنع الأثر الطيب ويدوم طويلاً في صحائف النور.",
            "اللهم صلِ على سيدنا محمد، صلاة تنحل بها العقد وتنكشف بها الكرب.",
            "كل جهد تبذله في تطوير المنصة وخدمة الطلاب مأجور ومكتوب عند الله.",
            "كن مفتاحاً للخير مغلاقاً للشر، واجعل التوفيق حليفك دائماً.",
            "بالصبر والعزيمة تُبنى الصروح العظيمة وتذلل الصعاب.",
            "اللهم افتح علينا فتوح العارفين، ويسر لنا كل أمر عسير.",
            "النية الصادقة والعمل الخالص هما أساس كل نجاح مستدام.",
            "اللهم صلِ وسلم وبارك على نبينا محمد في الأولين وفي الآخرين."
        ];

const json = (o, s, h) =>
  new Response(JSON.stringify(o), { status: s, headers: { ...h, "Content-Type": "application/json" } });

const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pick = (a) => a[crypto.getRandomValues(new Uint32Array(1))[0] % a.length];

async function hmac(secret, msg) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function studentHtml(generatedEmailOtp, selectedDailyMessage) {
  return `
                    <div style="direction: rtl; text-align: right; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px 25px; background: linear-gradient(135deg, #0f172a, #1e1b4b, #311042); border-radius: 20px; color: #f8fafc; max-width: 540px; margin: auto;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h2 style="color: #ffffff; font-size: 26px; font-weight: 800; margin: 0 0 8px 0;">منصة رحلة دراسية </h2>
                            <p style="color: #94a3b8; font-size: 15px; margin: 0;">بوابتك نحو التفوق والوصول للقمة</p>
                        </div>
                        <div style="background: rgba(30, 41, 59, 0.9); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 20px; padding: 30px 20px; text-align: center;">
                            <h3 style="color: #f8fafc; font-size: 20px; font-weight: 700; margin-bottom: 15px;">مرحباً بك، زائرنا المتميز </h3>
                            <p style="color: #cbd5e1; font-size: 15px; line-height: 1.7; margin-bottom: 25px;">
                                يسعدنا انضمامك إلى عائلة <strong>منصة رحلة دراسية</strong>. لإتمام عملية تسجيل حسابك الجديد، يرجى استخدام كود التحقق أدناه:
                            </p>
                            <div style="background: rgba(15, 23, 42, 0.95); border: 2.5px solid #6366f1; color: #38bdf8; padding: 20px 30px; display: inline-block; font-size: 38px; font-weight: 900; border-radius: 18px; letter-spacing: 10px; margin: 15px 0;">
                                ${generatedEmailOtp}
                            </div>
                            <p style="color: #94a3b8; font-size: 13px; margin-top: 20px;">هذا الكود صالح لمدة دقائق معدودة، ولا تقم بمشاركته مع أي شخص نهائياً.</p>
                        </div>
                        <div style="margin-top: 30px; background: rgba(16, 185, 129, 0.12); border-right: 5px solid #10b981; padding: 20px; border-radius: 12px;">
                            <p style="color: #34d399; font-size: 14px; font-weight: 700; margin: 0 0 8px 0;">رسالة اليوم لك:</p>
                            <p style="color: #e2e8f0; font-size: 14.5px; margin: 0; line-height: 1.7;">"${selectedDailyMessage}"</p>
                        </div>
                    </div>
                `;
}

function adminHtml(adminName, generatedOtp, randomQuote) {
  return `
                <div dir="rtl" style="background-color: #0f172a; padding: 30px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: right;">
                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background: linear-gradient(135deg, #1e1b4b, #311042); border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.15); box-shadow: 0 20px 40px rgba(0,0,0,0.6); overflow: hidden;">
                        <tr>
                            <td style="padding: 30px 30px 20px 30px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.08);">
                                <h1 style="color: #f8fafc; font-size: 24px; margin: 0 0 8px 0; font-weight: 800;">بوابة الإدارة والمطورين</h1>
                                <p style="color: #94a3b8; font-size: 14px; margin: 0;">منصة رحلة دراسية</p>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding: 20px 30px 10px 30px; text-align: center;">
                                <div style="background: rgba(99, 102, 241, 0.12); border: 1px dashed rgba(99, 102, 241, 0.4); border-radius: 12px; padding: 12px; color: #a5b4fc; font-size: 14px; font-weight: 600;">
                                    صلِّ على الحبيب المصطفى ﷺ 
                                </div>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding: 20px 30px;">
                                <h2 style="color: #f8fafc; font-size: 20px; margin-bottom: 15px;">مرحباً بك، ${adminName} </h2>
                                <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
                                    لتأكيد وإنشاء حسابك الإداري في <strong style="color: #6366f1;">منصة رحلة دراسية</strong>، يرجى استخدام كود التحقق أدناه:
                                </p>

                                <div style="text-align: center; margin: 25px 0;">
                                    <div style="display: inline-block; background: rgba(15, 23, 42, 0.8); border: 2px solid #6366f1; border-radius: 16px; padding: 15px 40px; font-size: 32px; font-weight: 800; color: #38bdf8; letter-spacing: 6px; box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);">
                                        ${generatedOtp}
                                    </div>
                                    <p style="color: #64748b; font-size: 12px; margin-top: 8px;">هذا الكود صالح لمدة دقائق معدودة، ولا تقم بمشاركته مع أحد.</p>
                                </div>

                                <div style="background: rgba(30, 41, 59, 0.9); border-right: 4px solid #10b981; border-radius: 12px; padding: 16px 20px; margin-top: 30px; margin-bottom: 10px;">
                                    <p style="color: #34d399; font-size: 12px; font-weight: bold; margin-bottom: 5px;">إضاءة لقلب المسؤول:</p>
                                    <p style="color: #e2e8f0; font-size: 14px; font-style: italic; line-height: 1.5; margin: 0;">
                                        "${randomQuote}"
                                    </p>
                                </div>
                            </td>
                        </tr>

                        <tr>
                            <td style="background: rgba(15, 23, 42, 0.5); padding: 20px 30px; text-align: center; border-top: 1px solid rgba(255,255,255,0.08);">
                                <p style="color: #64748b; font-size: 12px; margin: 0;">
                                    جميع الحقوق محفوظة © 2026 منصة رحلة دراسية <br>
                                    بوابة الإدارة والمطورين 
                                </p>
                            </td>
                        </tr>
                    </table>
                </div>`;
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": ALLOWED.includes(origin) ? origin : ALLOWED[0],
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    if (!ALLOWED.includes(origin)) return json({ error: "forbidden" }, 403, cors);
    if (req.method !== "POST") return json({ error: "method" }, 405, cors);

    const path = new URL(req.url).pathname;

    // فحص الحالة للوحة الأدمن: حالة Brevo والرصيد المتبقي (من غير أي بيانات حساسة)
    if (path === "/status") {
      const t0 = Date.now();
      const out = { ok: true, kv: !!env.OTP_KV, secrets: { otp: !!env.OTP_SECRET, brevo: !!env.BREVO_API_KEY, sender: !!env.SENDER_EMAIL } };
      try {
        const r = await fetch("https://api.brevo.com/v3/account", { headers: { "accept": "application/json", "api-key": env.BREVO_API_KEY || "" } });
        out.brevoStatus = r.status;
        out.brevoOk = r.ok;
        if (r.ok) {
          const a = await r.json();
          const plans = Array.isArray(a.plan) ? a.plan : [];
          out.credits = plans.filter(p => p.creditsType === "sendLimit").map(p => ({ type: p.type, credits: p.credits }));
        }
      } catch (e) { out.brevoOk = false; out.brevoStatus = 0; }
      out.latencyMs = Date.now() - t0;
      return json(out, 200, cors);
    }

    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254) return json({ error: "bad email" }, 400, cors);

    if (path === "/send") {
      const type = body.type === "admin" ? "admin" : "student";

      // حد 90 ثانية بين طلبات الكود لنفس الإيميل (Cloudflare KV، ربط باسم OTP_KV). لو الربط مش موجود الحد بيتخطى بدون ما يكسر الإرسال.
      const RL_SECONDS = 90;
      const rlKey = "rl:" + email;
      if (env.OTP_KV) {
        const last = Number(await env.OTP_KV.get(rlKey));
        if (last) {
          const left = Math.ceil((last + RL_SECONDS * 1000 - Date.now()) / 1000);
          if (left > 0) return json({ error: "rate_limited", retryAfter: left }, 429, cors);
        }
        await env.OTP_KV.put(rlKey, String(Date.now()), { expirationTtl: RL_SECONDS });
      }

      const code = String(100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000));
      const exp = Date.now() + 10 * 60 * 1000;
      const sig = await hmac(env.OTP_SECRET, `${email}|${exp}|${code}`);

      let subject, html;
      if (type === "admin") {
        const name = esc(String(body.name || "").trim().slice(0, 60) || "المسؤول الجديد");
        subject = "كود التحقق الإداري - منصة رحلة دراسية";
        html = adminHtml(name, code, pick(adminQuotes));
      } else {
        subject = "كود التحقق الخاص بك - منصة رحلة دراسية";
        html = studentHtml(code, pick(dailyMessages));
      }

      const r = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "accept": "application/json", "api-key": env.BREVO_API_KEY, "content-type": "application/json" },
        body: JSON.stringify({
          sender: { name: "منصة رحلة دراسية", email: env.SENDER_EMAIL },
          to: [{ email }],
          subject,
          htmlContent: html,
        }),
      });
      if (!r.ok) {
        if (env.OTP_KV) await env.OTP_KV.delete(rlKey); // الإرسال فشل: متحسبش المحاولة على الطالب
        return json({ error: "send failed", status: r.status }, 502, cors);
      }
      return json({ ok: true, exp, sig }, 200, cors);
    }

    if (path === "/verify") {
      const exp = Number(body.exp);
      if (!exp || Date.now() > exp) return json({ ok: false, error: "expired" }, 200, cors);
      const expected = await hmac(env.OTP_SECRET, `${email}|${exp}|${String(body.code || "").trim()}`);
      return json({ ok: expected === body.sig }, 200, cors);
    }
    return json({ error: "not found" }, 404, cors);
  },
};

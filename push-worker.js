// push-worker.js — Worker منفصل لإرسال الإشعارات (FCM). الـ OTP في worker.js زي ما هو.
// الأسرار المطلوبة (Cloudflare → Settings → Variables → Secrets):
//   FCM_SA  : محتوى ملف Service Account JSON كامل (من Firebase → Project settings → Service accounts → Generate new private key)
// اختياري:
//   DAILY_REMINDER = "1"  → تفعيل التذكير اليومي (Cron Trigger: "0 15 * * *" = 5 مساءً بتوقيت القاهرة تقريباً)
// المسارات:
//   POST /send  (للأدمن بس) { title, body, url, tokens: [..] } → بيرجّع { sent, failed, dead: [tokens ميتة] }
const ALLOWED = ["https://www.studytrip.online", "https://studytrip.online"];
const PROJECT = "study-trip-1";
const API_KEY = "AIzaSyBORRXM-bw9Svp4QS8_1OWUGGbhJToQM6U"; // مفتاح Firebase العام (مش سر)
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

const json = (o, s, h) => new Response(JSON.stringify(o), { status: s, headers: { ...h, "Content-Type": "application/json" } });
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64uStr = (s) => b64u(new TextEncoder().encode(s));

let cached = {}; // scope -> { token, exp }
async function googleToken(env, scope) {
  const c = cached[scope];
  if (c && c.exp > Date.now() + 60000) return c.token;
  const sa = JSON.parse(env.FCM_SA);
  const now = Math.floor(Date.now() / 1000);
  const head = b64uStr(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64uStr(JSON.stringify({ iss: sa.client_email, scope, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const pem = sa.private_key.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (ch) => ch.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(head + "." + claim));
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=" + head + "." + claim + "." + b64u(sig),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error("google token failed: " + JSON.stringify(j).slice(0, 200));
  cached[scope] = { token: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 };
  return j.access_token;
}

// يتأكد إن اللي بيطلب أدمن: بيتحقق من توكن Firebase، وبعدين يقرأ admins/{email} بصلاحية نفس المستخدم (قواعد Firestore بتطبّق)
async function verifyAdmin(req) {
  const h = req.headers.get("Authorization") || "";
  const idToken = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!idToken) return null;
  const r = await fetch("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + API_KEY, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken }),
  });
  if (!r.ok) return null;
  const email = String((((await r.json()).users || [])[0] || {}).email || "").toLowerCase();
  if (!email) return null;
  const d = await fetch(`${FS}/admins/${encodeURIComponent(email)}`, { headers: { Authorization: "Bearer " + idToken } });
  if (!d.ok) return null;
  const st = (((await d.json()).fields || {}).status || {}).stringValue || "active";
  return ["banned", "blocked", "suspended", "disabled", "inactive"].includes(st) ? null : email;
}

async function sendOne(env, access, token, title, body, url) {
  const r = await fetch(`https://fcm.googleapis.com/v1/projects/${PROJECT}/messages:send`, {
    method: "POST",
    headers: { Authorization: "Bearer " + access, "Content-Type": "application/json" },
    body: JSON.stringify({ message: { token, data: { title: String(title).slice(0, 100), body: String(body).slice(0, 300), url: String(url || "main.html").slice(0, 300) }, webpush: { headers: { Urgency: "high", TTL: "86400" } } } }),
  });
  if (r.ok) return "ok";
  const t = await r.text();
  return /UNREGISTERED|NOT_FOUND|INVALID_ARGUMENT/.test(t) ? "dead" : "fail";
}

async function sendMany(env, tokens, title, body, url) {
  const access = await googleToken(env, "https://www.googleapis.com/auth/firebase.messaging");
  const out = { sent: 0, failed: 0, dead: [] };
  for (let i = 0; i < tokens.length; i += 20) {
    const res = await Promise.all(tokens.slice(i, i + 20).map((t) => sendOne(env, access, t, title, body, url).catch(() => "fail")));
    res.forEach((x, k) => { if (x === "ok") out.sent++; else { out.failed++; if (x === "dead") out.dead.push(tokens[i + k]); } });
  }
  return out;
}

// التذكير اليومي: بيقرأ كل pushTokens بصلاحية الـ Service Account ويبعت رسالة تشجيعية
async function dailyReminder(env) {
  const access = await googleToken(env, "https://www.googleapis.com/auth/datastore");
  const tokens = []; let page = "";
  do {
    const r = await fetch(`${FS}/pushTokens?pageSize=300&mask.fieldPaths=token${page ? "&pageToken=" + page : ""}`, { headers: { Authorization: "Bearer " + access } });
    const j = await r.json();
    (j.documents || []).forEach((d) => { const t = d.fields && d.fields.token && d.fields.token.stringValue; if (t) tokens.push(t); });
    page = j.nextPageToken || "";
  } while (page && tokens.length < 5000);
  const msgs = [
    ["ذاكر النهاردة 📚", "نص ساعة بس تحافظ على الستريك بتاعك 🔥"],
    ["مستنيك على المنصة 💪", "حل امتحان سريع واكسب نقاط تقرّبك من المتصدرين"],
    ["لا تكسر الستريك 🔥", "ادخل دلوقتي وكمّل رحلتك الدراسية"],
  ];
  const m = msgs[new Date().getUTCDate() % msgs.length];
  const out = await sendMany(env, tokens, m[0], m[1], "main.html");
  // تنظيف التوكنات الميتة
  for (const t of out.dead) await fetch(`${FS}/pushTokens/${encodeURIComponent(t)}`, { method: "DELETE", headers: { Authorization: "Bearer " + access } }).catch(() => {});
  return out;
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": ALLOWED.includes(origin) ? origin : ALLOWED[0],
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    if (!ALLOWED.includes(origin)) return json({ error: "forbidden" }, 403, cors);
    if (req.method !== "POST") return json({ error: "method" }, 405, cors);
    if (!env.FCM_SA) return json({ error: "FCM_SA secret missing" }, 500, cors);
    try {
      if (new URL(req.url).pathname === "/send") {
        const admin = await verifyAdmin(req);
        if (!admin) return json({ error: "not_admin" }, 403, cors);
        const b = await req.json().catch(() => ({}));
        const tokens = (Array.isArray(b.tokens) ? b.tokens : []).filter((t) => typeof t === "string" && t.length > 20).slice(0, 500);
        if (!tokens.length || !b.title) return json({ error: "bad_request" }, 400, cors);
        return json(await sendMany(env, tokens, b.title, b.body || "", b.url), 200, cors);
      }
      return json({ error: "not found" }, 404, cors);
    } catch (e) {
      console.log("push crash", String(e && e.stack || e));
      return json({ error: "server_error" }, 500, cors);
    }
  },
  async scheduled(event, env, ctx) {
    if (env.DAILY_REMINDER === "1" && env.FCM_SA) ctx.waitUntil(dailyReminder(env).catch((e) => console.log("reminder failed", String(e))));
  },
};

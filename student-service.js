// student-service.js - ملف الخدمات الموحد لإدارة بيانات الطالب داخل مجموعة students
// - وثيقة الطالب اسمها الإيميل (بحروف صغيرة): students/{email}
// - معرّف الطالب في المنصة كلها: studentId (STU-0001, STU-0002 ...) وليس uid
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, limit, getDocs, runTransaction, serverTimestamp, increment, orderBy, getCountFromServer } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100';
const COUNTER_PATH = ['config', 'studentIdCounter'];

/* ------------------------------------------------------------------ */
/* أدوات مساعدة                                                        */
/* ------------------------------------------------------------------ */

export function formatStudentId(n) {
    const len = n >= 10000 ? String(n).length : 4;
    return 'STU-' + String(n).padStart(len, '0');
}

export function parseStudentIdNumber(sid) {
    const m = String(sid || '').trim().match(/^STU-(\d+)$/i);
    return m ? parseInt(m[1], 10) : null;
}

/**
 * الحقول المكررة في وثيقة الطالب (للتوافق مع الصفحات القديمة) تُكتب دائماً معاً بنفس القيمة.
 * الاسم الأساسي أولاً: name/fullName ، phone/studentPhone ، parentPhone/guardianPhone ،
 * studentId/id ، totalScore/points ، profileImage/avatar
 */
export function withAliases(fields = {}) {
    const out = { ...fields };
    const pairs = [['name', 'fullName'], ['phone', 'studentPhone'], ['parentPhone', 'guardianPhone'], ['studentId', 'id'], ['totalScore', 'points']];
    for (const [a, b] of pairs) {
        if (a in out && !(b in out)) out[b] = out[a];
        else if (b in out && !(a in out)) out[a] = out[b];
    }
    if ('profileImage' in out && !('avatar' in out)) out.avatar = out.profileImage || DEFAULT_AVATAR;
    if ('totalScore' in out) {
        const r = calculateStudentRank(out.totalScore);
        out.rank = r.rankKey;
        out.level = r.rankKey;
    }
    return out;
}

/** يبني وثيقة طالب كاملة وموحدة */
function buildStudentDoc(email, d, studentId) {
    const name = d.fullName || d.name || 'طالب المنصة';
    const phone = d.studentPhone || d.phone || '';
    const parent = d.parentPhone || d.guardianPhone || '';
    const img = d.profileImage || '';
    const score = Number(d.totalScore !== undefined ? d.totalScore : d.points) || 0;
    const r = calculateStudentRank(score);
    const nowIso = new Date().toISOString();
    return {
        ...d, // أي حقول إضافية أولاً، ثم الحقول المحسوبة تتغلب عليها
        role: 'student',
        email,
        uid: d.uid || '',
        studentId, id: studentId,
        name, fullName: name,
        phone, studentPhone: phone,
        parentPhone: parent, guardianPhone: parent,
        gender: d.gender || 'male',
        totalScore: score, points: score,
        rank: r.rankKey, level: r.rankKey,
        accountType: d.accountType || 'free',
        streak: Number(d.streak) || 0,
        longestStreak: Number(d.longestStreak) || 0,
        lastActiveDay: d.lastActiveDay || '',
        status: 'active',
        allowComparison: d.allowComparison !== false,
        bgPatternEnabled: d.bgPatternEnabled !== false,
        profileImage: img,
        avatar: d.avatar || img || DEFAULT_AVATAR,
        selectedEmojis: d.selectedEmojis || ['⭐', '🚀'],
        friends: d.friends || [],
        friendRequests: d.friendRequests || [],
        chats: d.chats || {},
        createdAt: d.createdAt || nowIso,
        lastUpdated: nowIso,
        lastSeenNotificationTime: d.lastSeenNotificationTime || Date.now()
    };
}

/* ------------------------------------------------------------------ */
/* 1. البحث عن الطالب                                                  */
/* ------------------------------------------------------------------ */

function wrap(snap) {
    return { id: snap.id, ref: snap.ref, data: snap.data(), collectionName: 'students' };
}

/** البحث عن الطالب بالإيميل أو بالـ studentId (الـ uid آخر محاولة فقط للتوافق) */
export async function findStudentDocument(db, identifier) {
    if (!identifier) return null;
    const raw = String(identifier).trim();
    const lower = raw.toLowerCase();
    try {
        if (lower.includes('@')) {
            const s = await getDoc(doc(db, "students", lower));
            if (s.exists()) return wrap(s);
            const q0 = await getDocs(query(collection(db, "students"), where("email", "==", lower), limit(1)));
            if (!q0.empty) return wrap(q0.docs[0]);
            return null;
        }
        const byId = await findStudentByStudentId(db, raw);
        if (byId) return byId;
        const s = await getDoc(doc(db, "students", lower));
        if (s.exists()) return wrap(s);
        const q = await getDocs(query(collection(db, "students"), where("uid", "==", raw), limit(1)));
        if (!q.empty) return wrap(q.docs[0]);
        return null;
    } catch (e) {
        console.error("خطأ أثناء البحث عن الطالب:", e);
        return null;
    }
}

/** البحث بالـ studentId (STU-0001) */
export async function findStudentByStudentId(db, studentId) {
    const sid = String(studentId || '').trim().toUpperCase();
    if (!sid) return null;
    try {
        const q = await getDocs(query(collection(db, "students"), where("studentId", "==", sid), limit(1)));
        if (!q.empty) return wrap(q.docs[0]);
        return null;
    } catch (e) {
        console.error("خطأ أثناء البحث بالـ ID:", e);
        return null;
    }
}

export async function getStudentData(db, studentIdentifier) {
    return (await findStudentDocument(db, studentIdentifier)) || null;
}

/* ------------------------------------------------------------------ */
/* 2. توليد الـ ID التسلسلي (بدون تكرار + يملأ الفراغات)               */
/* ------------------------------------------------------------------ */
/* العداد: config/studentIdCounter = { next: أول رقم لم يُستخدم قط, free: [أرقام فاضية تحت next] }
 * الاختيار يتم داخل Transaction مع حفظ وثيقة الطالب نفسها، فلا يتكرر الـ ID حتى لو سجّل اثنان معاً. */

async function seedCounterFromStudents(db) {
    const snap = await getDocs(collection(db, "students"));
    const used = new Set();
    let max = 0;
    snap.forEach(d => {
        const x = d.data();
        const n = parseStudentIdNumber(x.studentId || x.id);
        if (n !== null) { used.add(n); if (n > max) max = n; }
    });
    const free = [];
    for (let i = 1; i < max; i++) if (!used.has(i)) free.push(i);
    return { next: max + 1, free };
}

function pickFromCounter(counter) {
    const free = Array.from(new Set((counter.free || []).map(Number).filter(n => n > 0))).sort((a, b) => a - b);
    const next = Math.max(1, Number(counter.next) || 1);
    if (free.length) {
        const n = free.shift();
        return { n, state: { next, free } };
    }
    return { n: next, state: { next: next + 1, free } };
}

/** يعرض الـ ID القادم فقط دون حجزه (للعرض/التوافق) */
export async function getNextSmartStudentId(db) {
    try {
        const cs = await getDoc(doc(db, ...COUNTER_PATH));
        const counter = cs.exists() ? cs.data() : await seedCounterFromStudents(db);
        return formatStudentId(pickFromCounter(counter).n);
    } catch (e) {
        console.error("خطأ في توليد الـ ID:", e);
        return null;
    }
}

/** إعادة بناء العداد من الطلاب الموجودين فعلاً (للأدمن عند الحاجة) */
export async function rebuildStudentIdCounter(db) {
    const state = await seedCounterFromStudents(db);
    await setDoc(doc(db, ...COUNTER_PATH), { ...state, updatedAt: serverTimestamp() });
    return state;
}

/** يُرجع رقماً محذوفاً إلى قائمة الفراغات ليُعاد استخدامه */
export async function releaseStudentId(db, studentId) {
    const n = parseStudentIdNumber(studentId);
    if (n === null) return false;
    try {
        const counterRef = doc(db, ...COUNTER_PATH);
        await runTransaction(db, async (tx) => {
            const cs = await tx.get(counterRef);
            if (!cs.exists()) return; // سيُبنى العداد من الطلاب عند أول تسجيل
            const c = cs.data();
            const next = Number(c.next) || 1;
            if (n >= next) return;
            const free = new Set((c.free || []).map(Number));
            free.add(n);
            tx.set(counterRef, { next, free: Array.from(free).sort((a, b) => a - b), updatedAt: serverTimestamp() });
        });
        return true;
    } catch (e) {
        console.error("تعذر إرجاع الـ ID:", e);
        return false;
    }
}

/* ------------------------------------------------------------------ */
/* 3. إنشاء الطالب (ذري: الـ ID + الوثيقة معاً)                        */
/* ------------------------------------------------------------------ */

/**
 * @returns {Promise<{success:true, created:boolean, data:object}|null>}
 *   created=false لو الوثيقة موجودة من قبل (لا نعدّلها).
 */
export const TRIAL_HOURS = 24;

export async function createStudentAccount(db, email, studentData = {}, opts = {}) {
    try {
        if (!email) throw new Error("البريد الإلكتروني مطلوب لإنشاء مستند الطالب");
        const cleanEmail = String(email).toLowerCase().trim();
        const studentRef = doc(db, "students", cleanEmail);
        const counterRef = doc(db, ...COUNTER_PATH);

        // التجربة المجانية: مرة واحدة لكل إيميل ولكل رقم تليفون (وثيقة phones/{الرقم} داخل نفس الـ Transaction)
        const wantTrial = opts.grantTrial === true;
        const phoneDigits = String(studentData.studentPhone || studentData.phone || '').replace(/\D/g, '');
        const phoneRef = (wantTrial && phoneDigits.length >= 10) ? doc(db, "phones", phoneDigits) : null;

        let seed = null;
        const pre = await getDoc(counterRef);
        if (!pre.exists()) seed = await seedCounterFromStudents(db);

        const result = await runTransaction(db, async (tx) => {
            const existing = await tx.get(studentRef);
            if (existing.exists()) return { created: false, data: existing.data() };

            const cs = await tx.get(counterRef);
            const phoneSnap = phoneRef ? await tx.get(phoneRef) : null;
            const counter = cs.exists() ? cs.data() : (seed || { next: 1, free: [] });
            const picked = pickFromCounter(counter);
            const studentId = formatStudentId(picked.n);

            const finalData = buildStudentDoc(cleanEmail, studentData, studentId);

            let trialGranted = false;
            if (wantTrial && phoneRef && !(phoneSnap && phoneSnap.exists())) {
                const now = Date.now();
                const expiry = new Date(now + TRIAL_HOURS * 3600 * 1000).toISOString();
                finalData.accountType = 'trial';
                finalData.isSubscribed = true;
                finalData.subscriptionExpiry = expiry;
                finalData.trialUsed = true;
                finalData.trialStartedAt = new Date(now).toISOString();
                finalData.trialExpiry = expiry;
                trialGranted = true;
            } else if (wantTrial) {
                finalData.trialUsed = true; // الرقم أخذ تجربة قبل كده
            }

            tx.set(studentRef, finalData);
            tx.set(counterRef, { ...picked.state, updatedAt: serverTimestamp() });
            if (trialGranted) tx.set(phoneRef, { email: cleanEmail, studentId, createdAt: new Date().toISOString() });
            return { created: true, data: finalData, trialGranted };
        });
        return { success: true, created: result.created, data: result.data, trialGranted: !!result.trialGranted };
    } catch (e) {
        console.error("خطأ في حفظ ملف الطالب:", e);
        return null;
    }
}

/**
 * يضمن أن لوثيقة الطالب studentId صحيح (للحسابات القديمة)، ويوحّد الحقول المكررة والرتبة.
 * يُستدعى عند تسجيل الدخول. يكتب فقط لو في شيء يحتاج تصحيح.
 */
export async function ensureStudentConsistency(db, email) {
    try {
        const cleanEmail = String(email || '').toLowerCase().trim();
        if (!cleanEmail) return null;
        const studentRef = doc(db, "students", cleanEmail);
        const counterRef = doc(db, ...COUNTER_PATH);

        let seed = null;
        const pre = await getDoc(studentRef);
        if (!pre.exists()) return null;
        const needsId = parseStudentIdNumber(pre.data().studentId || pre.data().id) === null;
        if (needsId) {
            const cs0 = await getDoc(counterRef);
            if (!cs0.exists()) seed = await seedCounterFromStudents(db);
        }

        return await runTransaction(db, async (tx) => {
            const snap = await tx.get(studentRef);
            if (!snap.exists()) return null;
            const d = snap.data();
            const fixes = {};

            let sid = String(d.studentId || d.id || '').trim().toUpperCase();
            if (parseStudentIdNumber(sid) === null) {
                const cs = await tx.get(counterRef);
                const counter = cs.exists() ? cs.data() : (seed || { next: 1, free: [] });
                const picked = pickFromCounter(counter);
                sid = formatStudentId(picked.n);
                tx.set(counterRef, { ...picked.state, updatedAt: serverTimestamp() });
            }
            if (d.studentId !== sid) fixes.studentId = sid;
            if (d.id !== sid) fixes.id = sid;

            const name = d.fullName || d.name;
            if (name && (d.name !== name || d.fullName !== name)) { fixes.name = name; fixes.fullName = name; }
            const phone = d.studentPhone || d.phone;
            if (phone && (d.phone !== phone || d.studentPhone !== phone)) { fixes.phone = phone; fixes.studentPhone = phone; }
            const parent = d.parentPhone || d.guardianPhone;
            if (parent && (d.parentPhone !== parent || d.guardianPhone !== parent)) { fixes.parentPhone = parent; fixes.guardianPhone = parent; }

            const score = Math.max(Number(d.totalScore) || 0, Number(d.points) || 0);
            if (d.totalScore !== score || d.points !== score) { fixes.totalScore = score; fixes.points = score; }
            const r = calculateStudentRank(score);
            if (d.rank !== r.rankKey) fixes.rank = r.rankKey;
            if (d.level !== r.rankKey) fixes.level = r.rankKey;
            if (!d.role) fixes.role = 'student';
            if (!d.accountType) fixes.accountType = 'free';

            if (Object.keys(fixes).length) {
                tx.update(studentRef, fixes);
                return { ...d, ...fixes };
            }
            return d;
        });
    } catch (e) {
        console.error("تعذر توحيد بيانات الطالب:", e);
        return null;
    }
}

/** حذف الطالب مع إرجاع الـ ID للفراغات */
export async function deleteStudentAccountDoc(db, email) {
    const cleanEmail = String(email || '').toLowerCase().trim();
    if (!cleanEmail) return false;
    try {
        const ref = doc(db, "students", cleanEmail);
        const snap = await getDoc(ref);
        const sid = snap.exists() ? (snap.data().studentId || snap.data().id) : null;
        await deleteDoc(ref);
        if (sid) await releaseStudentId(db, sid);
        return true;
    } catch (e) {
        console.error("خطأ في حذف الطالب:", e);
        return false;
    }
}

/* ------------------------------------------------------------------ */
/* 4. تعديل البيانات والنقاط                                           */
/* ------------------------------------------------------------------ */

export async function updateStudentData(db, studentIdentifier, updateFields = {}) {
    try {
        const studentObj = await findStudentDocument(db, studentIdentifier);
        if (!studentObj) {
            console.warn("محاولة تحديث بيانات طالب غير موجود:", studentIdentifier);
            return false;
        }
        const payload = withAliases({ ...updateFields, lastUpdated: new Date().toISOString() });
        await updateDoc(studentObj.ref, payload);
        return true;
    } catch (e) {
        console.error("خطأ في تحديث بيانات الطالب:", e);
        return false;
    }
}

/** إضافة نقاط (أو خصمها لو القيمة سالبة، بحد أدنى صفر) وتحديث الرتبة والمستوى ذرياً */
export async function addPointsToStudent(db, studentIdentifier, pointsToAdd) {
    const delta = Number(pointsToAdd);
    if (!studentIdentifier || !delta) return false;
    try {
        const studentObj = await findStudentDocument(db, studentIdentifier);
        if (!studentObj) return false;
        await runTransaction(db, async (tx) => {
            const snap = await tx.get(studentObj.ref);
            const d = snap.data() || {};
            const current = Math.max(Number(d.totalScore) || 0, Number(d.points) || 0);
            const newTotal = Math.max(0, current + delta);
            const r = calculateStudentRank(newTotal);
            tx.update(studentObj.ref, {
                totalScore: newTotal, points: newTotal,
                rank: r.rankKey, level: r.rankKey,
                lastUpdated: new Date().toISOString()
            });
        });
        return true;
    } catch (e) {
        console.error("خطأ في إضافة النقاط:", e);
        return false;
    }
}

/* ------------------------------------------------------------------ */
/* 5. إشعار الترحيب                                                    */
/* ------------------------------------------------------------------ */

export async function sendWelcomeNotification(db, studentEmail, studentName, trialGranted = false) {
    try {
        if (!studentEmail) return;
        const firstName = studentName ? studentName.trim().split(' ')[0] : 'بطلنا';
        const customTitle = `🎉 أهلاً بيك يا ${firstName} في عائلة رحلة دراسية!`;
        const customMessage = `منورنا يا بطل في أقوى منصة تعليمية لطلاب تالتة اعدادي! 🚀 استعد لرحلة تفوق استثنائية، حل واجباتك، تابع دروسك، واصنع مستقبلك بكل حماس. بالتوفيق في رحلتك! ✨` + (trialGranted ? ` 🎁 هديناك تجربة مجانية لمدة 24 ساعة بكل مميزات VIP، استمتع بيها!` : ``);

        const cleanEmailKey = studentEmail.toLowerCase().replace(/[^a-zA-Z0-9]/g, "_");
        const notifId = "welcome_" + cleanEmailKey + "_" + Date.now();

        await setDoc(doc(db, "adminNotifications", notifId), {
            title: customTitle,
            message: customMessage,
            target: "single",
            recipientEmail: studentEmail.toLowerCase().trim(),
            sender: "إدارة المنصة 📖",
            createdAt: serverTimestamp()
        });
    } catch (err) {
        console.error("خطأ في حفظ الإشعار الترحيبي:", err);
    }
}

/* ------------------------------------------------------------------ */
/* 6. الرتب الخمس: ضعيف < 500 ≤ متوسط < 1500 ≤ قوي < 3000 ≤ قوي جداً < 5000 ≤ أسطوري */
/* ------------------------------------------------------------------ */

export function calculateStudentRank(totalScore) {
    const score = Number(totalScore) || 0;
    const lvTitle = 'Lv.' + Math.min(50, Math.floor(Math.sqrt(score / 10)) + 1); // المستوى بدل أسماء الرتب
    if (score >= 5000) {
        return { rankKey: 'legendary', title: lvTitle, frameClass: 'frame-legendary', badgeClass: 'badge-legendary', color: '#f472b6' };
    } else if (score >= 3000) {
        return { rankKey: 'very-strong', title: lvTitle, frameClass: 'frame-legendary', badgeClass: 'badge-very-strong', color: '#3b82f6' };
    } else if (score >= 1500) {
        return { rankKey: 'strong', title: lvTitle, frameClass: 'frame-strong', badgeClass: 'badge-strong', color: '#10b981' };
    } else if (score >= 500) {
        return { rankKey: 'medium', title: lvTitle, frameClass: 'frame-medium', badgeClass: 'badge-medium', color: '#f59e0b' };
    }
    return { rankKey: 'weak', title: lvTitle, frameClass: 'frame-weak', badgeClass: 'badge-weak', color: '#ef4444' };
}

/* ------------------------------------------------------------------ */
/* انتهاء الاشتراك: لو subscriptionExpiry عدّى والطالب لسه vip/trial    */
/* نكتب مرة واحدة accountType=free و isSubscribed=false (بدون حذف أي بيانات) */
/* ------------------------------------------------------------------ */
export function isSubscriptionExpired(d) {
    if (!d || !d.subscriptionExpiry) return false;
    const t = new Date(d.subscriptionExpiry).getTime();
    return !isNaN(t) && t <= Date.now();
}

export async function normalizeSubscription(db, emailKey, data) {
    try {
        if (!data || !isSubscriptionExpired(data)) return data;
        const active = data.isSubscribed === true || data.accountType === 'vip' || data.accountType === 'trial';
        if (!active) return data;
        const fix = { accountType: 'free', isSubscribed: false, lastUpdated: new Date().toISOString() };
        await updateDoc(doc(db, 'students', String(emailKey).toLowerCase().trim()), fix);
        return { ...data, ...fix };
    } catch (e) {
        console.warn('normalizeSubscription skipped', e);
        return data;
    }
}


/* ------------------------------------------------------------------ */
/* الاستريك اليومي: +1 مع أول دخول في كل يوم (بتوقيت القاهرة)، ولا يتصفّر أبداً */
/* ------------------------------------------------------------------ */
export function cairoDay(ts = Date.now()) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ts));
}

export async function touchDailyStreak(db, email) {
    try {
        const key = String(email || '').toLowerCase().trim();
        if (!key) return null;
        const today = cairoDay();
        try { if (localStorage.getItem('streak_done_' + key) === today) return null; } catch (e) {}
        const ref = doc(db, 'students', key);
        const res = await runTransaction(db, async (tx) => {
            const snap = await tx.get(ref);
            if (!snap.exists()) return null;
            const d = snap.data();
            const cur = Number(d.streak) || 0;
            if (d.lastActiveDay === today) return { streak: cur, changed: false };
            const n = cur + 1;
            tx.update(ref, { streak: n, longestStreak: Math.max(Number(d.longestStreak) || 0, n), lastActiveDay: today });
            return { streak: n, changed: true };
        });
        if (res) { try { localStorage.setItem('streak_done_' + key, today); localStorage.setItem('chat_streak', String(res.streak)); } catch (e) {} }
        return res;
    } catch (e) {
        console.warn('touchDailyStreak skipped', e);
        return null;
    }
}


/* ------------------------------------------------------------------ */
/* وقت المذاكرة: بيبعت الفرق المتراكم محلياً (session.js) بـ increment    */
/* كتابة واحدة بس لو الفرق دقيقة أو أكتر، فمفيش استهلاك زيادة.            */
/* ------------------------------------------------------------------ */
export async function syncStudyTime(db, email) {
    try {
        const key = String(email || '').toLowerCase().trim();
        if (!key || typeof PS === 'undefined') return null;
        const total = PS.localStudySeconds();
        const delta = PS.unsyncedStudySeconds();
        if (delta < 60) return null;
        await updateDoc(doc(db, 'students', key), { studySeconds: increment(delta) });
        PS.markStudySynced(total);
        return delta;
    } catch (e) {
        console.warn('syncStudyTime skipped', e);
        return null;
    }
}

/* ------------------------------------------------------------------ */
/* لوحة المتصدرين: أعلى N طالب بالنقاط (استعلام واحد = N قراءة بس)       */
/* totalScore بتتجمّع فيها نقاط: الفيديوهات والملازم والملخصات وامتحانات   */
/* الحصص (بالدرجة) والامتحانات الشاملة (بعد اعتماد الدرجة).              */
/* بتتخزن في sessionStorage 5 دقايق عشان القراءات متزدش.                 */
/* ------------------------------------------------------------------ */
const LB_CACHE_KEY = 'lb_top_cache_v1';
const LB_TTL_MS = 5 * 60 * 1000;

export async function fetchLeaderboard(db, n = 20, force = false) {
    try {
        if (!force) {
            const raw = sessionStorage.getItem(LB_CACHE_KEY);
            if (raw) {
                const c = JSON.parse(raw);
                if (c && Date.now() - c.t < LB_TTL_MS && Array.isArray(c.rows)) return { rows: c.rows, at: c.t, cached: true };
            }
        }
    } catch (e) {}
    const snap = await getDocs(query(collection(db, 'students'), orderBy('totalScore', 'desc'), limit(n)));
    const rows = [];
    snap.forEach(d => {
        const x = d.data();
        const score = Math.max(Number(x.totalScore) || 0, Number(x.points) || 0);
        if (score <= 0) return;
        if (x.status && x.status !== 'active') return;
        const avatar = x.profileImage || '';
        rows.push({
            email: String(d.id).toLowerCase(),
            studentId: x.studentId || x.id || '',
            name: x.fullName || x.name || 'طالب',
            gender: x.gender || 'male',
            score,
            streak: Number(x.streak) || 0,
            vip: !!(x.isSubscribed === true || x.accountType === 'vip' || x.accountType === 'trial'),
            hidden: x.allowComparison === false,
            avatar: avatar && avatar.length < 60000 ? avatar : ''
        });
    });
    const at = Date.now();
    try { sessionStorage.setItem(LB_CACHE_KEY, JSON.stringify({ t: at, rows })); } catch (e) {}
    return { rows, at, cached: false };
}

/** ترتيب الطالب الحالي لو برّه أول N: عدد اللي نقاطهم أعلى منه + 1 (قراءة واحدة تقريباً) */
export async function getMyLeaderboardRank(db, myScore) {
    try {
        const s = Number(myScore) || 0;
        if (s <= 0) return null;
        const cnt = await getCountFromServer(query(collection(db, 'students'), where('totalScore', '>', s)));
        return cnt.data().count + 1;
    } catch (e) {
        console.warn('getMyLeaderboardRank skipped', e);
        return null;
    }
}

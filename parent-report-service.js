// parent-report-service.js — تقرير ولي الأمر: بيبني ملخص بسيط للطالب، بيحفظه بتوكن عشوائي،
// ويجهّز رسالة واتساب بلغة سهلة. الصفحة العامة: parent-report.html?t=TOKEN
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, limit } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/** رقم مصري → صيغة واتساب الدولية (2010xxxxxxxx) أو null لو مش صالح */
export function normalizeEgyptPhone(p) {
    let d = String(p || '').replace(/\D/g, '');
    if (d.startsWith('0020')) d = d.slice(2);
    if (d.startsWith('20') && d.length === 12) return d;
    if (d.startsWith('0') && d.length === 11) return '2' + d;
    if (d.length === 10 && d.startsWith('1')) return '20' + d;
    return null;
}

export function fmtDuration(sec) {
    sec = Math.max(0, Math.round(Number(sec) || 0));
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
    if (h && m) return h + ' ساعة و' + m + ' دقيقة';
    if (h) return h + ' ساعة';
    if (m) return m + ' دقيقة';
    return 'أقل من دقيقة';
}

function daysSince(dayStr) {
    if (!dayStr) return null;
    const t = new Date(dayStr + 'T00:00:00').getTime();
    if (isNaN(t)) return null;
    return Math.max(0, Math.floor((Date.now() - t) / 86400000));
}

function randomToken() {
    const a = new Uint8Array(16);
    crypto.getRandomValues(a);
    return Array.from(a).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** يبني ملخص الطالب (من غير إيميل ولا تليفون) */
export async function buildSnapshot(db, st) {
    const sid = String(st.studentId || st.id || '').trim();
    let exams = [];
    try {
        const q = await getDocs(query(collection(db, 'studentExamResults'), where('userId', '==', sid), limit(40)));
        exams = q.docs.map(d => d.data()).map(r => {
            const s = Number(r.bestScore !== undefined ? r.bestScore : r.score), m = Number(r.bestMaxScore !== undefined ? r.bestMaxScore : r.maxScore);
            return { t: String(r.examTitle || 'امتحان').slice(0, 60), s: isNaN(s) ? 0 : s, m: isNaN(m) ? 0 : m, at: String(r.submittedAt || '') };
        }).filter(r => r.m > 0).sort((a, b) => (a.at < b.at ? 1 : -1));
    } catch (e) { console.warn('exams read failed', e); }

    const recent = exams.slice(0, 5).map(r => ({ t: r.t, s: r.s, m: r.m, p: Math.round(r.s / r.m * 100) }));
    const avg = exams.slice(0, 10).length ? Math.round(exams.slice(0, 10).reduce((a, r) => a + r.s / r.m * 100, 0) / exams.slice(0, 10).length) : null;

    const prev = st.parentReportPrev || null;
    const cur = Number(st.studySeconds) || 0;
    const sinceLast = (prev && typeof prev.studySeconds === 'number') ? Math.max(0, cur - prev.studySeconds) : null;
    const inactive = daysSince(st.lastActiveDay);

    let status, statusText, advice;
    if (avg === null) { status = 'none'; statusText = 'لسه ما حلّش امتحانات'; advice = 'شجّعوه يبدأ يحل أول امتحان على المنصة.'; }
    else if (avg >= 85) { status = 'green'; statusText = 'ممتاز، مستواه جامد'; advice = 'كمّلوا كده وشجّعوه، وبلاش تضغطوا عليه.'; }
    else if (avg >= 60) { status = 'yellow'; statusText = 'كويس، بس يقدر يبقى أحسن'; advice = 'خلّوه يراجع الأسئلة اللي غلط فيها، وشجّعوه يذاكر كل يوم.'; }
    else { status = 'red'; statusText = 'محتاج متابعة'; advice = 'اقعدوا معاه شوية واطمّنوا إنه بيذاكر كل يوم، ولو محتاج مساعدة كلّمونا.'; }
    if (inactive !== null && inactive >= 3) advice += ' (ملاحظة: مدخلش المنصة من ' + inactive + ' أيام.)';

    return {
        name: String(st.fullName || st.name || 'الطالب').slice(0, 60),
        gender: st.gender === 'female' ? 'female' : 'male',
        studentId: sid,
        status, statusText, advice,
        avg, recent,
        examsCount: exams.length,
        studyTotalSec: cur,
        studySinceLastSec: sinceLast,
        streak: Number(st.streak) || 0,
        points: Number(st.totalScore || st.points) || 0,
        inactiveDays: inactive,
        createdAt: Date.now()
    };
}

/** يحفظ التقرير بتوكن عشوائي ويرجّع الرابط. بيحدّث وثيقة الطالب عشان التقرير الجاي يقارن بالأسبوع ده. */
export async function createReport(db, studentEmail, st) {
    const snap = await buildSnapshot(db, st);
    const token = randomToken();
    await setDoc(doc(db, 'parentReports', token), snap);
    try {
        await updateDoc(doc(db, 'students', String(studentEmail).toLowerCase().trim()), {
            parentReportPrev: { studySeconds: Number(st.studySeconds) || 0, at: Date.now() }
        });
    } catch (e) { /* مش مشكلة لو فشل */ }
    const base = location.origin + location.pathname.replace(/[^/]*$/, '');
    return { token, url: base + 'parent-report.html?t=' + token, snapshot: snap };
}

const EMO = { green: '🟢', yellow: '🟡', red: '🔴', none: '⚪' };

/** رسالة واتساب قصيرة وبسيطة */
export function messageText(snap, url) {
    const kid = snap.gender === 'female' ? 'بنتكم' : 'ابنكم';
    const lines = [
        'السلام عليكم ورحمة الله 🌷',
        'دي رسالة من منصة رحلة دراسية عن ' + kid + ' *' + snap.name + '*',
        '',
        EMO[snap.status] + ' ' + snap.statusText,
        '⏱ ' + (snap.studySinceLastSec !== null ? 'ذاكر المدة اللي فاتت: ' + fmtDuration(snap.studySinceLastSec) : 'إجمالي وقت المذاكرة: ' + fmtDuration(snap.studyTotalSec)),
        '🔥 ' + snap.streak + ' يوم متواصل',
    ];
    if (snap.avg !== null) lines.push('📝 متوسط الامتحانات: ' + snap.avg + '%');
    lines.push('', 'اضغط على الرابط تشوف التقرير وتقدر *تسمعه بصوت* كمان 👇', url);
    return lines.join('\n');
}

export function whatsappLink(phone, text) {
    const n = normalizeEgyptPhone(phone);
    if (!n) return null;
    return 'https://wa.me/' + n + '?text=' + encodeURIComponent(text);
}

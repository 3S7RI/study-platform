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

/* ---------------------------- مساعدات التقرير ---------------------------- */
const num = (v) => { const n = Number(v); return isFinite(n) ? n : 0; };
const pctOf = (a, b) => (b > 0 ? Math.round(a / b * 100) : 0);
const cut = (s, n) => String(s == null ? '' : s).slice(0, n);
const listAr = (arr) => arr.join('، ');
function toMs(v) {
    if (!v) return 0;
    if (typeof v === 'number') return v;
    if (typeof v.toMillis === 'function') return v.toMillis();
    if (v.seconds) return v.seconds * 1000;
    const t = Date.parse(v);
    return isNaN(t) ? 0 : t;
}

// الحصص والامتحانات الشاملة بتتحمّل مرة كل 5 دقايق (مهم لما الأدمن يبعت تقارير لطلاب كتير ورا بعض)
let _shared = null;
async function loadShared(db) {
    if (_shared && Date.now() - _shared.at < 300000) return _shared;
    let lessons = null, exams = null;
    try { lessons = await getDocs(collection(db, 'lessons')); } catch (e) { console.warn('lessons read failed', e); }
    try { exams = await getDocs(collection(db, 'exams')); } catch (e) { console.warn('exams read failed', e); }
    const out = {
        at: Date.now(),
        lessons: lessons ? lessons.docs.map(d => ({ id: d.id, ...d.data() })) : [],
        exams: exams ? exams.docs.map(d => ({ id: d.id, ...d.data() })) : []
    };
    if (lessons) _shared = out;
    return out;
}

/** يبني ملخص الطالب (من غير إيميل ولا تليفون) */
export async function buildSnapshot(db, st, studentEmail) {
    const sid = String(st.studentId || st.id || '').trim();
    const email = String(studentEmail || st.email || '').toLowerCase().trim();

    /* ---- نتايج امتحانات الحصص ---- */
    let results = [];
    try {
        const q = await getDocs(query(collection(db, 'studentExamResults'), where('userId', '==', sid), limit(150)));
        results = q.docs.map(d => d.data());
    } catch (e) { console.warn('exams read failed', e); }

    const shared = await loadShared(db);
    const lessons = shared.lessons
        .filter(l => (l.settings || {}).generalActive !== false)
        .sort((a, b) => num(a.number) - num(b.number));
    const lessonById = {};
    lessons.forEach(l => { lessonById[l.id] = l; });
    const resByLesson = {};
    results.forEach(r => { resByLesson[r.lessonId] = r; });

    const resPct = (r) => {
        const s = num(r.bestScore !== undefined ? r.bestScore : r.score);
        const m = num(r.bestMaxScore !== undefined ? r.bestMaxScore : r.maxScore);
        return m > 0 ? Math.round(s / m * 100) : null;
    };

    /* ---- آخر الامتحانات + المتوسط + الاتجاه ---- */
    const sorted = results
        .map(r => ({ r, p: resPct(r), at: toMs(r.submittedAt) }))
        .filter(x => x.p !== null)
        .sort((a, b) => b.at - a.at);
    const recent = sorted.slice(0, 5).map(x => {
        const l = lessonById[x.r.lessonId];
        return { t: cut(l ? ('الحصة ' + (l.number || '') + (l.title ? ': ' + l.title : '')) : (x.r.examTitle || 'امتحان'), 60), s: num(x.r.score), m: num(x.r.maxScore), p: x.p };
    });
    const last10 = sorted.slice(0, 10);
    const avg = last10.length ? Math.round(last10.reduce((a, x) => a + x.p, 0) / last10.length) : null;
    let trend = null;
    if (sorted.length >= 4) {
        const a3 = sorted.slice(0, 3), b3 = sorted.slice(3, 6);
        const d = a3.reduce((s, x) => s + x.p, 0) / a3.length - b3.reduce((s, x) => s + x.p, 0) / b3.length;
        trend = d >= 8 ? 'up' : d <= -8 ? 'down' : 'flat';
    }
    let mistakesTotal = 0;
    results.forEach(r => { if (Array.isArray(r.mistakes)) mistakesTotal += r.mistakes.length; });

    /* ---- الحصص: التقدم لكل حصة ---- */
    const acts = st.lessonsActivity || {};
    let vD = 0, vT = 0, nD = 0, nT = 0, sD = 0, sT = 0, lDone = 0, lStarted = 0, examsLeft = 0;
    const lessonRows = [];
    const subj = {};
    lessons.forEach(l => {
        const a = acts[l.id] || {}, set = l.settings || {};
        const hasV = (l.videosList || []).length > 0, hasN = (l.notesList || []).length > 0, hasS = (l.summariesList || []).length > 0;
        const hasE = !!(l.examId && String(l.examId).trim()) && set.showExamSection !== false;
        const res = resByLesson[l.id];
        const dV = a.videoWatched === true, dN = a.studyNotes === true, dS = a.summarySeen === true, dE = !!res;
        if (hasV) { vT++; if (dV) vD++; }
        if (hasN) { nT++; if (dN) nD++; }
        if (hasS) { sT++; if (dS) sD++; }
        const parts = [hasV, hasN, hasS, hasE].filter(Boolean).length;
        const done = (hasV && dV ? 1 : 0) + (hasN && dN ? 1 : 0) + (hasS && dS ? 1 : 0) + (hasE && dE ? 1 : 0);
        const started = num(a.accessCount) > 0 || done > 0;
        const complete = parts > 0 && done === parts;
        if (started) lStarted++;
        if (complete) lDone++;
        if (hasE && started && !dE) examsLeft++;
        const p = parts ? Math.round(done / parts * 100) : 0;
        const ep = res ? resPct(res) : null;
        const sj = cut(String(l.subject || '').trim() || 'عام', 30);
        const g = subj[sj] || (subj[sj] = { s: sj, total: 0, done: 0, ps: [] });
        g.total++; if (complete) g.done++; if (ep !== null) g.ps.push(ep);
        if (started || res) lessonRows.push({ n: num(l.number), t: cut(l.title || '', 40), s: sj, p, e: ep, at: num(res && res.attempts) || (res ? 1 : 0), mk: res && Array.isArray(res.mistakes) ? res.mistakes.length : null });
    });
    const subjects = Object.values(subj).map(g => ({ s: g.s, total: g.total, done: g.done, n: g.ps.length, avg: g.ps.length ? Math.round(g.ps.reduce((a, b) => a + b, 0) / g.ps.length) : null }))
        .sort((a, b) => (b.avg === null ? -1 : b.avg) - (a.avg === null ? -1 : a.avg));
    const notStarted = lessons.length - lStarted;

    /* ---- الامتحانات الشاملة (الدرجات المعتمدة بس) ---- */
    const comp = { taken: 0, published: 0, pending: 0, avg: null, items: [] };
    let compSum = 0;
    shared.exams.forEach(ex => {
        const subs = (ex.examSubmissions || []).filter(s => String(s.studentEmail || '').toLowerCase().trim() === email);
        const done = subs.filter(s => s.isInitialOpen !== true);
        if (!done.length) return;
        comp.taken++;
        const pub = done.filter(s => s.published === true);
        if (pub.length) {
            const last = pub[pub.length - 1];
            const p = pctOf(num(last.score), num(last.totalMarks));
            comp.published++; compSum += p;
            comp.items.push({ t: cut(ex.title || 'امتحان شامل', 60), p });
        } else { comp.pending++; comp.items.push({ t: cut(ex.title || 'امتحان شامل', 60), p: null }); }
    });
    if (comp.published) comp.avg = Math.round(compSum / comp.published);
    comp.items = comp.items.slice(0, 8);

    /* ---- وقت المذاكرة والانتظام ---- */
    const prev = st.parentReportPrev || null;
    const cur = num(st.studySeconds);
    const sinceLast = (prev && typeof prev.studySeconds === 'number') ? Math.max(0, cur - prev.studySeconds) : null;
    const inactive = daysSince(st.lastActiveDay);
    const joined = toMs(st.createdAt);
    const joinDays = joined ? Math.max(1, Math.ceil((Date.now() - joined) / 86400000)) : null;
    const avgPerDay = joinDays ? Math.round(cur / joinDays) : null;
    const streak = num(st.streak);

    /* ---- التقييم العام: امتحانات 50% + إنجاز الحصص 30% + انتظام 20% ---- */
    const comps = [];
    if (avg !== null) comps.push([avg, 0.5]);
    if (lessons.length) comps.push([pctOf(lDone + (lStarted - lDone) * 0.4, lessons.length), 0.3]);
    comps.push([Math.min(100, Math.round(streak / 7 * 100)) * (inactive !== null && inactive >= 3 ? 0.5 : 1), 0.2]);
    const wSum = comps.reduce((a, c) => a + c[1], 0);
    const overall = Math.round(comps.reduce((a, c) => a + c[0] * c[1], 0) / wSum);
    const hasAnything = avg !== null || lStarted > 0 || cur > 600;

    let status, statusText;
    if (!hasAnything) { status = 'none'; statusText = 'لسه في البداية، لسه ما بدأش يذاكر على المنصة'; }
    else if (overall >= 80) { status = 'green'; statusText = 'شاطر ومجتهد، مستواه ممتاز'; }
    else if (overall >= 55) { status = 'yellow'; statusText = 'كويس، بس يقدر يبقى أحسن'; }
    else { status = 'red'; statusText = 'محتاج متابعة ومساعدة'; }

    /* ---- نقاط القوة / الضعف / النصايح ---- */
    const strengths = [], weaknesses = [], tips = [];
    const multiSubj = subjects.filter(s => s.s !== 'عام').length > 0;
    const rated = sorted.map(x => ({ p: x.p, l: lessonById[x.r.lessonId] })).filter(x => x.l);
    const lname = (l) => 'الحصة ' + (l.number || '') + (l.title ? ' (' + cut(l.title, 25) + ')' : '');
    const bestL = rated.slice().sort((a, b) => b.p - a.p).filter(x => x.p >= 85).slice(0, 3);
    const worstL = rated.slice().sort((a, b) => a.p - b.p).filter(x => x.p < 60).slice(0, 3);
    const strongSubj = multiSubj ? subjects.filter(s => s.avg !== null && s.avg >= 80) : [];
    const weakSubj = multiSubj ? subjects.filter(s => s.avg !== null && s.avg < 60).sort((a, b) => a.avg - b.avg) : [];

    strongSubj.slice(0, 3).forEach(s => strengths.push('متفوق في مادة ' + s.s + ' (متوسطه ' + s.avg + '%)'));
    if (bestL.length) strengths.push('جاب درجات عالية في: ' + listAr(bestL.map(x => lname(x.l) + ' ' + x.p + '%')));
    if (comp.avg !== null && comp.avg >= 80) strengths.push('درجاته في الامتحانات الشاملة ممتازة (' + comp.avg + '%)');
    if (streak >= 5) strengths.push('منتظم: بيدخل المنصة ' + streak + ' يوم ورا بعض');
    if (lessons.length && lDone / lessons.length >= 0.6) strengths.push('خلّص ' + lDone + ' حصة من ' + lessons.length + ' كاملة (فيديو وملزمة وملخص وامتحان)');
    if (trend === 'up') strengths.push('مستواه في تحسّن واضح في آخر امتحانات');
    if (vT && vD / vT >= 0.8) strengths.push('بيشوف فيديوهات الشرح بانتظام');

    weakSubj.slice(0, 3).forEach(s => weaknesses.push('محتاج تقوية في مادة ' + s.s + ' (متوسطه ' + s.avg + '%)'));
    if (worstL.length) weaknesses.push('درجته ضعيفة في: ' + listAr(worstL.map(x => lname(x.l) + ' ' + x.p + '%')));
    if (comp.avg !== null && comp.avg < 60) weaknesses.push('درجاته في الامتحانات الشاملة ضعيفة (' + comp.avg + '%)');
    if (trend === 'down') weaknesses.push('مستواه في نزول في آخر امتحانات');
    if (examsLeft > 0) weaknesses.push('فتح ' + examsLeft + ' حصة ولسه ما حلّش امتحانها');
    if (lessons.length && notStarted >= Math.max(3, lessons.length * 0.4)) weaknesses.push('لسه ما بدأش ' + notStarted + ' حصة من ' + lessons.length);
    if (inactive !== null && inactive >= 3) weaknesses.push('مدخلش المنصة من ' + inactive + ' أيام');
    if (avgPerDay !== null && hasAnything && avgPerDay < 1200) weaknesses.push('وقت مذاكرته على المنصة قليل (حوالي ' + fmtDuration(avgPerDay) + ' في اليوم)');

    if (weakSubj.length) tips.push('خلّوه يراجع فيديوهات وملخصات مادة ' + listAr(weakSubj.slice(0, 2).map(s => s.s)) + ' ويعيد حل امتحاناتها.');
    if (worstL.length) tips.push('يعيد الحصص اللي درجته فيها ضعيفة وبعدها يعيد الامتحان.');
    if (mistakesTotal > 0) tips.push('يفتح صفحة «أخطائي» في المنصة ويراجع الأسئلة اللي غلط فيها، لأن ده أسرع طريق للتحسّن.');
    if (examsLeft > 0) tips.push('يحل امتحانات الحصص اللي فتحها قبل ما يفتح حصة جديدة.');
    if (inactive !== null && inactive >= 3) tips.push('يرجع للمذاكرة كل يوم، حتى لو نص ساعة بس، عشان ما يضيعش الاستريك.');
    else if (avgPerDay !== null && hasAnything && avgPerDay < 1200) tips.push('يزوّد وقت المذاكرة شوية كل يوم.');
    if (!tips.length) tips.push(status === 'green' ? 'كمّلوا كده وشجّعوه، وبلاش تضغطوا عليه.' : 'شجّعوه يكمّل حصة كل يوم ويحل امتحانها.');
    if (!hasAnything) tips.unshift('شجّعوه يبدأ بأول حصة ويحل امتحانها.');
    const advice = tips.slice(0, 2).join(' ');

    return {
        v: 2,
        name: cut(st.fullName || st.name || 'الطالب', 60),
        gender: st.gender === 'female' ? 'female' : 'male',
        studentId: sid,
        status, statusText, advice, overall,
        avg, recent, trend,
        examsCount: sorted.length,
        mistakesTotal,
        studyTotalSec: cur,
        studySinceLastSec: sinceLast,
        studyAvgPerDaySec: avgPerDay,
        streak,
        longestStreak: Math.max(num(st.longestStreak), streak),
        points: num(st.totalScore || st.points),
        inactiveDays: inactive,
        lessonsTotal: lessons.length, lessonsDone: lDone, lessonsStarted: lStarted, examsLeft,
        videos: { d: vD, t: vT }, notes: { d: nD, t: nT }, sums: { d: sD, t: sT },
        subjects: multiSubj ? subjects.slice(0, 10) : [],
        lessons: lessonRows.slice(0, 60),
        comp,
        strengths: strengths.slice(0, 6), weaknesses: weaknesses.slice(0, 6), tips: tips.slice(0, 5),
        createdAt: Date.now()
    };
}

/** يحفظ التقرير بتوكن عشوائي ويرجّع الرابط. بيحدّث وثيقة الطالب عشان التقرير الجاي يقارن بالأسبوع ده. */
export async function createReport(db, studentEmail, st) {
    const snap = await buildSnapshot(db, st, studentEmail);
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
    if (snap.strengths && snap.strengths[0]) lines.push('💪 ' + snap.strengths[0]);
    if (snap.weaknesses && snap.weaknesses[0]) lines.push('📌 ' + snap.weaknesses[0]);
    lines.push('', 'اضغط على الرابط تشوف التقرير بالتفصيل (الحصص والمواد والدرجات) وتقدر *تسمعه بصوت* كمان 👇', url);
    return lines.join('\n');
}

export function whatsappLink(phone, text) {
    const n = normalizeEgyptPhone(phone);
    if (!n) return null;
    return 'https://wa.me/' + n + '?text=' + encodeURIComponent(text);
}

// student-service.js - ملف الخدمات الموحد لإدارة بيانات وطالب المنصة
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * البحث عن وثيقة الطالب في قاعدة البيانات بأي وسيلة (Email, StudentId, UID, أو Name)
 */
export async function findStudentDocument(db, identifier) {
    if (!identifier) return null;
    const cleanId = String(identifier).toLowerCase().trim();

    try {
        // 1. البحث المباشر بواسطة البريد الإلكتروني (المستند الأساسي عادة)
        let docRef = doc(db, "students", cleanId);
        let docSnap = await getDoc(docRef);
        if (docSnap.exists()) return { id: docSnap.id, ref: docRef, data: docSnap.data() };

        // 2. البحث بواسطة حقل email
        let q = query(collection(db, "students"), where("email", "==", cleanId));
        let snap = await getDocs(q);
        if (!snap.empty) return { id: snap.docs[0].id, ref: snap.docs[0].ref, data: snap.docs[0].data() };

        // 3. البحث بواسطة studentId (المعرف الخاص بالمنصة)
        q = query(collection(db, "students"), where("studentId", "==", identifier));
        snap = await getDocs(q);
        if (!snap.empty) return { id: snap.docs[0].id, ref: snap.docs[0].ref, data: snap.docs[0].data() };

        // 4. البحث بواسطة uid (Firebase Auth UID)
        q = query(collection(db, "students"), where("uid", "==", identifier));
        snap = await getDocs(q);
        if (!snap.empty) return { id: snap.docs[0].id, ref: snap.docs[0].ref, data: snap.docs[0].data() };

        // 5. البحث الاحتياطي في مجموعة users لو موجودة
        q = query(collection(db, "users"), where("email", "==", cleanId));
        snap = await getDocs(q);
        if (!snap.empty) return { id: snap.docs[0].id, ref: snap.docs[0].ref, data: snap.docs[0].data() };

        return null;
    } catch (e) {
        console.error("خطأ أثناء البحث عن الطالب:", e);
        return null;
    }
}

/**
 * تحديث وإضافة نقاط للطالب وتحديث مستواه فوراً (مع حساب نظام المستويات والدرجات)
 */
export async function addPointsToStudent(db, studentIdentifier, pointsToAdd) {
    if (!studentIdentifier || !pointsToAdd || pointsToAdd <= 0) return false;

    try {
        const studentObj = await findStudentDocument(db, studentIdentifier);
        if (!studentObj) {
            console.warn("لم يتم العثور على الطالب لتحديث نقاطه:", studentIdentifier);
            return false;
        }

        const currentScore = studentObj.data.totalScore || 0;
        const newTotalScore = currentScore + pointsToAdd;

        // تحديث النقاط في الكولكشن
        await updateDoc(studentObj.ref, {
            totalScore: newTotalScore,
            lastUpdated: new Date().toISOString()
        });

        console.log(`تم إضافة ${pointsToAdd} نقطة بنجاح للطالب. المجموع الجديد: ${newTotalScore}`);
        return true;
    } catch (e) {
        console.error("خطأ في إضافة النقاط للطالب:", e);
        return false;
    }
}

/**
 * جلب معلومات المستوى والشارة الخاصة بالطالب بناءً على إجمالي نقاطه
 */
export function calculateStudentRank(totalScore) {
    let score = totalScore || 0;
    if (score < 500) {
        return { rankKey: 'weak', title: 'مبتدئ (ضعيف)', frameClass: 'rank-frame-weak', badgeClass: 'badge-weak', color: '#fca5a5' };
    } else if (score < 1500) {
        return { rankKey: 'medium', title: 'متوسط', frameClass: 'rank-frame-medium', badgeClass: 'badge-medium', color: '#fde68a' };
    } else if (score < 3000) {
        return { rankKey: 'strong', title: 'قوي', frameClass: 'rank-frame-strong', badgeClass: 'badge-strong', color: '#fef08a' };
    } else if (score < 5000) {
        return { rankKey: 'very-strong', title: 'قوي جداً', frameClass: 'rank-frame-very-strong', badgeClass: 'badge-very-strong', color: '#bfdbfe' };
    } else {
        return { rankKey: 'legendary', title: 'أسطوري', frameClass: 'rank-frame-legendary', badgeClass: 'badge-legendary', color: '#e9d5ff' };
    }
}

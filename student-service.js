// student-service.js - ملف الخدمات الشامل والموحد لإدارة وجلب وتعديل بيانات طالب المنصة (بدون إنشاء تلقائي)
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * 1. البحث عن وثيقة الطالب في قاعدة البيانات بأي وسيلة (Email, StudentId, UID، أو Name)
 */
export async function findStudentDocument(db, identifier) {
    if (!identifier) return null;
    const cleanId = String(identifier).toLowerCase().trim();

    try {
        // البحث المباشر في مجموعة students
        let docRef = doc(db, "students", cleanId);
        let docSnap = await getDoc(docRef);
        if (docSnap.exists()) return { id: docSnap.id, ref: docRef, data: docSnap.data(), collectionName: 'students' };

        // البحث بواسطة email
        let q = query(collection(db, "students"), where("email", "==", cleanId));
        let snap = await getDocs(q);
        if (!snap.empty) return { id: snap.docs[0].id, ref: snap.docs[0].ref, data: snap.docs[0].data(), collectionName: 'students' };

        // البحث بواسطة studentId
        q = query(collection(db, "students"), where("studentId", "==", identifier));
        snap = await getDocs(q);
        if (!snap.empty) return { id: snap.docs[0].id, ref: snap.docs[0].ref, data: snap.docs[0].data(), collectionName: 'students' };

        // البحث بواسطة uid
        q = query(collection(db, "students"), where("uid", "==", identifier));
        snap = await getDocs(q);
        if (!snap.empty) return { id: snap.docs[0].id, ref: snap.docs[0].ref, data: snap.docs[0].data(), collectionName: 'students' };

        // البحث في مجموعة users الأساسية
        let userDocRef = doc(db, "users", identifier);
        let userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) return { id: userDocSnap.id, ref: userDocRef, data: userDocSnap.data(), collectionName: 'users' };

        q = query(collection(db, "users"), where("email", "==", cleanId));
        snap = await getDocs(q);
        if (!snap.empty) return { id: snap.docs[0].id, ref: snap.docs[0].ref, data: snap.docs[0].data(), collectionName: 'users' };

        return null;
    } catch (e) {
        console.error("خطأ أثناء البحث عن الطالب:", e);
        return null;
    }
}

/**
 * 2. جلب بيانات الطالب فقط (بدون إنشاء تلقائي نهائياً لتأمين المنصة)
 */
export async function getStudentData(db, studentIdentifier) {
    let studentObj = await findStudentDocument(db, studentIdentifier);
    if (studentObj) {
        return studentObj; // الطالب موجود بالفعل
    }
    return null; // لا يتم إنشاء أي حساب تلقائياً
}

/**
 * 3. إنشاء طالب جديد رسمياً (يتم استدعاؤها فقط من واجهة التسجيل أو لوحة تحكم المشرفين)
 */
export async function createStudentAccount(db, studentIdentifier, studentData = {}) {
    try {
        const cleanId = String(studentIdentifier).toLowerCase().trim();
        const docRef = doc(db, "students", cleanId);
        
        const newStudentData = {
            email: cleanId.includes('@') ? cleanId : (studentData.email || ''),
            name: studentData.name || 'طالب المنصة',
            fullName: studentData.fullName || studentData.name || 'طالب المنصة',
            studentId: studentData.studentId || `STU-${Math.floor(1000 + Math.random() * 9000)}`,
            phone: studentData.phone || '',
            parentPhone: studentData.parentPhone || studentData.guardianPhone || '',
            gender: studentData.gender || studentData.type || 'male',
            type: studentData.gender || studentData.type || 'male',
            totalScore: 0,
            points: 0,
            rank: 'weak',
            level: 'weak',
            active: true,
            createdAt: new Date().toISOString()
        };

        await setDoc(docRef, newStudentData);
        console.log("تم إنشاء حساب الطالب رسمياً في السحابة:", cleanId);
        return { id: cleanId, ref: docRef, data: newStudentData, collectionName: 'students' };
    } catch (e) {
        console.error("خطأ في إنشاء حساب الطالب:", e);
        return null;
    }
}

/**
 * 4. تعديل وتحديث بيانات الطالب الموجود فعلياً
 */
export async function updateStudentData(db, studentIdentifier, updateFields = {}) {
    try {
        let studentObj = await findStudentDocument(db, studentIdentifier);
        if (!studentObj) {
            console.warn("محاولة تحديث بيانات طالب غير موجود:", studentIdentifier);
            return false;
        }

        const payload = {
            ...updateFields,
            lastUpdated: new Date().toISOString()
        };

        // إذا تم تحديث النقاط، نقوم بحساب المستوى تلقائياً بناءً على النقاط الجديدة
        if (payload.totalScore !== undefined || payload.points !== undefined) {
            let score = payload.totalScore || payload.points || 0;
            payload.rank = calculateStudentRank(score).rankKey;
            payload.level = payload.rank;
        }

        await updateDoc(studentObj.ref, payload);
        console.log("تم تحديث بيانات الطالب بنجاح!");
        return true;
    } catch (e) {
        console.error("خطأ في تحديث بيانات الطالب:", e);
        return false;
    }
}

/**
 * 5. تحديث وإضافة نقاط للطالب وتحديث مستواه فوراً
 */
export async function addPointsToStudent(db, studentIdentifier, pointsToAdd) {
    if (!studentIdentifier || !pointsToAdd || pointsToAdd <= 0) return false;

    try {
        let studentObj = await findStudentDocument(db, studentIdentifier);
        if (!studentObj) return false;

        const currentScore = studentObj.data.totalScore || studentObj.data.points || 0;
        const newTotalScore = currentScore + pointsToAdd;
        const newRankInfo = calculateStudentRank(newTotalScore);

        await updateDoc(studentObj.ref, {
            totalScore: newTotalScore,
            points: increment(pointsToAdd),
            rank: newRankInfo.rankKey,
            level: newRankInfo.rankKey,
            lastUpdated: new Date().toISOString()
        });

        console.log(`تم إضافة ${pointsToAdd} نقطة بنجاح. المجموع الجديد: ${newTotalScore}`);
        return true;
    } catch (e) {
        console.error("خطأ في إضافة النقاط:", e);
        return false;
    }
}

/**
 * 6. حساب معلومات المستوى والشارة
 */
export function calculateStudentRank(totalScore) {
    let score = totalScore || 0;
    if (score >= 5000) {
        return { rankKey: 'legendary', title: 'أسطوري', frameClass: 'frame-legendary', badgeClass: 'badge-legendary', color: '#f472b6' };
    } else if (score >= 3000) {
        return { rankKey: 'very-strong', title: 'قوي جداً', frameClass: 'frame-legendary', badgeClass: 'badge-very-strong', color: '#3b82f6' };
    } else if (score >= 1500) {
        return { rankKey: 'strong', title: 'قوي', frameClass: 'frame-strong', badgeClass: 'badge-strong', color: '#10b981' };
    } else if (score >= 500) {
        return { rankKey: 'medium', title: 'متوسط', frameClass: 'frame-medium', badgeClass: 'badge-medium', color: '#f59e0b' };
    } else {
        return { rankKey: 'weak', title: 'مبتدئ (ضعيف)', frameClass: 'frame-weak', badgeClass: 'badge-weak', color: '#ef4444' };
    }
}

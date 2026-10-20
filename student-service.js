// student-service.js - ملف الخدمات الشامل والموحد لإدارة وجلب وتعديل بيانات طالب المنصة داخل مجموعة users
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * 1. البحث عن وثيقة الطالب داخل مجموعة users بأي وسيلة (Email, StudentId, أو UID)
 */
export async function findStudentDocument(db, identifier) {
    if (!identifier) return null;
    const cleanId = String(identifier).toLowerCase().trim();

    try {
        // البحث المباشر في مجموعة users باستخدام الـ Document ID (الإيميل) مع التحقق من الرول
        let docRef = doc(db, "users", cleanId);
        let docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().role === 'student') {
            return { id: docSnap.id, ref: docRef, data: docSnap.data(), collectionName: 'users' };
        }

        // البحث بواسطة حقل email داخل users للطلاب
        let q = query(collection(db, "users"), where("email", "==", cleanId), where("role", "==", "student"));
        let snap = await getDocs(q);
        if (!snap.empty) return { id: snap.docs[0].id, ref: snap.docs[0].ref, data: snap.docs[0].data(), collectionName: 'users' };

        // البحث بواسطة studentId
        q = query(collection(db, "users"), where("studentId", "==", identifier), where("role", "==", "student"));
        snap = await getDocs(q);
        if (!snap.empty) return { id: snap.docs[0].id, ref: snap.docs[0].ref, data: snap.docs[0].data(), collectionName: 'users' };

        // البحث بواسطة uid
        q = query(collection(db, "users"), where("uid", "==", identifier), where("role", "==", "student"));
        snap = await getDocs(q);
        if (!snap.empty) return { id: snap.docs[0].id, ref: snap.docs[0].ref, data: snap.docs[0].data(), collectionName: 'users' };

        return null;
    } catch (e) {
        console.error("خطأ أثناء البحث عن الطالب:", e);
        return null;
    }
}

/**
 * 2. جلب بيانات الطالب فقط (بدون إنشاء تلقائي لتأمين المنصة)
 */
export async function getStudentData(db, studentIdentifier) {
    let studentObj = await findStudentDocument(db, studentIdentifier);
    if (studentObj) {
        return studentObj; 
    }
    return null; 
}

/**
 * 3. إنشاء طالب جديد رسمياً وضمان حفظ جميع خانات التسجيل داخل كولكشن users باسم الإيميل
 */
export async function createStudentAccount(db, studentIdentifier, studentData = {}) {
    try {
        const cleanId = String(studentIdentifier).toLowerCase().trim();
        // الحفظ الأساسي والمؤكد داخل كولكشن "users" بحيث يكون الـ Document ID هو البريد الإلكتروني
        const docRef = doc(db, "users", cleanId);
        
        const newStudentData = {
            role: 'student',
            email: cleanId.includes('@') ? cleanId : (studentData.email || ''),
            name: studentData.name || studentData.fullName || 'طالب المنصة',
            studentId: studentData.studentId || `STU-${Math.floor(1000 + Math.random() * 9000)}`,
            uid: studentData.uid || '',
            phone: studentData.phone || studentData.studentPhone || '',
            parentPhone: studentData.parentPhone || studentData.guardianPhone || '',
            gender: studentData.gender || studentData.type || 'male',
            totalScore: studentData.totalScore || 0,
            rank: studentData.rank || 'weak',
            accountType: studentData.accountType || 'free',
            status: 'active',
            allowComparison: true,
            bgPatternEnabled: true,
            profileImage: studentData.profileImage || '',
            createdAt: studentData.createdAt || new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            lastSeenNotificationTime: Date.now()
        };

        await setDoc(docRef, newStudentData);
        console.log("تم إنشاء حساب الطالب رسمياً في مجموعة users بـ Document ID (الإيميل):", cleanId);
        return { id: cleanId, ref: docRef, data: newStudentData, collectionName: 'users' };
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

        if (payload.totalScore !== undefined) {
            payload.rank = calculateStudentRank(payload.totalScore).rankKey;
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
 * 5. تحديث وإضافة نقاط للطالب وتحديث مستواه ورتبته فوراً
 */
export async function addPointsToStudent(db, studentIdentifier, pointsToAdd) {
    if (!studentIdentifier || !pointsToAdd || pointsToAdd <= 0) return false;

    try {
        let studentObj = await findStudentDocument(db, studentIdentifier);
        if (!studentObj) return false;

        const currentScore = studentObj.data.totalScore || 0;
        const newTotalScore = currentScore + pointsToAdd;
        const newRankInfo = calculateStudentRank(newTotalScore);

        await updateDoc(studentObj.ref, {
            totalScore: newTotalScore,
            rank: newRankInfo.rankKey,
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
 * 6. حساب معلومات المستوى والرتبة والشارة
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

// student-service.js - ملف الخدمات الشامل والموحد لإدارة وتخزين وإنشاء وتعديل بيانات طالب المنصة
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * 1. البحث عن وثيقة الطالب في قاعدة البيانات بأي وسيلة (Email, StudentId, UID, أو Name)
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
 * 2. جلب بيانات الطالب، وإنشاؤه تلقائياً فوراً إذا لم يكن موجوداً في قاعدة البيانات (حفظ وتخزين جديد)
 */
export async function getOrSaveStudentData(db, studentIdentifier, initialData = {}) {
    let studentObj = await findStudentDocument(db, studentIdentifier);
    
    if (studentObj) {
        return studentObj; // الطالب موجود بالفعل
    }

    // إذا لم يكن موجوداً، نقوم بإنشائه وتخزينه في مجموعة students كوثيقة جديدة
    try {
        const cleanId = String(studentIdentifier).toLowerCase().trim();
        const docRef = doc(db, "students", cleanId);
        
        const defaultData = {
            email: cleanId.includes('@') ? cleanId : '',
            name: initialData.name || 'طالب جديد',
            fullName: initialData.fullName || initialData.name || 'طالب جديد',
            studentId: initialData.studentId || `STU-${Math.floor(1000 + Math.random() * 9000)}`,
            phone: initialData.phone || '',
            parentPhone: initialData.parentPhone || '',
            gender: initialData.gender || 'male',
            totalScore: initialData.totalScore || 0,
            points: initialData.points || 0,
            rank: 'weak',
            level: 'weak',
            active: true,
            createdAt: new Date().toISOString()
        };

        await setDoc(docRef, defaultData, { merge: true });
        console.log("تم إنشاء وتخزين طالب جديد بنجاح في السحابة:", cleanId);
        
        return { id: cleanId, ref: docRef, data: defaultData, collectionName: 'students' };
    } catch (e) {
        console.error("خطأ في إنشاء الطالب تلقائياً:", e);
        return null;
    }
}

/**
 * 3. تعديل وتحديث بيانات الطالب (لو مش موجود بينشئه، ولو موجود بيعدل بياناته ويزامنها)
 */
export async function updateStudentData(db, studentIdentifier, updateFields = {}) {
    try {
        let studentObj = await getOrSaveStudentData(db, studentIdentifier, updateFields);
        if (!studentObj) return false;

        // دمج التحديثات الجديدة مع الحفاظ على حقل آخر تحديث
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
        console.log("تم تحديث وتخزين بيانات الطالب بنجاح!");
        return true;
    } catch (e) {
        console.error("خطأ في تحديث بيانات الطالب:", e);
        return false;
    }
}

/**
 * 4. تحديث وإضافة نقاط للطالب وتحديث مستواه فوراً (مع مزامنة totalScore و points)
 */
export async function addPointsToStudent(db, studentIdentifier, pointsToAdd) {
    if (!studentIdentifier || !pointsToAdd || pointsToAdd <= 0) return false;

    try {
        let studentObj = await getOrSaveStudentData(db, studentIdentifier);
        if (!studentObj) return false;

        const currentScore = studentObj.data.totalScore || studentObj.data.points || 0;
        const newTotalScore = currentScore + pointsToAdd;
        const newRankInfo = calculateStudentRank(newTotalScore);

        // تحديث النقاط والمستوى الجديد فوراً في السحابة
        await updateDoc(studentObj.ref, {
            totalScore: newTotalScore,
            points: increment(pointsToAdd),
            rank: newRankInfo.rankKey,
            level: newRankInfo.rankKey,
            lastUpdated: new Date().toISOString()
        });

        console.log(`تم إضافة ${pointsToAdd} نقطة بنجاح للطالب. المجموع الجديد: ${newTotalScore} والمستوى: ${newRankInfo.title}`);
        return true;
    } catch (e) {
        console.error("خطأ في إضافة النقاط للطالب:", e);
        return false;
    }
}

/**
 * 5. جلب معلومات المستوى والشارة ودقة المسميات (ضعيف، متوسط، قوي، قوي جداً، أسطوري) بناءً على إجمالي النقاط
 */
export function calculateStudentRank(totalScore) {
    let score = totalScore || 0;
    if (score < 500) {
        return { rankKey: 'weak', title: 'ضعيف', frameClass: 'rank-frame-weak', badgeClass: 'badge-weak', color: '#fca5a5' };
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

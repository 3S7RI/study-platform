// student-service.js - ملف الخدمات الشامل والموحد لإدارة وجلب وتعديل بيانات طالب المنصة داخل مجموعة students
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * 1. البحث عن وثيقة الطالب داخل مجموعة students بأي وسيلة (Email, StudentId, أو UID)
 */
export async function findStudentDocument(db, identifier) {
    if (!identifier) return null;
    const cleanId = String(identifier).toLowerCase().trim();

    try {
        let docRef = doc(db, "students", cleanId);
        let docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ref: docRef, data: docSnap.data(), collectionName: 'students' };
        }

        let q = query(collection(db, "students"), where("email", "==", cleanId));
        let snap = await getDocs(q);
        if (!snap.empty) return { id: snap.docs[0].id, ref: snap.docs[0].ref, data: snap.docs[0].data(), collectionName: 'students' };

        q = query(collection(db, "students"), where("studentId", "==", identifier));
        snap = await getDocs(q);
        if (!snap.empty) return { id: snap.docs[0].id, ref: snap.docs[0].ref, data: snap.docs[0].data(), collectionName: 'students' };

        q = query(collection(db, "students"), where("uid", "==", identifier));
        snap = await getDocs(q);
        if (!snap.empty) return { id: snap.docs[0].id, ref: snap.docs[0].ref, data: snap.docs[0].data(), collectionName: 'students' };

        return null;
    } catch (e) {
        console.error("خطأ أثناء البحث عن الطالب:", e);
        return null;
    }
}

/**
 * 2. جلب بيانات الطالب فقط
 */
export async function getStudentData(db, studentIdentifier) {
    let studentObj = await findStudentDocument(db, studentIdentifier);
    if (studentObj) {
        return studentObj; 
    }
    return null; 
}

/**
 * 3. توليد الـ ID التسلسلي الذكي (STU-0001, STU-0002...) بدون تكرار أو فراغات
 */
export async function getNextSmartStudentId(db) {
    try {
        const studentsRef = collection(db, "students");
        const snapshot = await getDocs(studentsRef);
        
        let existingNumbers = new Set();

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const sId = data.studentId || data.id || "";
            if (sId.startsWith("STU-")) {
                const numPart = parseInt(sId.replace("STU-", ""), 10);
                if (!isNaN(numPart)) {
                    existingNumbers.add(numPart);
                }
            }
        });

        let targetNum = 1;
        while (existingNumbers.has(targetNum)) {
            targetNum++;
        }

        let paddingLength = 4;
        if (targetNum >= 10000) {
            paddingLength = String(targetNum).length;
        }

        return 'STU-' + String(targetNum).padStart(paddingLength, '0');

    } catch (e) {
        console.error("خطأ في توليد الـ ID الذكي:", e);
        return 'STU-0001';
    }
}

/**
 * 4. إنشاء حساب طالب جديد وضمان حفظ جميع البيانات داخل كولكشن students بـ إيميل الطالب كمعرف للمستند
 */
export async function createStudentAccount(db, email, studentData = {}) {
    try {
        const cleanEmail = String(email).toLowerCase().trim();
        const docRef = doc(db, "students", cleanEmail);
        
        const finalStudentData = {
            role: 'student',
            email: cleanEmail,
            name: studentData.name || studentData.fullName || 'طالب المنصة',
            fullName: studentData.fullName || studentData.name || 'طالب المنصة',
            studentId: studentData.studentId || studentData.id || `STU-0001`,
            id: studentData.studentId || studentData.id || `STU-0001`,
            uid: studentData.uid || '',
            phone: studentData.phone || studentData.studentPhone || '',
            studentPhone: studentData.phone || studentData.studentPhone || '',
            parentPhone: studentData.parentPhone || studentData.guardianPhone || '',
            guardianPhone: studentData.parentPhone || studentData.guardianPhone || '',
            gender: studentData.gender || 'male',
            totalScore: studentData.totalScore || 0,
            points: studentData.points || 0,
            rank: studentData.rank || 'strong',
            accountType: studentData.accountType || 'free',
            status: 'active',
            allowComparison: true,
            bgPatternEnabled: true,
            profileImage: studentData.profileImage || '',
            avatar: studentData.avatar || studentData.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
            createdAt: serverTimestamp(),
            lastUpdated: new Date().toISOString(),
            lastSeenNotificationTime: Date.now()
        };

        await setDoc(docRef, finalStudentData);
        console.log("تم حفظ بيانات الطالب بنجاح في كولكشن students تحت الإيميل:", cleanEmail);
        return { success: true, data: finalStudentData };
    } catch (e) {
        console.error("خطأ في حفظ ملف الطالب:", e);
        return null;
    }
}

/**
 * 5. تعديل وتحديث بيانات الطالب الموجود فعلياً
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
 * 6. تحديث وإضافة نقاط للطالب وتحديث مستواه ورتبته فوراً
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
            points: newTotalScore,
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
 * 7. إرسال الإشعار الترحيبي للطالب الجديد
 */
export async function sendWelcomeNotification(db, studentEmail, studentName) {
    try {
        const firstName = studentName ? studentName.trim().split(' ')[0] : 'بطلنا';
        const customTitle = `🎉 أهلاً بيك يا ${firstName} في عائلة رحلة دراسية!`;
        const customMessage = `منورنا يا بطل في أقوى منصة تعليمية لطلاب تالتة اعدادي! 🚀 استعد لرحلة تفوق استثنائية، حل واجباتك، تابع دروسك، واصنع مستقبلك بكل حماس. بالتوفيق في رحلتك! ✨`;
        
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

/**
 * 8. حساب معلومات المستوى والرتبة والشارة
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

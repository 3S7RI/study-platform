// admin-service.js - ملف الخدمات الشامل والموحد لإدارة وتخزين وإنشاء وتعديل بيانات مشرفي المنصة
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * 1. البحث عن وثيقة المشرف في قاعدة البيانات بأي وسيلة (Email, Username, أو ID)
 */
export async function findAdminDocument(db, identifier) {
    if (!identifier) return null;
    const cleanId = String(identifier).toLowerCase().trim();

    try {
        // البحث المباشر في مجموعة admins
        let docRef = doc(db, "admins", cleanId);
        let docSnap = await getDoc(docRef);
        if (docSnap.exists()) return { id: docSnap.id, ref: docRef, data: docSnap.data(), collectionName: 'admins' };

        // البحث بواسطة email
        let q = query(collection(db, "admins"), where("email", "==", cleanId));
        let snap = await getDocs(q);
        if (!snap.empty) return { id: snap.docs[0].id, ref: snap.docs[0].ref, data: snap.docs[0].data(), collectionName: 'admins' };

        // البحث بواسطة username
        q = query(collection(db, "admins"), where("username", "==", cleanId));
        snap = await getDocs(q);
        if (!snap.empty) return { id: snap.docs[0].id, ref: snap.docs[0].ref, data: snap.docs[0].data(), collectionName: 'admins' };

        return null;
    } catch (e) {
        console.error("خطأ أثناء البحث عن المشرف:", e);
        return null;
    }
}

/**
 * 2. جلب بيانات المشرف فقط (بدون إنشاء تلقائي نهائياً لتأمين المنصة)
 */
export async function getAdminData(db, adminIdentifier) {
    let adminObj = await findAdminDocument(db, adminIdentifier);
    if (adminObj) {
        return adminObj; // المشرف موجود بالفعل
    }
    return null; // لا يتم إنشاء أي حساب تلقائياً
}

/**
 * 3. إنشاء مشرف جديد رسمياً (يتم استدعاؤها فقط من واجهة إنشاء حساب المشرف أو لوحة التحكم)
 */
export async function createAdminAccount(db, adminIdentifier, adminData = {}) {
    try {
        const cleanId = String(adminIdentifier).toLowerCase().trim();
        const docRef = doc(db, "admins", cleanId);
        
        const isVerifiedStatus = adminData.isVerified === true || adminData.verified === true;

        const newAdminData = {
            adminId: adminData.adminId || `ADM-${Math.floor(1000 + Math.random() * 9000)}`,
            name: adminData.name || 'مشرف المنصة',
            username: adminData.username || cleanId,
            email: adminData.email || cleanId,
            password: adminData.password || '',
            phone: adminData.phone || '',
            role: adminData.role || 'moderator', // full أو moderator
            isVerified: isVerifiedStatus,
            verified: isVerifiedStatus,
            profileImage: adminData.profileImage || adminData.avatar || '',
            avatar: adminData.profileImage || adminData.avatar || '',
            createdAt: Date.now()
        };

        await setDoc(docRef, newAdminData);
        console.log("تم إنشاء حساب المشرف رسمياً في السحابة:", cleanId);
        return { id: cleanId, ref: docRef, data: newAdminData, collectionName: 'admins' };
    } catch (e) {
        console.error("خطأ في إنشاء حساب المشرف:", e);
        return null;
    }
}

/**
 * 4. تعديل وتحديث بيانات المشرف الموجود فعلياً (مثل التوثيق، الصلاحية، الاسم، الهاتف، إلخ)
 */
export async function updateAdminData(db, adminIdentifier, updateFields = {}) {
    try {
        let adminObj = await findAdminDocument(db, adminIdentifier);
        if (!adminObj) {
            console.warn("محاولة تحديث بيانات مشرف غير موجود:", adminIdentifier);
            return false;
        }

        // مزامنة حالة التوثيق لضمان تطابق الحقلين معاً
        if (updateFields.isVerified !== undefined || updateFields.verified !== undefined) {
            let verifyVal = updateFields.isVerified === true || updateFields.verified === true;
            updateFields.isVerified = verifyVal;
            updateFields.verified = verifyVal;
        }

        const payload = {
            ...updateFields,
            lastUpdated: Date.now()
        };

        await updateDoc(adminObj.ref, payload);
        console.log("تم تحديث بيانات المشرف بنجاح!");
        return true;
    } catch (e) {
        console.error("خطأ في تحديث بيانات المشرف:", e);
        return false;
    }
}

/**
 * 5. حذف حساب المشرف نهائياً من السحابة
 */
export async function deleteAdminAccount(db, adminIdentifier) {
    try {
        let adminObj = await findAdminDocument(db, adminIdentifier);
        if (!adminObj) return false;

        await adminObj.ref.delete();
        console.log("تم حذف حساب المشرف بنجاح من السحابة.");
        return true;
    } catch (e) {
        console.error("خطأ في حذف حساب المشرف:", e);
        return false;
    }
}
